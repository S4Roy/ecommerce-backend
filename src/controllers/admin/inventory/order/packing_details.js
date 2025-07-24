import mongoose from "mongoose";
import Order from "../../../../models/Order.js";
import PackedItem from "../../../../models/PackedItem.js";
import OrderItem from "../../../../models/OrderItem.js";
import { StatusError } from "../../../../config/index.js";
import PackedItemDetailsResource from "../../../../resources/PackedItemDetailsResource.js";

export const packing_details = async (req, res, next) => {
  try {
    const { _id = null } = req.query;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      throw new StatusError(400, "Invalid order ID");
    }

    const orderId = new mongoose.Types.ObjectId(_id);
    const order = await Order.findById(orderId);

    if (!order) {
      throw new StatusError(404, "Order not found");
    }

    const [{ items = [], totals = {} } = {}] = await PackedItem.aggregate([
      { $match: { order_id: order._id } },

      // Join product details
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },

      // Join product images
      {
        $lookup: {
          from: "medias",
          localField: "productInfo.images",
          foreignField: "_id",
          as: "imagesData",
        },
      },

      // Join categories
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.categories",
          foreignField: "_id",
          as: "categoryData",
        },
      },

      {
        $facet: {
          items: [
            {
              $project: {
                product_id: 1,
                order_id: 1,
                sku: "$productInfo.sku",
                name: "$productInfo.name",
                slug: "$productInfo.slug",
                ordered_quantity: "$quantity",
                picked_quantity: 1,
                images: {
                  $map: {
                    input: "$imagesData",
                    as: "img",
                    in: {
                      _id: "$$img._id",
                      url: "$$img.url",
                      alt: "$$img.alt",
                    },
                  },
                },
                categories: {
                  $map: {
                    input: "$categoryData",
                    as: "cat",
                    in: {
                      _id: "$$cat._id",
                      name: "$$cat.name",
                      slug: "$$cat.slug",
                    },
                  },
                },
              },
            },
          ],
        },
      },

      {
        $project: {
          items: 1,
          totals: { $ifNull: [{ $arrayElemAt: ["$totals", 0] }, {}] },
        },
      },
    ]);

    const data = new PackedItemDetailsResource({
      id: order.id,
      _id: order._id,
      order_status: order.order_status,
      total_amount: order.total_amount,
      grand_total: order.grand_total,
      created_at: order.created_at,
      packed_items: items,
      ordered_quantity: totals.ordered_quantity || 0,
      picked_quantity: totals.picked_quantity || 0,
    }).exec();

    res.status(200).json({
      status: "success",
      message: req.__("Packed items fetched successfully"),
      data,
    });
  } catch (error) {
    console.error("❌ packing_details error:", error.message);
    next(error);
  }
};
