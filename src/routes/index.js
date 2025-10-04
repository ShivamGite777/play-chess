const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const gameRoutes = require('./games');
const userRoutes = require('./users');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Chess API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/users', userRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

module.exports = router;