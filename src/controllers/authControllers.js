import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appConfig from "../config/appConfig.js";
import pool from "../database/configuration.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/sendResponse.js";

class AuthController {
    createUserHandlers = async (req, res) => {
        try {
            const { first_name, last_name, email, phone_number, password, role = "frontdesk" } = req.body;
            if (!first_name.trim() || !email.trim() || !phone_number.trim() || !password.trim() || !role.trim()) {
                return sendErrorResponse(res, 400, "First name, email, phone number, password and role are required.");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return sendErrorResponse(res, 400, "Invalid email address.");
            }

            // Phone validation
            if (!/^[0-9]{10}$/.test(phone_number)) {
                return sendErrorResponse(res, 400, "Phone number must contain exactly 10 digits");
            }

            // Password validation
            if (password.length < 8) {
                return sendErrorResponse(res, 400, "Password must be at least 8 characters");
            }

            // Role validation
            const allowedRoles = ["admin", "frontdesk", "technical"];

            if (!allowedRoles.includes(role)) {
                return sendErrorResponse(res, 400, "Invalid role");
            }

            // Check duplicate email or phone number
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
        try {
            const { email, password } = req.body;

            if (!email || !email.trim()) {
                return sendErrorResponse(res, 400, "Email is required.");
            }

            if (!password || !password.trim()) {
                return sendErrorResponse(res, 400, "Password is required.");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                return sendErrorResponse(res, 400, "Invalid email address.");
            }

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

            const isPasswordMatched = await bcrypt.compare( password,user.password);

            if (!isPasswordMatched) {
                return sendErrorResponse(res, 401, "Invalid email or password.");
            }

            const token = jwt.sign({ id: user.id }, appConfig.jwtSecretKey, { expiresIn: "24h",});

            delete user.password;

            return sendSuccessResponse(res, 200, "Login successful.", { token, user }
            );
        } catch (error) {
            return sendErrorResponse(res , 500 , error.message || "Internal server error")
        }
    }
}

export default AuthController;