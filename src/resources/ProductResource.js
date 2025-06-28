import Resource from "resources.js";
import { envs } from "../config/index.js";
import SEOResource from "./SEOResource.js";
import CategoryResourceMinimal from "./CategoryResourceMinimal.js";
import MediaResource from "./MediaResource.js";
import BrandResource from "./BrandResource.js";
import UserResource from "./UserResource.js";

class ProductResource extends Resource {
  toArray() {
    let doc = {
      _id: this._id || null,
      slug: this.slug || null,
      name: this.name || null,
      sku: this.sku || null,
      description: this.description || null,
      cost_price: this.cost_price || 0,
      regular_price: this.regular_price || 0,
      discount: this.discount || 0,
      sale_price: this.sale_price || 0,
      current_stock: this.current_stock || 0,
      low_stock_alert: this.low_stock_alert || 0,
      seo: new SEOResource(this.seo).exec() || null,
      brand: new BrandResource(this.brand).exec() || null,
      categories: CategoryResourceMinimal.collection(this.categories),
      status: this.status || null,
      is_wishlist: this.wishlist?._id ? true : false,
      is_carted: this.cart?._id ? true : false,
      cart_quantity: this.cart?.quantity || 0,
      images: MediaResource.collection(this.media),
      updated_at: this.updated_at || null,
      created_at: this.created_at || null,
      created_by: new UserResource(this.created_by).exec() || null,
      updated_by: new UserResource(this.updated_by).exec() || null,
    };
    return doc;
  }
}

export default ProductResource;
