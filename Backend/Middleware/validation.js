const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../Config/constant');

/**
 * Middleware to handle validation results
 * Returns 400 with validation errors if any exist
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

/**
 * Registration Validation
 */
exports.validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    
    body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])/)
        .withMessage('Password must contain at least one lowercase letter')
        .optional({ checkFalsy: true })
        .matches(/^(?=.*[A-Z])/)
        .withMessage('Password should contain at least one uppercase letter (recommended)')
        .optional({ checkFalsy: true })
        .matches(/^(?=.*\d)/)
        .withMessage('Password should contain at least one number (recommended)'),
    
    handleValidationErrors
];

/**
 * Login Validation
 */
exports.validateLogin = [
    body('email')
        .optional()
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please provide a valid email address'),
    
    body('username')
        .optional()
        .trim(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    // Custom validation to ensure either email or username is provided
    body().custom((value, { req }) => {
        if (!req.body.email && !req.body.username) {
            throw new Error('Either email or username is required');
        }
        return true;
    }),
    
    handleValidationErrors
];

/**
 * Profile Update Validation
 */
exports.validateProfileUpdate = [
    body('profile.firstName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('First name must not exceed 50 characters'),
    
    body('profile.lastName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Last name must not exceed 50 characters'),
    
    body('profile.bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),
    
    body('profile.avatar')
        .optional()
        .trim()
        .isURL()
        .withMessage('Avatar must be a valid URL'),
    
    handleValidationErrors
];

/**
 * Preferences Update Validation
 */
exports.validatePreferencesUpdate = [
    body('preferences.theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Theme must be one of: light, dark, auto'),
    
    body('preferences.timezone')
        .optional()
        .trim(),
    
    body('preferences.reminderTime')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('Reminder time must be in HH:MM format'),
    
    handleValidationErrors
];

/**
 * Password Change Validation
 */
exports.validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Journal Creation/Update Validation
 */
exports.validateJournal = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    
    body('content')
        .trim()
        .isLength({ min: 1, max: 50000 })
        .withMessage('Content must be between 1 and 50000 characters'),
    
    body('mood')
        .optional()
        .isIn(['happy', 'sad', 'excited', 'anxious', 'calm', 'angry', 'neutral', 'grateful', 'tired', 'motivated'])
        .withMessage('Invalid mood value'),
    
    body('tags')
        .optional()
        .isArray({ max: 10 })
        .withMessage('Tags must be an array with maximum 10 items'),
    
    body('tags.*')
        .optional()
        .trim()
        .toLowerCase()
        .isLength({ min: 1, max: 30 })
        .withMessage('Each tag must be between 1 and 30 characters'),
    
    body('isFavorite')
        .optional()
        .isBoolean()
        .withMessage('isFavorite must be a boolean'),
    
    body('isPrivate')
        .optional()
        .isBoolean()
        .withMessage('isPrivate must be a boolean'),
    
    body('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array'),
    
    body('attachments.*.fileName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('File name is required for attachments'),
    
    body('attachments.*.fileUrl')
        .optional()
        .trim()
        .isURL()
        .withMessage('File URL must be valid'),
    
    body('attachments.*.fileSize')
        .optional()
        .isInt({ max: 5242880 })
        .withMessage('File size must not exceed 5MB'),
    
    handleValidationErrors
];

/**
 * Category Creation/Update Validation
 */
exports.validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category name must be between 1 and 50 characters'),
    
    body('color')
        .optional()
        .trim()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage('Color must be a valid hex color code'),
    
    body('icon')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Icon must not exceed 50 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description must not exceed 200 characters'),
    
    handleValidationErrors
];

/**
 * Prompt Creation/Update Validation (Admin only)
 */
exports.validatePrompt = [
    body('prompt')
        .trim()
        .notEmpty()
        .withMessage('Prompt text is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Prompt must be between 10 and 500 characters'),
    
    body('category')
        .trim()
        .isIn(['reflection', 'gratitude', 'goals', 'creativity', 'mindfulness', 'relationships', 'personal_growth'])
        .withMessage('Invalid category value'),
    
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    
    handleValidationErrors
];

/**
 * MongoDB ObjectId Validation
 */
exports.validateObjectId = [
    param('id')
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage('Invalid ID format'),
    
    handleValidationErrors
];

/**
 * Query Parameter Validation for Pagination
 */
exports.validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
];

/**
 * Search Query Validation
 */
exports.validateSearch = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    handleValidationErrors
];
