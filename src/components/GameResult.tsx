import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSoundStore } from '../store/soundStore';
import { useEffect, useState } from 'react';

export function GameResult() {
  const { gameResult, status, whitePlayer, blackPlayer, playerColor, resetGame } = useGameStore();
  const { playSound } = useSoundStore();
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; color: string }>>([]);

  const isOpen = status === 'finished' && gameResult !== null;

  useEffect(() => {
    if (isOpen) {
      playSound('gameEnd');

      if (
        (gameResult?.winner === playerColor) ||
        (gameResult?.winner === 'draw')
      ) {
        const pieces = Array.from({ length: 50 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          color: ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#32CD32'][
            Math.floor(Math.random() * 5)
          ],
        }));
        setConfetti(pieces);

        setTimeout(() => setConfetti([]), 4000);
      }
    }
  }, [isOpen, gameResult, playerColor, playSound]);

  if (!isOpen || !gameResult) return null;

  const getWinnerName = () => {
    if (gameResult.winner === 'draw') return null;
    return gameResult.winner === 'white' ? whitePlayer?.username : blackPlayer?.username;
  };

  const getResultText = () => {
    if (gameResult.winner === 'draw') {
      return 'Game Drawn';
    }
    const winnerName = getWinnerName();
    return `${winnerName} Wins!`;
  };

  const getReasonText = () => {
    const reasons: Record<string, string> = {
      checkmate: 'by Checkmate',
      resignation: 'by Resignation',
      timeout: 'on Time',
      stalemate: 'by Stalemate',
      agreement: 'by Agreement',
      threefold_repetition: 'by Threefold Repetition',
      fifty_move_rule: 'by Fifty-Move Rule',
      insufficient_material: 'by Insufficient Material',
    };
    return reasons[gameResult.reason] || '';
  };

  const isPlayerWinner =
    gameResult.winner === playerColor ||
    (gameResult.winner === 'draw' && playerColor !== null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              className="confetti-piece"
              initial={{ y: -20, x: `${piece.left}vw`, opacity: 1 }}
              animate={{ y: '100vh', opacity: 0 }}
              transition={{ duration: 3, ease: 'easeIn' }}
              style={{ backgroundColor: piece.color }}
            />
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && resetGame()}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className={`text-6xl mb-4 ${
                    isPlayerWinner ? '🏆' : '🎮'
                  }`}
                >
                  {isPlayerWinner ? '🏆' : gameResult.winner === 'draw' ? '🤝' : '😔'}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-3xl font-bold mb-2 ${
                    isPlayerWinner
                      ? 'text-green-600 dark:text-green-400'
                      : gameResult.winner === 'draw'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {getResultText()}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 dark:text-gray-400 text-lg mb-6"
                >
                  {getReasonText()}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <button
                    onClick={resetGame}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    New Game
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
