import mongoose from "mongoose";
import Product from "../../../../models/Product.js";
import PackedItem from "../../../../models/PackedItem.js";
import { StatusError, envs } from "../../../../config/index.js";

export const scan_and_pick_item = async (req, res, next) => {
  try {
    const { sku, order_id } = req.query;
    const user_id = req.auth.user_id; // 📌 Authenticated packer

    if (!sku || !order_id) {
      throw new StatusError(400, "Both 'sku' and 'order_id' are required.");
    }

    if (!mongoose.isValidObjectId(order_id)) {
      throw new StatusError(400, "Invalid Order ID format.");
    }

    // STEP 1: Look up the product, order item, and packed count
    const [result] = await Product.aggregate([
      { $match: { sku: sku } },
      { $limit: 1 },
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
            { $limit: 1 },
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
      { $unwind: "$orderItem" },

      // Lookups for media, brand, etc.
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

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
          localField: "images",
          foreignField: "_id",
          as: "media",
        },
      },

      // Final projection
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
                url: { $concat: [envs.s3.BASE_URL, "$$img.url"] },
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
    ]);

    if (!result) {
      throw new StatusError(404, "Item not found in this order.");
    }

    const { ordered_quantity, picked_quantity } = result;

    // STEP 2: Validate if more can be packed
    if (picked_quantity >= ordered_quantity) {
      return res.status(409).json({
        status: "warning",
        message: "All items already packed for this SKU.",
        data: result,
      });
    }

    // STEP 3: Insert new packed item
    const packed = await PackedItem.create({
      order_id: result.order_id,
      product_id: result.product_id,
      order_item_id: result.order_item_id,
      sku: result.sku,
      packed_by: user_id,
      // Optionally add: serial, package_no, etc.
    });

    // STEP 4: Respond with updated status
    result.picked_quantity += 1;
    result.packed.push({
      _id: packed._id,
      picked_by: packed.picked_by,
      packed_at: packed.packed_at,
      label_printed: packed.label_printed,
      package_no: packed.package_no,
    });

    return res.status(200).json({
      status: "success",
      message: "Item packed successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ scan_and_pack_item error:", error);
    next(error);
  }
};
