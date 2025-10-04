import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { SocketEvents, GameState, TimerState, ChatMessage, User, PerformanceMetrics } from '../types'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  latency: number
  connectionQuality: PerformanceMetrics['connectionQuality']
  joinGame: (gameId: string) => void
  leaveGame: (gameId: string) => void
  makeMove: (gameId: string, move: { from: string; to: string; promotion?: string }) => void
  sendChatMessage: (gameId: string, message: string, messageType?: 'chat' | 'system') => void
  offerDraw: (gameId: string, action: 'offer' | 'accept' | 'decline') => void
  resign: (gameId: string) => void
  spectateGame: (gameId: string) => void
  syncTimer: (gameId: string) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, tokens, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [latency, setLatency] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState<PerformanceMetrics['connectionQuality']>('poor')
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = useRef(1000)

  // Connect to WebSocket
  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken && user) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, tokens?.accessToken, user])

  const connect = () => {
    if (socket?.connected) return

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    const newSocket = io(apiUrl, {
      auth: {
        token: tokens?.accessToken,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    })

    setupEventListeners(newSocket)
    setSocket(newSocket)
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    setIsConnected(false)
    setLatency(0)
    setConnectionQuality('poor')
  }

  const setupEventListeners = (socketInstance: Socket) => {
    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      reconnectAttempts.current = 0
      reconnectDelay.current = 1000
      toast.success('Connected to server')
      
      // Start latency measurement
      startLatencyMeasurement()
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setIsConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        handleReconnect()
      } else {
        toast.error('Disconnected from server')
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setIsConnected(false)
      
      if (error.message === 'Authentication failed') {
        toast.error('Authentication failed. Please login again.')
      } else {
        handleReconnect()
      }
    })

    // Ping/Pong for latency measurement
    socketInstance.on('ping', () => {
      socketInstance.emit('pong')
    })

    socketInstance.on('pong', () => {
      // Latency measurement handled in startLatencyMeasurement
    })

    // Error events
    socketInstance.on('error', (data) => {
      console.error('Socket error:', data)
      toast.error(data.message)
    })
  }

  const startLatencyMeasurement = () => {
    const measureLatency = () => {
      if (!socket?.connected) return

      const startTime = Date.now()
      socket.emit('ping')
      
      // Estimate latency based on round trip
      setTimeout(() => {
        const estimatedLatency = Date.now() - startTime
        setLatency(estimatedLatency)
        
        // Determine connection quality
        if (estimatedLatency < 50) {
          setConnectionQuality('excellent')
        } else if (estimatedLatency < 100) {
          setConnectionQuality('good')
        } else if (estimatedLatency < 200) {
          setConnectionQuality('fair')
        } else {
          setConnectionQuality('poor')
        }
      }, 100)
    }

    // Measure latency every 5 seconds
    const interval = setInterval(measureLatency, 5000)
    measureLatency() // Initial measurement

    return () => clearInterval(interval)
  }

  const handleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      toast.error('Failed to reconnect. Please refresh the page.')
      return
    }

    reconnectAttempts.current++
    const delay = reconnectDelay.current * Math.pow(2, reconnectAttempts.current - 1)
    
    setTimeout(() => {
      if (socket && !socket.connected) {
        console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
        socket.connect()
      }
    }, delay)
  }

  // Game actions
  const joinGame = (gameId: string) => {
    if (!socket) return
    socket.emit('join_game', { gameId })
  }

  const leaveGame = (gameId: string) => {
    if (!socket) return
    socket.emit('leave_game', { gameId })
  }

  const makeMove = (gameId: string, move: { from: string; to: string; promotion?: string }) => {
    if (!socket) return
    socket.emit('make_move', { gameId, ...move })
  }

  const sendChatMessage = (gameId: string, message: string, messageType: 'chat' | 'system' = 'chat') => {
    if (!socket) return
    socket.emit('chat_message', { gameId, message, messageType })
  }

  const offerDraw = (gameId: string, action: 'offer' | 'accept' | 'decline') => {
    if (!socket) return
    socket.emit('draw_offer', { gameId, action })
  }

  const resign = (gameId: string) => {
    if (!socket) return
    socket.emit('resign', { gameId })
  }

  const spectateGame = (gameId: string) => {
    if (!socket) return
    socket.emit('spectate_game', { gameId })
  }

  const syncTimer = (gameId: string) => {
    if (!socket) return
    socket.emit('timer_sync', { gameId })
  }

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        latency,
        connectionQuality,
        joinGame,
        leaveGame,
        makeMove,
        sendChatMessage,
        offerDraw,
        resign,
        spectateGame,
        syncTimer,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}