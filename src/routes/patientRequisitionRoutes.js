import express from "express";
import PatientRequisitionController from "../controllers/patientRequisitionControllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const patientRequisitionController = new PatientRequisitionController();
const patientRequisitionRoutes = express.Router();

patientRequisitionRoutes.post(
    "/",
    verifyToken,
    patientRequisitionController.createPatientRequisitionHandler
);

patientRequisitionRoutes.get(
    "/",
    verifyToken,
    patientRequisitionController.getPatientRequisitionsHandler
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
    patientRequisitionController.updatePatientRequisitionStatusHandler
);

patientRequisitionRoutes.patch(
    "/:id/emergency",
    verifyToken,
    patientRequisitionController.updatePatientRequisitionEmergencyHandler
);

export default patientRequisitionRoutes;