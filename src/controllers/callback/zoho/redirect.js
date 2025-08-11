import Address from "../../../models/Address.js";
import { StatusError } from "../../../config/index.js";

/**
 * Zoho redirect controller
 * Handles the redirect after Zoho OAuth authentication.
 * This function is called when the user is redirected back from Zoho after authentication.
 * @param req
 * @param res
 * @param next
 */
export const redirect = async (req, res, next) => {
  try {
    // Extract the code from the query parameters
    const { code } = req.query;
    console.log("Zoho redirect code:", code);

    res.status(200).json({
      status: "success",
      message: req.__("Zoho redirect successful"),
      data: { ...req.query },
    });
  } catch (error) {
    next(error);
  }
};
