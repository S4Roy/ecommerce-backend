import Category from "../../../../models/Category.js";
import Product from "../../../../models/Product.js";
import { StatusError } from "../../../../config/index.js";
import { envs } from "../../../../config/index.js";
import ProductResource from "../../../../resources/ProductResource.js";
import mongoose from "mongoose";

/**
 *  Product
 * @param req
 * @param res
 * @param next
 */
export const list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = envs.pagination.limit,
      search_key = "",
      sort_by = "created_at",
      sort_order = -1,
      category = null, // alias to avoid name collision
    } = req.query;
    const { slug } = req.params;

    const options = {
      page: page,
      limit: limit,
      sort: { [sort_by]: sort_order },
    };
    let matchFilter = { deleted_at: null };
    if (slug) {
      matchFilter.slug = slug;
    }
    if (category) {
      let existingCategory = await Category.findOne({ slug: category }).exec();
      matchFilter.categories = { $in: [existingCategory._id] };
    }
    // if (category && mongoose.Types.ObjectId.isValid(category)) {
    //   matchFilter.category = new mongoose.Types.ObjectId(
    //     category
    //   );
    // }
    // else {
    //   matchFilter.parent_category = null;
    // }
    if (search_key) {
      matchFilter.$or = [
        { name: { $regex: ".*" + search_key + ".*", $options: "i" } },
        { slug: { $regex: ".*" + search_key + ".*", $options: "i" } },
      ];
    }
    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      {
        $unwind: {
          path: "$brand",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "categories",
        },
      },

      {
        $lookup: {
          from: "medias",
          localField: "images", // 🔹 Reference to Media IDs
          foreignField: "_id",
          as: "media",
        },
      },
      {
        $lookup: {
          from: "seos",
          localField: "seo",
          foreignField: "_id",
          as: "seo",
        },
      },
      {
        $unwind: {
          path: "$seo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "created_by",
          foreignField: "_id",
          as: "created_by",
        },
      },
      {
        $unwind: {
          path: "$created_by",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "updated_by",
          foreignField: "_id",
          as: "updated_by",
        },
      },
      {
        $unwind: {
          path: "$updated_by",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    let data;
    if (slug) {
      // Fetch a single product by slug
      data = await Product.aggregate(pipeline);

      if (!data.length) {
        throw StatusError.notFound(req.__("Product not found"));
      }

      data = new ProductResource(data[0]).exec();
    } else {
      data = await Product.aggregatePaginate(
        Product.aggregate(pipeline),
        options
      );
      data.docs = await ProductResource.collection(data.docs);
    }
    res.status(201).json({
      status: "success",
      message: req.__(`${slug ? "Details" : "List"} fetched successfully`),
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
