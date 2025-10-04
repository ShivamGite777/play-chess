const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateUUID, validatePagination } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiting');

// Apply general rate limiting
router.use(generalLimiter);

// Public routes
router.get('/leaderboard', validatePagination, userController.getLeaderboard);
router.get('/search', userController.searchUsers);

// Protected routes
router.use(authenticate);

// User profiles and statistics
router.get('/:id/profile', validateUUID, userController.getUserProfile);
router.get('/:id/stats', validateUUID, userController.getUserStats);
router.get('/:id/game-history', validateUUID, validatePagination, userController.getUserGameHistory);
router.get('/:id/recent-games', validateUUID, userController.getUserRecentGames);
router.get('/:id/active-games', validateUUID, userController.getUserActiveGames);
router.get('/:id/game-stats', validateUUID, userController.getUserGameStatsByTimeControl);

module.exports = router;