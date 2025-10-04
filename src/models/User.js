const { query } = require('../database/connection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.avatar_url = data.avatar_url;
        this.elo_rating = data.elo_rating || 1200;
        this.games_played = data.games_played || 0;
        this.games_won = data.games_won || 0;
        this.games_lost = data.games_lost || 0;
        this.games_drawn = data.games_drawn || 0;
        this.is_active = data.is_active !== false;
        this.last_login = data.last_login;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Create a new user
    static async create(userData) {
        const { username, email, password } = userData;
        
        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const password_hash = await bcrypt.hash(password, saltRounds);
        
        const id = uuidv4();
        const queryText = `
            INSERT INTO users (id, username, email, password_hash, elo_rating)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        try {
            const result = await query(queryText, [id, username, email, password_hash, 1200]);
            return new User(result.rows[0]);
        } catch (error) {
            logger.error('Error creating user:', error);
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        const queryText = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
        try {
            const result = await query(queryText, [id]);
            return result.rows.length > 0 ? new User(result.rows[0]) : null;
        } catch (error) {
            logger.error('Error finding user by ID:', error);
            throw error;
        }
    }

    // Find user by username
    static async findByUsername(username) {
        const queryText = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
        try {
            const result = await query(queryText, [username]);
            return result.rows.length > 0 ? new User(result.rows[0]) : null;
        } catch (error) {
            logger.error('Error finding user by username:', error);
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        const queryText = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
        try {
            const result = await query(queryText, [email]);
            return result.rows.length > 0 ? new User(result.rows[0]) : null;
        } catch (error) {
            logger.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Verify password
    async verifyPassword(password) {
        try {
            return await bcrypt.compare(password, this.password_hash);
        } catch (error) {
            logger.error('Error verifying password:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(updateData) {
        const allowedFields = ['username', 'email', 'avatar_url'];
        const updates = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(this.id);
        const queryText = `
            UPDATE users 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        try {
            const result = await query(queryText, values);
            if (result.rows.length > 0) {
                Object.assign(this, result.rows[0]);
                return this;
            }
            throw new Error('User not found');
        } catch (error) {
            logger.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Update last login
    async updateLastLogin() {
        const queryText = `
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE id = $1
        `;
        try {
            await query(queryText, [this.id]);
            this.last_login = new Date();
        } catch (error) {
            logger.error('Error updating last login:', error);
            throw error;
        }
    }

    // Get user statistics
    async getStats() {
        const queryText = `
            SELECT 
                elo_rating,
                games_played,
                games_won,
                games_lost,
                games_drawn,
                CASE 
                    WHEN games_played > 0 THEN ROUND((games_won::float / games_played) * 100, 2)
                    ELSE 0 
                END as win_percentage,
                created_at
            FROM users 
            WHERE id = $1
        `;
        try {
            const result = await query(queryText, [this.id]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error getting user stats:', error);
            throw error;
        }
    }

    // Get user's game history
    async getGameHistory(limit = 20, offset = 0) {
        const queryText = `
            SELECT 
                g.id,
                g.game_mode,
                g.time_control,
                g.status,
                g.result,
                g.created_at,
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
                    WHEN g.result = 'white_wins' AND g.white_player_id = $1 THEN 'win'
                    WHEN g.result = 'black_wins' AND g.black_player_id = $1 THEN 'win'
                    WHEN g.result = 'draw' THEN 'draw'
                    ELSE 'loss'
                END as game_result
            FROM games g
            LEFT JOIN users u1 ON g.white_player_id = u1.id
            LEFT JOIN users u2 ON g.black_player_id = u2.id
            WHERE (g.white_player_id = $1 OR g.black_player_id = $1)
            ORDER BY g.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        try {
            const result = await query(queryText, [this.id, limit, offset]);
            return result.rows;
        } catch (error) {
            logger.error('Error getting user game history:', error);
            throw error;
        }
    }

    // Get leaderboard
    static async getLeaderboard(limit = 50, offset = 0) {
        const queryText = `
            SELECT 
                id,
                username,
                elo_rating,
                games_played,
                games_won,
                games_lost,
                games_drawn,
                CASE 
                    WHEN games_played > 0 THEN ROUND((games_won::float / games_played) * 100, 2)
                    ELSE 0 
                END as win_percentage
            FROM users 
            WHERE is_active = true AND games_played > 0
            ORDER BY elo_rating DESC, games_won DESC
            LIMIT $1 OFFSET $2
        `;
        try {
            const result = await query(queryText, [limit, offset]);
            return result.rows;
        } catch (error) {
            logger.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    // Update ELO rating
    async updateEloRating(newRating) {
        const queryText = `
            UPDATE users 
            SET elo_rating = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;
        try {
            await query(queryText, [newRating, this.id]);
            this.elo_rating = newRating;
        } catch (error) {
            logger.error('Error updating ELO rating:', error);
            throw error;
        }
    }

    // Convert to safe object (without sensitive data)
    toSafeObject() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            avatar_url: this.avatar_url,
            elo_rating: this.elo_rating,
            games_played: this.games_played,
            games_won: this.games_won,
            games_lost: this.games_lost,
            games_drawn: this.games_drawn,
            last_login: this.last_login,
            created_at: this.created_at
        };
    }
}

module.exports = User;