import axios from "axios";
import { envs } from "../../config/index.js";

/**
 * Exchange Zoho authorization code for access & refresh tokens
 * @param {string} code - Zoho authorization code
 * @returns {Promise<object>} Token response { access_token, refresh_token, expires_in }
 */
export const exchangeCodeForToken = async (code) => {
  try {
    const tokenUrl = "https://accounts.zoho.com/oauth/v2/token";
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: envs.zoho.CLIENT_ID,
      client_secret: envs.zoho.CLIENT_SECRET,
      redirect_uri: `${envs.backendBaseUrl}/callback/zoho/redirect`,
      code: code,
    });

    const response = await axios.post(tokenUrl, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    return response.data;
  } catch (err) {
    console.error("Zoho token exchange failed:", err.response?.data || err.message);
    throw err;
  }
};
