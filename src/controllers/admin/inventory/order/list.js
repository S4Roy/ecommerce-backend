import Order from "../../../../models/Order.js";
import { StatusError, envs } from "../../../../config/index.js";
import mongoose from "mongoose";

export const list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = envs.pagination.limit,
      order_status = "",
      search_key = "",
      sort_by = "id",
      sort_order = -1,
      _id = null,
    } = req.query;

    const { slug = null } = req.params;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sort_by]: parseInt(sort_order) },
    };

    const matchFilter = { deleted_at: null };

    if (slug) matchFilter.slug = slug;
    if (_id) matchFilter._id = new mongoose.Types.ObjectId(_id);
    if (order_status) matchFilter.order_status = order_status;
    if (search_key) {
      matchFilter.$or = [
        { id: { $regex: search_key, $options: "i" } },
        { transaction_id: { $regex: search_key, $options: "i" } },
        { order_status: { $regex: search_key, $options: "i" } },
      ];
    }

    const pipeline = [
      { $match: matchFilter },

      // Lookup user
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Billing address
      {
        $lookup: {
          from: "addresses",
          localField: "billing_address",
          foreignField: "_id",
          as: "billing_address",
        },
      },
      {
        $unwind: {
          path: "$billing_address",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Shipping address
      {
        $lookup: {
          from: "addresses",
          localField: "shipping_address",
          foreignField: "_id",
          as: "shipping_address",
        },
      },
      {
        $unwind: {
          path: "$shipping_address",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup order items
      {
        $lookup: {
          from: "order_items",
          localField: "_id",
          foreignField: "order_id",
          as: "order_items",
        },
      },

      // Expand order_items to process product + image lookups
      { $unwind: { path: "$order_items", preserveNullAndEmptyArrays: true } },

      // Lookup product in order_item
      {
        $lookup: {
          from: "products",
          localField: "order_items.product_id",
          foreignField: "_id",
          as: "product_doc",
        },
      },
      {
        $unwind: {
          path: "$product_doc",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup images for product
      {
        $lookup: {
          from: "medias",
          localField: "product_doc.images",
          foreignField: "_id",
          as: "product_images",
        },
      },

      // Rebuild order_item
      {
        $addFields: {
          "order_items.product": {
            $mergeObjects: ["$product_doc", { images: "$product_images" }],
          },
        },
      },

      // Group all order_items back
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
          order_items: { $push: "$order_items" },
        },
      },
      {
        $addFields: {
          "doc.order_items": "$order_items",
        },
      },
      {
        $replaceRoot: { newRoot: "$doc" },
      },
    ];

    let data;
    if (slug || _id) {
      const result = await Order.aggregate(pipeline);
      if (!result.length) throw StatusError.notFound(req.__("Order not found"));
      data = result[0];
    } else {
      const agg = Order.aggregate(pipeline);
      const result = await Order.aggregatePaginate(agg, options);
      data = result;
    }

    res.status(200).json({
      status: "success",
      message: req.__(
        `${slug || _id ? "Details" : "List"} fetched successfully`
      ),
      data,
    });
  } catch (error) {
    next(error);
  }
};
