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
      sort_by = "created_at", // prefer a real field
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

    // Build a compact match filter early
    const matchFilter = { deleted_at: null };
    if (slug) matchFilter.slug = slug;
    if (_id) {
      // if _id is passed as string, convert to ObjectId safely
      matchFilter._id = mongoose.Types.ObjectId.isValid(_id)
        ? new mongoose.Types.ObjectId(_id)
        : _id;
    }
    if (order_status) matchFilter.order_status = order_status;
    if (search_key) {
      const re = { $regex: search_key, $options: "i" };
      matchFilter.$or = [
        { id: re },
        { transaction_id: re },
        { order_status: re },
      ];
    }

    // Base pipeline: match + user lookup (minimal user fields)
    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      // keep user as single doc or null
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      // project minimal user fields (optional, adjust as needed)
      {
        $addFields: {
          user: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            // add other small user fields you need
          },
        },
      },
    ];

    if (isDetail) {
      // DETAIL view:
      // - Lookup order_items and, for each item, lookup its product and product images,
      //   all inside a single lookup pipeline to avoid unwinding/grouping.
      pipeline.push(
        // Addresses (billing & shipping) - single doc each
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

        // order_items lookup: embed product (with its medias) inside each item
        {
          $lookup: {
            from: "order_items",
            let: { orderId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$order_id", "$$orderId"] } } },
              // fetch the product doc for this order_item.product_id
              {
                $lookup: {
                  from: "products",
                  let: { pid: "$product_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$pid"] } } },
                    // bring product medias inline
                    {
                      $lookup: {
                        from: "medias",
                        localField: "images",
                        foreignField: "_id",
                        as: "images",
                      },
                    },
                    // keep a compact product doc (avoid leaking very large product docs)
                    {
                      $project: {
                        _id: 1,
                        title: 1,
                        slug: 1,
                        sku: 1,
                        type: 1,
                        price: 1,
                        images: 1,
                        // include any other necessary product fields here
                      },
                    },
                  ],
                  as: "product_doc",
                },
              },
              // product_doc will be an array (0 or 1) -> unwind to single doc if exists
              {
                $unwind: {
                  path: "$product_doc",
                  preserveNullAndEmptyArrays: true,
                },
              },
              // merge the product into the order_item under `product`
              {
                $addFields: {
                  product: "$product_doc",
                },
              },
              // project only necessary order_item fields to reduce size
              {
                $project: {
                  _id: 1,
                  product_id: 1,
                  qty: 1,
                  price: 1,
                  variant: 1,
                  product: 1,
                  // any other fields you want to expose
                },
              },
            ],
            as: "order_items",
          },
        },

        // Finally, project the shape you want returned for details
        {
          $project: {
            id: 1,
            order_status: 1,
            created_at: 1,
            updated_at: 1,
            transaction_id: 1,
            grand_total: 1,
            user: 1,
            billing_address: 1,
            shipping_address: 1,
            order_items: 1,
            // include other order-level fields you need
          },
        }
      );
    } else {
      // LIST view: keep documents small and fast
      pipeline.push({
        $project: {
          id: 1,
          order_status: 1,
          user: 1,
          created_at: 1,
          grand_total: 1,
          "order_items.product_id": 1, // keep product_id only (if needed)
        },
      });
    }

    let data;

    if (isDetail) {
      const result = await Order.aggregate(pipeline);

      if (!result.length) throw StatusError.notFound(req.__("Order not found"));

      data = new OrderResource(result[0]).exec();
    } else {
      // LIST (paginated)
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
