const Game = require('../models/Game');
const User = require('../models/User');
const Move = require('../models/Move');
const chessService = require('../services/chessService');
const timerService = require('../services/timerService');
const logger = require('../utils/logger');

class GameController {
    // Get lobby games
    async getLobbyGames(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            const games = await Game.getLobbyGames(limit, offset);

            res.json({
                success: true,
                games,
                pagination: {
                    limit,
                    offset,
                    count: games.length
                }
            });
        } catch (error) {
            logger.error('Get lobby games error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get lobby games'
            });
        }
    }

    // Create new game
    async createGame(req, res) {
        try {
            const user = req.user;
            const { game_mode, time_control, increment_seconds = 0, delay_seconds = 0 } = req.body;

            // Validate time control
            const timeValidation = chessService.validateTimeControl(game_mode, time_control, increment_seconds, delay_seconds);
            if (!timeValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: timeValidation.error
                });
            }

            // Check if user already has active games
            const activeGames = await Game.getActiveGamesForUser(user.id);
            const maxGames = parseInt(process.env.MAX_GAMES_PER_USER) || 5;
            
            if (activeGames.length >= maxGames) {
                return res.status(400).json({
                    success: false,
                    message: `You can only have ${maxGames} active games at a time`
                });
            }

            // Create new game
            const game = await Game.create({
                white_player_id: user.id,
                black_player_id: null,
                game_mode,
                time_control: timeValidation.timeControl,
                increment_seconds: timeValidation.incrementSeconds,
                delay_seconds: timeValidation.delaySeconds
            });

            logger.info('Game created successfully', { gameId: game.id, userId: user.id });

            res.status(201).json({
                success: true,
                message: 'Game created successfully',
                game: game.toObject()
            });
        } catch (error) {
            logger.error('Create game error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create game'
            });
        }
    }

    // Join game
    async joinGame(req, res) {
        try {
            const user = req.user;
            const gameId = req.params.id;

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Game not found'
                });
            }

            // Check if user already has active games
            const activeGames = await Game.getActiveGamesForUser(user.id);
            const maxGames = parseInt(process.env.MAX_GAMES_PER_USER) || 5;
            
            if (activeGames.length >= maxGames) {
                return res.status(400).json({
                    success: false,
                    message: `You can only have ${maxGames} active games at a time`
                });
            }

            // Join the game
            const updatedGame = await game.joinGame(user.id);

            // Start timer if both players are present
            if (updatedGame.status === 'active') {
                await timerService.startGameTimer(
                    gameId,
                    updatedGame.time_control / 1000,
                    updatedGame.time_control / 1000,
                    updatedGame.increment_seconds / 1000,
                    updatedGame.delay_seconds / 1000
                );
            }

            logger.info('User joined game', { gameId, userId: user.id });

            res.json({
                success: true,
                message: 'Joined game successfully',
                game: updatedGame.toObject()
            });
        } catch (error) {
            logger.error('Join game error:', error);
            
            if (error.message.includes('not available') || error.message.includes('full') || error.message.includes('already')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to join game'
            });
        }
    }

    // Get game details
    async getGameDetails(req, res) {
        try {
            const gameId = req.params.id;
            const user = req.user;

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Game not found'
                });
            }

            // Check if user has access to this game
            const isPlayer = game.white_player_id === user.id || game.black_player_id === user.id;
            const isSpectator = !isPlayer;

            if (!isPlayer && !isSpectator) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Get game state
            const gameState = game.getGameState();
            const timerState = timerService.getTimerState(gameId);

            // Get player usernames
            const whitePlayer = game.white_player_id ? await User.findById(game.white_player_id) : null;
            const blackPlayer = game.black_player_id ? await User.findById(game.black_player_id) : null;

            res.json({
                success: true,
                game: {
                    ...gameState,
                    white_player: whitePlayer ? whitePlayer.toSafeObject() : null,
                    black_player: blackPlayer ? blackPlayer.toSafeObject() : null
                },
                timer: timerState,
                isPlayer,
                isSpectator
            });
        } catch (error) {
            logger.error('Get game details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get game details'
            });
        }
    }

    // Make a move
    async makeMove(req, res) {
        try {
            const user = req.user;
            const gameId = req.params.id;
            const { from, to, promotion } = req.body;

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Game not found'
                });
            }

            // Check if user is a player
            const isPlayer = game.white_player_id === user.id || game.black_player_id === user.id;
            if (!isPlayer) {
                return res.status(403).json({
                    success: false,
                    message: 'Only players can make moves'
                });
            }

            // Make the move
            const moveResult = await game.makeMove({
                from,
                to,
                promotion,
                playerId: user.id
            });

            if (moveResult.error) {
                return res.status(400).json({
                    success: false,
                    message: moveResult.error
                });
            }

            // Switch timer turn
            await timerService.switchTurn(gameId, moveResult.timeTaken || 0);

            logger.info('Move made successfully', { gameId, userId: user.id, move: moveResult.move });

            res.json({
                success: true,
                message: 'Move made successfully',
                move: moveResult.move,
                gameState: moveResult.gameState,
                timer: timerService.getTimerState(gameId),
                isGameOver: moveResult.isGameOver
            });
        } catch (error) {
            logger.error('Make move error:', error);
            
            if (error.message.includes('Invalid') || error.message.includes('Not your turn')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to make move'
            });
        }
    }

    // Resign from game
    async resign(req, res) {
        try {
            const user = req.user;
            const gameId = req.params.id;

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Game not found'
                });
            }

            // Check if user is a player
            const isPlayer = game.white_player_id === user.id || game.black_player_id === user.id;
            if (!isPlayer) {
                return res.status(403).json({
                    success: false,
                    message: 'Only players can resign'
                });
            }

            // Resign
            await game.resign(user.id);

            // Stop timer
            await timerService.stopGameTimer(gameId);

            logger.info('Player resigned', { gameId, userId: user.id });

            res.json({
                success: true,
                message: 'Resigned successfully',
                game: game.toObject()
            });
        } catch (error) {
            logger.error('Resign error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resign'
            });
        }
    }

    // Offer draw
    async offerDraw(req, res) {
        try {
            const user = req.user;
            const gameId = req.params.id;
            const { action } = req.body; // 'offer', 'accept', 'decline'

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Game not found'
                });
            }

            // Check if user is a player
            const isPlayer = game.white_player_id === user.id || game.black_player_id === user.id;
            if (!isPlayer) {
                return res.status(403).json({
                    success: false,
                    message: 'Only players can offer draws'
                });
            }

            switch (action) {
                case 'offer':
                    await game.offerDraw(user.id);
                    break;
                case 'accept':
                    await game.acceptDraw(user.id);
                    // Stop timer
                    await timerService.stopGameTimer(gameId);
                    break;
                case 'decline':
                    // Just acknowledge the decline
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid draw action'
                    });
            }

            logger.info(`Draw ${action}`, { gameId, userId: user.id });

            res.json({
                success: true,
                message: `Draw ${action} successful`,
                game: game.toObject()
            });
        } catch (error) {
            logger.error('Draw offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process draw offer'
            });
        }
    }

    // Get game history (moves)
    async getGameHistory(req, res) {
        try {
            const gameId = req.params.id;
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;

            // Get game
            const game = await Game.findById(gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    message: 'Game not found'
                });
            }

            // Get moves
            const moves = await Move.getMovesForGame(gameId, limit, offset);
            const moveStats = await Move.getMoveStatsForGame(gameId);

            res.json({
                success: true,
                moves: moves.map(move => move.toObject()),
                stats: moveStats,
                pagination: {
                    limit,
                    offset,
                    count: moves.length
                }
            });
        } catch (error) {
            logger.error('Get game history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get game history'
            });
        }
    }

    // Get user's active games
    async getUserActiveGames(req, res) {
        try {
            const user = req.user;
            const activeGames = await Game.getActiveGamesForUser(user.id);

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
}

module.exports = new GameController();