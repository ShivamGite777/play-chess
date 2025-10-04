const User = require('../models/User');
const { generateTokenPair } = require('../utils/jwt');
const logger = require('../utils/logger');

class AuthController {
    // Register new user
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }

            // Create new user
            const user = await User.create({ username, email, password });

            // Generate tokens
            const tokens = generateTokenPair(user);

            // Update last login
            await user.updateLastLogin();

            logger.info('User registered successfully', { userId: user.id, username: user.username });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: user.toSafeObject(),
                tokens
            });
        } catch (error) {
            logger.error('Registration error:', error);
            
            if (error.code === '23505') { // PostgreSQL unique constraint violation
                return res.status(400).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Registration failed'
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Verify password
            const isPasswordValid = await user.verifyPassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate tokens
            const tokens = generateTokenPair(user);

            // Update last login
            await user.updateLastLogin();

            logger.info('User logged in successfully', { userId: user.id, username: user.username });

            res.json({
                success: true,
                message: 'Login successful',
                user: user.toSafeObject(),
                tokens
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }

    // Get current user profile
    async getMe(req, res) {
        try {
            const user = req.user;
            res.json({
                success: true,
                user: user.toSafeObject()
            });
        } catch (error) {
            logger.error('Get me error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user profile'
            });
        }
    }

    // Update user profile
    async updateProfile(req, res) {
        try {
            const user = req.user;
            const updateData = req.body;

            // Check if email is being changed and if it's already taken
            if (updateData.email && updateData.email !== user.email) {
                const existingUser = await User.findByEmail(updateData.email);
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already taken'
                    });
                }
            }

            // Check if username is being changed and if it's already taken
            if (updateData.username && updateData.username !== user.username) {
                const existingUser = await User.findByUsername(updateData.username);
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already taken'
                    });
                }
            }

            // Update user profile
            const updatedUser = await user.updateProfile(updateData);

            logger.info('User profile updated', { userId: user.id });

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser.toSafeObject()
            });
        } catch (error) {
            logger.error('Update profile error:', error);
            
            if (error.code === '23505') { // PostgreSQL unique constraint violation
                return res.status(400).json({
                    success: false,
                    message: 'Username or email already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }

    // Refresh token
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            const { verifyToken } = require('../utils/jwt');
            const decoded = verifyToken(refreshToken);
            
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate new tokens
            const tokens = generateTokenPair(user);

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                tokens
            });
        } catch (error) {
            logger.error('Refresh token error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    // Logout (client-side token removal)
    async logout(req, res) {
        try {
            // In a more sophisticated implementation, you might want to blacklist the token
            // For now, we'll just return success and let the client handle token removal
            
            logger.info('User logged out', { userId: req.user.id });

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }

    // Get user statistics
    async getUserStats(req, res) {
        try {
            const user = req.user;
            const stats = await user.getStats();

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            logger.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user statistics'
            });
        }
    }

    // Get user game history
    async getUserGameHistory(req, res) {
        try {
            const user = req.user;
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            const gameHistory = await user.getGameHistory(limit, offset);

            res.json({
                success: true,
                games: gameHistory,
                pagination: {
                    limit,
                    offset,
                    count: gameHistory.length
                }
            });
        } catch (error) {
            logger.error('Get user game history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get game history'
            });
        }
    }
}

module.exports = new AuthController();