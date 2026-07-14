import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";
import { createDonorWithBloodUnitSchema } from "../validations/schemas/bloodUnitValidations.js";
import validateRequest from "../validations/validateRequest.js";

class DonorController {
    createDonorHandler = async (req, res) => {
        try {
            const {
                first_name,
                last_name,
                gender,
                age,
                date_of_birth,
                blood_group,
                rh_type,
                phone_number,
                email,
                address,
                city,
                state,
                pincode,
                weight,
                hemoglobin,
                last_donation_date
            } = req.body;

            const errors = {};

            if (!first_name || !first_name.trim()) {
                errors.first_name = "First name is required.";
            }

            if (!gender || !gender.trim()) {
                errors.gender = "Gender is required.";
            } else if (!["Male", "Female", "Other"].includes(gender)) {
                errors.gender = "Invalid gender.";
            }

            if (!blood_group || !blood_group.trim()) {
                errors.blood_group = "Blood group is required.";
            }

            if (!rh_type || !rh_type.trim()) {
                errors.rh_type = "Rh type is required.";
            } else if (!["+", "-"].includes(rh_type)) {
                errors.rh_type = "Invalid Rh type.";
            }

            if (!phone_number || !phone_number.trim()) {
                errors.phone_number = "Phone number is required.";
            } else if (!/^[0-9]{10}$/.test(phone_number)) {
                errors.phone_number = "Phone number must contain exactly 10 digits.";
            }

            if (!date_of_birth) {
                errors.date_of_birth = "Date of birth is required.";
            }

            if (Object.keys(errors).length > 0) {
                return res.status(422).json({
                    success: false,
                    statusCode: 422,
                    message: "Validation failed.",
                    errors
                });
            }

            const existingDonor = await pool.query(
                `
                SELECT id
                FROM donors
                WHERE donor_code = $1
                   OR phone_number = $2
                   OR email = $3;
                `,
                [donor_code, phone_number, email || null]
            );

            if (existingDonor.rowCount > 0) {
                return sendErrorResponse(
                    res,
                    409,
                    "Donor already exists."
                );
            }

            const result = await pool.query(
                `
                INSERT INTO donors(
                    first_name,
                    last_name,
                    gender,
                    age,
                    date_of_birth,
                    blood_group,
                    rh_type,
                    phone_number,
                    email,
                    address,
                    city,
                    state,
                    pincode,
                    weight,
                    hemoglobin,
                    last_donation_date,
                    created_by
                )
                VALUES(
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                    $11,$12,$13,$14,$15,$16,$17,$18
                )
                RETURNING *;
                `,
                [
                    first_name,
                    last_name,
                    gender,
                    age,
                    date_of_birth,
                    blood_group,
                    rh_type,
                    phone_number,
                    email,
                    address,
                    city,
                    state,
                    pincode,
                    weight,
                    hemoglobin,
                    last_donation_date,
                    req.user.id
                ]
            );

            return sendSuccessResponse(
                res,
                201,
                "Donor created successfully.",
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

    // add donor details with blood units
    createDonorWithBloodUnitHandler = async (req, res) => {
        const validatedBody = validateRequest(createDonorWithBloodUnitSchema, req);

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const {
                name,
                gender,
                age,
                blood_group,
                rh_type,
                phone_number,
                email,
                address,
                weight,
                hemoglobin,
                last_donation_date,
                collection_date,
                volume_ml,
                remarks
            } = validatedBody;

            // Check duplicate donor
            const existingDonor = await client.query(`
                SELECT id
                FROM donors
                WHERE phone_number = $1
                OR email = $2
                `,
                [phone_number, email || null]
            );

            if (existingDonor.rowCount > 0) {
                await client.query("ROLLBACK");
                return sendErrorResponse(
                    res,
                    409,
                    "Donor already exists."
                );
            }

            // Create Donor
            const donorResult = await client.query(
                `
            INSERT INTO donors
            (
                name,
                gender,
                age,
                blood_group,
                rh_type,
                phone_number,
                email,
                address,
                weight,
                hemoglobin,
                last_donation_date,
                created_by
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
            )
            RETURNING *;
            `,
                [
                    name,
                    gender,
                    age,
                    blood_group,
                    rh_type,
                    phone_number,
                    email || null,
                    address || null,
                    weight || null,
                    hemoglobin || null,
                    last_donation_date || null,
                    req.user.id
                ]
            );

            const donor = donorResult.rows[0];

            // Generate Blood Unit Number
            const seq = await client.query(
                `SELECT nextval('blood_unit_seq') AS seq`
            );

            const currentYear = new Date().getFullYear();

            const unit_number = `BU-${currentYear}-${String(
                seq.rows[0].seq
            ).padStart(6, "0")}`;

            // Create Blood Unit
            const bloodUnitResult = await client.query(
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
                    donor.id,
                    blood_group,
                    rh_type,
                    collection_date,
                    volume_ml,
                    remarks || null,
                    req.user.id
                ]
            );

            await client.query("COMMIT");

            return sendSuccessResponse(
                res,
                201,
                "Donor and blood unit created successfully.",
                {
                    ...donor,
                    ...bloodUnitResult.rows[0]
                }
            );

        } catch (error) {
            await client.query("ROLLBACK");

            return sendErrorResponse(
                res,
                500,
                error.message || "Internal server error."
            );
        } finally {
            client.release();
        }
    };

    getDonorsHandler = async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    d.*,
                    CONCAT(u.first_name,' ',u.last_name) AS created_by_name
                FROM donors d
                JOIN users u
                    ON d.created_by = u.id
                ORDER BY d.created_at DESC;
            `);

            return sendSuccessResponse(
                res,
                200,
                "Donors fetched successfully.",
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

    getDonorByIdHandler = async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(id)) {
                return sendErrorResponse(
                    res,
                    400,
                    "Invalid donor ID."
                );
            }

            const result = await pool.query(
                `
                SELECT
                    d.*,
                    json_build_object(
                        'id',u.id,
                        'first_name',u.first_name,
                        'last_name',u.last_name,
                        'email',u.email,
                        'role',u.role
                    ) AS created_by
                FROM donors d
                JOIN users u
                    ON d.created_by = u.id
                WHERE d.id = $1;
                `,
                [id]
            );

            if (result.rowCount === 0) {
                return sendErrorResponse(
                    res,
                    404,
                    "Donor not found."
                );
            }

            return sendSuccessResponse(
                res,
                200,
                "Donor fetched successfully.",
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

export default DonorController;