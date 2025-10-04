const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const timerService = require('../services/timerService');
const logger = require('../utils/logger');

class SocketHandler {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });

        this.connectedUsers = new Map(); // userId -> socketId
        this.gameRooms = new Map(); // gameId -> Set of socketIds
        this.userSockets = new Map(); // socketId -> userId

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    // Setup authentication middleware
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);
                
                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.userId = user.id;
                socket.user = user;
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
    }

    // Setup event handlers
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    // Handle new connection
    handleConnection(socket) {
        const userId = socket.userId;
        const user = socket.user;

        logger.info(`User ${user.username} connected`, { socketId: socket.id, userId });

        // Store connection
        this.connectedUsers.set(userId, socket.id);
        this.userSockets.set(socket.id, userId);

        // Join user to their personal room
        socket.join(`user:${userId}`);

        // Send connection confirmation
        socket.emit('connected', {
            success: true,
            message: 'Connected successfully',
            user: user.toSafeObject()
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });

        // Handle joining game room
        socket.on('join_game', (data) => {
            this.handleJoinGame(socket, data);
        });

        // Handle leaving game room
        socket.on('leave_game', (data) => {
            this.handleLeaveGame(socket, data);
        });

        // Handle making a move
        socket.on('make_move', (data) => {
            this.handleMakeMove(socket, data);
        });

        // Handle chat messages
        socket.on('chat_message', (data) => {
            this.handleChatMessage(socket, data);
        });

        // Handle draw offers
        socket.on('draw_offer', (data) => {
            this.handleDrawOffer(socket, data);
        });

        // Handle resignation
        socket.on('resign', (data) => {
            this.handleResign(socket, data);
        });

        // Handle timer sync
        socket.on('timer_sync', (data) => {
            this.handleTimerSync(socket, data);
        });

        // Handle spectating
        socket.on('spectate_game', (data) => {
            this.handleSpectateGame(socket, data);
        });

        // Handle ping/pong for connection health
        socket.on('ping', () => {
            socket.emit('pong');
        });
    }

    // Handle disconnection
    async handleDisconnection(socket) {
        const userId = this.userSockets.get(socket.id);
        
        if (userId) {
            logger.info(`User ${userId} disconnected`, { socketId: socket.id });
            
            // Remove from connected users
            this.connectedUsers.delete(userId);
            this.userSockets.delete(socket.id);

            // Leave all game rooms
            for (const [gameId, socketIds] of this.gameRooms) {
                if (socketIds.has(socket.id)) {
                    socketIds.delete(socket.id);
                    
                    // Notify other players in the game
                    socket.to(`game:${gameId}`).emit('player_disconnected', {
                        userId,
                        message: 'Player disconnected'
                    });

                    // If no one left in room, clean up
                    if (socketIds.size === 0) {
                        this.gameRooms.delete(gameId);
                    }
                }
            }
        }
    }

    // Handle joining game room
    async handleJoinGame(socket, data) {
        try {
            const { gameId } = data;
            const userId = socket.userId;

            if (!gameId) {
                return socket.emit('error', { message: 'Game ID required' });
            }

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return socket.emit('error', { message: 'Game not found' });
            }

            // Check if user is a player or spectator
            const isPlayer = game.white_player_id === userId || game.black_player_id === userId;
            const isSpectator = !isPlayer;

            if (isSpectator) {
                // Add to spectators table
                const { query } = require('../database/connection');
                await query(`
                    INSERT INTO game_spectators (game_id, user_id) 
                    VALUES ($1, $2) 
                    ON CONFLICT (game_id, user_id) DO NOTHING
                `, [gameId, userId]);
            }

            // Join socket room
            socket.join(`game:${gameId}`);
            
            // Add to game rooms tracking
            if (!this.gameRooms.has(gameId)) {
                this.gameRooms.set(gameId, new Set());
            }
            this.gameRooms.get(gameId).add(socket.id);

            // Get current game state
            const gameState = game.getGameState();
            const timerState = timerService.getTimerState(gameId);

            // Send game state to user
            socket.emit('game_joined', {
                success: true,
                game: gameState,
                timer: timerState,
                isPlayer,
                isSpectator
            });

            // Notify other players
            socket.to(`game:${gameId}`).emit('player_joined', {
                userId,
                username: socket.user.username,
                isPlayer,
                isSpectator
            });

            logger.info(`User ${userId} joined game ${gameId}`, { isPlayer, isSpectator });

        } catch (error) {
            logger.error('Error joining game:', error);
            socket.emit('error', { message: 'Failed to join game' });
        }
    }

    // Handle leaving game room
    async handleLeaveGame(socket, data) {
        try {
            const { gameId } = data;
            const userId = socket.userId;

            if (!gameId) {
                return socket.emit('error', { message: 'Game ID required' });
            }

            // Leave socket room
            socket.leave(`game:${gameId}`);

            // Remove from game rooms tracking
            if (this.gameRooms.has(gameId)) {
                this.gameRooms.get(gameId).delete(socket.id);
                
                // If no one left in room, clean up
                if (this.gameRooms.get(gameId).size === 0) {
                    this.gameRooms.delete(gameId);
                }
            }

            // Remove from spectators if applicable
            const { query } = require('../database/connection');
            await query(`
                DELETE FROM game_spectators 
                WHERE game_id = $1 AND user_id = $2
            `, [gameId, userId]);

            // Notify other players
            socket.to(`game:${gameId}`).emit('player_left', {
                userId,
                username: socket.user.username
            });

            socket.emit('game_left', { success: true });

            logger.info(`User ${userId} left game ${gameId}`);

        } catch (error) {
            logger.error('Error leaving game:', error);
            socket.emit('error', { message: 'Failed to leave game' });
        }
    }

    // Handle making a move
    async handleMakeMove(socket, data) {
        try {
            const { gameId, from, to, promotion } = data;
            const userId = socket.userId;

            if (!gameId || !from || !to) {
                return socket.emit('error', { message: 'Invalid move data' });
            }

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return socket.emit('error', { message: 'Game not found' });
            }

            // Check if user is a player
            const isPlayer = game.white_player_id === userId || game.black_player_id === userId;
            if (!isPlayer) {
                return socket.emit('error', { message: 'Only players can make moves' });
            }

            // Make the move
            const moveResult = await game.makeMove({
                from,
                to,
                promotion,
                playerId: userId
            });

            if (moveResult.error) {
                return socket.emit('error', { message: moveResult.error });
            }

            // Switch timer turn
            await timerService.switchTurn(gameId, moveResult.timeTaken || 0);

            // Broadcast move to all players in the game
            this.io.to(`game:${gameId}`).emit('move_made', {
                move: moveResult.move,
                gameState: moveResult.gameState,
                timer: timerService.getTimerState(gameId),
                isGameOver: moveResult.isGameOver
            });

            // If game is over, handle game completion
            if (moveResult.isGameOver) {
                await this.handleGameCompletion(gameId);
            }

            logger.info(`Move made in game ${gameId}`, { userId, move: moveResult.move });

        } catch (error) {
            logger.error('Error making move:', error);
            socket.emit('error', { message: 'Failed to make move' });
        }
    }

    // Handle chat messages
    async handleChatMessage(socket, data) {
        try {
            const { gameId, message, messageType = 'chat' } = data;
            const userId = socket.userId;

            if (!gameId || !message) {
                return socket.emit('error', { message: 'Invalid chat data' });
            }

            // Validate message length
            if (message.length > 500) {
                return socket.emit('error', { message: 'Message too long' });
            }

            // Store chat message
            const { query } = require('../database/connection');
            const messageId = require('uuid').v4();
            
            await query(`
                INSERT INTO chat_messages (id, game_id, user_id, message, message_type)
                VALUES ($1, $2, $3, $4, $5)
            `, [messageId, gameId, userId, message, messageType]);

            // Broadcast message to all players in the game
            this.io.to(`game:${gameId}`).emit('chat_message', {
                id: messageId,
                userId,
                username: socket.user.username,
                message,
                messageType,
                timestamp: new Date()
            });

            logger.info(`Chat message sent in game ${gameId}`, { userId, messageType });

        } catch (error) {
            logger.error('Error handling chat message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    }

    // Handle draw offers
    async handleDrawOffer(socket, data) {
        try {
            const { gameId, action } = data; // action: 'offer', 'accept', 'decline'
            const userId = socket.userId;

            if (!gameId || !action) {
                return socket.emit('error', { message: 'Invalid draw offer data' });
            }

            const game = await Game.findById(gameId);
            if (!game) {
                return socket.emit('error', { message: 'Game not found' });
            }

            switch (action) {
                case 'offer':
                    await game.offerDraw(userId);
                    this.io.to(`game:${gameId}`).emit('draw_offered', {
                        offeredBy: userId,
                        offeredByUsername: socket.user.username
                    });
                    break;

                case 'accept':
                    await game.acceptDraw(userId);
                    this.io.to(`game:${gameId}`).emit('draw_accepted', {
                        acceptedBy: userId,
                        acceptedByUsername: socket.user.username
                    });
                    await this.handleGameCompletion(gameId);
                    break;

                case 'decline':
                    this.io.to(`game:${gameId}`).emit('draw_declined', {
                        declinedBy: userId,
                        declinedByUsername: socket.user.username
                    });
                    break;

                default:
                    return socket.emit('error', { message: 'Invalid draw action' });
            }

            logger.info(`Draw ${action} in game ${gameId}`, { userId });

        } catch (error) {
            logger.error('Error handling draw offer:', error);
            socket.emit('error', { message: 'Failed to process draw offer' });
        }
    }

    // Handle resignation
    async handleResign(socket, data) {
        try {
            const { gameId } = data;
            const userId = socket.userId;

            if (!gameId) {
                return socket.emit('error', { message: 'Game ID required' });
            }

            const game = await Game.findById(gameId);
            if (!game) {
                return socket.emit('error', { message: 'Game not found' });
            }

            await game.resign(userId);

            // Broadcast resignation
            this.io.to(`game:${gameId}`).emit('player_resigned', {
                resignedBy: userId,
                resignedByUsername: socket.user.username,
                winner: game.white_player_id === userId ? 'black' : 'white'
            });

            await this.handleGameCompletion(gameId);

            logger.info(`Player resigned in game ${gameId}`, { userId });

        } catch (error) {
            logger.error('Error handling resignation:', error);
            socket.emit('error', { message: 'Failed to resign' });
        }
    }

    // Handle timer sync
    handleTimerSync(socket, data) {
        try {
            const { gameId } = data;
            
            if (!gameId) {
                return socket.emit('error', { message: 'Game ID required' });
            }

            const timerState = timerService.getTimerState(gameId);
            socket.emit('timer_sync', timerState);

        } catch (error) {
            logger.error('Error syncing timer:', error);
            socket.emit('error', { message: 'Failed to sync timer' });
        }
    }

    // Handle spectating game
    async handleSpectateGame(socket, data) {
        try {
            const { gameId } = data;
            const userId = socket.userId;

            if (!gameId) {
                return socket.emit('error', { message: 'Game ID required' });
            }

            const game = await Game.findById(gameId);
            if (!game) {
                return socket.emit('error', { message: 'Game not found' });
            }

            // Add to spectators
            const { query } = require('../database/connection');
            await query(`
                INSERT INTO game_spectators (game_id, user_id) 
                VALUES ($1, $2) 
                ON CONFLICT (game_id, user_id) DO NOTHING
            `, [gameId, userId]);

            // Join game room
            socket.join(`game:${gameId}`);
            
            if (!this.gameRooms.has(gameId)) {
                this.gameRooms.set(gameId, new Set());
            }
            this.gameRooms.get(gameId).add(socket.id);

            // Send game state
            const gameState = game.getGameState();
            const timerState = timerService.getTimerState(gameId);

            socket.emit('game_spectating', {
                success: true,
                game: gameState,
                timer: timerState
            });

            logger.info(`User ${userId} started spectating game ${gameId}`);

        } catch (error) {
            logger.error('Error spectating game:', error);
            socket.emit('error', { message: 'Failed to spectate game' });
        }
    }

    // Handle game completion
    async handleGameCompletion(gameId) {
        try {
            // Stop timer
            await timerService.stopGameTimer(gameId);

            // Update ratings
            const ratingService = require('../services/ratingService');
            await ratingService.updateRatings(gameId);

            // Broadcast game completion
            this.io.to(`game:${gameId}`).emit('game_completed', {
                gameId,
                message: 'Game completed'
            });

            logger.info(`Game ${gameId} completed`);

        } catch (error) {
            logger.error('Error handling game completion:', error);
        }
    }

    // Send message to user
    sendToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }

    // Send message to game room
    sendToGame(gameId, event, data) {
        this.io.to(`game:${gameId}`).emit(event, data);
    }

    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    // Get active games count
    getActiveGamesCount() {
        return this.gameRooms.size;
    }
}

module.exports = SocketHandler;