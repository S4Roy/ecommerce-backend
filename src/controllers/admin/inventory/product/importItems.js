import Product from "../../../../models/Product.js";
import Category from "../../../../models/Category.js";
import Media from "../../../../models/Media.js";
import SEO from "../../../../models/SEO.js";
import { StatusError } from "../../../../config/index.js";
import { s3Handler } from "../../../../services/s3Handler/s3Handler.js";
import path from "path";
import ProductResource from "../../../../resources/ProductResource.js";
import { generalHelper, customFileHelper } from "../../../../helpers/index.js";

/**
 * Add Products with SEO & Media Handling
 * @param req
 * @param res
 * @param next
 */
export const importItems = async (req, res, next) => {
  try {
    const file = req?.files?.file ?? null;
    if (!file) throw StatusError.badRequest("No file uploaded.");

    const parsedData = await generalHelper.importFileParse(file.data);

    // Normalize keys
    const normalizedData = parsedData.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim(), value])
      )
    );

    const imported = [];

    for (const row of normalizedData) {
      const ID = row["ID"]?.trim();
      if (!ID) continue;
      const name = row["Name"];
      const existingProductName = await Product.findOne({ name: name });
      if (existingProductName) {
        console.log(`Skipping duplicate product by name: ${name}`);
        continue;
      }
      // 🚫 Skip if Product already exists by ID
      const existingProduct = await Product.findOne({ id: ID });
      if (existingProduct) {
        console.log(`Skipping existing product ID: ${ID}`);
        continue;
      }

      const sku = row["SKU"];
      const current_stock = row["Stock"];
      const description = row["Description"] || null;
      const brand = row["Brand"] || "67f81a034b16c345887be0c1";
      const status = row["Status"] || "active";
      const meta_title = row["Meta Title"];
      const meta_description = row["Meta Description"];
      const meta_keywords = row["Meta Keywords"];
      const weight = row["Weight (kg)"];
      const length = row["Length (cm)"];
      const width = row["Width (cm)"];
      const height = row["Height (cm)"];
      const regular_price = row["Regular price"];
      const sale_price = row["Sale price"] || regular_price;
      const cost_price = sale_price || regular_price;

      // ✅ Slug Handling
      const slugBase = generalHelper.generateSlugName(name);
      let slug = slugBase;
      let count = 1;
      while (await Product.exists({ slug })) {
        slug = generalHelper.generateSlugName(`${slugBase}-${count}`);
        count++;
      }

      // ✅ Category Parsing
      const CATEGORIES = (row["Categories"] || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const categories = [];

      for (let category_name of CATEGORIES) {
        let category = await Category.findOne({ name: category_name });

        if (!category) {
          const baseSlug = generalHelper.generateSlugName(category_name);
          let catSlug = baseSlug;
          let slugCount = 1;

          while (await Category.exists({ slug: catSlug })) {
            catSlug = generalHelper.generateSlugName(
              `${baseSlug}-${slugCount}`
            );
            slugCount++;
          }

          category = new Category({
            name: category_name,
            slug: catSlug,
            created_by: req.auth.user_id,
          });

          await category.save();
        }

        categories.push(category._id);
      }

      // ✅ Image Upload
      const imageUrls = (row["Images"] || "")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);

      const mediaIds = [];

      for (const imageUrl of imageUrls) {
        const key = `products/${slug}-${Date.now()}${path.extname(imageUrl)}`;
        const imgData = await customFileHelper.createStreamData(imageUrl);

        const s3Upload = await s3Handler.uploadToS3(
          { data: imgData, mimetype: "image/jpeg" },
          key
        );
        if (!s3Upload)
          throw StatusError.badRequest("Product image upload failed");

        const media = new Media({
          reference_id: null,
          reference_type: "products",
          url: key,
          type: "image",
          status: "active",
          created_by: req.auth.user_id,
        });

        await media.save();
        mediaIds.push(media._id);
      }

      // ✅ SEO (optional: you may link it later)
      const seo = new SEO({
        meta_title: meta_title || name,
        reference_type: "products",
        meta_description: meta_description || description,
        meta_keywords: meta_keywords ? meta_keywords.split(",") : [],
        canonical_url: `/product/${slug}`,
        created_by: req.auth.user_id,
      });

      await seo.save();

      // ✅ Product Creation
      const product = new Product({
        id: ID,
        sku,
        current_stock,
        regular_price,
        sale_price,
        cost_price,
        name,
        slug,
        description,
        brand,
        status,
        categories,
        images: mediaIds,
        seo: seo._id,
        shipping: { weight, length, width, height },
        created_by: req.auth.user_id,
      });

      await product.save();

      // Update references
      await SEO.findByIdAndUpdate(seo._id, { reference_id: product._id });
      await Media.updateMany(
        { _id: { $in: mediaIds } },
        { reference_id: product._id }
      );

      imported.push(product);
    }

    res.status(201).json({
      status: "success",
      message: req.__("Products imported successfully"),
      imported,
      count: imported.length,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
