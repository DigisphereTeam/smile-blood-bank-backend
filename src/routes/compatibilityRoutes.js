import express from "express";
import CompatibilityTestController from "../controllers/compatibilityControllers.js";
import { requireRequestBody, verifyToken } from "../middlewares/authMiddleware.js";

const compatibilityTestRoutes = express.Router({
    mergeParams : true
});

const compatibilityTestController = new CompatibilityTestController();

compatibilityTestRoutes.post(
    "/",
    verifyToken,
    requireRequestBody,
    compatibilityTestController.createCompatibilityTestHandler
);

compatibilityTestRoutes.get(
    "/",
    verifyToken,
    compatibilityTestController.getCompatibilityTestsByRequisitionHandler
);

compatibilityTestRoutes.get(
    "/:id",
    verifyToken,
    compatibilityTestController.getCompatibilityTestByIdHandler
);

export default compatibilityTestRoutes;