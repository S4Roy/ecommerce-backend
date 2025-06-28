import Product from "../../../../models/Product.js";
import Media from "../../../../models/Media.js";
import SEO from "../../../../models/SEO.js";
import { StatusError } from "../../../../config/index.js";
import { s3Handler } from "../../../../services/s3Handler/s3Handler.js";
import path from "path";
import ProductResource from "../../../../resources/ProductResource.js";
import { generalHelper } from "../../../../helpers/index.js";

/**
 * Add Product with SEO & Media Handling
 * @param req
 * @param res
 * @param next
 */
export const add = async (req, res, next) => {
  try {
    const {
      name,
      description,
      brand,
      category,
      status,
      meta_title,
      meta_description,
      meta_keywords,
    } = req.body;
    const images = req?.files?.images ?? []; // Handle multiple images
    let slug = generalHelper.generateSlugName(name);
    console.log(category);

    // Ensure unique slug
    let count = 1;
    while (await Product.exists({ slug })) {
      slug = generalHelper.generateSlugName(`${name}-${count}`);
      count++;
    }

    // 🔹 Create SEO entry first (before product)
    const seo = new SEO({
      meta_title: meta_title || name,
      reference_type: "products",
      meta_description: meta_description || description || "",
      meta_keywords: meta_keywords ? meta_keywords.split(",") : [],
      canonical_url: `/product/${slug}`,
      created_by: req.auth.user_id,
    });
    await seo.save();

    // 🔹 Upload images to S3 and store media IDs
    let mediaIds = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const image of images) {
        const key = `products/${slug}-${Date.now()}${path.extname(image.name)}`;
        const s3Upload = await s3Handler.uploadToS3(image, key);
        if (!s3Upload)
          throw StatusError.badRequest(req.__("Product image upload failed"));

        // Create Media record
        const media = new Media({
          reference_id: null, // To be updated later
          reference_type: "products",
          url: key,
          type: "image",
          status: "active",
          created_by: req.auth.user_id,
        });
        await media.save();
        mediaIds.push(media._id);
      }
    }
    // 🔹 Parse comma-separated categories into array of ObjectIDs
    let categoryArray = [];
    if (category && typeof category === "string") {
      categoryArray = category
        .split(",")
        .map((id) => id.trim())
        .filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    }
    // 🔹 Create new product with SEO and images
    const product = new Product({
      name,
      slug,
      description: description || null,
      brand: brand || null,
      categories: categoryArray,
      images: mediaIds,
      status: status || "active",
      seo: seo._id, // Link SEO entry
      created_by: req.auth.user_id,
    });

    // Save product to DB
    await product.save();

    // Update SEO with reference_id
    await SEO.findByIdAndUpdate(seo._id, { reference_id: product._id });

    // Update media reference_id with product ID
    if (mediaIds.length > 0) {
      await Media.updateMany(
        { _id: { $in: mediaIds } },
        { reference_id: product._id }
      );
    }

    // Success Response
    res.status(201).json({
      status: "success",
      message: req.__("Product added successfully"),
      data: new ProductResource(product).exec(),
    });
  } catch (error) {
    next(error);
  }
};
