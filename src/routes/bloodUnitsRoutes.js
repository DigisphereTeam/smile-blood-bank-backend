import express from "express";
import BloodUnitController from "../controllers/bloodUnitControllers.js";
import { requireRequestBody, verifyToken } from "../middlewares/authMiddleware.js";

const bloodUnitRoutes = express.Router();
const bloodUnitController = new BloodUnitController();

bloodUnitRoutes.post(
    "/",
    verifyToken,
    requireRequestBody,
    bloodUnitController.createBloodUnitHandler
);

// to add blood components of a donor
bloodUnitRoutes.post(
    "/:bloodUnitId/components",
    verifyToken,
    requireRequestBody,
    bloodUnitController.createBloodUnitComponentsHandler
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
    requireRequestBody,
    bloodUnitController.updateBloodUnitStatusHandler
);



export default bloodUnitRoutes;