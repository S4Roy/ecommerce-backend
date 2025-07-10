import Order from "../../../../models/Order.js";
import { StatusError, envs } from "../../../../config/index.js";
import OrderPickupDetailsResource from "../../../../resources/OrderPickupDetailsResource.js";
import mongoose from "mongoose";

export const order_details = async (req, res, next) => {
  try {
    const { _id = null } = req.query;

    const results = await Order.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(_id) },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          let: { productId: "$products.product" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
            {
              $lookup: {
                from: "medias",
                localField: "images",
                foreignField: "_id",
                as: "imagesData",
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "categories",
                foreignField: "_id",
                as: "categoryData",
              },
            },
          ],
          as: "productInfo",
        },
      },

      { $unwind: "$productInfo" },
      {
        $addFields: {
          ordered_quantity: "$products.quantity",
          packed_quantity: { $size: { $ifNull: ["$products.packed", []] } },
          current_stock: "$productInfo.current_stock",
        },
      },
      {
        $project: {
          _id: 0,
          order_id: "$_id",
          product_id: "$products.product",
          sku: "$productInfo.sku",
          name: "$productInfo.name",
          slug: "$productInfo.slug",
          shipping: "$productInfo.shipping",
          unit_price: "$products.unit_price",
          total_price: "$products.total_price",
          ordered_quantity: 1,
          packed_quantity: 1,
          current_stock: 1,
          images: {
            $map: {
              input: "$productInfo.imagesData",
              as: "img",
              in: {
                _id: "$$img._id",
                url: "$$img.url", // Adjust field names as per your `medias` schema
                alt: "$$img.alt",
              },
            },
          },
          categories: {
            $map: {
              input: "$productInfo.categoryData",
              as: "cat",
              in: {
                _id: "$$cat._id",
                name: "$$cat.name", // Adjust field names as per your `medias` schema
                slug: "$$cat.slug",
              },
            },
          },
        },
      },

      {
        $group: {
          _id: "$order_id",
          products: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "_id",
          as: "orderData",
        },
      },
      { $unwind: "$orderData" },
      {
        $project: {
          order_id: "$_id",
          user: "$orderData.user",
          shipping_address: "$orderData.shipping_address",
          billing_address: "$orderData.billing_address",
          payment_status: "$orderData.payment_status",
          order_status: "$orderData.order_status",
          total_amount: "$orderData.total_amount",
          grand_total: "$orderData.grand_total",
          created_at: "$orderData.created_at",
          products: 1,
        },
      },
    ]);
    let data = new OrderPickupDetailsResource(results[0]).exec();

    res.status(200).json({
      status: "success",
      message: req.__(`Details fetched successfully`),
      data,
    });
  } catch (error) {
    next(error);
  }
};
