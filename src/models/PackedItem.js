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
    quantity: { type: Number, required: true },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

PackedItemSchema.index({ order_id: 1, product_id: 1 });

export default model("packed_items", PackedItemSchema);
