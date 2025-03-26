import { userService, userRoleService } from "../services/index.js";
import { envs } from "../config/index.js";

/**
 * This function is used for validating authorization header if login
 * @param req
 * @param res
 * @param next
 */
export const accessTokenIfAny = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (token) {
      const decodedData = userService.verifyToken(token, envs.jwt.accessToken.secret);
      if (decodedData) {
        const userDetails = await userService.getByEmail(decodedData.email);
        if (userDetails) {
          const userRole = await userRoleService.getUserRole(userDetails.id);

          req["userDetails"] = {
            userId: userDetails.id,
            name: userDetails.name,
            email: userDetails.email,
            user_session_id: "",
            user_type: userRole ? userRole.role_name : "",
            user_role_id: userRole ? userRole.role_id : "",
          };
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
