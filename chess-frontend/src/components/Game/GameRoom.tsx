import React from 'react'
import { useParams } from 'react-router-dom'
import { Board } from '../Board/Board'
import { useAuth } from '../../contexts/AuthContext'

export function GameRoom() {
  const { gameId } = useParams<{ gameId: string }>()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Authentication Required
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Please login to join the game
        </p>
        <a
          href="/auth"
          className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Login
        </a>
      </div>
    )
  }

  // Mock game state for development
  const mockGameState = {
    id: gameId || '1',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
    turn: 'w' as const,
    isCheck: false,
    isCheckmate: false,
    isDraw: false,
    isGameOver: false,
    moves: [],
    status: 'active' as const,
    whiteTime: 300000,
    blackTime: 300000,
  }

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    console.log('Move made:', move)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Game #{gameId}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time multiplayer chess game
        </p>
      </div>

      <div className="flex justify-center">
        <Board
          gameState={mockGameState}
          onMove={handleMove}
          disabled={false}
          playerColor="white"
          isPlayer={true}
        />
      </div>
    </div>
  )
}