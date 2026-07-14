import express from "express";
import DonorController from "../controllers/donorControllers.js";
import { requireRequestBody, verifyToken } from "../middlewares/authMiddleware.js";

const donorRoutes = express.Router();
const donorController = new DonorController();

donorRoutes.post(
    "/",
    verifyToken,
    requireRequestBody,
    donorController.createDonorHandler
);

donorRoutes.post(
    "/with-blood-unit",
    verifyToken,
    requireRequestBody,
    donorController.createDonorWithBloodUnitHandler
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