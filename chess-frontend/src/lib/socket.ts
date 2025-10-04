import { io, Socket } from 'socket.io-client'
import { SocketEvents } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { useGameStore } from '@/stores/gameStore'
import toast from 'react-hot-toast'

class SocketManager {
  private socket: Socket | null = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    
    this.socket = io(apiUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    })

    this.setupEventListeners()
    return this.socket
  }

  private setupEventListeners() {
    if (!this.socket) return

    const gameStore = useGameStore.getState()
    const authStore = useAuthStore.getState()

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.isConnected = true
      this.reconnectAttempts = 0
      gameStore.setConnected(true)
      toast.success('Connected to server')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      this.isConnected = false
      gameStore.setConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect()
      } else {
        toast.error('Disconnected from server')
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.isConnected = false
      gameStore.setConnected(false)
      
      if (error.message === 'Authentication failed') {
        toast.error('Authentication failed. Please login again.')
        authStore.logout()
      } else {
        this.handleReconnect()
      }
    })

    // Game events
    this.socket.on('game_joined', (data) => {
      console.log('Joined game:', data)
      gameStore.setGame(data.game)
      gameStore.setGameState(data.gameState)
      gameStore.setTimer(data.timer)
      gameStore.setSpectator(data.isSpectator)
      gameStore.setPlayer(data.isPlayer)
      
      if (data.gameState) {
        // Initialize chess instance
        const { Chess } = require('chess.js')
        const chess = new Chess(data.gameState.fen)
        gameStore.setChess(chess)
      }
    })

    this.socket.on('game_left', (data) => {
      console.log('Left game:', data)
      gameStore.resetGame()
    })

    this.socket.on('player_joined', (data) => {
      console.log('Player joined:', data)
      toast.success(`${data.username} joined the game`)
    })

    this.socket.on('player_left', (data) => {
      console.log('Player left:', data)
      toast.info(`${data.username} left the game`)
    })

    this.socket.on('player_disconnected', (data) => {
      console.log('Player disconnected:', data)
      toast.warning(`${data.userId} disconnected`)
    })

    // Move events
    this.socket.on('move_made', (data) => {
      console.log('Move made:', data)
      
      const { move, gameState, timer, isGameOver } = data
      
      // Update game state
      gameStore.setGameState(gameState)
      gameStore.setTimer(timer)
      
      // Update chess instance
      const chess = gameStore.chess
      if (chess && move) {
        try {
          chess.move(move)
          gameStore.setChess(chess)
          
          // Update UI state
          gameStore.setLastMove({ from: move.from, to: move.to })
          gameStore.setSelectedSquare(null)
          gameStore.setPossibleMoves([])
        } catch (error) {
          console.error('Invalid move:', error)
        }
      }
      
      // Handle game over
      if (isGameOver) {
        toast.success('Game completed!')
      }
    })

    // Chat events
    this.socket.on('chat_message', (data) => {
      console.log('Chat message:', data)
      gameStore.addMessage(data)
    })

    // Draw events
    this.socket.on('draw_offered', (data) => {
      console.log('Draw offered:', data)
      toast.info(`${data.offeredByUsername} offered a draw`)
    })

    this.socket.on('draw_accepted', (data) => {
      console.log('Draw accepted:', data)
      toast.success(`${data.acceptedByUsername} accepted the draw`)
    })

    this.socket.on('draw_declined', (data) => {
      console.log('Draw declined:', data)
      toast.info(`${data.declinedByUsername} declined the draw`)
    })

    // Game end events
    this.socket.on('player_resigned', (data) => {
      console.log('Player resigned:', data)
      toast.info(`${data.resignedByUsername} resigned`)
    })

    this.socket.on('game_completed', (data) => {
      console.log('Game completed:', data)
      toast.success('Game completed!')
    })

    // Timer events
    this.socket.on('timer_sync', (data) => {
      gameStore.setTimer(data)
    })

    // Error events
    this.socket.on('error', (data) => {
      console.error('Socket error:', data)
      toast.error(data.message)
    })

    // Ping/Pong
    this.socket.on('ping', () => {
      this.socket?.emit('pong')
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Failed to reconnect. Please refresh the page.')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.socket.connect()
      }
    }, delay)
  }

  // Game actions
  joinGame(gameId: string) {
    if (!this.socket) return
    this.socket.emit('join_game', { gameId })
  }

  leaveGame(gameId: string) {
    if (!this.socket) return
    this.socket.emit('leave_game', { gameId })
  }

  makeMove(gameId: string, move: { from: string; to: string; promotion?: string }) {
    if (!this.socket) return
    this.socket.emit('make_move', { gameId, ...move })
  }

  sendChatMessage(gameId: string, message: string, messageType: 'chat' | 'system' = 'chat') {
    if (!this.socket) return
    this.socket.emit('chat_message', { gameId, message, messageType })
  }

  offerDraw(gameId: string, action: 'offer' | 'accept' | 'decline') {
    if (!this.socket) return
    this.socket.emit('draw_offer', { gameId, action })
  }

  resign(gameId: string) {
    if (!this.socket) return
    this.socket.emit('resign', { gameId })
  }

  spectateGame(gameId: string) {
    if (!this.socket) return
    this.socket.emit('spectate_game', { gameId })
  }

  syncTimer(gameId: string) {
    if (!this.socket) return
    this.socket.emit('timer_sync', { gameId })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
  }

  getSocket() {
    return this.socket
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }
}

// Create global socket manager instance
export const socketManager = new SocketManager()

// Hook for using socket in components
export const useSocket = () => {
  return {
    socket: socketManager.getSocket(),
    isConnected: socketManager.isSocketConnected(),
    joinGame: socketManager.joinGame.bind(socketManager),
    leaveGame: socketManager.leaveGame.bind(socketManager),
    makeMove: socketManager.makeMove.bind(socketManager),
    sendChatMessage: socketManager.sendChatMessage.bind(socketManager),
    offerDraw: socketManager.offerDraw.bind(socketManager),
    resign: socketManager.resign.bind(socketManager),
    spectateGame: socketManager.spectateGame.bind(socketManager),
    syncTimer: socketManager.syncTimer.bind(socketManager),
  }
}