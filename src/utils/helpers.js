const crypto = require('crypto');
const logger = require('./logger');

// Generate random string
const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate secure random number
const generateSecureRandom = (min = 0, max = 1000000) => {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;
    
    let randomValue;
    do {
        randomValue = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
    } while (randomValue > maxValidValue);
    
    return min + (randomValue % range);
};

// Hash string with salt
const hashString = (str, salt = null) => {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(str, actualSalt, 10000, 64, 'sha512');
    return {
        hash: hash.toString('hex'),
        salt: actualSalt
    };
};

// Verify hash
const verifyHash = (str, hash, salt) => {
    const testHash = crypto.pbkdf2Sync(str, salt, 10000, 64, 'sha512');
    return testHash.toString('hex') === hash;
};

// Format time duration
const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

// Format chess time
const formatChessTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate username format
const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
};

// Sanitize HTML
const sanitizeHTML = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Deep clone object
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
};

// Retry function with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            const delay = baseDelay * Math.pow(2, attempt);
            logger.warn(`Retry attempt ${attempt + 1} failed, retrying in ${delay}ms`, { error: error.message });
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
};

// Pagination helper
const paginate = (items, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);
    
    return {
        items: paginatedItems,
        pagination: {
            page,
            limit,
            total: items.length,
            pages: Math.ceil(items.length / limit),
            hasNext: offset + limit < items.length,
            hasPrev: page > 1
        }
    };
};

// Error response helper
const createErrorResponse = (message, statusCode = 500, details = null) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
};

// Success response helper
const createSuccessResponse = (data, message = 'Success', statusCode = 200) => {
    return {
        success: true,
        message,
        data,
        statusCode
    };
};

// Validate UUID
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Generate game room code
const generateGameRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Calculate ELO change
const calculateEloChange = (playerRating, opponentRating, result, kFactor = 32) => {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const actualScore = result; // 1 for win, 0.5 for draw, 0 for loss
    const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
    
    return {
        ratingChange,
        newRating: playerRating + ratingChange,
        expectedScore,
        actualScore
    };
};

// Performance monitoring helper
const measurePerformance = (fn, label = 'Function') => {
    return async (...args) => {
        const start = process.hrtime.bigint();
        try {
            const result = await fn(...args);
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000; // Convert to milliseconds
            
            logger.debug(`${label} executed in ${duration.toFixed(2)}ms`);
            return result;
        } catch (error) {
            const end = process.hrtime.bigint();
            const duration = Number(end - start) / 1000000;
            
            logger.error(`${label} failed after ${duration.toFixed(2)}ms`, { error: error.message });
            throw error;
        }
    };
};

// Memory usage helper
const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
        rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
        arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100 // MB
    };
};

module.exports = {
    generateRandomString,
    generateSecureRandom,
    hashString,
    verifyHash,
    formatDuration,
    formatChessTime,
    isValidEmail,
    isValidUsername,
    sanitizeHTML,
    deepClone,
    retryWithBackoff,
    paginate,
    createErrorResponse,
    createSuccessResponse,
    isValidUUID,
    generateGameRoomCode,
    calculateEloChange,
    measurePerformance,
    getMemoryUsage
};