const User = require('../models/User');
const Game = require('../models/Game');
const logger = require('../utils/logger');

class UserController {
    // Get user profile by ID
    async getUserProfile(req, res) {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user: user.toSafeObject()
            });
        } catch (error) {
            logger.error('Get user profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user profile'
            });
        }
    }

    // Get user statistics
    async getUserStats(req, res) {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

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
            const userId = req.params.id;
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

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

    // Get leaderboard
    async getLeaderboard(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            const leaderboard = await User.getLeaderboard(limit, offset);

            res.json({
                success: true,
                leaderboard,
                pagination: {
                    limit,
                    offset,
                    count: leaderboard.length
                }
            });
        } catch (error) {
            logger.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get leaderboard'
            });
        }
    }

    // Search users
    async searchUsers(req, res) {
        try {
            const { username, limit = 20, offset = 0 } = req.query;

            if (!username || username.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be at least 2 characters long'
                });
            }

            const { query } = require('../database/connection');
            const searchQuery = `
                SELECT id, username, elo_rating, games_played, avatar_url
                FROM users 
                WHERE username ILIKE $1 AND is_active = true
                ORDER BY 
                    CASE 
                        WHEN username ILIKE $2 THEN 1
                        WHEN username ILIKE $3 THEN 2
                        ELSE 3
                    END,
                    elo_rating DESC
                LIMIT $4 OFFSET $5
            `;

            const searchTerm = `%${username}%`;
            const exactMatch = `${username}`;
            const startsWith = `${username}%`;

            const result = await query(searchQuery, [searchTerm, exactMatch, startsWith, limit, offset]);

            res.json({
                success: true,
                users: result.rows,
                pagination: {
                    limit,
                    offset,
                    count: result.rows.length
                }
            });
        } catch (error) {
            logger.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search users'
            });
        }
    }

    // Get user's recent games
    async getUserRecentGames(req, res) {
        try {
            const userId = req.params.id;
            const limit = parseInt(req.query.limit) || 10;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const recentGames = await user.getGameHistory(limit, 0);

            res.json({
                success: true,
                games: recentGames
            });
        } catch (error) {
            logger.error('Get user recent games error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recent games'
            });
        }
    }

    // Get user's active games
    async getUserActiveGames(req, res) {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const activeGames = await Game.getActiveGamesForUser(userId);

            // Get player usernames for each game
            const gamesWithPlayers = await Promise.all(
                activeGames.map(async (game) => {
                    const whitePlayer = game.white_player_id ? await User.findById(game.white_player_id) : null;
                    const blackPlayer = game.black_player_id ? await User.findById(game.black_player_id) : null;
                    
                    return {
                        ...game.toObject(),
                        white_player: whitePlayer ? whitePlayer.toSafeObject() : null,
                        black_player: blackPlayer ? blackPlayer.toSafeObject() : null
                    };
                })
            );

            res.json({
                success: true,
                games: gamesWithPlayers
            });
        } catch (error) {
            logger.error('Get user active games error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get active games'
            });
        }
    }

    // Get user's game statistics by time control
    async getUserGameStatsByTimeControl(req, res) {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const { query } = require('../database/connection');
            const statsQuery = `
                SELECT 
                    game_mode,
                    COUNT(*) as games_played,
                    COUNT(CASE WHEN result = 'white_wins' AND white_player_id = $1 THEN 1 END) +
                    COUNT(CASE WHEN result = 'black_wins' AND black_player_id = $1 THEN 1 END) as wins,
                    COUNT(CASE WHEN result = 'draw' THEN 1 END) as draws,
                    COUNT(CASE WHEN result = 'white_wins' AND black_player_id = $1 THEN 1 END) +
                    COUNT(CASE WHEN result = 'black_wins' AND white_player_id = $1 THEN 1 END) as losses,
                    CASE 
                        WHEN COUNT(*) > 0 THEN ROUND(
                            (COUNT(CASE WHEN result = 'white_wins' AND white_player_id = $1 THEN 1 END) +
                             COUNT(CASE WHEN result = 'black_wins' AND black_player_id = $1 THEN 1 END))::float / COUNT(*) * 100, 2
                        )
                        ELSE 0 
                    END as win_percentage
                FROM games 
                WHERE (white_player_id = $1 OR black_player_id = $1)
                AND status = 'completed'
                GROUP BY game_mode
                ORDER BY game_mode
            `;

            const result = await query(statsQuery, [userId]);

            res.json({
                success: true,
                stats: result.rows
            });
        } catch (error) {
            logger.error('Get user game stats by time control error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get game statistics'
            });
        }
    }
}

module.exports = new UserController();