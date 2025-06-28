import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const CartSchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: false,
      default: null,
    }, // ✅ Nullable for guest users
    guest_id: {
      type: String, // UUID or any unique string for guest users
      required: false,
      default: null, // ✅ Nullable for guest users
    },
    product: { type: mongoose.Types.ObjectId, ref: "products", required: true },
    quantity: { type: Number, required: true, min: 1 },
    deleted_at: { type: Date, default: null }, // ✅ Soft delete flag
  },
  { timestamps: true }
);

// CartSchema.index({ user: 1, product: 1 }, { unique: true });
// Compound index for efficient queries by user or guest + product
CartSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } }
);
CartSchema.index(
  { guest_id: 1, product: 1 },
  { unique: true, partialFilterExpression: { guest_id: { $exists: true } } }
);
// Apply pagination plugin
CartSchema.plugin(mongooseAggregatePaginate);

// Create model
const Cart = model("carts", CartSchema);

export default Cart;
