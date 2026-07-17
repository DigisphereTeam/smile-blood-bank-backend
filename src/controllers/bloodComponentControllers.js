import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";
import { createBloodComponentSchema } from "../validations/schemas/bloodComponentValidations.js";
import validateRequest from "../validations/validateRequest.js";


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

    
    createBloodComponentHandler = async (req, res) => {
        const validatedBody = validateRequest(createBloodComponentSchema, req);
        try {
            const { component_name } = validatedBody;
            
            const result = await pool.query(
                `
                INSERT INTO blood_components (component_name)
                VALUES ($1)
                RETURNING id, component_name, created_at;
                `,
                [component_name.trim()]
            );

            return sendSuccessResponse(
                res,
                201,
                "Blood component created successfully.",
                result.rows[0]
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