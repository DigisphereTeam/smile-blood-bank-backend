import cors from "cors";
import "dotenv/config";
import express from 'express';
import appConfig from './config/appConfig.js';
import pool from './database/configuration.js';
import globalError from './middlewares/globalError.js';
import notFound from './middlewares/notFound.js';
import authRoutes from './routes/authRoutes.js';
import bloodComponentRoutes from './routes/bloodComponentRoutes.js';
import bloodUnitRoutes from './routes/bloodUnitsRoutes.js';
import donorRoutes from './routes/donotRoutes.js';
import patientRequisitionRoutes from './routes/patientRequisitionRoutes.js';
import { sendSuccessResponse } from './utils/sendResponse.js';

const app = express();
app.use(cors());
app.use(express.json())

app.get("/" , (_, res)=>{
    sendSuccessResponse(res , 200 ,  "Server is up and running");
}) 

app.use("/auth" , authRoutes);
app.use("/patient-requisitions" , patientRequisitionRoutes);
app.use("/donors" , donorRoutes);
app.use("/blood-units" , bloodUnitRoutes);
app.use("/blood-components" , bloodComponentRoutes);

app.use(notFound);
app.use(globalError);

const port = appConfig.port;

app.listen(port, async () => {
  try {
    await pool.query("SELECT 1");
    console.log("DB connected successfully");
    console.log(`Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
});