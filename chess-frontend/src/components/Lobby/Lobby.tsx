import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

export function Lobby() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Chess Multiplayer
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Please login to access the game lobby
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

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Game Lobby
      </h1>
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Lobby components will be implemented here
        </p>
      </div>
    </div>
  )
}