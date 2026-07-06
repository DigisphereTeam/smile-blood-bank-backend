import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse, validateRequestBody } from "../utils/sendResponse.js";

class BloodUnitController {

    createBloodUnitHandler = async (req, res) => {
        if (!validateRequestBody(req, res)) return;
        try {
            const {
                donor_id,
                blood_group,
                rh_type,
                component_id,
                collection_date,
                expiry_date,
                volume_ml
            } = req.body;

            const errors = {};

            if (!donor_id) {
                errors.donor_id = "Donor ID is required.";
            }

            if (!blood_group || !blood_group.trim()) {
                errors.blood_group = "Blood group is required.";
            }

            if (!rh_type || !rh_type.trim()) {
                errors.rh_type = "Rh type is required.";
            } else if (!["+", "-"].includes(rh_type)) {
                errors.rh_type = "Invalid Rh type.";
            }

            if (!component_id) {
                errors.component_id = "Component ID is required.";
            }

            if (!collection_date) {
                errors.collection_date = "Collection date is required.";
            }

            if (!expiry_date) {
                errors.expiry_date = "Expiry date is required.";
            }

            if (!volume_ml) {
                errors.volume_ml = "Volume is required.";
            } else if (Number(volume_ml) <= 0) {
                errors.volume_ml = "Volume must be greater than 0.";
            }

            if (Object.keys(errors).length > 0) {
                return res.status(422).json({
                    success: false,
                    statusCode: 422,
                    message: "Validation failed.",
                    errors
                });
            }

            const donor = await pool.query(
                "SELECT id FROM donors WHERE id = $1",
                [donor_id]
            );

            if (donor.rowCount === 0) {
                return sendErrorResponse(res, 404, "Donor not found.");
            }

            const component = await pool.query(
                "SELECT id FROM blood_components WHERE id = $1",
                [component_id]
            );

            if (component.rowCount === 0) {
                return sendErrorResponse(res, 404, "Blood component not found.");
            }

            const seq = await pool.query(
                "SELECT nextval('blood_unit_seq') AS seq"
            );

            const currentYear = new Date().getFullYear();

            const unit_number = `BU-${currentYear}-${String(seq.rows[0].seq).padStart(6, "0")}`;

            const result = await pool.query(
                `
                INSERT INTO blood_units(
                    unit_number,
                    donor_id,
                    blood_group,
                    rh_type,
                    component_id,
                    collection_date,
                    expiry_date,
                    volume_ml,
                    created_by
                )
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
                RETURNING *;
                `,
                [
                    unit_number,
                    donor_id,
                    blood_group,
                    rh_type,
                    component_id,
                    collection_date,
                    expiry_date,
                    volume_ml,
                    req.user.id
                ]
            );

            return sendSuccessResponse(
                res,
                201,
                "Blood unit created successfully.",
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

    getBloodUnitsHandler = async (req, res) => {
        try {
           const { status, blood_group, rh_type, component_id } = req.query;
            const conditions = [];
            const values = [];

            if (status) {
                const statusArray = status.split(",").map(s => s.trim());
                values.push(statusArray);
                conditions.push(`bu.status = ANY($${values.length})`);
            }

            if (blood_group) {
                values.push(blood_group);
                conditions.push(`bu.blood_group = $${values.length}`);
            }
            
            if (rh_type) {
                values.push(rh_type);
                conditions.push(`bu.rh_type = $${values.length}`);
            }

            if (component_id) {
                values.push(component_id);
                conditions.push(`bu.component_id = $${values.length}`);
            }

            const whereClause = conditions.length
                ? `WHERE ${conditions.join(" AND ")}`
                : "";
            
            const result = await pool.query(
                `
            SELECT
                bu.id,
                bu.unit_number,
                bu.blood_group,
                bu.rh_type,
                bu.collection_date,
                bu.expiry_date,
                bu.volume_ml,
                bu.status,
                bu.created_at,

                CONCAT(d.first_name, ' ', d.last_name) AS donor_name,
                bc.component_name,
                CONCAT(u.first_name, ' ', u.last_name) AS created_by

            FROM blood_units bu

            JOIN donors d
                ON bu.donor_id = d.id

            JOIN blood_components bc
                ON bu.component_id = bc.id

            JOIN users u
                ON bu.created_by = u.id

            ${whereClause}

            ORDER BY bu.created_at DESC;
            `,
                values
            );

            return sendSuccessResponse(
                res,
                200,
                "Blood units fetched successfully",
                result.rows
            );

        } catch (error) {
            return sendErrorResponse(
                res,
                500,
                error.message || "Failed to fetch blood units"
            );
        }
    };

    getBloodUnitByIdHandler = async (req, res) => {
        try {

            const { id } = req.params;

            if (!id || isNaN(id) || Number(id) <= 0) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid blood unit ID."
                );
            }

            const result = await pool.query(
                `
                SELECT
                    bu.*,

                    json_build_object(
                        'id', d.id,
                        'donor_code', d.donor_code,
                        'first_name', d.first_name,
                        'last_name', d.last_name,
                        'blood_group', d.blood_group,
                        'rh_type', d.rh_type,
                        'phone_number', d.phone_number
                    ) AS donor,

                    json_build_object(
                        'id', bc.id,
                        'component_name', bc.component_name
                    ) AS component,

                    json_build_object(
                        'id', u.id,
                        'first_name', u.first_name,
                        'last_name', u.last_name,
                        'email', u.email,
                        'role', u.role
                    ) AS created_by

                FROM blood_units bu

                JOIN donors d
                    ON bu.donor_id = d.id

                JOIN blood_components bc
                    ON bu.component_id = bc.id

                JOIN users u
                    ON bu.created_by = u.id

                WHERE bu.id = $1;
                `,
                [id]
            );

            if (result.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Blood unit not found."
                );
            }

            return sendSuccessResponse(
                res,
                200,
                "Blood unit fetched successfully.",
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

    updateBloodUnitStatusHandler = async (req, res) => {
        if (!validateRequestBody(req, res)) return;
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validate path parameter
            if (!id || isNaN(id) || Number(id) <= 0) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid blood unit ID."
                );
            }

            const allowedStatuses = [
                "Available",
                "Reserved",
                "Issued",
                "Expired",
                "Discarded"
            ];

            const errors = {};

            if (!status || !status.trim()) {
                errors.status = "Status is required.";
            } else if (!allowedStatuses.includes(status)) {
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

            const result = await pool.query(
                `
                UPDATE blood_units
                SET
                    status = $1,
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
                    "Blood unit not found."
                );
            }

            return sendSuccessResponse(
                res,
                200,
                "Blood unit status updated successfully.",
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

export default BloodUnitController;