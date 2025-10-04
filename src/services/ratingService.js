const { query } = require('../database/connection');
const logger = require('../utils/logger');

class RatingService {
    constructor() {
        this.initialRating = 1200;
        this.kFactor = 32; // K-factor for ELO calculation
    }

    // Calculate ELO rating change
    calculateEloChange(playerRating, opponentRating, result) {
        // result: 1 for win, 0.5 for draw, 0 for loss
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        const actualScore = result;
        const ratingChange = Math.round(this.kFactor * (actualScore - expectedScore));
        
        return {
            ratingChange,
            newRating: playerRating + ratingChange,
            expectedScore,
            actualScore
        };
    }

    // Update ratings after game completion
    async updateRatings(gameId) {
        try {
            const gameQuery = `
                SELECT 
                    white_player_id, black_player_id, result,
                    u1.elo_rating as white_rating,
                    u2.elo_rating as black_rating
                FROM games g
                JOIN users u1 ON g.white_player_id = u1.id
                JOIN users u2 ON g.black_player_id = u2.id
                WHERE g.id = $1 AND g.status = 'completed'
            `;

            const gameResult = await query(gameQuery, [gameId]);
            if (gameResult.rows.length === 0) {
                throw new Error('Game not found or not completed');
            }

            const game = gameResult.rows[0];
            const whiteRating = game.white_rating;
            const blackRating = game.black_rating;

            let whiteResult, blackResult;
            switch (game.result) {
                case 'white_wins':
                    whiteResult = 1;
                    blackResult = 0;
                    break;
                case 'black_wins':
                    whiteResult = 0;
                    blackResult = 1;
                    break;
                case 'draw':
                    whiteResult = 0.5;
                    blackResult = 0.5;
                    break;
                default:
                    throw new Error('Invalid game result');
            }

            // Calculate rating changes
            const whiteChange = this.calculateEloChange(whiteRating, blackRating, whiteResult);
            const blackChange = this.calculateEloChange(blackRating, whiteRating, blackResult);

            // Update ratings in database
            await query(`
                UPDATE users 
                SET elo_rating = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [whiteChange.newRating, game.white_player_id]);

            await query(`
                UPDATE users 
                SET elo_rating = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [blackChange.newRating, game.black_player_id]);

            // Log rating changes
            logger.info('Rating update completed', {
                gameId,
                whitePlayer: {
                    id: game.white_player_id,
                    oldRating: whiteRating,
                    newRating: whiteChange.newRating,
                    change: whiteChange.ratingChange
                },
                blackPlayer: {
                    id: game.black_player_id,
                    oldRating: blackRating,
                    newRating: blackChange.newRating,
                    change: blackChange.ratingChange
                }
            });

            return {
                whiteChange,
                blackChange
            };
        } catch (error) {
            logger.error('Error updating ratings:', error);
            throw error;
        }
    }

    // Get rating history for a user
    async getRatingHistory(userId, limit = 50) {
        try {
            const historyQuery = `
                SELECT 
                    g.id as game_id,
                    g.result,
                    g.completed_at,
                    CASE 
                        WHEN g.white_player_id = $1 THEN 'white'
                        ELSE 'black'
                    END as player_color,
                    CASE 
                        WHEN g.white_player_id = $1 THEN u2.username
                        ELSE u1.username
                    END as opponent_username,
                    CASE 
                        WHEN g.white_player_id = $1 THEN u2.elo_rating
                        ELSE u1.elo_rating
                    END as opponent_rating
                FROM games g
                LEFT JOIN users u1 ON g.white_player_id = u1.id
                LEFT JOIN users u2 ON g.black_player_id = u2.id
                WHERE (g.white_player_id = $1 OR g.black_player_id = $1)
                AND g.status = 'completed'
                ORDER BY g.completed_at DESC
                LIMIT $2
            `;

            const result = await query(historyQuery, [userId, limit]);
            return result.rows;
        } catch (error) {
            logger.error('Error getting rating history:', error);
            throw error;
        }
    }

    // Calculate provisional rating (for new players)
    calculateProvisionalRating(gamesPlayed, wins, losses, draws) {
        if (gamesPlayed === 0) {
            return this.initialRating;
        }

        const winRate = wins / gamesPlayed;
        const drawRate = draws / gamesPlayed;
        
        // Adjust initial rating based on performance
        let adjustment = 0;
        if (winRate > 0.6) {
            adjustment = 200; // Strong start
        } else if (winRate > 0.4) {
            adjustment = 100; // Decent start
        } else if (winRate < 0.3) {
            adjustment = -100; // Weak start
        }

        return Math.max(800, Math.min(1600, this.initialRating + adjustment));
    }

    // Get rating distribution
    async getRatingDistribution() {
        try {
            const distributionQuery = `
                SELECT 
                    CASE 
                        WHEN elo_rating < 1000 THEN '< 1000'
                        WHEN elo_rating < 1200 THEN '1000-1199'
                        WHEN elo_rating < 1400 THEN '1200-1399'
                        WHEN elo_rating < 1600 THEN '1400-1599'
                        WHEN elo_rating < 1800 THEN '1600-1799'
                        WHEN elo_rating < 2000 THEN '1800-1999'
                        WHEN elo_rating < 2200 THEN '2000-2199'
                        WHEN elo_rating < 2400 THEN '2200-2399'
                        ELSE '2400+'
                    END as rating_range,
                    COUNT(*) as player_count
                FROM users 
                WHERE is_active = true AND games_played > 0
                GROUP BY 
                    CASE 
                        WHEN elo_rating < 1000 THEN '< 1000'
                        WHEN elo_rating < 1200 THEN '1000-1199'
                        WHEN elo_rating < 1400 THEN '1200-1399'
                        WHEN elo_rating < 1600 THEN '1400-1599'
                        WHEN elo_rating < 1800 THEN '1600-1799'
                        WHEN elo_rating < 2000 THEN '1800-1999'
                        WHEN elo_rating < 2200 THEN '2000-2199'
                        WHEN elo_rating < 2400 THEN '2200-2399'
                        ELSE '2400+'
                    END
                ORDER BY MIN(elo_rating)
            `;

            const result = await query(distributionQuery);
            return result.rows;
        } catch (error) {
            logger.error('Error getting rating distribution:', error);
            throw error;
        }
    }

    // Get top players
    async getTopPlayers(limit = 100) {
        try {
            const topPlayersQuery = `
                SELECT 
                    id, username, elo_rating, games_played, games_won, games_lost, games_drawn,
                    CASE 
                        WHEN games_played > 0 THEN ROUND((games_won::float / games_played) * 100, 2)
                        ELSE 0 
                    END as win_percentage
                FROM users 
                WHERE is_active = true AND games_played >= 10
                ORDER BY elo_rating DESC, games_won DESC
                LIMIT $1
            `;

            const result = await query(topPlayersQuery, [limit]);
            return result.rows;
        } catch (error) {
            logger.error('Error getting top players:', error);
            throw error;
        }
    }

    // Calculate performance rating (for tournaments)
    calculatePerformanceRating(opponentRatings, results) {
        if (opponentRatings.length === 0) return this.initialRating;

        const totalOpponentRating = opponentRatings.reduce((sum, rating) => sum + rating, 0);
        const averageOpponentRating = totalOpponentRating / opponentRatings.length;
        const score = results.reduce((sum, result) => sum + result, 0);
        const expectedScore = opponentRatings.length / 2; // Assuming equal opponents
        const scoreDifference = score - expectedScore;

        return Math.round(averageOpponentRating + (scoreDifference * 400));
    }

    // Get rating change statistics
    async getRatingChangeStats(userId, days = 30) {
        try {
            const statsQuery = `
                SELECT 
                    COUNT(*) as games_played,
                    COUNT(CASE WHEN result = 'white_wins' AND white_player_id = $1 THEN 1 END) +
                    COUNT(CASE WHEN result = 'black_wins' AND black_player_id = $1 THEN 1 END) as wins,
                    COUNT(CASE WHEN result = 'draw' THEN 1 END) as draws,
                    COUNT(CASE WHEN result = 'white_wins' AND black_player_id = $1 THEN 1 END) +
                    COUNT(CASE WHEN result = 'black_wins' AND white_player_id = $1 THEN 1 END) as losses
                FROM games 
                WHERE (white_player_id = $1 OR black_player_id = $1)
                AND status = 'completed'
                AND completed_at >= NOW() - INTERVAL '${days} days'
            `;

            const result = await query(statsQuery, [userId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error getting rating change stats:', error);
            throw error;
        }
    }

    // Adjust K-factor based on player experience
    getKFactor(gamesPlayed, rating) {
        if (gamesPlayed < 30) {
            return 40; // Higher K-factor for new players
        } else if (rating >= 2400) {
            return 16; // Lower K-factor for masters
        } else if (rating >= 2000) {
            return 24; // Medium K-factor for experts
        } else {
            return 32; // Standard K-factor
        }
    }
}

module.exports = new RatingService();