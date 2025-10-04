const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Generate access token
const generateAccessToken = (payload) => {
    try {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'chess-api',
            audience: 'chess-client'
        });
    } catch (error) {
        logger.error('Error generating access token:', error);
        throw new Error('Token generation failed');
    }
};

// Generate refresh token
const generateRefreshToken = (payload) => {
    try {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            issuer: 'chess-api',
            audience: 'chess-client'
        });
    } catch (error) {
        logger.error('Error generating refresh token:', error);
        throw new Error('Refresh token generation failed');
    }
};

// Verify token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'chess-api',
            audience: 'chess-client'
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            logger.error('Token verification error:', error);
            throw new Error('Token verification failed');
        }
    }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        logger.error('Error decoding token:', error);
        return null;
    }
};

// Generate token pair
const generateTokenPair = (user) => {
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    return {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
    };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    decodeToken,
    generateTokenPair
};