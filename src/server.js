require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { initializeConnections, closeConnections } = require('./database/connection');
const logger = require('./utils/logger');
const routes = require('./routes');
const SocketHandler = require('./websocket/socketHandler');
const timerService = require('./services/timerService');

class ChessServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.socketHandler = null;
        this.port = process.env.PORT || 3000;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            next();
        });

        // Trust proxy (for accurate IP addresses behind reverse proxy)
        this.app.set('trust proxy', 1);
    }

    setupRoutes() {
        // API routes
        this.app.use('/api', routes);

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'Chess Multiplayer API',
                version: '1.0.0',
                endpoints: {
                    auth: '/api/auth',
                    games: '/api/games',
                    users: '/api/users',
                    health: '/api/health'
                },
                documentation: '/api/docs'
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found',
                path: req.originalUrl
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);

            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';
            
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Internal server error',
                ...(isDevelopment && { stack: error.stack })
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            this.gracefulShutdown();
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.gracefulShutdown();
        });

        // Handle SIGTERM
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received');
            this.gracefulShutdown();
        });

        // Handle SIGINT
        process.on('SIGINT', () => {
            logger.info('SIGINT received');
            this.gracefulShutdown();
        });
    }

    async start() {
        try {
            // Initialize database connections
            await initializeConnections();
            logger.info('Database connections initialized');

            // Start timer service
            timerService.start();
            logger.info('Timer service started');

            // Setup WebSocket handler
            this.socketHandler = new SocketHandler(this.server);
            logger.info('WebSocket handler initialized');

            // Start server
            this.server.listen(this.port, () => {
                logger.info(`Chess server running on port ${this.port}`);
                logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`API available at: http://localhost:${this.port}/api`);
            });

        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    async gracefulShutdown() {
        logger.info('Starting graceful shutdown...');

        try {
            // Stop accepting new connections
            this.server.close(() => {
                logger.info('HTTP server closed');
            });

            // Stop timer service
            timerService.stop();
            logger.info('Timer service stopped');

            // Close database connections
            await closeConnections();
            logger.info('Database connections closed');

            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    }
}

// Create and start server
const server = new ChessServer();
server.start();

module.exports = server;