const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    handleValidationErrors
];

// User login validation
const validateUserLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Game creation validation
const validateGameCreation = [
    body('game_mode')
        .isIn(['bullet', 'blitz', 'rapid', 'classical'])
        .withMessage('Game mode must be one of: bullet, blitz, rapid, classical'),
    body('time_control')
        .isInt({ min: 60, max: 7200 })
        .withMessage('Time control must be between 60 and 7200 seconds'),
    body('increment_seconds')
        .optional()
        .isInt({ min: 0, max: 60 })
        .withMessage('Increment must be between 0 and 60 seconds'),
    body('delay_seconds')
        .optional()
        .isInt({ min: 0, max: 30 })
        .withMessage('Delay must be between 0 and 30 seconds'),
    handleValidationErrors
];

// Move validation
const validateMove = [
    body('from')
        .matches(/^[a-h][1-8]$/)
        .withMessage('From square must be in algebraic notation (e.g., e2)'),
    body('to')
        .matches(/^[a-h][1-8]$/)
        .withMessage('To square must be in algebraic notation (e.g., e4)'),
    body('promotion')
        .optional()
        .isIn(['q', 'r', 'b', 'n'])
        .withMessage('Promotion piece must be one of: q, r, b, n'),
    handleValidationErrors
];

// UUID parameter validation
const validateUUID = [
    param('id')
        .isUUID()
        .withMessage('Invalid ID format'),
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
    handleValidationErrors
];

// User profile update validation
const validateProfileUpdate = [
    body('username')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('avatar_url')
        .optional()
        .isURL()
        .withMessage('Avatar URL must be a valid URL'),
    handleValidationErrors
];

// Chat message validation
const validateChatMessage = [
    body('message')
        .isLength({ min: 1, max: 500 })
        .withMessage('Message must be between 1 and 500 characters')
        .trim(),
    body('message_type')
        .optional()
        .isIn(['chat', 'system'])
        .withMessage('Message type must be either chat or system'),
    handleValidationErrors
];

// Draw offer validation
const validateDrawOffer = [
    body('action')
        .isIn(['offer', 'accept', 'decline'])
        .withMessage('Action must be one of: offer, accept, decline'),
    handleValidationErrors
];

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/[<>]/g, '') // Remove < and >
            .trim();
    };

    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateGameCreation,
    validateMove,
    validateUUID,
    validatePagination,
    validateProfileUpdate,
    validateChatMessage,
    validateDrawOffer,
    sanitizeInput
};