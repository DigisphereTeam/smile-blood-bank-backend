import express from "express";
import BloodUnitController from "../controllers/bloodUnitControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const bloodUnitRoutes = express.Router();
const bloodUnitController = new BloodUnitController();

bloodUnitRoutes.post(
    "/",
    verifyToken,
    bloodUnitController.createBloodUnitHandler
);

bloodUnitRoutes.get(
    "/",
    verifyToken,
    bloodUnitController.getBloodUnitsHandler
);

bloodUnitRoutes.get(
    "/:id",
    verifyToken,
    bloodUnitController.getBloodUnitByIdHandler
);

bloodUnitRoutes.patch(
    "/:id/status",
    verifyToken,
    bloodUnitController.updateBloodUnitStatusHandler
);



export default bloodUnitRoutes;