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
    if (!code) {
      throw new StatusError(200, "Authorization code is missing");
    }

    res.status(200).json({
      status: "success",
      message: req.__("Zoho redirect successful"),
      data: { code: code },
    });
  } catch (error) {
    next(error);
  }
};
