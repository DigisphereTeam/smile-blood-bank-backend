import jwt from "jsonwebtoken";
import appConfig from "../config/appConfig.js";
import { sendErrorResponse } from "../utils/sendResponse.js";

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return sendErrorResponse(res, 401, "Access token is required.");
        }

        if (!authHeader.startsWith("Bearer ")) {
            return sendErrorResponse(res, 401, "Invalid authorization header.");
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, appConfig.jwtSecretKey);

        req.user = decoded;

        next();
    } catch (error) {
        return sendErrorResponse(res, 401, "Invalid or expired access token.");
    }
};