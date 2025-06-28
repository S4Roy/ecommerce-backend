import Address from "../../../models/Address.js";
import { StatusError } from "../../../config/index.js";

/**
 * Add Address
 * @param req
 * @param res
 * @param next
 */
export const edit = async (req, res, next) => {
  try {
    const {
      _id,
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
    const address = await Address.findOne({
      _id: _id,
      user: user_id,
      deleted_at: null,
    });
    console.log(address);

    if (!address) throw StatusError.notFound("Address not found");

    // Unset other default addresses
    if (is_default) {
      await Address.updateMany(
        { user: user_id, deleted_at: null, _id: { $ne: _id } },
        { is_default: false }
      );
    }
    if (full_name) address.full_name = full_name;
    if (phone) address.phone = phone;
    if (email) address.email = email;
    if (address_line1) address.address_line1 = address_line1;
    if (address_line2) address.address_line2 = address_line2;
    if (landmark) address.landmark = landmark;
    if (city) address.city = city;
    if (state) address.state = state;
    if (country) address.country = country;
    if (pincode) address.pincode = pincode;
    if (address_type) address.address_type = address_type;
    if (purpose) address.purpose = purpose;
    if (typeof is_default === "boolean") address.is_default = is_default;

    address.updated_by = user_id;
    address.updated_at = Date.now();
    console.log(address);

    await address.save();

    res.status(201).json({
      status: "success",
      message: req.__("Address updated successfully"),
      data: address,
    });
  } catch (error) {
    next(error);
  }
};
