import mongoose from "mongoose";
const { Schema, model } = mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Sub-schema for item packing info
const PackingSchema = new Schema(
  {
    packed_at: { type: Date, default: null },
    packed_by: { type: Schema.Types.ObjectId, ref: "users" },
    serial: { type: String },
    label_printed: { type: Boolean, default: false },
  },
  { _id: false }
);

// Product item in the order
const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "products", required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true },
    packed: { type: [PackingSchema], default: [] },
  },
  { _id: false }
);

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
      required: true,
    },
    billing_address: {
      type: Schema.Types.ObjectId,
      ref: "address",
      required: true,
    },

    products: { type: [OrderItemSchema], required: true },

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
    discount: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },

    payment_method: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    transaction_id: { type: String },
    note: { type: String },

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
