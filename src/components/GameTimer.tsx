import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSoundStore } from '../store/soundStore';

interface GameTimerProps {
  color: 'white' | 'black';
}

export function GameTimer({ color }: GameTimerProps) {
  const { whiteTime, blackTime, status, updateTime, chess } = useGameStore();
  const { playSound } = useSoundStore();
  const time = color === 'white' ? whiteTime : blackTime;
  const isActive = status === 'playing' && chess.turn() === (color === 'white' ? 'w' : 'b');

  useEffect(() => {
    if (!isActive || status !== 'playing') return;

    const interval = setInterval(() => {
      const newTime = time - 100;
      updateTime(color, Math.max(0, newTime));

      if (newTime <= 10000 && newTime > 9900 && newTime % 1000 < 100) {
        playSound('timerTick');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, time, status, color, updateTime, playSound]);

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const milliseconds = Math.floor((time % 1000) / 100);

  const isLowTime = time < 20000;
  const isCriticalTime = time < 10000;

  return (
    <div
      className={`
        px-6 py-4 rounded-lg font-mono text-3xl font-bold transition-all duration-300
        ${isActive ? 'ring-4 ring-blue-500 scale-105' : 'scale-100'}
        ${isCriticalTime ? 'bg-red-600 text-white animate-pulse' : isLowTime ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'}
      `}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
      {time < 20000 && <span className="text-xl">.{milliseconds}</span>}
    </div>
  );
}
