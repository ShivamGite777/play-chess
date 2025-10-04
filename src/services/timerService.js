const { redisSet, redisGet, redisDel } = require('../database/connection');
const logger = require('../utils/logger');

class TimerService {
    constructor() {
        this.activeTimers = new Map();
        this.timerInterval = null;
        this.syncInterval = parseInt(process.env.TIMER_SYNC_INTERVAL) || 1000; // 1 second
    }

    // Start timer service
    start() {
        if (this.timerInterval) {
            return;
        }

        this.timerInterval = setInterval(() => {
            this.updateAllTimers();
        }, this.syncInterval);

        logger.info('Timer service started');
    }

    // Stop timer service
    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Clear all active timers
        this.activeTimers.clear();
        logger.info('Timer service stopped');
    }

    // Start timer for a game
    async startGameTimer(gameId, whiteTime, blackTime, incrementSeconds = 0, delaySeconds = 0) {
        try {
            const timerData = {
                gameId,
                whiteTime: whiteTime * 1000, // Convert to milliseconds
                blackTime: blackTime * 1000,
                incrementSeconds: incrementSeconds * 1000,
                delaySeconds: delaySeconds * 1000,
                currentPlayer: 'white',
                lastUpdate: Date.now(),
                isActive: true
            };

            // Store in memory
            this.activeTimers.set(gameId, timerData);

            // Store in Redis for persistence
            await redisSet(`timer:${gameId}`, timerData, 3600); // 1 hour cache

            logger.info(`Timer started for game ${gameId}`, timerData);
            return timerData;
        } catch (error) {
            logger.error('Error starting game timer:', error);
            throw error;
        }
    }

    // Stop timer for a game
    async stopGameTimer(gameId) {
        try {
            // Remove from memory
            this.activeTimers.delete(gameId);

            // Remove from Redis
            await redisDel(`timer:${gameId}`);

            logger.info(`Timer stopped for game ${gameId}`);
        } catch (error) {
            logger.error('Error stopping game timer:', error);
            throw error;
        }
    }

    // Switch turn and apply time logic
    async switchTurn(gameId, timeTaken) {
        try {
            const timerData = this.activeTimers.get(gameId);
            if (!timerData) {
                throw new Error('Timer not found for game');
            }

            const now = Date.now();
            const timeElapsed = now - timerData.lastUpdate;

            // Update time for current player
            if (timerData.currentPlayer === 'white') {
                timerData.whiteTime = Math.max(0, timerData.whiteTime - timeElapsed);
                
                // Apply delay if configured
                if (timerData.delaySeconds > 0) {
                    timerData.whiteTime = Math.max(timerData.whiteTime, timerData.whiteTime - timerData.delaySeconds);
                }
                
                // Add increment
                if (timerData.incrementSeconds > 0) {
                    timerData.whiteTime += timerData.incrementSeconds;
                }
            } else {
                timerData.blackTime = Math.max(0, timerData.blackTime - timeElapsed);
                
                // Apply delay if configured
                if (timerData.delaySeconds > 0) {
                    timerData.blackTime = Math.max(timerData.blackTime, timerData.blackTime - timerData.delaySeconds);
                }
                
                // Add increment
                if (timerData.incrementSeconds > 0) {
                    timerData.blackTime += timerData.incrementSeconds;
                }
            }

            // Switch player
            timerData.currentPlayer = timerData.currentPlayer === 'white' ? 'black' : 'white';
            timerData.lastUpdate = now;

            // Update cache
            await redisSet(`timer:${gameId}`, timerData, 3600);

            return timerData;
        } catch (error) {
            logger.error('Error switching turn:', error);
            throw error;
        }
    }

    // Get current timer state
    getTimerState(gameId) {
        const timerData = this.activeTimers.get(gameId);
        if (!timerData) {
            return null;
        }

        const now = Date.now();
        const timeElapsed = now - timerData.lastUpdate;

        return {
            gameId,
            whiteTime: Math.max(0, timerData.whiteTime - (timerData.currentPlayer === 'white' ? timeElapsed : 0)),
            blackTime: Math.max(0, timerData.blackTime - (timerData.currentPlayer === 'black' ? timeElapsed : 0)),
            currentPlayer: timerData.currentPlayer,
            isActive: timerData.isActive
        };
    }

    // Update all active timers
    async updateAllTimers() {
        try {
            const now = Date.now();
            const gamesToEnd = [];

            for (const [gameId, timerData] of this.activeTimers) {
                if (!timerData.isActive) continue;

                const timeElapsed = now - timerData.lastUpdate;
                let currentPlayerTime = timerData.currentPlayer === 'white' 
                    ? timerData.whiteTime - timeElapsed 
                    : timerData.blackTime - timeElapsed;

                // Check if time is up
                if (currentPlayerTime <= 0) {
                    gamesToEnd.push({
                        gameId,
                        winner: timerData.currentPlayer === 'white' ? 'black' : 'white',
                        reason: 'timeout'
                    });
                }
            }

            // End games that timed out
            for (const gameToEnd of gamesToEnd) {
                await this.handleTimeout(gameToEnd.gameId, gameToEnd.winner);
            }
        } catch (error) {
            logger.error('Error updating timers:', error);
        }
    }

    // Handle timeout
    async handleTimeout(gameId, winner) {
        try {
            // Stop the timer
            await this.stopGameTimer(gameId);

            // Update game in database
            const Game = require('../models/Game');
            const game = await Game.findById(gameId);
            if (game && game.status === 'active') {
                const result = winner === 'white' ? 'white_wins' : 'black_wins';
                const winnerId = winner === 'white' ? game.white_player_id : game.black_player_id;

                const { query } = require('../database/connection');
                await query(`
                    UPDATE games 
                    SET 
                        status = 'completed',
                        result = $1,
                        winner_id = $2,
                        end_reason = 'timeout',
                        completed_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `, [result, winnerId, gameId]);

                logger.info(`Game ${gameId} ended by timeout, winner: ${winner}`);
            }
        } catch (error) {
            logger.error('Error handling timeout:', error);
        }
    }

    // Pause timer
    async pauseTimer(gameId) {
        try {
            const timerData = this.activeTimers.get(gameId);
            if (!timerData) {
                throw new Error('Timer not found for game');
            }

            timerData.isActive = false;
            await redisSet(`timer:${gameId}`, timerData, 3600);

            logger.info(`Timer paused for game ${gameId}`);
        } catch (error) {
            logger.error('Error pausing timer:', error);
            throw error;
        }
    }

    // Resume timer
    async resumeTimer(gameId) {
        try {
            const timerData = this.activeTimers.get(gameId);
            if (!timerData) {
                throw new Error('Timer not found for game');
            }

            timerData.isActive = true;
            timerData.lastUpdate = Date.now();
            await redisSet(`timer:${gameId}`, timerData, 3600);

            logger.info(`Timer resumed for game ${gameId}`);
        } catch (error) {
            logger.error('Error resuming timer:', error);
            throw error;
        }
    }

    // Restore timers from Redis on startup
    async restoreTimers() {
        try {
            // This would require scanning Redis keys, which is not implemented in the basic Redis client
            // In production, you'd implement a more sophisticated restoration mechanism
            logger.info('Timer restoration not implemented - requires Redis key scanning');
        } catch (error) {
            logger.error('Error restoring timers:', error);
        }
    }

    // Get all active game timers
    getActiveTimers() {
        const activeTimers = [];
        for (const [gameId, timerData] of this.activeTimers) {
            if (timerData.isActive) {
                activeTimers.push({
                    gameId,
                    whiteTime: timerData.whiteTime,
                    blackTime: timerData.blackTime,
                    currentPlayer: timerData.currentPlayer,
                    lastUpdate: timerData.lastUpdate
                });
            }
        }
        return activeTimers;
    }

    // Format time for display
    formatTime(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Check if game should be ended due to time
    shouldEndGame(gameId) {
        const timerState = this.getTimerState(gameId);
        if (!timerState) return false;

        return timerState.whiteTime <= 0 || timerState.blackTime <= 0;
    }
}

module.exports = new TimerService();