import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

export function Profile() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and view statistics
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {user?.username}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {user?.email}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {user?.eloRating}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {user?.gamesWon}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {user?.gamesLost}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {user?.gamesPlayed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Games</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}