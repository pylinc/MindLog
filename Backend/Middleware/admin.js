const { HTTP_STATUS, ERROR_MESSAGES } = require('../Config/constant');

/**
 * Admin Middleware
 * Verifies that the authenticated user has admin role
 * Must be used after authMiddleware
 */
exports.adminMiddleware = (req, res, next) => {
    try {
        // Check if user is authenticated (should be set by authMiddleware)
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        // Check if user role is 'admin'
        if (req.user.role !== 'admin') {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // User is admin, proceed to next middleware/controller
        next();
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Server error in admin verification'
        });
    }
};
