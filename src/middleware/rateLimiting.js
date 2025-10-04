const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
        });
    }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts, please try again later.',
            retryAfter: 900
        });
    }
});

// Game creation rate limiting
const gameCreationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // limit each IP to 3 game creations per 5 minutes
    message: {
        success: false,
        message: 'Too many game creation attempts, please try again later.',
        retryAfter: 300
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Game creation rate limit exceeded', {
            ip: req.ip,
            userId: req.user?.id,
            path: req.path
        });
        res.status(429).json({
            success: false,
            message: 'Too many game creation attempts, please try again later.',
            retryAfter: 300
        });
    }
});

// Move rate limiting (per game)
const moveLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 moves per minute per game
    keyGenerator: (req) => {
        return `${req.ip}:${req.params.id}`;
    },
    message: {
        success: false,
        message: 'Too many moves, please slow down.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Move rate limit exceeded', {
            ip: req.ip,
            gameId: req.params.id,
            userId: req.user?.id
        });
        res.status(429).json({
            success: false,
            message: 'Too many moves, please slow down.',
            retryAfter: 60
        });
    }
});

// Chat rate limiting
const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 chat messages per minute per game
    keyGenerator: (req) => {
        return `${req.ip}:${req.params.id}`;
    },
    message: {
        success: false,
        message: 'Too many chat messages, please slow down.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Chat rate limit exceeded', {
            ip: req.ip,
            gameId: req.params.id,
            userId: req.user?.id
        });
        res.status(429).json({
            success: false,
            message: 'Too many chat messages, please slow down.',
            retryAfter: 60
        });
    }
});

// Speed limiter for repeated requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 50
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again later.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Password reset rate limit exceeded', {
            ip: req.ip,
            email: req.body.email
        });
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts, please try again later.',
            retryAfter: 3600
        });
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    gameCreationLimiter,
    moveLimiter,
    chatLimiter,
    speedLimiter,
    passwordResetLimiter
};