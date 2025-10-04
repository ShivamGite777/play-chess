import { useGameStore } from '../store/gameStore';
import { Move } from 'chess.js';

export function MoveHistory() {
  const { moveHistory, chess } = useGameStore();

  const exportPGN = () => {
    const pgn = chess.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const movePairs: Move[][] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push([moveHistory[i], moveHistory[i + 1]].filter(Boolean));
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Move History</h3>
        {moveHistory.length > 0 && (
          <button
            onClick={exportPGN}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            aria-label="Export PGN"
          >
            Export PGN
          </button>
        )}
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {movePairs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No moves yet</p>
        ) : (
          movePairs.map((pair, index) => (
            <div
              key={index}
              className="flex gap-4 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-600 dark:text-gray-400 font-mono w-8">
                {index + 1}.
              </span>
              <div className="flex gap-8 flex-1">
                <span className="font-mono text-gray-900 dark:text-white flex-1">
                  {pair[0]?.san || ''}
                </span>
                {pair[1] && (
                  <span className="font-mono text-gray-900 dark:text-white flex-1">
                    {pair[1].san}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
