const Chess = require('chess.js');
const logger = require('../utils/logger');

class ChessService {
    constructor() {
        this.gameModes = {
            bullet: { minTime: 60, maxTime: 180 },
            blitz: { minTime: 180, maxTime: 600 },
            rapid: { minTime: 600, maxTime: 1800 },
            classical: { minTime: 1800, maxTime: 7200 }
        };
    }

    // Create a new chess game instance
    createGame(fen = null) {
        try {
            return new Chess(fen);
        } catch (error) {
            logger.error('Error creating chess game:', error);
            throw new Error('Invalid chess position');
        }
    }

    // Validate a move
    validateMove(chess, moveData) {
        try {
            const { from, to, promotion } = moveData;
            
            // Check if the move is legal
            const move = chess.move({
                from,
                to,
                promotion: promotion || undefined
            });

            if (!move) {
                return {
                    isValid: false,
                    error: 'Invalid move'
                };
            }

            return {
                isValid: true,
                move,
                isCheck: chess.isCheck(),
                isCheckmate: chess.isCheckmate(),
                isDraw: chess.isDraw(),
                isGameOver: chess.isGameOver(),
                fen: chess.fen(),
                pgn: chess.pgn()
            };
        } catch (error) {
            logger.error('Error validating move:', error);
            return {
                isValid: false,
                error: 'Move validation failed'
            };
        }
    }

    // Get all legal moves for current position
    getLegalMoves(chess) {
        try {
            return chess.moves({ verbose: true });
        } catch (error) {
            logger.error('Error getting legal moves:', error);
            return [];
        }
    }

    // Get game status
    getGameStatus(chess) {
        try {
            return {
                isCheck: chess.isCheck(),
                isCheckmate: chess.isCheckmate(),
                isDraw: chess.isDraw(),
                isGameOver: chess.isGameOver(),
                turn: chess.turn(),
                fen: chess.fen(),
                pgn: chess.pgn(),
                history: chess.history({ verbose: true })
            };
        } catch (error) {
            logger.error('Error getting game status:', error);
            throw new Error('Failed to get game status');
        }
    }

    // Analyze position (basic)
    analyzePosition(chess) {
        try {
            const moves = chess.moves({ verbose: true });
            const legalMoves = moves.length;
            const isCheck = chess.isCheck();
            const isCheckmate = chess.isCheckmate();
            const isDraw = chess.isDraw();
            const isGameOver = chess.isGameOver();

            return {
                legalMoves,
                isCheck,
                isCheckmate,
                isDraw,
                isGameOver,
                turn: chess.turn(),
                materialCount: this.countMaterial(chess),
                positionEvaluation: this.evaluatePosition(chess)
            };
        } catch (error) {
            logger.error('Error analyzing position:', error);
            throw new Error('Position analysis failed');
        }
    }

    // Count material on board
    countMaterial(chess) {
        try {
            const board = chess.board();
            const material = {
                white: { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0, king: 0 },
                black: { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0, king: 0 }
            };

            for (let row of board) {
                for (let piece of row) {
                    if (piece) {
                        const color = piece.color;
                        const type = piece.type;
                        material[color][type + 's']++;
                    }
                }
            }

            return material;
        } catch (error) {
            logger.error('Error counting material:', error);
            return null;
        }
    }

    // Basic position evaluation
    evaluatePosition(chess) {
        try {
            const material = this.countMaterial(chess);
            if (!material) return 0;

            const pieceValues = {
                pawn: 1,
                knight: 3,
                bishop: 3,
                rook: 5,
                queen: 9,
                king: 0
            };

            let evaluation = 0;
            for (const [piece, count] of Object.entries(material.white)) {
                evaluation += count * pieceValues[piece];
            }
            for (const [piece, count] of Object.entries(material.black)) {
                evaluation -= count * pieceValues[piece];
            }

            return evaluation;
        } catch (error) {
            logger.error('Error evaluating position:', error);
            return 0;
        }
    }

    // Check if position is draw by repetition
    isDrawByRepetition(chess) {
        try {
            const history = chess.history();
            if (history.length < 6) return false;

            // Check last 6 moves for repetition
            const recentMoves = history.slice(-6);
            const firstThree = recentMoves.slice(0, 3);
            const lastThree = recentMoves.slice(3, 6);

            return JSON.stringify(firstThree) === JSON.stringify(lastThree);
        } catch (error) {
            logger.error('Error checking repetition:', error);
            return false;
        }
    }

    // Check if position is draw by insufficient material
    isDrawByInsufficientMaterial(chess) {
        try {
            const material = this.countMaterial(chess);
            if (!material) return false;

            const whitePieces = Object.values(material.white).reduce((sum, count) => sum + count, 0);
            const blackPieces = Object.values(material.black).reduce((sum, count) => sum + count, 0);

            // King vs King
            if (whitePieces === 1 && blackPieces === 1) return true;

            // King and Bishop vs King
            if (whitePieces === 2 && blackPieces === 1 && material.white.bishops === 1) return true;
            if (whitePieces === 1 && blackPieces === 2 && material.black.bishops === 1) return true;

            // King and Knight vs King
            if (whitePieces === 2 && blackPieces === 1 && material.white.knights === 1) return true;
            if (whitePieces === 1 && blackPieces === 2 && material.black.knights === 1) return true;

            return false;
        } catch (error) {
            logger.error('Error checking insufficient material:', error);
            return false;
        }
    }

    // Get time control validation
    validateTimeControl(gameMode, timeControl, incrementSeconds = 0, delaySeconds = 0) {
        const modeConfig = this.gameModes[gameMode];
        if (!modeConfig) {
            return {
                isValid: false,
                error: 'Invalid game mode'
            };
        }

        if (timeControl < modeConfig.minTime || timeControl > modeConfig.maxTime) {
            return {
                isValid: false,
                error: `Time control for ${gameMode} must be between ${modeConfig.minTime} and ${modeConfig.maxTime} seconds`
            };
        }

        if (incrementSeconds < 0 || incrementSeconds > 60) {
            return {
                isValid: false,
                error: 'Increment must be between 0 and 60 seconds'
            };
        }

        if (delaySeconds < 0 || delaySeconds > 30) {
            return {
                isValid: false,
                error: 'Delay must be between 0 and 30 seconds'
            };
        }

        return {
            isValid: true,
            timeControl: timeControl * 1000, // Convert to milliseconds
            incrementSeconds: incrementSeconds * 1000,
            delaySeconds: delaySeconds * 1000
        };
    }

    // Calculate time remaining after move
    calculateTimeAfterMove(currentTime, timeTaken, incrementSeconds, delaySeconds) {
        let newTime = currentTime - timeTaken;
        
        // Apply delay (Bronstein/Simple delay)
        if (delaySeconds > 0) {
            newTime = Math.max(newTime, currentTime - delaySeconds);
        }
        
        // Add increment (Fischer increment)
        if (incrementSeconds > 0) {
            newTime += incrementSeconds;
        }
        
        return Math.max(0, newTime);
    }

    // Check if time is up
    isTimeUp(timeRemaining) {
        return timeRemaining <= 0;
    }

    // Get game mode from time control
    getGameModeFromTimeControl(timeControl) {
        for (const [mode, config] of Object.entries(this.gameModes)) {
            if (timeControl >= config.minTime && timeControl <= config.maxTime) {
                return mode;
            }
        }
        return 'classical';
    }

    // Generate PGN from moves
    generatePGN(moves, headers = {}) {
        try {
            const chess = new Chess();
            
            // Add headers
            Object.entries(headers).forEach(([key, value]) => {
                chess.header(key, value);
            });
            
            // Play moves
            moves.forEach(move => {
                chess.move(move);
            });
            
            return chess.pgn();
        } catch (error) {
            logger.error('Error generating PGN:', error);
            return '';
        }
    }

    // Parse PGN to moves
    parsePGN(pgn) {
        try {
            const chess = new Chess();
            chess.load_pgn(pgn);
            return chess.history({ verbose: true });
        } catch (error) {
            logger.error('Error parsing PGN:', error);
            return [];
        }
    }

    // Get opening name from position
    getOpeningName(fen) {
        // This is a simplified version - in production you'd use a proper opening database
        const openingMap = {
            'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3': 'King\'s Pawn Opening',
            'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3': 'Queen\'s Pawn Opening',
            'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq -': 'King\'s Knight Opening'
        };
        
        return openingMap[fen] || 'Unknown Opening';
    }
}

module.exports = new ChessService();