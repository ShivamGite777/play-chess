const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticate, requireGamePlayer, requireGameAccess } = require('../middleware/auth');
const { 
    validateGameCreation, 
    validateMove, 
    validateUUID, 
    validatePagination,
    validateDrawOffer 
} = require('../middleware/validation');
const { 
    gameCreationLimiter, 
    moveLimiter, 
    chatLimiter, 
    generalLimiter 
} = require('../middleware/rateLimiting');

// Apply general rate limiting
router.use(generalLimiter);

// Public routes (with optional auth for lobby)
router.get('/lobby', validatePagination, gameController.getLobbyGames);

// Protected routes
router.use(authenticate);

// Game management
router.post('/create', gameCreationLimiter, validateGameCreation, gameController.createGame);
router.post('/:id/join', validateUUID, gameController.joinGame);
router.get('/my-games', gameController.getUserActiveGames);

// Game details and history
router.get('/:id', validateUUID, requireGameAccess, gameController.getGameDetails);
router.get('/:id/history', validateUUID, requireGameAccess, validatePagination, gameController.getGameHistory);

// Game actions (players only)
router.post('/:id/move', validateUUID, requireGamePlayer, moveLimiter, validateMove, gameController.makeMove);
router.post('/:id/resign', validateUUID, requireGamePlayer, gameController.resign);
router.post('/:id/draw', validateUUID, requireGamePlayer, validateDrawOffer, gameController.offerDraw);

module.exports = router;