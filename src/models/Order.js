import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const OrderSchema = new Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "users", required: true },
    shipping_address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "address",
      required: true,
    },
    billing_address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "address",
      required: true,
    },

    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
        quantity: Number,
        unit_price: Number,
        total_price: Number,
      },
    ],

    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    order_status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    total_amount: Number,
    discount: Number,
    grand_total: Number,

    payment_method: { type: String, enum: ["cod", "online"] },
    transaction_id: String,
    note: String,

    deleted_at: { type: Date, default: null },
  },
  { versionKey: false }
);
// Apply pagination plugin
OrderSchema.plugin(mongooseAggregatePaginate);

// Create model
const Order = model("orders", OrderSchema);

export default Order;
