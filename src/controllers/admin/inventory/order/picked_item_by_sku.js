import Order from "../../../../models/Order.js";
import mongoose from "mongoose";

export const picked_item_by_sku = async (req, res, next) => {
  try {
    const { sku, order_id } = req.query;

    if (!sku || !order_id) {
      return res.status(400).json({
        status: "error",
        message: "Both 'sku' and 'order_id' are required.",
      });
    }

    const data = await Order.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(order_id),
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $match: {
          "productInfo.sku": sku,
        },
      },
      {
        $addFields: {
          packed_quantity: { $size: { $ifNull: ["$products.packed", []] } },
        },
      },
      {
        $project: {
          order_id: "$_id",
          product_id: "$products.product",
          sku: "$productInfo.sku",
          name: "$productInfo.name",
          ordered_quantity: "$products.quantity",
          packed_quantity: 1,
          packed: "$products.packed",
        },
      },
    ]);

    if (!data.length) {
      return res.status(404).json({
        status: "error",
        message: "No matching item found for this SKU and Order ID",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Picked item fetched successfully",
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};
