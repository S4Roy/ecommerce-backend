import mongoose from "mongoose";
const { Schema, model } = mongoose;

const OrderItemSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "orders", required: true },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true },
    regular_price: { type: Number },
    sale_price: { type: Number },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const OrderItem = model("order_items", OrderItemSchema);
export default OrderItem;
