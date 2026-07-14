import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appConfig from "../config/appConfig.js";
import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";
import { createUserSchema, userLoginSchema } from "../validations/schemas/authValidations.js";
import validateRequest from "../validations/validateRequest.js";

class AuthController {
    createUserHandlers = async (req, res) => {
        validateRequest(createUserSchema, req);
        try {
            const { first_name, last_name, email, phone_number, password, role = "frontdesk" } = req.body;

            const existingUser = await pool.query(`
                SELECT id
                FROM users
                WHERE email = $1 OR phone_number = $2
                `,
                [email, phone_number]
            );

            if (existingUser.rows.length > 0) {
                return sendErrorResponse(res, 409, "Email or phone number already exists");
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await pool.query(`
                INSERT INTO users (first_name,last_name,email,phone_number,password,role)
                VALUES ($1,$2,$3,$4,$5,$6)
                RETURNING
                    id,
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    role,
                    is_active,
                    created_at
                `,
                [
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    hashedPassword,
                    role,
                ]
            );

            return sendSuccessResponse(res, 201, "User created successfully.", result.rows[0]);
        } catch (error) {
            return sendErrorResponse(res, 500, error.message || "Internal server error")
        }
    };
    userLoginHandlers = async (req, res) => {
        validateRequest(userLoginSchema, req);
        try {
            const { email, password } = req.body;
            const result = await pool.query(`
                    SELECT *
                    FROM users
                    WHERE email = $1
                `,
                [email]
            );

            if (result.rows.length === 0) {
                return sendErrorResponse(res, 401, "Invalid email or password.");
            }

            const user = result.rows[0];

            if (!user.is_active) {
                return sendErrorResponse(res, 403, "Your account has been deactivated.");
            }

            const isPasswordMatched = await bcrypt.compare(password, user.password);

            if (!isPasswordMatched) {
                return sendErrorResponse(res, 401, "Invalid email or password.");
            }

            const token = jwt.sign({ id: user.id }, appConfig.jwtSecretKey, { expiresIn: "24h", });

            delete user.password;

            return sendSuccessResponse(res, 200, "Login successful.", { token, user }
            );
        } catch (error) {
            return sendErrorResponse(res, 500, error.message || "Internal server error")
        }
    }
}

export default AuthController;