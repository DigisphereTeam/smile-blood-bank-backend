const globalError = (err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    success: false,
    statusCode : err.statusCode,
    message: err.message || "Internal Server Error",
  });
};

export default globalError;