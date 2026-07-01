import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";

class DonorController {
    createDonorHandler = async (req, res) => {
        try {
            const {
                donor_code,
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

            if (
                !donor_code?.trim() ||
                !first_name?.trim() ||
                !gender?.trim() ||
                !blood_group?.trim() ||
                !rh_type?.trim() ||
                !phone_number?.trim() ||
                !date_of_birth
            ) {
                return sendErrorResponse(
                    res,
                    400,
                    "Required fields are missing."
                );
            }

            if (!["Male", "Female", "Other"].includes(gender)) {
                return sendErrorResponse(res, 400, "Invalid gender.");
            }

            if (!["+", "-"].includes(rh_type)) {
                return sendErrorResponse(res, 400, "Invalid Rh type.");
            }

            if (!/^[0-9]{10}$/.test(phone_number)) {
                return sendErrorResponse(
                    res,
                    400,
                    "Phone number must contain exactly 10 digits."
                );
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
                    donor_code,
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
                    donor_code,
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