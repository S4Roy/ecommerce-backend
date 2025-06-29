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
      customer,
      billing_address,
      items,
    } = req.body;

    // 1. Find or create user
    let user = await User.findOne({ email: customer.email });
    if (!user) {
      user = await User.create({
        role: "customer",
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        email: customer.email,
        mobile: customer.phone || null,
        password: "external_order",
        status: "active",
      });
    }

    // 2. Find or create billing address
    const addressFilter = {
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

    let billing = await Address.findOne(addressFilter);
    if (!billing) {
      billing = await Address.create({
        ...addressFilter,
        address_line2: "",
        landmark: "",
        address_type: "home",
        purpose: "both",
        is_default: true,
        created_by: user._id,
      });
    }

    // 3. Prepare product list
    const products = [];
    const stockTransactions = [];

    for (const item of items) {
      const productDoc = await Product.findOne({ id: String(item.product_id) });
      if (!productDoc) {
        console.warn(`⚠️ Product not found for ID: ${item.product_id}`);
        continue;
      }

      const quantity = item.quantity;
      const unit_price = parseFloat(item.price);
      const total_price = unit_price * quantity;

      if (productDoc.current_stock < quantity) {
        throw new StatusError(400, `Insufficient stock for ${productDoc.name}`);
      }

      // Reduce stock
      productDoc.current_stock -= quantity;
      await productDoc.save();

      products.push({
        product: productDoc._id,
        quantity,
        unit_price,
        total_price,
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

    // 4. Create order
    const order = await Order.create({
      id: order_id,
      user: user._id,
      shipping_address: billing._id,
      billing_address: billing._id,
      products,
      payment_status: "pending",
      order_status: status,
      total_amount: total,
      discount: 0,
      grand_total: parseFloat(total),
      payment_method: "cod",
      transaction_id: `EXT-${order_id}`,
      note: "Imported from external source",
    });

    // 5. Add reference_id to transactions and insert
    for (const txn of stockTransactions) {
      txn.reference_id = order._id;
    }

    await StockTransaction.insertMany(stockTransactions);

    return res.status(200).json({
      status: "success",
      message: "Order synced",
      data: { order_id: order.id },
    });
  } catch (error) {
    next(error);
  }
};
