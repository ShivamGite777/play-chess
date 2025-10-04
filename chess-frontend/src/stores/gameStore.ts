import { create } from 'zustand'
import { Chess } from 'chess.js'
import { Game, GameState, GameUIState, TimerState, ChatMessage, User } from '@/types'

interface GameStore {
  // Game data
  game: Game | null
  gameState: GameState | null
  timer: TimerState | null
  chess: Chess | null
  
  // UI state
  ui: GameUIState
  
  // Chat
  messages: ChatMessage[]
  
  // Players
  players: {
    white: User | null
    black: User | null
  }
  
  // Connection state
  isConnected: boolean
  isSpectator: boolean
  isPlayer: boolean
  
  // Actions
  setGame: (game: Game) => void
  setGameState: (gameState: GameState) => void
  setTimer: (timer: TimerState) => void
  setChess: (chess: Chess) => void
  
  // UI actions
  setSelectedSquare: (square: string | null) => void
  setPossibleMoves: (moves: string[]) => void
  setLastMove: (move: { from: string; to: string } | null) => void
  toggleBoardFlip: () => void
  setShowCoordinates: (show: boolean) => void
  setShowMoveHistory: (show: boolean) => void
  setShowCapturedPieces: (show: boolean) => void
  setPromoting: (isPromoting: boolean, square?: string) => void
  
  // Chat actions
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
  
  // Player actions
  setPlayers: (white: User | null, black: User | null) => void
  
  // Connection actions
  setConnected: (connected: boolean) => void
  setSpectator: (isSpectator: boolean) => void
  setPlayer: (isPlayer: boolean) => void
  
  // Reset
  resetGame: () => void
}

const initialUIState: GameUIState = {
  selectedSquare: null,
  possibleMoves: [],
  lastMove: null,
  isFlipped: false,
  showCoordinates: true,
  showMoveHistory: false,
  showCapturedPieces: true,
  isPromoting: false,
  promotionSquare: null,
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  game: null,
  gameState: null,
  timer: null,
  chess: null,
  ui: initialUIState,
  messages: [],
  players: {
    white: null,
    black: null,
  },
  isConnected: false,
  isSpectator: false,
  isPlayer: false,
  
  // Actions
  setGame: (game) => set({ game }),
  
  setGameState: (gameState) => set({ gameState }),
  
  setTimer: (timer) => set({ timer }),
  
  setChess: (chess) => set({ chess }),
  
  setSelectedSquare: (selectedSquare) => 
    set((state) => ({ 
      ui: { ...state.ui, selectedSquare } 
    })),
  
  setPossibleMoves: (possibleMoves) => 
    set((state) => ({ 
      ui: { ...state.ui, possibleMoves } 
    })),
  
  setLastMove: (lastMove) => 
    set((state) => ({ 
      ui: { ...state.ui, lastMove } 
    })),
  
  toggleBoardFlip: () => 
    set((state) => ({ 
      ui: { ...state.ui, isFlipped: !state.ui.isFlipped } 
    })),
  
  setShowCoordinates: (showCoordinates) => 
    set((state) => ({ 
      ui: { ...state.ui, showCoordinates } 
    })),
  
  setShowMoveHistory: (showMoveHistory) => 
    set((state) => ({ 
      ui: { ...state.ui, showMoveHistory } 
    })),
  
  setShowCapturedPieces: (showCapturedPieces) => 
    set((state) => ({ 
      ui: { ...state.ui, showCapturedPieces } 
    })),
  
  setPromoting: (isPromoting, promotionSquare = null) => 
    set((state) => ({ 
      ui: { ...state.ui, isPromoting, promotionSquare } 
    })),
  
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
  
  clearMessages: () => set({ messages: [] }),
  
  setPlayers: (white, black) => 
    set({ players: { white, black } }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  setSpectator: (isSpectator) => set({ isSpectator }),
  
  setPlayer: (isPlayer) => set({ isPlayer }),
  
  resetGame: () => set({
    game: null,
    gameState: null,
    timer: null,
    chess: null,
    ui: initialUIState,
    messages: [],
    players: { white: null, black: null },
    isConnected: false,
    isSpectator: false,
    isPlayer: false,
  }),
}))