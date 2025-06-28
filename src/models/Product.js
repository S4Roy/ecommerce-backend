import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import slugify from "slugify";

const { Schema, model, Types } = mongoose;

const ProductSchema = new Schema(
  {
    id: {
      type: String,
      default: "",
    },
    sku: {
      type: String,
      // required: true,
      unique: true,
      // uppercase: true,
      trim: true,
      default: "",
    },
    cost_price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    regular_price: {
      type: Number,
      min: 0,
      default: 0,
    },
    sale_price: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    current_stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    low_stock_alert: {
      type: Number,
      default: 5,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    brand: {
      type: Types.ObjectId,
      ref: "brands",
      required: false, // Ensure products always have a brand
      default: null,
    },
    categories: [
      {
        type: Types.ObjectId,
        ref: "categories",
        required: true, // Ensure products always have a category
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    images: [
      {
        type: Types.ObjectId,
        ref: "medias", // 🔹 Reference to Media Model
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
    seo: {
      type: Types.ObjectId,
      ref: "seo", // 🔹 Reference to SEO Model
      default: null,
    },
    shipping_profile: {
      type: Types.ObjectId,
      ref: "shipping_profiles",
      default: null,
    },
    shipping: {
      weight: { type: String, default: null },
      length: { type: String, default: null },
      width: { type: String, default: null },
      height: { type: String, default: null },
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    created_by: {
      type: Types.ObjectId,
      ref: "users",
      default: null,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    updated_by: {
      type: Types.ObjectId,
      ref: "users",
      default: null,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    deleted_by: {
      type: Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { versionKey: false }
);

// 🔹 Automatically generate slug only when `name` changes
ProductSchema.pre("validate", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// 🔹 Indexing for faster queries
ProductSchema.index({ name: 1 });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ status: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ meta_title: 1 });
ProductSchema.index({ meta_keywords: 1 });

// 🔹 Separate unique sparse index on `serial_numbers`
ProductSchema.index({ serial_numbers: 1 }, { unique: true, sparse: true });

// 🔹 Apply pagination plugin
ProductSchema.plugin(mongooseAggregatePaginate);

// Create model
const Product = model("products", ProductSchema);

export default Product;
