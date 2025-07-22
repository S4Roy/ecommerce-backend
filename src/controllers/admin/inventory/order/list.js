import Order from "../../../../models/Order.js";
import { StatusError, envs } from "../../../../config/index.js";
import mongoose from "mongoose";
import OrderResource from "../../../../resources/OrderResource.js";

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

    const isDetail = !!(_id || slug);

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

      // Lookup order items
      {
        $lookup: {
          from: "order_items",
          localField: "_id",
          foreignField: "order_id",
          as: "order_items",
        },
      },
    ];

    // If details view, enrich with address, product, and media
    if (isDetail) {
      pipeline.push(
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

        // Expand order_items to get product info
        { $unwind: { path: "$order_items", preserveNullAndEmptyArrays: true } },
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
        {
          $lookup: {
            from: "medias",
            localField: "product_doc.images",
            foreignField: "_id",
            as: "product_images",
          },
        },
        {
          $addFields: {
            "order_items.product": {
              $mergeObjects: ["$product_doc", { images: "$product_images" }],
            },
          },
        },
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
        }
      );
    } else {
      // LIST view: project minimal fields
      pipeline.push({
        $project: {
          id: 1,
          order_status: 1,
          user: 1,
          created_at: 1,
          grand_total: 1,
          "order_items.product_id": 1,
        },
      });
    }

    let data;

    if (isDetail) {
      const result = await Order.aggregate(pipeline);
      if (!result.length) throw StatusError.notFound(req.__("Order not found"));
      data = new OrderResource(result[0]).exec();
    } else {
      const agg = Order.aggregate(pipeline);
      const result = await Order.aggregatePaginate(agg, options);
      result.docs = await OrderResource.collection(result.docs);
      data = result;
    }

    res.status(200).json({
      status: "success",
      message: req.__(`${isDetail ? "Details" : "List"} fetched successfully`),
      data,
    });
  } catch (error) {
    next(error);
  }
};
