export function sendSuccessResponse(res, statusCode, message, data = null,) {
    return res.status(statusCode).json({
        success: true,
        statusCode,
        message,
        data,
    });
};

export function sendErrorResponse(res, statusCode, message) {
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
}