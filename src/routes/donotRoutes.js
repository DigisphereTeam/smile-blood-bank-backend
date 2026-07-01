import express from "express";
import DonorController from "../controllers/donorControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const donorRoutes = express.Router();
const donorController = new DonorController();

donorRoutes.post(
    "/",
    verifyToken,
    donorController.createDonorHandler
);

donorRoutes.get(
    "/",
    verifyToken,
    donorController.getDonorsHandler
);

donorRoutes.get(
    "/:id",
    verifyToken,
    donorController.getDonorByIdHandler
);

export default donorRoutes;