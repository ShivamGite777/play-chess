import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../store/gameStore';
import { useSoundStore } from '../store/soundStore';
import { Square } from 'chess.js';
import { useState } from 'react';

export function ChessBoard() {
  const {
    chess,
    playerColor,
    status,
    selectedSquare,
    legalMoves,
    selectSquare,
    makeMove,
    isCheck,
  } = useGameStore();

  const { playSound } = useSoundStore();
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  const onSquareClick = (square: Square) => {
    if (status !== 'playing') return;

    const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
    if (playerColor !== currentTurn && playerColor !== null) return;

    selectSquare(square);
  };

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (status !== 'playing') return false;

    const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
    if (playerColor !== currentTurn && playerColor !== null) return false;

    const piece = chess.get(sourceSquare);
    const isPromotion =
      piece?.type === 'p' &&
      ((piece.color === 'w' && targetSquare[1] === '8') ||
        (piece.color === 'b' && targetSquare[1] === '1'));

    const success = makeMove(sourceSquare, targetSquare, isPromotion ? 'q' : undefined);

    if (success) {
      const targetPiece = chess.get(targetSquare);
      if (targetPiece) {
        playSound('capture');
      } else if (
        piece?.type === 'k' &&
        Math.abs(sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)) === 2
      ) {
        playSound('castle');
      } else {
        playSound('move');
      }

      if (chess.isCheck()) {
        playSound('check');
      }
      if (chess.isCheckmate()) {
        playSound('checkmate');
      }
    }

    return success;
  };

  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(255, 255, 0, 0.4)',
    };
  }

  legalMoves.forEach((move) => {
    customSquareStyles[move.to] = {
      background:
        chess.get(move.to) !== null
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.2) 25%, transparent 25%)',
      borderRadius: '50%',
    };
  });

  if (isCheck) {
    const kingSquare = chess
      .board()
      .flat()
      .find((piece) => piece?.type === 'k' && piece.color === chess.turn());

    if (kingSquare) {
      const files = 'abcdefgh';
      const squares = chess.board();
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          if (squares[rank][file] === kingSquare) {
            const square = `${files[file]}${8 - rank}` as Square;
            customSquareStyles[square] = {
              backgroundColor: 'rgba(220, 38, 38, 0.5)',
            };
          }
        }
      }
    }
  }

  return (
    <div className="relative">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          aria-label="Flip board"
        >
          Flip Board
        </button>
      </div>
      <Chessboard
        position={chess.fen()}
        onSquareClick={onSquareClick}
        onPieceDrop={onPieceDrop}
        boardOrientation={boardOrientation}
        customSquareStyles={customSquareStyles}
        arePiecesDraggable={status === 'playing'}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
      />
    </div>
  );
}
