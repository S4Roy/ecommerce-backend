import Order from "../../../../models/Order.js";
import { StatusError } from "../../../../config/index.js";

export const updateStatus = async (req, res, next) => {
  try {
    const { order_id, status } = req.body;
    console.log(order_id, status);
    // Find and update the order by external ID
    const orderDoc = await Order.findOneAndUpdate(
      { id: String(order_id) },
      { order_status: status },
      { new: true }
    );

    if (!orderDoc) {
      throw new StatusError(404, "Order not found");
    }

    return res.status(200).json({
      status: "success",
      message: "Order status updated",
      data: {
        order_id: orderDoc.id,
        order_status: orderDoc.order_status,
      },
    });
  } catch (error) {
    next(error);
  }
};
