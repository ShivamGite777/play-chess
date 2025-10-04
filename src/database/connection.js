const { Pool } = require('pg');
const redis = require('redis');
const logger = require('../utils/logger');

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chess_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Redis client
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server connection refused');
            return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            logger.error('Redis max retry attempts reached');
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Redis connection event handlers
redisClient.on('connect', () => {
    logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
});

redisClient.on('end', () => {
    logger.info('Redis client disconnected');
});

// PostgreSQL connection event handlers
pool.on('connect', (client) => {
    logger.info('New PostgreSQL client connected');
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client:', err);
    process.exit(-1);
});

// Database query helper
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        logger.error('Database query error:', { text, params, error: error.message });
        throw error;
    }
};

// Redis helper functions
const redisGet = async (key) => {
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        logger.error('Redis GET error:', { key, error: error.message });
        return null;
    }
};

const redisSet = async (key, value, expireSeconds = null) => {
    try {
        const serialized = JSON.stringify(value);
        if (expireSeconds) {
            await redisClient.setex(key, expireSeconds, serialized);
        } else {
            await redisClient.set(key, serialized);
        }
        return true;
    } catch (error) {
        logger.error('Redis SET error:', { key, error: error.message });
        return false;
    }
};

const redisDel = async (key) => {
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        logger.error('Redis DEL error:', { key, error: error.message });
        return false;
    }
};

const redisExists = async (key) => {
    try {
        const result = await redisClient.exists(key);
        return result === 1;
    } catch (error) {
        logger.error('Redis EXISTS error:', { key, error: error.message });
        return false;
    }
};

// Initialize connections
const initializeConnections = async () => {
    try {
        // Test PostgreSQL connection
        await pool.query('SELECT NOW()');
        logger.info('PostgreSQL connection established');
        
        // Test Redis connection
        await redisClient.connect();
        logger.info('Redis connection established');
        
        return true;
    } catch (error) {
        logger.error('Failed to initialize database connections:', error);
        throw error;
    }
};

// Graceful shutdown
const closeConnections = async () => {
    try {
        await pool.end();
        await redisClient.quit();
        logger.info('Database connections closed');
    } catch (error) {
        logger.error('Error closing database connections:', error);
    }
};

module.exports = {
    pool,
    redisClient,
    query,
    redisGet,
    redisSet,
    redisDel,
    redisExists,
    initializeConnections,
    closeConnections
};