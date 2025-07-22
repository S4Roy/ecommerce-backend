import mongoose from "mongoose";
import Order from "../../../../models/Order.js";
import OrderItem from "../../../../models/OrderItem.js";
import { StatusError } from "../../../../config/index.js";
import OrderPickupDetailsResource from "../../../../resources/OrderPickupDetailsResource.js";

export const order_details = async (req, res, next) => {
  try {
    const { _id = null } = req.query;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      throw new StatusError(400, "Invalid order ID");
    }

    const orderId = new mongoose.Types.ObjectId(_id);

    const order = await Order.findById(orderId)
      .populate("user")
      .populate("shipping_address")
      .populate("billing_address");

    if (!order) {
      throw new StatusError(404, "Order not found");
    }

    const [{ items = [], totals = {} } = {}] = await OrderItem.aggregate([
      { $match: { order_id: order._id } },

      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },

      {
        $lookup: {
          from: "medias",
          localField: "productInfo.images",
          foreignField: "_id",
          as: "imagesData",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.categories",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $lookup: {
          from: "packed_items",
          let: { orderId: "$order_id", productId: "$product_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$order_id", "$$orderId"] },
                    { $eq: ["$product_id", "$$productId"] },
                  ],
                },
              },
            },
          ],
          as: "packedData",
        },
      },

      {
        $addFields: {
          packed_quantity: { $size: "$packedData" },
          unpacked_quantity: {
            $subtract: ["$quantity", { $size: "$packedData" }],
          },
        },
      },

      {
        $facet: {
          items: [
            { $sort: { unpacked_quantity: -1 } },
            {
              $project: {
                product_id: 1,
                order_id: 1,
                sku: "$productInfo.sku",
                name: "$productInfo.name",
                slug: "$productInfo.slug",
                shipping: "$productInfo.shipping",
                unit_price: 1,
                total_price: 1,
                ordered_quantity: "$quantity",
                packed_quantity: 1,
                current_stock: "$productInfo.current_stock",
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
          totals: [
            {
              $group: {
                _id: null,
                ordered_quantity: { $sum: "$quantity" },
                packed_quantity: { $sum: "$packed_quantity" },
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

    const data = new OrderPickupDetailsResource({
      id: order.id,
      _id: order._id,
      user: order.user,
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      payment_status: order.payment_status,
      order_status: order.order_status,
      total_amount: order.total_amount,
      grand_total: order.grand_total,
      created_at: order.created_at,
      order_items: items,
      ordered_quantity: totals.ordered_quantity || 0,
      packed_quantity: totals.packed_quantity || 0,
    }).exec();

    res.status(200).json({
      status: "success",
      message: req.__(`Details fetched successfully`),
      data,
    });
  } catch (error) {
    console.error("❌ order_details error:", error.message);
    next(error);
  }
};
