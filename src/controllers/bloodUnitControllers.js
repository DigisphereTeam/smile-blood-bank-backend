import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";
import { createBloodUnitComponentsSchema, createBloodUnitSchema, updateBloodUnitStatusSchema } from "../validations/schemas/bloodUnitValidations.js";
import validateRequest from "../validations/validateRequest.js";

class BloodUnitController {

    createBloodUnitHandler = async (req, res) => {
        validateRequest(createBloodUnitSchema, req);
        try {
            const { donor_id, blood_group, rh_type, collection_date, volume_ml, remarks } = req.body;

            const donor = await pool.query(`
                SELECT id
                FROM donors
                WHERE id = $1`,
                [donor_id]
            );

            if (donor.rowCount === 0) {
                return sendErrorResponse(res, 404, "Donor not found.");
            }


            const seq = await pool.query(
                `SELECT nextval('blood_unit_seq') AS seq`
            );

            const currentYear = new Date().getFullYear();

            const unit_number = `BU-${currentYear}-${String(
                seq.rows[0].seq
            ).padStart(6, "0")}`;

            // Insert Blood Unit
            const result = await pool.query(
                `
            INSERT INTO blood_units
            (
                unit_number,
                donor_id,
                blood_group,
                rh_type,
                collection_date,
                volume_ml,
                remarks,
                created_by
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8
            )
            RETURNING *;
            `,
                [
                    unit_number,
                    donor_id,
                    blood_group.toUpperCase(),
                    rh_type,
                    collection_date,
                    volume_ml,
                    remarks || null,
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

    createBloodUnitComponentsHandler = async (req, res) => {
        validateRequest(createBloodUnitComponentsSchema, req);
        const client = await pool.connect();

        try {

            await client.query("BEGIN");

            const { bloodUnitId } = req.params;
            const { components } = req.body;

            // Check Blood Unit
            const bloodUnitResult = await client.query(`
                SELECT id, status
                FROM blood_units
                WHERE id = $1
            `,
                [bloodUnitId]
            );

            if (bloodUnitResult.rowCount === 0) {
                await client.query("ROLLBACK");
                return sendErrorResponse(res, 404, "Blood unit not found.");
            }

            if (bloodUnitResult.rows[0].status === "Processed") {
                await client.query("ROLLBACK");
                return sendErrorResponse(res, 400, "Blood unit already processed.");
            }

            // Validate all component ids in one query
            const componentIds = components.map(c => c.component_id);

            const componentResult = await client.query(`
                SELECT id
                FROM blood_components
                WHERE id = ANY($1)
            `,
                [componentIds]
            );

            if (componentResult.rowCount !== componentIds.length) {
                await client.query("ROLLBACK");
                return sendErrorResponse(
                    res,
                    404,
                    "One or more blood components not found."
                );
            }

            // Get sequence numbers for all components

            const seqResult = await client.query(`
                SELECT nextval('blood_unit_component_seq') AS seq
                FROM generate_series(1, $1)
            `,
                [components.length]
            );

            const currentYear = new Date().getFullYear();

            const values = [];
            const placeholders = [];

            components.forEach((item, index) => {

                const component_unit_number = `BUC-${currentYear}-${String(
                    seqResult.rows[index].seq
                ).padStart(6, "0")}`;

                const base = index * 6;

                placeholders.push(
                    `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
                );

                values.push(
                    component_unit_number,
                    bloodUnitId,
                    item.component_id,
                    item.volume_ml,
                    item.expiry_date,
                    req.user.id
                );
            });

            const insertQuery = `
                INSERT INTO blood_unit_components
                (
                    component_unit_number,
                    blood_unit_id,
                    component_id,
                    volume_ml,
                    expiry_date,
                    created_by
                )
                VALUES
                ${placeholders.join(",")}
                RETURNING *;
            `;

            const insertedComponents = await client.query(insertQuery, values);

            await client.query(`
                UPDATE blood_units
                SET status = 'Processed'
                WHERE id = $1
            `,
                [bloodUnitId]
            );

            await client.query("COMMIT");

            return sendSuccessResponse(
                res,
                201,
                "Blood components created successfully.",
                insertedComponents.rows
            );

        } catch (error) {

            await client.query("ROLLBACK");

            return sendErrorResponse(
                res,
                500,
                error.message ?? "Internal Server Error"
            );

        } finally {

            client.release();

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
                conditions.push(`buc.component_id = $${values.length}`);
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
                
                bu.volume_ml,
                bu.status,
                bu.created_at,

                d.name AS donor_name,

                COALESCE(
                    JSON_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'component_id', bc.id,
                            'component_name', bc.component_name,
                            'component_expire_date', buc.expiry_date,
                            'component_status', buc.status
                        )
                    ) FILTER (WHERE bc.id IS NOT NULL),
                    '[]'
                ) AS components,

                u.first_name AS created_by

            FROM blood_units bu

            INNER JOIN donors d
                ON bu.donor_id = d.id

            LEFT JOIN blood_unit_components buc
                ON bu.id = buc.blood_unit_id

            LEFT JOIN blood_components bc
                ON buc.component_id = bc.id

            INNER JOIN users u
                ON bu.created_by = u.id

            ${whereClause}

            GROUP BY
                bu.id,
                d.name,
                u.first_name

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
        const { id } = req.params;

        // Validate path parameter
        if (!id || isNaN(id) || Number(id) <= 0) {
            return sendErrorResponse(
                res,
                400,
                "Invalid blood unit ID."
            );
        }
        const validatedBody = validateRequest(updateBloodUnitStatusSchema, req);
        const { status } = validatedBody;
        try {

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