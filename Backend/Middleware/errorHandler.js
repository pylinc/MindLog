const { HTTP_STATUS } = require('../Config/constant');

/**
 * Global Error Handler Middleware
 * Catches all errors from routes and returns consistent error responses
 * Must be placed after all routes in server.js
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error Handler Caught:', err);

    let error = { ...err };
    error.message = err.message;

    // Log detailed error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Stack:', err.stack);
        console.error('Error Details:', err);
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }

    // Mongoose Cast Error (Invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    // MongoDB Duplicate Key Error (11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];
        
        return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`
        });
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid token. Please log in again.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Token expired. Please log in again.'
        });
    }

    // Custom Application Errors (with statusCode property)
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message || 'Application error',
            ...(err.errors && { errors: err.errors })
        });
    }

    // Default to 500 Internal Server Error
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Custom Error Class for Application Errors
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    AppError,
    asyncHandler
};
