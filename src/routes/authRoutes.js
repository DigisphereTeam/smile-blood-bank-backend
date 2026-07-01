import express from "express";
import AuthController from "../controllers/authControllers.js";

const authControllers = new AuthController();
const authRoutes = express.Router();

authRoutes.post("/signup", authControllers.createUserHandlers);
authRoutes.post("/login", authControllers.userLoginHandlers);

export default authRoutes;