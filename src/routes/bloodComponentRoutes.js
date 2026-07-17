import express from "express";
import BloodComponentController from "../controllers/bloodComponentControllers.js";
import { requireRequestBody, verifyToken } from "../middlewares/authMiddleware.js";

const bloodComponentRoutes = express.Router();
const bloodComponentController = new BloodComponentController();

bloodComponentRoutes.get(
    "/" , 
    verifyToken ,  
    bloodComponentController.getAllBloodComponentsHandler
);

bloodComponentRoutes.post(
    "/" , 
    verifyToken , 
    requireRequestBody,
    bloodComponentController.createBloodComponentHandler
);

export default bloodComponentRoutes;