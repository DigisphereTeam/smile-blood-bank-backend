import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";
import { createCompatibilityTestSchema } from "../validations/schemas/compatibilityTestValidations.js";
import validateRequest from "../validations/validateRequest.js";

class CompatibilityTestController {
    createCompatibilityTestHandler = async (req, res) => {
        const { requisitionId: requisition_id } = req.params;
        if (!requisition_id || !Number.isInteger(Number(requisition_id)) || Number(requisition_id) <= 0) {
            return sendErrorResponse(
                res,
                400,
                "Invalid patient requisition ID."
            );
        }
        const validatedBody = validateRequest(createCompatibilityTestSchema, req);
        try {
            const {
                blood_unit_component_id,
                compatibility_test_type,
                abo_rh_result,
                hiv_1_2_result,
                hbsag_result,
                hcv_result,
                vdrl_result,
                malaria_result,
                crossmatch_result,
                remarks,
                status
            } = validatedBody;

            // Check requisition exists

            const requisition = await pool.query(`
                SELECT id
                FROM patient_requisitions
                WHERE id = $1;
            `,
                [requisition_id]
            );

            if (requisition.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Patient requisition not found."
                );
            }

            // Check blood unit component exists
            const component = await pool.query(`
                SELECT id
                FROM blood_unit_components
                WHERE id = $1;
            `,
                [blood_unit_component_id]
            );

            if (component.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Blood unit component not found."
                );
            }

            // Prevent duplicate compatibility test
            const existingTest = await pool.query(`
                SELECT id
                FROM compatibility_tests
                WHERE requisition_id = $1
                AND blood_unit_component_id = $2;
            `,
                [
                    requisition_id,
                    blood_unit_component_id
                ]
            );

            if (existingTest.rowCount > 0) {
                return sendErrorResponse(
                    res,
                    409,
                    "Compatibility test already exists for this requisition and blood component."
                );
            }

            const result = await pool.query(`
            INSERT INTO compatibility_tests
            (
                requisition_id,
                blood_unit_component_id,
                compatibility_test_type,
                abo_rh_result,
                hiv_1_2_result,
                hbsag_result,
                hcv_result,
                vdrl_result,
                malaria_result,
                crossmatch_result,
                remarks,
                tested_by,
                tested_at,
                status
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13
            )
            RETURNING *;
            `,
                [
                    requisition_id,
                    blood_unit_component_id,
                    compatibility_test_type,
                    abo_rh_result,
                    hiv_1_2_result,
                    hbsag_result,
                    hcv_result,
                    vdrl_result,
                    malaria_result,
                    crossmatch_result,
                    remarks,
                    req.user.id,
                    status
                ]
            );

            return sendSuccessResponse(
                res,
                201,
                "Compatibility test created successfully.",
                result.rows[0]
            );

        } catch (error) {
            return sendErrorResponse(
                res,
                500,
                error.message || "Failed to create compatibility test."
            );
        }
    };
    getCompatibilityTestByIdHandler = async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid compatibility test ID."
                );
            }

            const result = await pool.query(
                `
                SELECT
                    ct.id,
                    ct.compatibility_test_type,
                    ct.abo_rh_result,
                    ct.hiv_1_2_result,
                    ct.hbsag_result,
                    ct.hcv_result,
                    ct.vdrl_result,
                    ct.malaria_result,
                    ct.crossmatch_result,
                    ct.remarks,
                    ct.tested_at,
                    ct.status,
                    ct.created_at,
                    ct.updated_at,

                    json_build_object(
                        'id', pr.id,
                        'patient_id', pr.patient_id,
                        'name', pr.patient_name,
                        'hospital_name', pr.hospital_name,
                        'blood_group', pr.blood_group,
                        'rh_type', pr.rh_type
                    ) AS patient,

                    json_build_object(
                        'id', buc.id,
                        'component_name', bc.component_name,
                        'component_unit_number', buc.component_unit_number,
                        'volume_ml', buc.volume_ml,
                        'expiry_date', buc.expiry_date,
                        'status', buc.status,

                        'blood_unit',
                        json_build_object(
                            'id', bu.id,
                            'unit_number', bu.unit_number,
                            'blood_group', bu.blood_group,
                            'rh_type', bu.rh_type
                        ),

                        'donor',
                        json_build_object(
                            'id', d.id,
                            'donor_code', d.donor_code,
                            'name', d.name,
                            'phone_number', d.phone_number
                        )
                    ) AS selected_blood_component,

                    json_build_object(
                        'id', u.id,
                        'name', CONCAT(u.first_name, ' ', u.last_name),
                        'email', u.email,
                        'role', u.role
                    ) AS tested_by

                FROM compatibility_tests ct

                INNER JOIN patient_requisitions pr
                    ON ct.requisition_id = pr.id

                INNER JOIN blood_unit_components buc
                    ON ct.blood_unit_component_id = buc.id

                INNER JOIN blood_components bc
                    ON buc.component_id = bc.id

                INNER JOIN blood_units bu
                    ON buc.blood_unit_id = bu.id

                INNER JOIN donors d
                    ON bu.donor_id = d.id

                LEFT JOIN users u
                    ON ct.tested_by = u.id

                WHERE ct.id = $1;
                `,
                [id]
            );

            if (result.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Compatibility test not found."
                );
            }

            return sendSuccessResponse(
                res,
                200,
                "Compatibility test fetched successfully.",
                result.rows[0]
            );

        } catch (error) {
            return sendErrorResponse(
                res,
                500,
                error.message || "Failed to fetch compatibility test."
            );
        }
    };
    getCompatibilityTestsByRequisitionHandler = async (req, res) => {
        try {
            const { requisitionId } = req.params;

            if ( !requisitionId || !Number.isInteger(Number(requisitionId)) ||Number(requisitionId) <= 0) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid patient requisition ID."
                );
            }

            const requisition = await pool.query(
                `
            SELECT id
            FROM patient_requisitions
            WHERE id = $1;
            `,
                [requisitionId]
            );

            if (requisition.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Patient requisition not found."
                );
            }

            const result = await pool.query(
                `
            SELECT
                ct.id,
                ct.compatibility_test_type,
                ct.abo_rh_result,
                ct.hiv_1_2_result,
                ct.hbsag_result,
                ct.hcv_result,
                ct.vdrl_result,
                ct.malaria_result,
                ct.crossmatch_result,
                ct.remarks,
                ct.tested_at,
                ct.status,

                json_build_object(
                    'id', buc.id,
                    'component_name', bc.component_name,
                    'component_unit_number', buc.component_unit_number,
                    'volume_ml', buc.volume_ml,
                    'expiry_date', buc.expiry_date,
                    'status', buc.status,

                    'blood_unit',
                    json_build_object(
                        'id', bu.id,
                        'unit_number', bu.unit_number,
                        'blood_group', bu.blood_group,
                        'rh_type', bu.rh_type
                    ),

                    'donor',
                    json_build_object(
                        'id', d.id,
                        'donor_code', d.donor_code,
                        'name', d.name,
                        'phone_number', d.phone_number
                    )
                ) AS selected_blood_component,

                json_build_object(
                    'id', u.id,
                    'name', CONCAT(u.first_name, ' ', u.last_name),
                    'email', u.email,
                    'role', u.role
                ) AS tested_by

            FROM compatibility_tests ct

            INNER JOIN blood_unit_components buc
                ON ct.blood_unit_component_id = buc.id

            INNER JOIN blood_components bc
                ON buc.component_id = bc.id

            INNER JOIN blood_units bu
                ON buc.blood_unit_id = bu.id

            INNER JOIN donors d
                ON bu.donor_id = d.id

            LEFT JOIN users u
                ON ct.tested_by = u.id

            WHERE ct.requisition_id = $1

            ORDER BY ct.tested_at DESC;
            `,
                [requisitionId]
            );

            return sendSuccessResponse(
                res,
                200,
                "Compatibility tests fetched successfully.",
                result.rows
            );

        } catch (error) {
            return sendErrorResponse(
                res,
                500,
                error.message || "Failed to fetch compatibility tests."
            );
        }
    };
}

export default CompatibilityTestController;