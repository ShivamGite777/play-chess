import { GameMode, useGameStore } from '../store/gameStore';
import { useSoundStore } from '../store/soundStore';

const GAME_MODES: Array<{ mode: GameMode; label: string; time: string }> = [
  { mode: 'bullet', label: 'Bullet', time: '1 min' },
  { mode: 'blitz', label: 'Blitz', time: '3 min + 2s' },
  { mode: 'rapid', label: 'Rapid', time: '10 min + 5s' },
  { mode: 'classical', label: 'Classical', time: '30 min + 30s' },
];

export function GameModeSelector() {
  const { config, setConfig, status } = useGameStore();
  const { playSound } = useSoundStore();

  if (status !== 'lobby') return null;

  const handleModeSelect = (mode: GameMode) => {
    playSound('click');
    setConfig({ ...config, mode });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
        Select Time Control
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {GAME_MODES.map(({ mode, label, time }) => (
          <button
            key={mode}
            onClick={() => handleModeSelect(mode)}
            className={`
              p-6 rounded-xl font-semibold transition-all duration-200
              ${
                config.mode === mode
                  ? 'bg-blue-600 text-white scale-105 shadow-xl'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-102'
              }
            `}
          >
            <div className="text-xl mb-1">{label}</div>
            <div className="text-sm opacity-80">{time}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
