import jwt from "jsonwebtoken";
import { envs } from "../../config/index.js";

/**
 * Generate access token
 * @param data - Payload for JWT
 * @param options - Optional settings like disableExpiry
 */
export const generateTokens = async (data, options = {}) => {
  const { disableExpiry = false } = options;

  const signOptions = disableExpiry
    ? {} // No expiration
    : { expiresIn: envs.jwt.accessToken.expiry };

  const accessToken = jwt.sign(data, envs.jwt.accessToken.secret, signOptions);

  return {
    access_token: accessToken,
    access_token_expiry: disableExpiry ? null : envs.jwt.accessToken.expiry,
  };
};
