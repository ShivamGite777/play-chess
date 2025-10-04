import { Chess } from 'chess.js'

// User types
export interface User {
  id: string
  username: string
  email: string
  avatar_url?: string
  elo_rating: number
  games_played: number
  games_won: number
  games_lost: number
  games_drawn: number
  last_login?: string
  created_at: string
}

// Game types
export interface Game {
  id: string
  white_player_id: string
  black_player_id: string
  game_mode: GameMode
  time_control: number
  increment_seconds: number
  delay_seconds: number
  fen_position: string
  pgn: string
  white_time_remaining: number
  black_time_remaining: number
  status: GameStatus
  result?: GameResult
  winner_id?: string
  end_reason?: EndReason
  draw_offer_by?: string
  draw_offer_at?: string
  spectator_count: number
  created_at: string
  completed_at?: string
  white_player?: User
  black_player?: User
}

export type GameMode = 'bullet' | 'blitz' | 'rapid' | 'classical'
export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned'
export type GameResult = 'white_wins' | 'black_wins' | 'draw'
export type EndReason = 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | 'draw_agreement' | 'abandonment'

// Move types
export interface Move {
  id: string
  game_id: string
  move_number: number
  player_color: 'white' | 'black'
  from_square: string
  to_square: string
  piece: string
  notation: string
  captured_piece?: string
  is_check: boolean
  is_checkmate: boolean
  is_castling: boolean
  is_en_passant: boolean
  is_promotion: boolean
  promoted_piece?: string
  time_taken?: number
  timestamp: string
}

// Chat types
export interface ChatMessage {
  id: string
  game_id: string
  user_id: string
  username: string
  message: string
  message_type: 'chat' | 'system' | 'draw_offer' | 'resignation'
  timestamp: string
}

// WebSocket event types
export interface SocketEvents {
  // Connection events
  connected: (data: { success: boolean; message: string; user: User }) => void
  disconnected: () => void
  
  // Game events
  game_joined: (data: { game: Game; timer: TimerState; isPlayer: boolean; isSpectator: boolean }) => void
  game_left: (data: { success: boolean }) => void
  player_joined: (data: { userId: string; username: string; isPlayer: boolean; isSpectator: boolean }) => void
  player_left: (data: { userId: string; username: string }) => void
  player_disconnected: (data: { userId: string; message: string }) => void
  
  // Move events
  move_made: (data: { move: any; gameState: GameState; timer: TimerState; isGameOver: boolean }) => void
  
  // Chat events
  chat_message: (data: ChatMessage) => void
  
  // Draw events
  draw_offered: (data: { offeredBy: string; offeredByUsername: string }) => void
  draw_accepted: (data: { acceptedBy: string; acceptedByUsername: string }) => void
  draw_declined: (data: { declinedBy: string; declinedByUsername: string }) => void
  
  // Game end events
  player_resigned: (data: { resignedBy: string; resignedByUsername: string; winner: 'white' | 'black' }) => void
  game_completed: (data: { gameId: string; message: string }) => void
  
  // Timer events
  timer_sync: (data: TimerState) => void
  
  // Error events
  error: (data: { message: string }) => void
  
  // Ping/Pong
  ping: () => void
  pong: () => void
}

// Game state types
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
  white_time_remaining: number
  black_time_remaining: number
  draw_offer_by?: string
  draw_offer_at?: string
}

export interface TimerState {
  gameId: string
  whiteTime: number
  blackTime: number
  currentPlayer: 'white' | 'black'
  isActive: boolean
}

// UI state types
export interface GameUIState {
  selectedSquare: string | null
  possibleMoves: string[]
  lastMove: { from: string; to: string } | null
  isFlipped: boolean
  showCoordinates: boolean
  showMoveHistory: boolean
  showCapturedPieces: boolean
  isPromoting: boolean
  promotionSquare: string | null
}

// Sound types
export interface SoundEffects {
  move: () => void
  capture: () => void
  castle: () => void
  check: () => void
  checkmate: () => void
  gameStart: () => void
  timerTick: () => void
  drawOffer: () => void
  victory: () => void
  defeat: () => void
  resignation: () => void
  click: () => void
}

// Theme types
export interface Theme {
  name: string
  board: {
    light: string
    dark: string
  }
  pieces: string
  background: string
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
  white_username: string
  black_username: string
}

// Statistics types
export interface UserStats {
  elo_rating: number
  games_played: number
  games_won: number
  games_lost: number
  games_drawn: number
  win_percentage: number
  created_at: string
}

export interface GameStats {
  total_moves: number
  checks: number
  checkmates: number
  castlings: number
  en_passants: number
  promotions: number
  captures: number
  avg_time_per_move: number
}