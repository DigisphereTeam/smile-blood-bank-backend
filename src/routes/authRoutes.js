import express from "express";
import AuthController from "../controllers/authControllers.js";
import { requireRequestBody } from "../middlewares/authMiddleware.js";


const authControllers = new AuthController();
const authRoutes = express.Router();

authRoutes.post(
    "/signup",
   requireRequestBody,
    authControllers.createUserHandlers
);

authRoutes.post(
    "/login",
    requireRequestBody,
    authControllers.userLoginHandlers
);

authRoutes.post(
    "/forgot-password",
    requireRequestBody,
    authControllers.forgotPassword
);

authRoutes.post(
    "/verify-forgot-password-otp",
    requireRequestBody,
    authControllers.verifyForgotPasswordOtp
);

authRoutes.post(
    "/reset-password",
    requireRequestBody,
    authControllers.resetPassword
);

export default authRoutes;