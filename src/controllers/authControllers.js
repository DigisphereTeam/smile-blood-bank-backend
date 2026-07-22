import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appConfig from "../config/appConfig.js";
import pool from "../database/configuration.js";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/sendResponse.js";
import {
  createUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userLoginSchema,
  verifyForgotPasswordOtpSchema,
} from "../validations/schemas/authValidations.js";
import validateRequest from "../validations/validateRequest.js";

class AuthController {
  createUserHandlers = async (req, res) => {
    validateRequest(createUserSchema, req);
    try {
      const {
        first_name,
        last_name,
        email,
        phone_number,
        password,
        role = "frontdesk",
      } = req.body;

      const existingUser = await pool.query(
        `
                SELECT id
                FROM users
                WHERE email = $1 OR phone_number = $2
                `,
        [email, phone_number],
      );

      if (existingUser.rows.length > 0) {
        return sendErrorResponse(
          res,
          409,
          "Email or phone number already exists",
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `
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
        [first_name, last_name, email, phone_number, hashedPassword, role],
      );

      return sendSuccessResponse(
        res,
        201,
        "User created successfully.",
        result.rows[0],
      );
    } catch (error) {
      return sendErrorResponse(
        res,
        500,
        error.message || "Internal server error",
      );
    }
  };
  userLoginHandlers = async (req, res) => {
    const validatedBody = validateRequest(userLoginSchema, req);
    try {
      const { email, password } = validatedBody;
      const result = await pool.query(
        `
                    SELECT *
                    FROM users
                    WHERE email = $1
                `,
        [email],
      );

      if (result.rows.length === 0) {
        return sendErrorResponse(res, 401, "Invalid email or password.");
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return sendErrorResponse(
          res,
          403,
          "Your account has been deactivated.",
        );
      }

      const isPasswordMatched = await bcrypt.compare(password, user.password);

      if (!isPasswordMatched) {
        return sendErrorResponse(res, 401, "Invalid email or password.");
      }

      const token = jwt.sign({ id: user.id }, appConfig.jwtSecretKey, {
        expiresIn: "24h",
      });

      delete user.password;

      return sendSuccessResponse(res, 200, "Login successful.", {
        token,
        user,
      });
    } catch (error) {
      return sendErrorResponse(
        res,
        500,
        error.message || "Internal server error",
      );
    }
  };
  forgotPassword = async (req, res) => {
    const validatedBody = validateRequest(forgotPasswordSchema, req);
    try {
      const { email } = validatedBody;

      const user = await pool.query(
        "SELECT id , email FROM users WHERE email = $1",
        [email],
      );

      if (user.rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "User not found",
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await pool.query(
        `UPDATE users
             SET otp = $1,
                 otp_expiry = NOW() + INTERVAL '5 minutes'
             WHERE email = $2`,
        [otp, email],
      );

      // sendforgotpasswordOtpMail(email, otp).catch((error) => { console.log(error) });

      return res.status(200).json({
        statusCode: 200,
        message: "OTP sent successfully",
        data: user.rows[0],
      });
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: error.message || "Internal Server Error",
      });
    }
  };
  verifyForgotPasswordOtp = async (req, res) => {
    const validatedBody = validateRequest(verifyForgotPasswordOtpSchema, req);

    try {
      const { email, otp } = validatedBody;

      // Fixed OTP verification
      if (otp !== "1234") {
        return res.status(400).json({
          statusCode: 400,
          message: "Invalid OTP"
        });
      }

      const result = await pool.query(
        `SELECT id, email
             FROM users
             WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "User not found"
        });
      }

      return res.status(200).json({
        statusCode: 200,
        message: "OTP verified successfully",
        data: result.rows[0]
      });

    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: error.message || "Internal Server Error"
      });
    }
  };
  resetPassword = async (req, res) => {
    validateRequest(resetPasswordSchema, req);
    try {
      const { email, password, confirm_password } = req.body;

      if (password !== confirm_password) {
        return res.status(400).json({
          statusCode: 400,
          message: "Passwords do not match",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        `UPDATE users
             SET password = $1,
                 otp = NULL,
                 otp_expiry = NULL
             WHERE email = $2`,
        [hashedPassword, email],
      );

      return res.status(200).json({
        statusCode: 200,
        message: "Password reset successfully",
      });
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: error.message || "Internal Server Error",
      });
    }
  };
}

export default AuthController;
