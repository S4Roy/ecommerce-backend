import express from "express";

// Import Middleware
import AuthMiddleware from "../../../app/middleware/AuthMiddleware.js";

// Import Controllers
import AdminAuthController from "../../../app/controllers/api/v1/auth/AdminAuthController.js";
import FrontendAuthController from "../../../app/controllers/api/v1/auth/FrontendAuthController.js";
import FrontendOtpVerificationController from "../../../app/controllers/api/v1/auth/FrontendOtpVerificationController.js";

const router = express.Router();

router.post("/admin/login", AdminAuthController.login);
router.post(
  "/admin/getaccount",
  AuthMiddleware.checkAuth,
  AuthMiddleware.checkRole([
    "superadmin",
    "manager",
    "operator",
    "supervisor",
    "staff",
  ]),
  AdminAuthController.getAccountDetails
);

router.post("/register/submit", FrontendAuthController.register);
router.post("/login/submit", FrontendAuthController.login);
router.post("/password/reset", FrontendAuthController.resetPassword);

// Uncomment if OTP verification is needed
// router.post('/otp/init', FrontendOtpVerificationController.init);
// router.post('/otp/verify', FrontendOtpVerificationController.verify);
// router.post('/otp/resend', FrontendOtpVerificationController.resend);

export default router;
