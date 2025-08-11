import { zohoService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";
/**
 * Zoho redirect controller
 * Handles the redirect after Zoho OAuth authentication.
 * This function is called when the user is redirected back from Zoho after authentication.
 * @param req
 * @param res
 * @param next
 */
export const code = async (req, res, next) => {
  try {
    // Extract the code from the query parameters
    const { code } = req.query;
    console.log("Zoho redirect code:", code);
    const tokenResponse = await zohoService.getZohoTokens();
    if (!tokenResponse || !tokenResponse.access_token) {
      throw new StatusError(400, "Failed to exchange Zoho code for tokens");
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
