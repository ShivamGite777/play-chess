import { Player } from '../store/gameStore';

interface PlayerInfoProps {
  player: Player | null;
  color: 'white' | 'black';
  isActive?: boolean;
}

export function PlayerInfo({ player, color, isActive }: PlayerInfoProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg skeleton">
        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const avatarColor = color === 'white' ? 'bg-gray-200' : 'bg-gray-800';
  const textColor = color === 'white' ? 'text-gray-900' : 'text-white';

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg transition-all duration-200
        ${isActive ? 'ring-4 ring-blue-500 scale-105 bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}
      `}
    >
      <div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold
          ${avatarColor} ${textColor}
        `}
      >
        {player.avatarUrl ? (
          <img
            src={player.avatarUrl}
            alt={player.username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          player.username.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 dark:text-white">
          {player.username}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Rating: {player.rating}
        </div>
      </div>
      {isActive && (
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}
