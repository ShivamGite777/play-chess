const { query } = require('../database/connection');
const logger = require('../utils/logger');

class Move {
    constructor(data) {
        this.id = data.id;
        this.game_id = data.game_id;
        this.move_number = data.move_number;
        this.player_color = data.player_color;
        this.from_square = data.from_square;
        this.to_square = data.to_square;
        this.piece = data.piece;
        this.notation = data.notation;
        this.captured_piece = data.captured_piece;
        this.is_check = data.is_check || false;
        this.is_checkmate = data.is_checkmate || false;
        this.is_castling = data.is_castling || false;
        this.is_en_passant = data.is_en_passant || false;
        this.is_promotion = data.is_promotion || false;
        this.promoted_piece = data.promoted_piece;
        this.time_taken = data.time_taken;
        this.timestamp = data.timestamp;
    }

    // Get moves for a game
    static async getMovesForGame(gameId, limit = 100, offset = 0) {
        const queryText = `
            SELECT * FROM moves 
            WHERE game_id = $1 
            ORDER BY move_number ASC
            LIMIT $2 OFFSET $3
        `;
        try {
            const result = await query(queryText, [gameId, limit, offset]);
            return result.rows.map(row => new Move(row));
        } catch (error) {
            logger.error('Error getting moves for game:', error);
            throw error;
        }
    }

    // Get move by ID
    static async findById(id) {
        const queryText = 'SELECT * FROM moves WHERE id = $1';
        try {
            const result = await query(queryText, [id]);
            return result.rows.length > 0 ? new Move(result.rows[0]) : null;
        } catch (error) {
            logger.error('Error finding move by ID:', error);
            throw error;
        }
    }

    // Get last move for a game
    static async getLastMoveForGame(gameId) {
        const queryText = `
            SELECT * FROM moves 
            WHERE game_id = $1 
            ORDER BY move_number DESC 
            LIMIT 1
        `;
        try {
            const result = await query(queryText, [gameId]);
            return result.rows.length > 0 ? new Move(result.rows[0]) : null;
        } catch (error) {
            logger.error('Error getting last move for game:', error);
            throw error;
        }
    }

    // Get move statistics for a game
    static async getMoveStatsForGame(gameId) {
        const queryText = `
            SELECT 
                COUNT(*) as total_moves,
                COUNT(CASE WHEN is_check = true THEN 1 END) as checks,
                COUNT(CASE WHEN is_checkmate = true THEN 1 END) as checkmates,
                COUNT(CASE WHEN is_castling = true THEN 1 END) as castlings,
                COUNT(CASE WHEN is_en_passant = true THEN 1 END) as en_passants,
                COUNT(CASE WHEN is_promotion = true THEN 1 END) as promotions,
                COUNT(CASE WHEN captured_piece IS NOT NULL THEN 1 END) as captures,
                AVG(time_taken) as avg_time_per_move
            FROM moves 
            WHERE game_id = $1
        `;
        try {
            const result = await query(queryText, [gameId]);
            return result.rows[0];
        } catch (error) {
            logger.error('Error getting move stats for game:', error);
            throw error;
        }
    }

    // Get moves by player color
    static async getMovesByPlayer(gameId, playerColor) {
        const queryText = `
            SELECT * FROM moves 
            WHERE game_id = $1 AND player_color = $2
            ORDER BY move_number ASC
        `;
        try {
            const result = await query(queryText, [gameId, playerColor]);
            return result.rows.map(row => new Move(row));
        } catch (error) {
            logger.error('Error getting moves by player:', error);
            throw error;
        }
    }

    // Convert to object
    toObject() {
        return {
            id: this.id,
            game_id: this.game_id,
            move_number: this.move_number,
            player_color: this.player_color,
            from_square: this.from_square,
            to_square: this.to_square,
            piece: this.piece,
            notation: this.notation,
            captured_piece: this.captured_piece,
            is_check: this.is_check,
            is_checkmate: this.is_checkmate,
            is_castling: this.is_castling,
            is_en_passant: this.is_en_passant,
            is_promotion: this.is_promotion,
            promoted_piece: this.promoted_piece,
            time_taken: this.time_taken,
            timestamp: this.timestamp
        };
    }
}

module.exports = Move;