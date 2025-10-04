const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify token
        const decoded = verifyToken(token);
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        
        if (error.message === 'Token expired') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        } else if (error.message === 'Invalid token') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        
        req.user = user;
        next();
    } catch (error) {
        // If token is invalid, just set user to null and continue
        req.user = null;
        next();
    }
};

// Authorization middleware - check if user owns resource
const authorize = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (req.user.id !== resourceUserId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        next();
    };
};

// Check if user is in game
const requireGamePlayer = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const gameId = req.params.id || req.params.gameId;
        const Game = require('../models/Game');
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }

        if (game.white_player_id !== req.user.id && game.black_player_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not a player in this game'
            });
        }

        req.game = game;
        next();
    } catch (error) {
        logger.error('Game player authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
};

// Check if user is spectator or player
const requireGameAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const gameId = req.params.id || req.params.gameId;
        const Game = require('../models/Game');
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }

        // Allow access if user is player or spectator
        const isPlayer = game.white_player_id === req.user.id || game.black_player_id === req.user.id;
        
        if (!isPlayer) {
            // Check if user is spectator (this would require additional database query)
            // For now, we'll allow any authenticated user to spectate
            // In production, you might want to implement spectator management
        }

        req.game = game;
        next();
    } catch (error) {
        logger.error('Game access authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
};

module.exports = {
    authenticate,
    optionalAuth,
    authorize,
    requireGamePlayer,
    requireGameAccess
};