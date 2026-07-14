import express from "express";
import PatientRequisitionController from "../controllers/patientRequisitionControllers.js";
import { requireRequestBody, verifyToken } from "../middlewares/authMiddleware.js";
import compatibilityTestRoutes from "./compatibilityRoutes.js";

const patientRequisitionController = new PatientRequisitionController();
const patientRequisitionRoutes = express.Router();

patientRequisitionRoutes.post(
    "/",
    verifyToken,
    requireRequestBody,
    patientRequisitionController.createPatientRequisitionHandler
);

patientRequisitionRoutes.get(
    "/",
    verifyToken,
    patientRequisitionController.getPatientRequisitionsHandler
);

patientRequisitionRoutes.get(
    "/recent",
    verifyToken,
    patientRequisitionController.getRecentPatientRequisitionsHandler
);

patientRequisitionRoutes.get(
    "/:id",
    verifyToken,
    patientRequisitionController.getPatientRequisitionByIdHandler
);

patientRequisitionRoutes.get(
    "/statistics/status",
    verifyToken,
    patientRequisitionController.getRequisitionStats
);

patientRequisitionRoutes.patch(
    "/:id/status",
    verifyToken,
    requireRequestBody,
    patientRequisitionController.updatePatientRequisitionStatusHandler
);

patientRequisitionRoutes.patch(
    "/:requisitionId",
    verifyToken,
    requireRequestBody,
    patientRequisitionController.updatePatientRequisitionHandler
);

patientRequisitionRoutes.patch(
    "/:requisitionId/blood-group",
    verifyToken,
    requireRequestBody,
    patientRequisitionController.updatePatientBloodGroupHandler
);

patientRequisitionRoutes.patch(
    "/:id/emergency",
    verifyToken,
    requireRequestBody,
    patientRequisitionController.updatePatientRequisitionEmergencyHandler
);

patientRequisitionRoutes.use("/:requisitionId/compatibility-tests" , compatibilityTestRoutes);

export default patientRequisitionRoutes;