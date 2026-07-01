import express from "express";
import BloodComponentController from "../controllers/bloodComponentControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const bloodComponentRoutes = express.Router();
const bloodComponentController = new BloodComponentController();

bloodComponentRoutes.get(
    "/" , 
    verifyToken ,  
    bloodComponentController.getAllBloodComponentsHandler
);

export default bloodComponentRoutes;