import mongoose from "mongoose";
import Product from "../../../../models/Product.js";
import { StatusError } from "../../../../config/index.js";
import { envs } from "../../../../config/index.js";

export const picked_item_by_sku = async (req, res, next) => {
  try {
    const { sku, order_id } = req.query;

    if (!sku || !order_id) {
      throw new StatusError(400, "Both 'sku' and 'order_id' are required.");
    }

    if (!mongoose.isValidObjectId(order_id)) {
      throw new StatusError(400, "Invalid Order ID format.");
    }

    const pipeline = [
      {
        $match: { sku: sku },
      },
      {
        $limit: 1,
      },
      {
        $lookup: {
          from: "order_items",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product_id", "$$productId"] },
                    {
                      $eq: ["$order_id", new mongoose.Types.ObjectId(order_id)],
                    },
                  ],
                },
              },
            },
            {
              $limit: 1,
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
                  {
                    $project: {
                      _id: 1,
                      serial: 1,
                      picked_by: 1,
                      packed_at: 1,
                      label_printed: 1,
                      package_no: 1,
                    },
                  },
                ],
                as: "packed",
              },
            },
            {
              $addFields: {
                picked_quantity: { $size: "$packed" },
              },
            },
          ],
          as: "orderItem",
        },
      },
      {
        $unwind: "$orderItem",
      },
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
        $project: {
          _id: 0,
          product_id: "$_id",
          brand: {
            _id: "$brand._id",
            name: "$brand.name",
            slug: "$brand.slug",
          },
          categories: {
            $map: {
              input: "$categories",
              as: "cat",
              in: {
                _id: "$$cat._id",
                name: "$$cat.name",
                slug: "$$cat.slug",
              },
            },
          },
          images: {
            $map: {
              input: "$media",
              as: "img",
              in: {
                _id: "$$img._id",
                url: {
                  $concat: [envs.s3.BASE_URL, "$$img.url"],
                },
                alt: "$$img.alt",
              },
            },
          },
          slug: "$slug",
          shipping: "$shipping",
          sku: "$sku",
          name: "$name",
          current_stock: "$current_stock",
          order_id: "$orderItem.order_id",
          order_item_id: "$orderItem._id",
          ordered_quantity: "$orderItem.quantity",
          picked_quantity: "$orderItem.picked_quantity",
          packed: "$orderItem.packed",
        },
      },
    ];

    const result = await Product.aggregate(pipeline);

    if (!result.length) {
      throw new StatusError(
        404,
        "No matching product/order combination found."
      );
    }

    return res.status(200).json({
      status: "success",
      message:
        result[0].picked_quantity > 0
          ? "Picked item fetched successfully"
          : "Item found but not yet picked",
      data: result[0],
    });
  } catch (error) {
    next(error);
  }
};
