const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
    validateUserRegistration, 
    validateUserLogin, 
    validateProfileUpdate,
    validatePagination 
} = require('../middleware/validation');
const { authLimiter, generalLimiter } = require('../middleware/rateLimiting');

// Apply rate limiting
router.use(generalLimiter);

// Public routes
router.post('/register', authLimiter, validateUserRegistration, authController.register);
router.post('/login', authLimiter, validateUserLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(authenticate);

router.get('/me', authController.getMe);
router.patch('/me', validateProfileUpdate, authController.updateProfile);
router.get('/me/stats', authController.getUserStats);
router.get('/me/game-history', validatePagination, authController.getUserGameHistory);
router.post('/logout', authController.logout);

module.exports = router;