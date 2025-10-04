const { query, redisSet, redisGet, redisDel } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const Chess = require('chess.js');
const logger = require('../utils/logger');

class Game {
    constructor(data) {
        this.id = data.id;
        this.white_player_id = data.white_player_id;
        this.black_player_id = data.black_player_id;
        this.game_mode = data.game_mode;
        this.time_control = data.time_control;
        this.increment_seconds = data.increment_seconds || 0;
        this.delay_seconds = data.delay_seconds || 0;
        this.fen_position = data.fen_position || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        this.pgn = data.pgn || '';
        this.white_time_remaining = data.white_time_remaining;
        this.black_time_remaining = data.black_time_remaining;
        this.status = data.status || 'waiting';
        this.result = data.result;
        this.winner_id = data.winner_id;
        this.end_reason = data.end_reason;
        this.draw_offer_by = data.draw_offer_by;
        this.draw_offer_at = data.draw_offer_at;
        this.spectator_count = data.spectator_count || 0;
        this.created_at = data.created_at;
        this.completed_at = data.completed_at;
        this.updated_at = data.updated_at;
        
        // Initialize chess instance
        this.chess = new Chess(this.fen_position);
    }

    // Create a new game
    static async create(gameData) {
        const {
            white_player_id,
            black_player_id,
            game_mode,
            time_control,
            increment_seconds = 0,
            delay_seconds = 0
        } = gameData;

        const id = uuidv4();
        const queryText = `
            INSERT INTO games (
                id, white_player_id, black_player_id, game_mode, 
                time_control, increment_seconds, delay_seconds,
                white_time_remaining, black_time_remaining, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        try {
            const result = await query(queryText, [
                id, white_player_id, black_player_id, game_mode,
                time_control, increment_seconds, delay_seconds,
                time_control * 1000, time_control * 1000, 'waiting'
            ]);
            
            const game = new Game(result.rows[0]);
            
            // Cache the game in Redis
            await redisSet(`game:${id}`, game.toObject(), 3600); // 1 hour cache
            
            return game;
        } catch (error) {
            logger.error('Error creating game:', error);
            throw error;
        }
    }

    // Find game by ID
    static async findById(id) {
        // Try Redis cache first
        const cached = await redisGet(`game:${id}`);
        if (cached) {
            return new Game(cached);
        }

        const queryText = 'SELECT * FROM games WHERE id = $1';
        try {
            const result = await query(queryText, [id]);
            if (result.rows.length > 0) {
                const game = new Game(result.rows[0]);
                // Cache the game
                await redisSet(`game:${id}`, game.toObject(), 3600);
                return game;
            }
            return null;
        } catch (error) {
            logger.error('Error finding game by ID:', error);
            throw error;
        }
    }

    // Get active games for a user
    static async getActiveGamesForUser(userId) {
        const queryText = `
            SELECT * FROM games 
            WHERE (white_player_id = $1 OR black_player_id = $1) 
            AND status IN ('waiting', 'active')
            ORDER BY created_at DESC
        `;
        try {
            const result = await query(queryText, [userId]);
            return result.rows.map(row => new Game(row));
        } catch (error) {
            logger.error('Error getting active games for user:', error);
            throw error;
        }
    }

    // Get available games in lobby
    static async getLobbyGames(limit = 20, offset = 0) {
        const queryText = `
            SELECT 
                g.*,
                u1.username as white_username,
                u2.username as black_username
            FROM games g
            LEFT JOIN users u1 ON g.white_player_id = u1.id
            LEFT JOIN users u2 ON g.black_player_id = u2.id
            WHERE g.status = 'waiting'
            ORDER BY g.created_at DESC
            LIMIT $1 OFFSET $2
        `;
        try {
            const result = await query(queryText, [limit, offset]);
            return result.rows.map(row => ({
                ...new Game(row).toObject(),
                white_username: row.white_username,
                black_username: row.black_username
            }));
        } catch (error) {
            logger.error('Error getting lobby games:', error);
            throw error;
        }
    }

    // Join a game
    async joinGame(playerId) {
        if (this.status !== 'waiting') {
            throw new Error('Game is not available to join');
        }

        if (this.white_player_id && this.black_player_id) {
            throw new Error('Game is full');
        }

        if (this.white_player_id === playerId || this.black_player_id === playerId) {
            throw new Error('Player is already in this game');
        }

        const queryText = `
            UPDATE games 
            SET 
                ${!this.white_player_id ? 'white_player_id = $1' : 'black_player_id = $1'},
                status = CASE 
                    WHEN (white_player_id IS NOT NULL AND black_player_id IS NOT NULL) THEN 'active'
                    ELSE 'waiting'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND status = 'waiting'
            RETURNING *
        `;

        try {
            const result = await query(queryText, [playerId, this.id]);
            if (result.rows.length > 0) {
                Object.assign(this, result.rows[0]);
                
                // Update cache
                await redisSet(`game:${this.id}`, this.toObject(), 3600);
                
                return this;
            }
            throw new Error('Failed to join game');
        } catch (error) {
            logger.error('Error joining game:', error);
            throw error;
        }
    }

    // Make a move
    async makeMove(moveData) {
        const { from, to, promotion, playerId } = moveData;

        if (this.status !== 'active') {
            throw new Error('Game is not active');
        }

        // Determine player color
        const playerColor = this.white_player_id === playerId ? 'white' : 'black';
        if (playerColor !== this.chess.turn()) {
            throw new Error('Not your turn');
        }

        // Validate move
        const move = this.chess.move({
            from,
            to,
            promotion: promotion || undefined
        });

        if (!move) {
            throw new Error('Invalid move');
        }

        // Record the move in database
        const moveId = uuidv4();
        const moveQueryText = `
            INSERT INTO moves (
                id, game_id, move_number, player_color, from_square, to_square,
                piece, notation, captured_piece, is_check, is_checkmate,
                is_castling, is_en_passant, is_promotion, promoted_piece
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;

        try {
            await query(moveQueryText, [
                moveId, this.id, this.chess.history().length, playerColor,
                move.from, move.to, move.piece, move.san, move.captured,
                move.san.includes('+'), move.san.includes('#'),
                move.flags.includes('k') || move.flags.includes('q'),
                move.flags.includes('e'), move.flags.includes('p'),
                move.promotion || null
            ]);

            // Update game state
            this.fen_position = this.chess.fen();
            this.pgn = this.chess.pgn();

            // Check for game end conditions
            if (this.chess.isGameOver()) {
                await this.endGame();
            } else {
                // Update game in database
                const updateQueryText = `
                    UPDATE games 
                    SET fen_position = $1, pgn = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `;
                await query(updateQueryText, [this.fen_position, this.pgn, this.id]);
            }

            // Update cache
            await redisSet(`game:${this.id}`, this.toObject(), 3600);

            return {
                move,
                gameState: this.getGameState(),
                isGameOver: this.chess.isGameOver()
            };
        } catch (error) {
            logger.error('Error making move:', error);
            throw error;
        }
    }

    // End the game
    async endGame() {
        let result = null;
        let winner_id = null;
        let end_reason = null;

        if (this.chess.isCheckmate()) {
            result = this.chess.turn() === 'w' ? 'black_wins' : 'white_wins';
            winner_id = this.chess.turn() === 'w' ? this.black_player_id : this.white_player_id;
            end_reason = 'checkmate';
        } else if (this.chess.isDraw()) {
            result = 'draw';
            end_reason = 'stalemate';
        }

        const queryText = `
            UPDATE games 
            SET 
                status = 'completed',
                result = $1,
                winner_id = $2,
                end_reason = $3,
                completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `;

        try {
            await query(queryText, [result, winner_id, end_reason, this.id]);
            
            this.status = 'completed';
            this.result = result;
            this.winner_id = winner_id;
            this.end_reason = end_reason;
            this.completed_at = new Date();

            // Remove from cache
            await redisDel(`game:${this.id}`);

            return this;
        } catch (error) {
            logger.error('Error ending game:', error);
            throw error;
        }
    }

    // Resign from game
    async resign(playerId) {
        if (this.status !== 'active') {
            throw new Error('Game is not active');
        }

        const playerColor = this.white_player_id === playerId ? 'white' : 'black';
        const result = playerColor === 'white' ? 'black_wins' : 'white_wins';
        const winner_id = playerColor === 'white' ? this.black_player_id : this.white_player_id;

        const queryText = `
            UPDATE games 
            SET 
                status = 'completed',
                result = $1,
                winner_id = $2,
                end_reason = 'resignation',
                completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `;

        try {
            await query(queryText, [result, winner_id, this.id]);
            
            this.status = 'completed';
            this.result = result;
            this.winner_id = winner_id;
            this.end_reason = 'resignation';
            this.completed_at = new Date();

            // Remove from cache
            await redisDel(`game:${this.id}`);

            return this;
        } catch (error) {
            logger.error('Error resigning from game:', error);
            throw error;
        }
    }

    // Offer draw
    async offerDraw(playerId) {
        if (this.status !== 'active') {
            throw new Error('Game is not active');
        }

        const queryText = `
            UPDATE games 
            SET 
                draw_offer_by = $1,
                draw_offer_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `;

        try {
            await query(queryText, [playerId, this.id]);
            
            this.draw_offer_by = playerId;
            this.draw_offer_at = new Date();

            // Update cache
            await redisSet(`game:${this.id}`, this.toObject(), 3600);

            return this;
        } catch (error) {
            logger.error('Error offering draw:', error);
            throw error;
        }
    }

    // Accept draw
    async acceptDraw(playerId) {
        if (this.status !== 'active') {
            throw new Error('Game is not active');
        }

        if (!this.draw_offer_by || this.draw_offer_by === playerId) {
            throw new Error('No draw offer to accept');
        }

        const queryText = `
            UPDATE games 
            SET 
                status = 'completed',
                result = 'draw',
                end_reason = 'draw_agreement',
                completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `;

        try {
            await query(queryText, [this.id]);
            
            this.status = 'completed';
            this.result = 'draw';
            this.end_reason = 'draw_agreement';
            this.completed_at = new Date();

            // Remove from cache
            await redisDel(`game:${this.id}`);

            return this;
        } catch (error) {
            logger.error('Error accepting draw:', error);
            throw error;
        }
    }

    // Get game state for client
    getGameState() {
        return {
            id: this.id,
            fen: this.fen_position,
            pgn: this.pgn,
            turn: this.chess.turn(),
            isCheck: this.chess.isCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isDraw: this.chess.isDraw(),
            isGameOver: this.chess.isGameOver(),
            moves: this.chess.history(),
            status: this.status,
            white_time_remaining: this.white_time_remaining,
            black_time_remaining: this.black_time_remaining,
            draw_offer_by: this.draw_offer_by,
            draw_offer_at: this.draw_offer_at
        };
    }

    // Convert to object
    toObject() {
        return {
            id: this.id,
            white_player_id: this.white_player_id,
            black_player_id: this.black_player_id,
            game_mode: this.game_mode,
            time_control: this.time_control,
            increment_seconds: this.increment_seconds,
            delay_seconds: this.delay_seconds,
            fen_position: this.fen_position,
            pgn: this.pgn,
            white_time_remaining: this.white_time_remaining,
            black_time_remaining: this.black_time_remaining,
            status: this.status,
            result: this.result,
            winner_id: this.winner_id,
            end_reason: this.end_reason,
            draw_offer_by: this.draw_offer_by,
            draw_offer_at: this.draw_offer_at,
            spectator_count: this.spectator_count,
            created_at: this.created_at,
            completed_at: this.completed_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Game;