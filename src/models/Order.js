import mongoose from "mongoose";
const { Schema, model } = mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Main order schema
const OrderSchema = new Schema(
  {
    id: {
      type: String,
    },
    user: { type: Schema.Types.ObjectId, ref: "users", required: true },

    shipping_address: {
      type: Schema.Types.ObjectId,
      ref: "address",
      required: false,
      default: null,
    },
    billing_address: {
      type: Schema.Types.ObjectId,
      ref: "address",
      required: false,
      default: null,
    },

    payment_status: {
      type: String,
      // enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    order_status: {
      type: String,
      // enum: [
      //   "pending",
      //   "confirmed",
      //   "packed",
      //   "shipped",
      //   "delivered",
      //   "cancelled",
      // ],
      default: "pending",
    },

    total_amount: { type: Number, required: true },
    item_count: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },

    payment_method: {
      type: String,
      // enum: ["cod", "online"],
      required: false,
    },
    transaction_id: { type: String },
    note: { type: String },
    payment_status: { type: String },
    payment_meta: { type: Object, default: {} }, // optional Razorpay response etc.

    paid_at: { type: Date, default: null },

    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    versionKey: false,
  }
);

// Indexes for performance
OrderSchema.index({ user: 1, created_at: -1 });
OrderSchema.index({ order_status: 1 });
OrderSchema.index({ "products.product": 1 });

// Apply pagination plugin
OrderSchema.plugin(mongooseAggregatePaginate);

// Create and export model
const Order = model("orders", OrderSchema);
export default Order;
