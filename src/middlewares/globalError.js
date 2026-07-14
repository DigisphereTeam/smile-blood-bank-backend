const globalError = (err, req, res, next) => {
    const statusCode = err.statusCode ?? 500;

    const data = {
        success: false,
        statusCode,
        message: err.message ?? "Internal Server Error",
        errors: err.errors ?? null
    };

    return res.status(statusCode).json(data);
};

export default globalError;