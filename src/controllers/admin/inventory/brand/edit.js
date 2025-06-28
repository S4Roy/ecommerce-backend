import Brand from "../../../../models/Brand.js";
import Media from "../../../../models/Media.js";
import { StatusError } from "../../../../config/index.js";
import { s3Handler } from "../../../../services/s3Handler/s3Handler.js";
import path from "path";
import CategoryResource from "../../../../resources/CategoryResource.js";
import { generalHelper } from "../../../../helpers/index.js";

/**
 * Edit Brand
 * @param req
 * @param res
 * @param next
 */
export const edit = async (req, res, next) => {
  try {
    const { _id, name, description, parent_brand, status } = req.body;
    const image = req?.files?.image ?? null; // Get uploaded file (Single)

    if (!_id) {
      throw StatusError.badRequest(req.__("Brand ID is required"));
    }

    // Find the existing brand
    const brand = await Brand.findById(_id).exec();
    if (!brand) {
      throw StatusError.notFound(req.__("Brand not found"));
    }

    // Generate new slug only if the name has changed
    let slug = brand.slug;
    if (name && name !== brand.name) {
      slug = generalHelper.generateSlugName(name);

      // Check if another brand with the same slug exists
      let existingData = await Brand.findOne({
        slug,
        _id: { $ne: _id },
      }).exec();
      let count = 1;

      // Regenerate slug if a duplicate is found
      while (existingData) {
        slug = generalHelper.generateSlugName(`${name}-${count}`);
        existingData = await Brand.findOne({
          slug,
          _id: { $ne: _id },
        }).exec();
        count++;
      }
    }

    // Prepare update data
    let sanitizedParentCategory = null;

    if (
      parent_brand !== undefined &&
      parent_brand !== null &&
      parent_brand !== "" &&
      parent_brand !== "null" &&
      generalHelper.sanitizeObjectId(parent_brand)
    ) {
      sanitizedParentCategory = generalHelper.sanitizeObjectId(parent_brand);
    }

    const updateData = {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(description !== undefined && { description: description || null }),
      ...(status !== undefined && { status }),
      ...(sanitizedParentCategory !== null && {
        parent_brand: sanitizedParentCategory,
      }),
      updated_by: req.auth.user_id,
      updated_at: new Date(),
    };
    // Handle image upload if a new image is provided
    if (image) {
      const key = `brands/${slug}${path.extname(image.name)}`;
      const s3Upload = await s3Handler.uploadToS3(image, key);
      if (!s3Upload) {
        throw StatusError.badRequest(req.__("Brand image upload failed"));
      }
      // Create Media record
      const media = new Media({
        reference_id: null, // To be updated later
        reference_type: "brands",
        alt_text: image.name,
        url: key,
        type: "image",
        status: "active",
        created_by: req.auth.user_id,
      });
      await media.save();
      updateData.image = media?._id;
    }

    // Update the brand
    const updateBrand = await Brand.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    );

    // Success Response
    res.status(200).json({
      status: "success",
      message: req.__("Brand updated successfully"),
      data: new CategoryResource(updateBrand).exec(),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
