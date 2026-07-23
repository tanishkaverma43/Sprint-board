/** Thrown deliberately by controllers/services for expected, client-facing failures. */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** Wraps an async route handler so rejected promises reach the error middleware. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** 404 handler for unknown routes — placed after all routes are registered. */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}

/** Centralized error handler — keeps error shape/logging consistent app-wide. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
  }

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: isServerError && process.env.NODE_ENV === 'production'
      ? 'Something went wrong on our end. Please try again later.'
      : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { ApiError, asyncHandler, notFoundHandler, errorHandler };
