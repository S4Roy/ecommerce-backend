import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const WishlistSchema = new Schema(
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
    product: {
      type: Types.ObjectId,
      ref: "products",
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  { versionKey: false }
);

// Compound index for efficient queries by user or guest + product
WishlistSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } }
);
WishlistSchema.index(
  { guest_id: 1, product: 1 },
  { unique: true, partialFilterExpression: { guest_id: { $exists: true } } }
);
// Apply pagination plugin
WishlistSchema.plugin(mongooseAggregatePaginate);

// Create model
const Wishlist = model("wishlists", WishlistSchema);

export default Wishlist;
