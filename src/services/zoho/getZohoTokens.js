import { envs } from "../../config/index.js";

import axios from "axios";
import qs from "qs";
export const getZohoTokens = async () => {
  const data = {
    code: envs.zoho.CODE,
    client_id: envs.zoho.CLIENT_ID,
    client_secret: envs.zoho.CLIENT_SECRET,
    redirect_uri: envs.backendBaseUrl + "/api/v1/callback/zoho/redirect/",
    grant_type: "authorization_code",
  };
  const response = await axios.post(
    "https://accounts.zoho.in/oauth/v2/token",
    qs.stringify(data),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  console.log(response);

  return response.data; // { access_token, refresh_token, expires_in, ... }
};
