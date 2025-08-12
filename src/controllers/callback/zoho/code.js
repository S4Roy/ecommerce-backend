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
    const token = await zohoService.getTokens();
    console.log(token);

    res.status(200).json({
      status: "success",
      message: req.__("Zoho token"),
      data: { token: token },
    });
  } catch (error) {
    next(error);
  }
};
