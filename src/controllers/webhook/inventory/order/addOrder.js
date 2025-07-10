import mongoose from "mongoose";
import Order from "../../../../models/Order.js";
import OrderItem from "../../../../models/OrderItem.js";
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

    // 🏠 3. Billing address
    let billingAddress = null;
    if (billing_address?.address_1) {
      const billingFilter = {
        user: user._id,
        full_name: `${customer.first_name} ${customer.last_name}`.trim(),
        phone: customer.phone || null,
        email: customer.email,
        address_line1: billing_address.address_1,
        city: billing_address.city || "",
        state: billing_address.state || "",
        country: billing_address.country || "",
        pincode: billing_address.postcode || "",
      };

      billingAddress = await Address.findOne(billingFilter);
      if (!billingAddress) {
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
    }

    // 📬 4. Shipping address
    let shippingAddress = null;
    if (shipping_address?.address_1) {
      const shippingFilter = {
        user: user._id,
        full_name: `${customer.first_name} ${customer.last_name}`.trim(),
        phone: customer.phone || null,
        email: customer.email,
        address_line1: shipping_address.address_1,
        city: shipping_address.city || "",
        state: shipping_address.state || "",
        country: shipping_address.country || "",
        pincode: shipping_address.postcode || "",
      };

      shippingAddress = await Address.findOne(shippingFilter);
      if (!shippingAddress) {
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
    }
    const totalAmount = parseFloat(total ?? 0);
    const discountAmount = parseFloat(discount ?? 0);
    const shippingAmount = parseFloat(shipping ?? 0);

    const sub_total = totalAmount - discountAmount - shippingAmount;
    // ✅ 5. Create Order first (without products)
    const order = await Order.create({
      id: order_id,
      user: user._id,
      billing_address: billingAddress?._id ?? null,
      shipping_address: shippingAddress?._id ?? null,
      payment_status: "pending",
      order_status: status,
      total_amount: sub_total,
      discount: discountAmount,
      shipping: shippingAmount,
      grand_total: totalAmount,
      payment_method,
      transaction_id: `EXT-${order_id}`,
      note: "Imported from external source",
    });

    const orderItems = [];
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

      // ✅ Prepare order item document
      orderItems.push({
        order_id: order._id,
        product_id: productDoc._id,
        quantity,
        unit_price,
        total_price,
        regular_price,
        sale_price,
      });

      // 📊 Prepare stock transaction
      stockTransactions.push({
        product_id: productDoc._id,
        type: "sale",
        quantity,
        reference_type: "order",
        reference_id: order._id,
        sale_price: unit_price,
        created_by: user._id,
      });
    }

    if (!orderItems.length) {
      throw new StatusError(400, "No valid products found in the order");
    }

    // ✅ Save order items
    await OrderItem.insertMany(orderItems);

    // ✅ Save stock transactions
    await StockTransaction.insertMany(stockTransactions);

    console.log(`✅ Order created: ${order.id}`);
    console.log(`📦 Order items added: ${orderItems.length}`);
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
