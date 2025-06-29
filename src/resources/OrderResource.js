import Resource from "resources.js";
import UserResource from "./UserResource.js";
import AddressResource from "./AddressResource.js";
import MediaResource from "./MediaResource.js"; // make sure this handles collections

class OrderResource extends Resource {
  toArray() {
    const productMap = {};
    (this.product_details || []).forEach((prod) => {
      productMap[prod._id?.toString()] = prod;
    });
    // Build media map by product ID (ref_id)
    const mediaMap = {};
    (this.product_images || []).forEach((media) => {
      const refId = media.reference_id?.toString?.();
      if (!refId) return;

      if (!mediaMap[refId]) mediaMap[refId] = [];
      mediaMap[refId].push(media);
    });

    return {
      _id: this._id || null,
      id: this.id || null,
      transaction_id: this.transaction_id || null,
      order_status: this.order_status || null,
      payment_method: this.payment_method || null,
      payment_status: this.payment_status || null,
      total_amount: this.total_amount || 0,
      shipping: this.shipping || 0,
      discount: this.discount || 0,
      grand_total: this.grand_total || 0,
      payment_method: this.payment_method || null,
      user: this.user ? new UserResource(this.user).exec() : null,
      billing_address: this.billing_address
        ? new AddressResource(this.billing_address).exec()
        : null,
      shipping_address: this.shipping_address
        ? new AddressResource(this.shipping_address).exec()
        : null,
      products: (this.products || []).map((item) => {
        const prodId = item.product?.toString();
        const productInfo = productMap[prodId] || {};
        const images = mediaMap[prodId] || [];

        return {
          product_id: productInfo._id || null,
          sku: productInfo.sku || null,
          name: productInfo.name || null,
          slug: productInfo.slug || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          packed: item.packed || [],
          images: MediaResource.collection(images),
        };
      }),
      note: this.note || null,
      created_at: this.created_at || null,
      updated_at: this.updated_at || null,
    };
  }
}

export default OrderResource;
