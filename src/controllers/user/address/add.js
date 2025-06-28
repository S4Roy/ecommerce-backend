import Address from "../../../models/Address.js";
import { StatusError } from "../../../config/index.js";

/**
 * Add Address
 * @param req
 * @param res
 * @param next
 */
export const add = async (req, res, next) => {
  try {
    const {
      full_name,
      phone,
      email,
      address_line1,
      address_line2,
      landmark,
      city,
      state,
      country,
      pincode,
      address_type,
      purpose,
      is_default,
    } = req.body;

    const user_id = req.auth?.user_id;
    if (!user_id) throw StatusError.unauthorized("Invalid access token.");

    // If is_default is true, unset others
    if (is_default) {
      await Address.updateMany(
        { user: user_id, deleted_at: null },
        { is_default: false }
      );
    }

    const address = new Address({
      user: user_id,
      full_name,
      phone,
      email: email || null,
      address_line1,
      address_line2: address_line2 || null,
      landmark: landmark || null,
      city,
      state,
      country: country || "India",
      pincode,
      address_type: address_type || "home",
      purpose: purpose || "shipping",
      is_default: is_default || false,
    });

    await address.save();

    res.status(201).json({
      status: "success",
      message: req.__("Address added successfully"),
      data: address,
    });
  } catch (error) {
    next(error);
  }
};
