import mongoose from "mongoose";
import Order from "../../../../models/Order.js";
import User from "../../../../models/User.js";
import Address from "../../../../models/Address.js";
import Product from "../../../../models/Product.js";
import StockTransaction from "../../../../models/StockTransaction.js";
import { StatusError } from "../../../../config/index.js";

export const addOrder = async (req, res, next) => {
  try {
    const {
      order_id,
      status,
      total,
      currency,
      discount,
      shipping,
      customer,
      billing_address,
      shipping_address,
      payment_method,
      items,
    } = req.body;

    console.log(`🚀 Received order: ${order_id}`);

    // 🔒 1. Prevent duplicate order
    const existingOrder = await Order.findOne({ id: order_id });
    if (existingOrder) {
      console.warn(`⚠️ Duplicate order attempt: ${order_id}`);
      throw new StatusError(409, `Order with ID ${order_id} already exists`);
    }

    // 👤 2. Find or create user
    let user = await User.findOne({ email: customer.email });
    if (!user) {
      console.log(`👤 Creating new user for ${customer.email}`);
      user = await User.create({
        role: "customer",
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        email: customer.email,
        mobile: customer.phone || null,
        password: "external_order",
        status: "active",
      });
    }

    // 🏠 3. Find or create billing address
    const billingFilter = {
      user: user._id,
      full_name: `${customer.first_name} ${customer.last_name}`.trim(),
      phone: customer.phone || null,
      email: customer.email,
      address_line1: billing_address.address_1,
      city: billing_address.city,
      state: billing_address.state,
      country: billing_address.country,
      pincode: billing_address.postcode,
    };

    let billingAddress = await Address.findOne(billingFilter);
    if (!billingAddress) {
      console.log(`📦 Creating billing address for user ${user.email}`);
      billingAddress = await Address.create({
        ...billingFilter,
        address_line2: billing_address.address_2 || "",
        landmark: "",
        address_type: "home",
        purpose: "billing",
        is_default: true,
        created_by: user._id,
      });
    }

    // 📬 4. Find or create shipping address
    const shippingFilter = {
      user: user._id,
      full_name: `${customer.first_name} ${customer.last_name}`.trim(),
      phone: customer.phone || null,
      email: customer.email,
      address_line1: shipping_address.address_1,
      city: shipping_address.city,
      state: shipping_address.state,
      country: shipping_address.country,
      pincode: shipping_address.postcode,
    };

    let shippingAddress = await Address.findOne(shippingFilter);
    if (!shippingAddress) {
      console.log(`📦 Creating shipping address for user ${user.email}`);
      shippingAddress = await Address.create({
        ...shippingFilter,
        address_line2: shipping_address.address_2 || "",
        landmark: "",
        address_type: "home",
        purpose: "shipping",
        is_default: false,
        created_by: user._id,
      });
    }

    // 📦 5. Prepare product list
    const products = [];
    const stockTransactions = [];

    for (const item of items) {
      const productDoc = await Product.findOne({ id: String(item.product_id) });
      if (!productDoc) {
        console.warn(`⚠️ Product not found for ID: ${item.product_id}`);
        continue;
      }

      const quantity = item.quantity;
      const unit_price = parseFloat(item.unit_price ?? item.price ?? 0);
      const total_price = parseFloat(item.subtotal ?? unit_price * quantity);
      const regular_price = parseFloat(item.regular_price ?? 0);
      const sale_price = parseFloat(item.sale_price ?? 0);

      if (productDoc.current_stock < quantity) {
        throw new StatusError(400, `Insufficient stock for ${productDoc.name}`);
      }

      // Reduce stock
      productDoc.current_stock -= quantity;
      await productDoc.save();

      console.log(`🛒 Adding product: ${productDoc.name} x${quantity}`);

      products.push({
        product: productDoc._id,
        quantity,
        unit_price,
        total_price,
        regular_price,
        sale_price,
        packed: [],
      });

      stockTransactions.push({
        product: productDoc._id,
        type: "sale",
        quantity,
        reference_type: "order",
        sale_price: unit_price,
        created_by: user._id,
      });
    }

    if (!products.length) {
      throw new StatusError(400, "No valid products found in the order");
    }

    // 📝 6. Create order
    const order = await Order.create({
      id: order_id,
      user: user._id,
      billing_address: billingAddress._id,
      shipping_address: shippingAddress._id,
      products,
      payment_status: "pending",
      order_status: status,
      total_amount: parseFloat(total),
      discount: parseFloat(discount ?? 0),
      shipping: parseFloat(shipping ?? 0),
      grand_total: parseFloat(total),
      payment_method: payment_method,
      transaction_id: `EXT-${order_id}`,
      note: "Imported from external source",
    });

    console.log(`✅ Order created: ${order.id}`);

    // 📉 7. Add stock transactions
    for (const txn of stockTransactions) {
      txn.reference_id = order._id;
    }

    await StockTransaction.insertMany(stockTransactions);
    console.log(`📊 Stock transactions logged: ${stockTransactions.length}`);

    return res.status(200).json({
      status: "success",
      message: "Order synced",
      data: { order_id: order.id },
    });
  } catch (error) {
    console.error("❌ Order sync failed:", error.message);
    next(error);
  }
};
