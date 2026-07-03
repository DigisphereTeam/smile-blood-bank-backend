import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse, validateRequestBody } from "../utils/sendResponse.js";

class PatientRequisitionController {
    createPatientRequisitionHandler = async (req, res) => {
        if (!validateRequestBody(req, res)) return;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const {
                patient_name,
                hospital_name,
                blood_group,
                rh_type,
                age,
                gender,
                diagnosis,
                ip_number,
                referred_by,
                ward_no,
                previous_transfusion = false,
                previous_transfusion_reaction = false,
                previous_transfusion_reaction_details,
                transfusion_indications = [],
                components = [],
                is_emergency = false,
                compatibility_test_type,
                physician,
                name,
                emergency_details
            } = req.body;


            const errors = {};

            if (!patient_name || !patient_name.trim()) {
                errors.patient_name = "Patient name is required.";
            }

            if (!hospital_name || !hospital_name.trim()) {
                errors.hospital_name = "Hospital name is required.";
            }

            if (!blood_group || !blood_group.trim()) {
                errors.blood_group = "Blood group is required.";
            }

            if (!rh_type || !rh_type.trim()) {
                errors.rh_type = "Rh type is required.";
            } else if (!["+", "-"].includes(rh_type)) {
                errors.rh_type = "Invalid Rh type.";
            }

            if (!age) {
                errors.age = "Age is required.";
            } else if (age <= 0) {
                errors.age = "Age must be greater than 0.";
            }

            if (!gender || !gender.trim()) {
                errors.gender = "Gender is required.";
            } else if (!["Male", "Female", "Other"].includes(gender)) {
                errors.gender = "Invalid gender.";
            }

            if (!diagnosis || !diagnosis.trim()) {
                errors.diagnosis = "Diagnosis is required.";
            }

            if (!Array.isArray(components) || components.length === 0) {
                errors.components = "At least one component is required.";
            }

            if (is_emergency === true) {
                if (!compatibility_test_type || !compatibility_test_type.trim()) {
                    errors.compatibility_test_type = "Compatibility test type is required.";
                }

                if (!physician || !physician.trim()) {
                    errors.physician = "Physician is required.";
                }

                if (!name || !name.trim()) {
                    errors.name = "Name is required.";
                }
            }

            if (
                !Array.isArray(transfusion_indications) ||
                transfusion_indications.length === 0
            ) {
                errors.transfusion_indications =
                    "At least one transfusion indication is required.";
            }

            if (Object.keys(errors).length > 0) {
                return res.status(422).json({
                    success: false,
                    statusCode: 422,
                    message: "Validation failed.",
                    errors
                });
            }

            const patientResult = await client.query(`SELECT nextval('patient_id_seq')`);
            const idNumber = patientResult.rows[0].nextval;

            const patientId = `PAT-${String(idNumber).padStart(6, '0')}`;

            const result = await client.query(`
                INSERT INTO patient_requisitions (
                    patient_id,
                    patient_name,
                    hospital_name,
                    blood_group,
                    rh_type,
                    age,
                    gender,
                    diagnosis,
                    ip_number,
                    referred_by,
                    ward_no,
                    previous_transfusion,
                    previous_transfusion_reaction,
                    previous_transfusion_reaction_details,
                    is_emergency,
                    compatibility_test_type,
                    physician,
                    name,
                    emergency_details,
                    created_by
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                    $11,$12,$13,$14,$15,$16,$17,$18,$19,$20
                )
                RETURNING *;
                `,
                [
                    patientId,
                    patient_name,
                    hospital_name,
                    blood_group,
                    rh_type,
                    age,
                    gender,
                    diagnosis,
                    ip_number ?? null,
                    referred_by,
                    ward_no ?? null,
                    previous_transfusion,
                    previous_transfusion_reaction,
                    previous_transfusion_reaction_details ?? null,
                    is_emergency,
                    compatibility_test_type ?? null,
                    physician ?? null,
                    name ?? null,
                    emergency_details ?? null,
                    req.user.id
                ]
            );

            const requisitionId = result.rows[0].id;
            const values = [];
            const placeholders = [];

            for (let index = 0; index < components.length; index++) {
                const c = components[index];

                if (
                    !c.component_id?.toString().trim() ||
                    !(c.units_required > 0) ||
                    !c.required_date_time
                ) {
                    return sendErrorResponse(res, 400, "Invalid component data");
                }

                const baseIndex = index * 3;

                placeholders.push(
                    `($1, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`
                );

                values.push(
                    c.component_id,
                    c.units_required,
                    c.required_date_time
                );
            }

            const indValues = [];
            const indPlaceholders = [];

            for (let index = 0; index < transfusion_indications.length; index++) {
                const ind = transfusion_indications[index];

                if (!ind?.toString().trim()) {
                    return sendErrorResponse(res, 400, "Invalid transfusion indication");
                }

                indPlaceholders.push(`($1, $${index + 2})`);
                indValues.push(ind);
            }

            await client.query(`
                INSERT INTO patient_requisition_components
                (requisition_id, component_id, units_required, required_date_time)
                VALUES ${placeholders.join(", ")}`,
                [requisitionId, ...values]
            ),
                await client.query(`
                INSERT INTO patient_requisition_transfusion_indications
                (requisition_id, indication)
                VALUES ${indPlaceholders.join(", ")}`,
                    [requisitionId, ...indValues]
                )

            await client.query("COMMIT");

            return sendSuccessResponse(
                res,
                201,
                "Patient requisition created successfully.",
                result.rows[0]
            );

        } catch (error) {
            await client.query("ROLLBACK");

            return sendErrorResponse(
                res,
                500,
                error.message || "Internal server error"
            );
        } finally {
            client.release();
        }
    };
    getRequisitionStats = async (req, res) => {
        try {

            const result = await pool.query(`
            SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER(WHERE status = 'Pending') AS pending,
            COUNT(*) FILTER(WHERE status = 'Processing') AS processing,
            COUNT(*) FILTER(WHERE status = 'Approved') AS approved,
            COUNT(*) FILTER(WHERE status = 'Rejected') AS rejected,
            COUNT(*) FILTER(WHERE status = 'Completed') AS completed,
            COUNT(*) FILTER(WHERE is_emergency = TRUE) AS emergency
            FROM patient_requisitions;
            `);

            sendSuccessResponse(
                res,
                200,
                "Patient requisition statistics fetched successfully.",
                result.rows[0]
            );

        } catch (error) {
            sendErrorResponse(
                res,
                500,
                error.message || "Failed to fetch patient requisition statistics."
            );
        }
    };
    updatePatientRequisitionStatusHandler = async (req, res) => {
        if (!validateRequestBody(req, res)) return;
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return sendErrorResponse(
                res,
                400,
                "Invalid patient requisition ID."
            );
        }

        const validStatuses = [
            "Pending",
            "Processing",
            "Approved",
            "Rejected",
            "Completed"
        ];

        const errors = {};

        if (!status || !status.trim()) {
            errors.status = "Status is required.";
        } else if (!validStatuses.includes(status)) {
            errors.status = "Invalid status.";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                statusCode: 422,
                message: "Validation failed.",
                errors
            });
        }

        try {
            const result = await pool.query(
                `
                UPDATE patient_requisitions
                SET status = $1,
    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
RETURNING *;
`,
                [status, id]
            );

            if (result.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Patient requisition not found."
                );
            }

            sendSuccessResponse(
                res,
                200,
                "Patient requisition status updated successfully.",
                result.rows[0]
            );
        } catch (error) {
            sendErrorResponse(
                res,
                500,
                "Failed to update patient requisition status."
            );
        }
    };
    getPatientRequisitionsHandler = async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    pr.id,
                    pr.patient_id,
                    pr.patient_name,
                    pr.hospital_name,
                    pr.blood_group,
                    pr.rh_type,
                    pr.age,
                    pr.gender,
                    pr.diagnosis,
                    pr.ip_number,
                    pr.referred_by,
                    pr.ward_no,
                    pr.previous_transfusion,
                    pr.previous_transfusion_reaction,
                    pr.previous_transfusion_reaction_details,
                    pr.status,
                    pr.is_emergency,
                    pr.compatibility_test_type,
                    pr.physician,
                    pr.name,
                    pr.emergency_details,
                    pr.created_at,
                    pr.updated_at,

                    json_build_object(
                        'id', u.id,
                        'first_name', u.first_name,
                        'last_name', u.last_name,
                        'email', u.email,
                        'phone_number', u.phone_number,
                        'role', u.role
                    ) AS created_by,

                    COALESCE(comp.components, '[]'::json) AS components,
                    COALESCE(ind.indications, '[]'::json) AS transfusion_indications

                FROM patient_requisitions pr

                JOIN users u
                    ON pr.created_by = u.id

                LEFT JOIN (
                    SELECT
                        prc.requisition_id,
                        json_agg(
                            json_build_object(
                                'id', bc.id,
                                'component_name', bc.component_name,
                                'units_required', prc.units_required,
                                'required_date_time', prc.required_date_time
                            )
                        ) AS components
                    FROM patient_requisition_components prc
                    LEFT JOIN blood_components bc
                        ON bc.id = prc.component_id
                    GROUP BY prc.requisition_id
                ) comp
                    ON comp.requisition_id = pr.id

                LEFT JOIN (
                    SELECT
                        requisition_id,
                        json_agg(indication) AS indications
                    FROM patient_requisition_transfusion_indications
                    GROUP BY requisition_id
                ) ind
                    ON ind.requisition_id = pr.id

                ORDER BY pr.created_at DESC;
                `);

            return sendSuccessResponse(
                res,
                200,
                "Patient requisitions fetched successfully.",
                result.rows
            );
        } catch (error) {
            sendErrorResponse(
                res,
                500,
                error.message || "Failed to fetch patient requisitions."
            );
        }
    };
    updatePatientRequisitionEmergencyHandler = async (req, res) => {
        if (!validateRequestBody(req, res)) return;
        const { id } = req.params;
        const { is_emergency, emergency_details } = req.body;

        // Validate path parameter separately
        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return sendErrorResponse(
                res,
                400,
                "Invalid patient requisition ID."
            );
        }

        const errors = {};

        if (typeof is_emergency !== "boolean") {
            errors.is_emergency = "Invalid  is_emergency.";
        }

        if (
            is_emergency === true &&
            (!emergency_details || !emergency_details.trim())
        ) {
            errors.emergency_details =
                "Emergency details are required when marking as emergency.";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                statusCode: 422,
                message: "Validation failed.",
                errors
            });
        }

        try {
            const result = await pool.query(
                `
                UPDATE patient_requisitions
                SET
                is_emergency = $1,
                    emergency_details = $2,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                RETURNING *;
                `,
                [
                    is_emergency,
                    is_emergency ? emergency_details.trim() : null,
                    id
                ]
            );

            if (result.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Patient requisition not found."
                );
            }

            sendSuccessResponse(
                res,
                200,
                "Patient requisition emergency status updated successfully.",
                result.rows[0]
            );
        } catch (error) {
            sendErrorResponse(
                res,
                500,
                "Failed to update patient requisition emergency status."
            );
        }
    };
    getPatientRequisitionByIdHandler = async (req, res) => {
        try {

            const { id } = req.params;

            if (!id || isNaN(id) || Number(id) <= 0) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid patient requisition ID."
                );
            }

            const result = await pool.query(`
                SELECT
                    pr.id,
                    pr.patient_id,
                    pr.patient_name,
                    pr.hospital_name,
                    pr.blood_group,
                    pr.rh_type,
                    pr.age,
                    pr.gender,
                    pr.diagnosis,
                    pr.ip_number,
                    pr.referred_by,
                    pr.ward_no,
                    pr.previous_transfusion,
                    pr.previous_transfusion_reaction,
                    pr.previous_transfusion_reaction_details,
                    pr.physician,
                    pr.name,
                    pr.compatibility_test_type,
                    pr.is_emergency,
                    pr.emergency_details,
                    pr.status,
                    pr.created_at,
                    pr.updated_at,

                    json_build_object(
                        'id', u.id,
                        'first_name', u.first_name,
                        'last_name', u.last_name,
                        'email', u.email,
                        'phone_number', u.phone_number,
                        'role', u.role
                    ) AS created_by,

                    COALESCE(comp.components, '[]'::json) AS components,
                    COALESCE(ind.indications, '[]'::json) AS transfusion_indications

                FROM patient_requisitions pr

                JOIN users u
                    ON pr.created_by = u.id

                LEFT JOIN (
                    SELECT
                        prc.requisition_id,
                        json_agg(
                            json_build_object(
                                'id', bc.id,
                                'component_name', bc.component_name,
                                'units_required', prc.units_required,
                                'required_date_time', prc.required_date_time
                            )
                        ) AS components
                    FROM patient_requisition_components prc
                    LEFT JOIN blood_components bc
                        ON bc.id = prc.component_id
                    WHERE prc.requisition_id = $1
                    GROUP BY prc.requisition_id
                ) comp
                    ON comp.requisition_id = pr.id

                LEFT JOIN (
                    SELECT
                        requisition_id,
                        json_agg(indication) AS indications
                    FROM patient_requisition_transfusion_indications
                    WHERE requisition_id = $1
                    GROUP BY requisition_id
                ) ind
                    ON ind.requisition_id = pr.id

                WHERE pr.id = $1;
                `, [id]);

            if (result.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Patient requisition not found."
                );
            }

            return sendSuccessResponse(
                res,
                200,
                "Patient requisition fetched successfully.",
                result.rows[0]
            );

        } catch (error) {
            return sendErrorResponse(
                res,
                500,
                error.message || "Failed to fetch patient requisition."
            );
        }
    };

    getRecentPatientRequisitionsHandler = async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    pr.id,
                    pr.patient_id,
                    pr.patient_name,
                    pr.status,
                    pr.created_at,

                    COALESCE(comp.components, '[]'::json) AS components

                FROM patient_requisitions pr

                LEFT JOIN (
                    SELECT
                        prc.requisition_id,
                        json_agg(
                            json_build_object(
                                'id', bc.id,
                                'component_name', bc.component_name,
                                'units_required', prc.units_required
                            )
                        ) AS components
                    FROM patient_requisition_components prc
                    LEFT JOIN blood_components bc
                        ON bc.id = prc.component_id
                    GROUP BY prc.requisition_id
                ) comp
                    ON comp.requisition_id = pr.id

                ORDER BY pr.created_at DESC
                LIMIT 10;
            `);

            return sendSuccessResponse(
                res,
                200,
                "Recent patient requisitions fetched successfully.",
                result.rows
            );
        } catch (error) {
            return sendErrorResponse(
                res,
                500,
                error.message || "Failed to fetch recent patient requisitions."
            );
        }
    };
}

export default PatientRequisitionController;