import mongoose from "mongoose";
const { Schema, model } = mongoose;

const PackedItemSchema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "orders", required: true },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    order_item_id: { type: Schema.Types.ObjectId, ref: "order_items" }, // Optional link to specific item
    packed_by: { type: Schema.Types.ObjectId, ref: "users", required: true },
    quantity: { type: Number, required: true },
    serial: { type: String }, // Optional serial number (for electronics etc.)
    packed_at: { type: Date, default: Date.now },
    label_printed: { type: Boolean, default: false },
    package_no: { type: Number }, // Optional for box labeling
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PackedItemSchema.index({ order_id: 1, product_id: 1 });

export default model("packed_items", PackedItemSchema);
