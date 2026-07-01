import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";

class BloodComponentController {

    getAllBloodComponentsHandler = async (req, res) => {
        try {

            const result = await pool.query(`
                SELECT
                    id,
                    component_name,
                    created_at
                FROM blood_components
                ORDER BY created_at DESC;
            `);

            return sendSuccessResponse(
                res,
                200,
                "Blood components fetched successfully.",
                result.rows
            );

        } catch (error) {
            return sendErrorResponse(
                res,
                500,
                error.message || "Internal server error."
            );
        }
    };

}

export default BloodComponentController;