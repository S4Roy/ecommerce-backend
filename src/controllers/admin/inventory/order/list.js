import Order from "../../../../models/Order.js";
import { StatusError } from "../../../../config/index.js";
import { envs } from "../../../../config/index.js";
import OrderResource from "../../../../resources/OrderResource.js";
import mongoose from "mongoose";

export const list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = envs.pagination.limit,
      search_key = "",
      sort_by = "id",
      sort_order = -1,
      _id = null,
    } = req.query;

    const { slug = null } = req.params;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sort_by]: sort_order },
    };

    const matchFilter = { deleted_at: null };

    if (slug) {
      matchFilter.slug = slug;
    }

    if (_id) {
      matchFilter._id = new mongoose.Types.ObjectId(_id);
    }

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

      // Lookup billing address
      {
        $lookup: {
          from: "addresses",
          localField: "billing_address",
          foreignField: "_id",
          as: "billing_address",
        },
      },
      {
        $unwind: { path: "$billing_address", preserveNullAndEmptyArrays: true },
      },

      // Lookup shipping address
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

      // Lookup product details
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "product_details",
        },
      },

      {
        $lookup: {
          from: "medias",
          localField: "product_details.images",
          foreignField: "_id",
          as: "product_images",
        },
      },
    ];

    let data;
    if (slug || _id) {
      // Single order detail
      const result = await Order.aggregate(pipeline);
      if (!result.length) {
        throw StatusError.notFound(req.__("Order not found"));
      }
      data = new OrderResource(result[0]).exec();
    } else {
      // Paginated list
      const agg = Order.aggregate(pipeline);
      const result = await Order.aggregatePaginate(agg, options);
      result.docs = await OrderResource.collection(result.docs);
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
