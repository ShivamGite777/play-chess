import { useGameStore } from '../store/gameStore';

interface CapturedPiecesProps {
  color: 'white' | 'black';
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const PIECE_UNICODE: Record<string, string> = {
  p: '♙',
  n: '♘',
  b: '♗',
  r: '♖',
  q: '♕',
  k: '♔',
};

export function CapturedPieces({ color }: CapturedPiecesProps) {
  const { capturedPieces } = useGameStore();
  const pieces = capturedPieces[color];

  const pieceCount: Record<string, number> = {};
  pieces.forEach((piece) => {
    pieceCount[piece] = (pieceCount[piece] || 0) + 1;
  });

  const totalValue = pieces.reduce((sum, piece) => sum + (PIECE_VALUES[piece] || 0), 0);
  const opponentColor = color === 'white' ? 'black' : 'white';
  const opponentPieces = capturedPieces[opponentColor];
  const opponentValue = opponentPieces.reduce(
    (sum, piece) => sum + (PIECE_VALUES[piece] || 0),
    0
  );
  const advantage = totalValue - opponentValue;

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[60px]">
      <div className="flex flex-wrap gap-1 flex-1">
        {Object.entries(pieceCount)
          .sort(([a], [b]) => (PIECE_VALUES[b] || 0) - (PIECE_VALUES[a] || 0))
          .map(([piece, count]) => (
            <div key={piece} className="flex items-center">
              <span className={`text-2xl ${color === 'white' ? 'text-white' : 'text-black'}`}>
                {PIECE_UNICODE[piece]}
              </span>
              {count > 1 && (
                <span className="text-xs font-bold ml-1 text-gray-600 dark:text-gray-400">
                  ×{count}
                </span>
              )}
            </div>
          ))}
      </div>
      {advantage > 0 && (
        <div className="text-sm font-bold text-green-600 dark:text-green-400">
          +{advantage}
        </div>
      )}
    </div>
  );
}
