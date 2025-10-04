import { Chess } from 'chess.js'

// Core game types
export interface GameState {
  id: string
  fen: string
  pgn: string
  turn: 'w' | 'b'
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  isGameOver: boolean
  moves: string[]
  status: GameStatus
  whiteTime: number
  blackTime: number
  drawOfferBy?: string
  drawOfferAt?: string
}

export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned'
export type GameResult = 'white_wins' | 'black_wins' | 'draw'
export type EndReason = 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | 'draw_agreement' | 'abandonment'
export type GameMode = 'bullet' | 'blitz' | 'rapid' | 'classical'
export type PlayerColor = 'white' | 'black'

// User types
export interface User {
  id: string
  username: string
  email: string
  avatarUrl?: string
  eloRating: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  gamesDrawn: number
  lastLogin?: string
  createdAt: string
}

// Game types
export interface Game {
  id: string
  whitePlayerId: string
  blackPlayerId: string
  gameMode: GameMode
  timeControl: number
  incrementSeconds: number
  delaySeconds: number
  fenPosition: string
  pgn: string
  whiteTimeRemaining: number
  blackTimeRemaining: number
  status: GameStatus
  result?: GameResult
  winnerId?: string
  endReason?: EndReason
  drawOfferBy?: string
  drawOfferAt?: string
  spectatorCount: number
  createdAt: string
  completedAt?: string
  whitePlayer?: User
  blackPlayer?: User
}

// Move types
export interface Move {
  id: string
  gameId: string
  moveNumber: number
  playerColor: PlayerColor
  fromSquare: string
  toSquare: string
  piece: string
  notation: string
  capturedPiece?: string
  isCheck: boolean
  isCheckmate: boolean
  isCastling: boolean
  isEnPassant: boolean
  isPromotion: boolean
  promotedPiece?: string
  timeTaken?: number
  timestamp: string
}

// Chat types
export interface ChatMessage {
  id: string
  gameId: string
  userId: string
  username: string
  message: string
  messageType: 'chat' | 'system' | 'draw_offer' | 'resignation'
  timestamp: string
}

// WebSocket event types
export interface SocketEvents {
  // Connection events
  connected: (data: { success: boolean; message: string; user: User }) => void
  disconnected: () => void
  
  // Game events
  gameJoined: (data: { game: Game; gameState: GameState; timer: TimerState; isPlayer: boolean; isSpectator: boolean }) => void
  gameLeft: (data: { success: boolean }) => void
  playerJoined: (data: { userId: string; username: string; isPlayer: boolean; isSpectator: boolean }) => void
  playerLeft: (data: { userId: string; username: string }) => void
  playerDisconnected: (data: { userId: string; message: string }) => void
  
  // Move events
  moveMade: (data: { move: any; gameState: GameState; timer: TimerState; isGameOver: boolean }) => void
  
  // Chat events
  chatMessage: (data: ChatMessage) => void
  
  // Draw events
  drawOffered: (data: { offeredBy: string; offeredByUsername: string }) => void
  drawAccepted: (data: { acceptedBy: string; acceptedByUsername: string }) => void
  drawDeclined: (data: { declinedBy: string; declinedByUsername: string }) => void
  
  // Game end events
  playerResigned: (data: { resignedBy: string; resignedByUsername: string; winner: PlayerColor }) => void
  gameCompleted: (data: { gameId: string; message: string }) => void
  
  // Timer events
  timerSync: (data: TimerState) => void
  
  // Error events
  error: (data: { message: string }) => void
  
  // Ping/Pong
  ping: () => void
  pong: () => void
}

export interface TimerState {
  gameId: string
  whiteTime: number
  blackTime: number
  currentPlayer: PlayerColor
  isActive: boolean
}

// UI state types
export interface BoardUIState {
  selectedSquare: string | null
  possibleMoves: string[]
  lastMove: { from: string; to: string } | null
  isFlipped: boolean
  showCoordinates: boolean
  showMoveHistory: boolean
  showCapturedPieces: boolean
  isPromoting: boolean
  promotionSquare: string | null
  hoveredSquare: string | null
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  soundEnabled: boolean
  soundVolume: number
  animationsEnabled: boolean
  showCoordinates: boolean
  showMoveHistory: boolean
  showCapturedPieces: boolean
  autoFlip: boolean
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large'
  patternOverlay: boolean
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Array<{
    field: string
    message: string
    value?: any
  }>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    limit: number
    offset: number
    count: number
  }
}

// Auth types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
}

// Lobby types
export interface LobbyGame extends Game {
  whiteUsername: string
  blackUsername: string
}

// Statistics types
export interface UserStats {
  eloRating: number
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  gamesDrawn: number
  winPercentage: number
  createdAt: string
}

export interface GameStats {
  totalMoves: number
  checks: number
  checkmates: number
  castlings: number
  enPassants: number
  promotions: number
  captures: number
  avgTimePerMove: number
}

// Accessibility types
export interface AccessibilitySettings {
  announceMoves: boolean
  announceCaptures: boolean
  announceChecks: boolean
  announceCheckmate: boolean
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  patternOverlay: boolean
}

// Performance types
export interface PerformanceMetrics {
  latency: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
  lastPing: number
  reconnectAttempts: number
}