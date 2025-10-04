'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChessBoard } from '@/components/chess/ChessBoard'
import { GameTimer } from '@/components/game/GameTimer'
import { GameControls } from '@/components/game/GameControls'
import { GameChat } from '@/components/game/GameChat'
import { useGameStore } from '@/stores/gameStore'
import { useSocket } from '@/lib/socket'
import { apiClient } from '@/lib/api'
import { soundEffects } from '@/lib/sounds'
import toast from 'react-hot-toast'
import Confetti from 'react-confetti'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  
  const { game, gameState, timer, isPlayer, isSpectator, isConnected } = useGameStore()
  const { joinGame, leaveGame, makeMove, spectateGame } = useSocket()
  
  const [showChat, setShowChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [gameResult, setGameResult] = useState<{
    winner: string
    reason: string
    isVictory: boolean
  } | null>(null)

  // Join game on mount
  useEffect(() => {
    if (gameId) {
      joinGame(gameId)
    }

    return () => {
      if (gameId) {
        leaveGame(gameId)
      }
    }
  }, [gameId, joinGame, leaveGame])

  // Handle game completion
  useEffect(() => {
    if (gameState?.isGameOver && game) {
      const isVictory = game.result === 'white_wins' && game.white_player_id === game.white_player_id ||
                       game.result === 'black_wins' && game.black_player_id === game.black_player_id
      
      setGameResult({
        winner: game.winner_id || 'Draw',
        reason: game.end_reason || 'Game over',
        isVictory
      })

      // Play victory/defeat sound
      if (isVictory) {
        soundEffects.victory()
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
      } else {
        soundEffects.defeat()
      }
    }
  }, [gameState?.isGameOver, game])

  // Handle move
  const handleMove = async (move: { from: string; to: string; promotion?: string }) => {
    try {
      await makeMove(gameId, move)
    } catch (error) {
      toast.error('Failed to make move')
    }
  }

  // Handle chat toggle
  const handleToggleChat = () => {
    setShowChat(!showChat)
  }

  // Handle settings toggle
  const handleToggleSettings = () => {
    setShowSettings(!showSettings)
  }

  // Handle spectator toggle
  const handleToggleSpectator = () => {
    router.push('/lobby')
  }

  // Loading state
  if (!game || !gameState) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading game...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 0}
          height={typeof window !== 'undefined' ? window.innerHeight : 0}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/lobby')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back to Lobby
              </button>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Game #{gameId.slice(0, 8)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main game area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left sidebar - Black player timer */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <GameTimer playerColor="black" />
          </div>

          {/* Center - Chess board */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="flex flex-col items-center gap-6">
              <ChessBoard onMove={handleMove} disabled={!isPlayer} />
              
              {/* Game controls */}
              <GameControls
                gameId={gameId}
                onToggleChat={handleToggleChat}
                onToggleSettings={handleToggleSettings}
                onToggleSpectator={handleToggleSpectator}
              />
            </div>
          </div>

          {/* Right sidebar - White player timer */}
          <div className="lg:col-span-1 order-3">
            <GameTimer playerColor="white" />
          </div>
        </div>
      </div>

      {/* Game result modal */}
      {gameResult && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4 modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">
                {gameResult.isVictory ? '🎉' : '😔'}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {gameResult.isVictory ? 'Congratulations!' : 'Game Over'}
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {gameResult.isVictory 
                  ? `You won by ${gameResult.reason}!`
                  : `You lost by ${gameResult.reason}.`
                }
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/lobby')}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Back to Lobby
                </button>
                
                <button
                  onClick={() => {
                    setGameResult(null)
                    // TODO: Implement rematch functionality
                  }}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Rematch
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Chat modal */}
      <GameChat
        gameId={gameId}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Settings modal */}
      {showSettings && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Game Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Show Coordinates</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Flip Board</span>
                <input type="checkbox" className="rounded" />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Sound Effects</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}