import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useGameStore } from './store/gameStore';
import { useThemeStore } from './store/themeStore';
import { useSoundStore } from './store/soundStore';
import { ChessBoard } from './components/ChessBoard';
import { GameTimer } from './components/GameTimer';
import { CapturedPieces } from './components/CapturedPieces';
import { MoveHistory } from './components/MoveHistory';
import { GameResult } from './components/GameResult';
import { GameControls } from './components/GameControls';
import { ThemeToggle } from './components/ThemeToggle';
import { SoundToggle } from './components/SoundToggle';
import { GameModeSelector } from './components/GameModeSelector';
import { PlayerInfo } from './components/PlayerInfo';

function App() {
  const {
    status,
    setStatus,
    setPlayers,
    chess,
    whitePlayer,
    blackPlayer,
    setPlayerColor,
  } = useGameStore();
  const { isDark } = useThemeStore();
  const { playSound } = useSoundStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const startGame = () => {
    const demoWhitePlayer = {
      id: '1',
      username: 'Player 1',
      rating: 1500,
    };
    const demoBlackPlayer = {
      id: '2',
      username: 'Player 2',
      rating: 1500,
    };

    setPlayers(demoWhitePlayer, demoBlackPlayer);
    setPlayerColor('white');
    setStatus('playing');
    playSound('gameStart');
  };

  const currentTurn = chess.turn() === 'w' ? 'white' : 'black';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Toaster position="top-right" />

      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Multiplayer Chess
          </h1>
          <div className="flex gap-3">
            <ThemeToggle />
            <SoundToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {status === 'lobby' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <GameModeSelector />
              <button
                onClick={startGame}
                className="w-full mt-8 px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Start Game
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <div className="mb-4">
                  <PlayerInfo
                    player={blackPlayer}
                    color="black"
                    isActive={currentTurn === 'black'}
                  />
                </div>

                <div className="mb-4">
                  <GameTimer color="black" />
                </div>

                <div className="mb-4">
                  <CapturedPieces color="white" />
                </div>

                <ChessBoard />

                <div className="mt-4">
                  <CapturedPieces color="black" />
                </div>

                <div className="mt-4">
                  <GameTimer color="white" />
                </div>

                <div className="mt-4">
                  <PlayerInfo
                    player={whitePlayer}
                    color="white"
                    isActive={currentTurn === 'white'}
                  />
                </div>

                <div className="mt-6">
                  <GameControls />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <MoveHistory />

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Game Info
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {status === 'playing' ? 'Active' : 'Finished'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turn:</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {currentTurn}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <GameResult />
    </div>
  );
}

export default App;
