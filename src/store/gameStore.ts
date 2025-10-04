import { create } from 'zustand';
import { Chess, Move, Square } from 'chess.js';

export type GameMode = 'bullet' | 'blitz' | 'rapid' | 'classical';
export type GameStatus = 'lobby' | 'waiting' | 'playing' | 'finished';
export type PlayerColor = 'white' | 'black' | null;

export interface GameConfig {
  mode: GameMode;
  initialTime: number;
  increment: number;
}

export interface Player {
  id: string;
  username: string;
  rating: number;
  avatarUrl?: string;
}

export interface GameResult {
  winner: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | 'agreement' | 'threefold_repetition' | 'fifty_move_rule' | 'insufficient_material';
}

interface GameState {
  chess: Chess;
  gameId: string | null;
  status: GameStatus;
  playerColor: PlayerColor;
  whitePlayer: Player | null;
  blackPlayer: Player | null;
  currentPlayer: string | null;
  config: GameConfig;
  whiteTime: number;
  blackTime: number;
  selectedSquare: Square | null;
  legalMoves: Move[];
  moveHistory: Move[];
  capturedPieces: { white: string[]; black: string[] };
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  gameResult: GameResult | null;
  moveCount: number;

  setGameId: (id: string) => void;
  setStatus: (status: GameStatus) => void;
  setPlayerColor: (color: PlayerColor) => void;
  setPlayers: (white: Player, black: Player) => void;
  setConfig: (config: GameConfig) => void;
  selectSquare: (square: Square | null) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => boolean;
  updateTime: (color: 'white' | 'black', time: number) => void;
  resetGame: () => void;
  resign: () => void;
  offerDraw: () => void;
  loadPosition: (fen: string, moves: Move[]) => void;
  setGameResult: (result: GameResult) => void;
}

const TIME_CONTROLS: Record<GameMode, { time: number; increment: number }> = {
  bullet: { time: 60000, increment: 0 },
  blitz: { time: 180000, increment: 2000 },
  rapid: { time: 600000, increment: 5000 },
  classical: { time: 1800000, increment: 30000 },
};

const getCapturedPieces = (moves: Move[]) => {
  const captured = { white: [] as string[], black: [] as string[] };

  moves.forEach((move) => {
    if (move.captured) {
      const piece = move.captured;
      if (move.color === 'w') {
        captured.black.push(piece);
      } else {
        captured.white.push(piece);
      }
    }
  });

  return captured;
};

export const useGameStore = create<GameState>((set, get) => ({
  chess: new Chess(),
  gameId: null,
  status: 'lobby',
  playerColor: null,
  whitePlayer: null,
  blackPlayer: null,
  currentPlayer: null,
  config: {
    mode: 'blitz',
    initialTime: TIME_CONTROLS.blitz.time,
    increment: TIME_CONTROLS.blitz.increment,
  },
  whiteTime: TIME_CONTROLS.blitz.time,
  blackTime: TIME_CONTROLS.blitz.time,
  selectedSquare: null,
  legalMoves: [],
  moveHistory: [],
  capturedPieces: { white: [], black: [] },
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,
  gameResult: null,
  moveCount: 0,

  setGameId: (id) => set({ gameId: id }),

  setStatus: (status) => set({ status }),

  setPlayerColor: (color) => set({ playerColor: color }),

  setPlayers: (white, black) =>
    set({ whitePlayer: white, blackPlayer: black }),

  setConfig: (config) => {
    const timeControl = TIME_CONTROLS[config.mode];
    set({
      config: {
        ...config,
        initialTime: timeControl.time,
        increment: timeControl.increment,
      },
      whiteTime: timeControl.time,
      blackTime: timeControl.time,
    });
  },

  selectSquare: (square) => {
    const { chess, selectedSquare } = get();

    if (!square) {
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }

    if (selectedSquare) {
      const move = get().makeMove(selectedSquare, square);
      if (move) {
        set({ selectedSquare: null, legalMoves: [] });
        return;
      }
    }

    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      const moves = chess.moves({ square, verbose: true }) as Move[];
      set({ selectedSquare: square, legalMoves: moves });
    } else {
      set({ selectedSquare: null, legalMoves: [] });
    }
  },

  makeMove: (from, to, promotion = 'q') => {
    const { chess } = get();

    try {
      const move = chess.move({
        from,
        to,
        promotion,
      }) as Move;

      if (move) {
        const history = chess.history({ verbose: true }) as Move[];
        const capturedPieces = getCapturedPieces(history);
        const isCheck = chess.isCheck();
        const isCheckmate = chess.isCheckmate();
        const isStalemate = chess.isStalemate();
        const isDraw = chess.isDraw();

        let gameResult: GameResult | null = null;
        if (isCheckmate) {
          gameResult = {
            winner: chess.turn() === 'w' ? ('black' as const) : ('white' as const),
            reason: 'checkmate' as const,
          };
        } else if (isStalemate) {
          gameResult = {
            winner: 'draw' as const,
            reason: 'stalemate' as const,
          };
        } else if (isDraw) {
          const reason: 'threefold_repetition' | 'insufficient_material' | 'fifty_move_rule' = chess.isThreefoldRepetition()
            ? 'threefold_repetition'
            : chess.isInsufficientMaterial()
            ? 'insufficient_material'
            : 'fifty_move_rule';
          gameResult = {
            winner: 'draw' as const,
            reason,
          };
        }

        set({
          moveHistory: history,
          capturedPieces,
          isCheck,
          isCheckmate,
          isStalemate,
          isDraw,
          gameResult,
          moveCount: history.length,
        });

        if (gameResult) {
          set({ status: 'finished' });
        }

        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }

    return false;
  },

  updateTime: (color, time) => {
    if (color === 'white') {
      set({ whiteTime: time });
      if (time <= 0) {
        set({
          status: 'finished',
          gameResult: {
            winner: 'black',
            reason: 'timeout',
          },
        });
      }
    } else {
      set({ blackTime: time });
      if (time <= 0) {
        set({
          status: 'finished',
          gameResult: {
            winner: 'white',
            reason: 'timeout',
          },
        });
      }
    }
  },

  resetGame: () => {
    const { config } = get();
    set({
      chess: new Chess(),
      status: 'lobby',
      selectedSquare: null,
      legalMoves: [],
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      gameResult: null,
      moveCount: 0,
      whiteTime: config.initialTime,
      blackTime: config.initialTime,
    });
  },

  resign: () => {
    const { playerColor } = get();
    if (playerColor) {
      set({
        status: 'finished',
        gameResult: {
          winner: playerColor === 'white' ? 'black' : 'white',
          reason: 'resignation',
        },
      });
    }
  },

  offerDraw: () => {
    set({
      status: 'finished',
      gameResult: {
        winner: 'draw',
        reason: 'agreement',
      },
    });
  },

  loadPosition: (fen, moves) => {
    const chess = new Chess(fen);
    const capturedPieces = getCapturedPieces(moves);
    set({
      chess,
      moveHistory: moves,
      capturedPieces,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      moveCount: moves.length,
    });
  },

  setGameResult: (result) => {
    set({
      gameResult: result,
      status: 'finished',
    });
  },
}));
