import { userService, userRoleService } from "../services/index.js";

/**
 * This function is used for validating authorization header
 * @param req
 * @param res
 * @param next
 */
export const validateAccessToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw StatusError.forbidden("Access token is missing.");
    const decodedData = await userService.verifyToken(token);
    if (!decodedData) throw StatusError.unauthorized("Invalid access token.");

    const userDetails = decodedData[0];
    if (!userDetails) throw StatusError.unauthorized("User  not found.");

    // const userRole = await userRoleService.getUserRole(userDetails.id);
    // if (!userRole) throw StatusError.unauthorized("User  role not found.");

    req["userDetails"] = {
      userId: userDetails.id,
      name: userDetails.name,
      email: userDetails.email,
      user_session_id: "",
      // user_type: userRole.role_name,
      user_role_id: userDetails.role_id,
    };
    next();
  } catch (error) {
    next(error);
  }
};
