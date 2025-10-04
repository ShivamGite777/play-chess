'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Clock, Users, Trophy, Search, Filter } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { LobbyGame, GameMode } from '@/types'
import { soundEffects } from '@/lib/sounds'
import toast from 'react-hot-toast'

export default function LobbyPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [games, setGames] = useState<LobbyGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateGame, setShowCreateGame] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMode, setSelectedMode] = useState<GameMode | 'all'>('all')

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  // Load games
  useEffect(() => {
    if (isAuthenticated) {
      loadGames()
    }
  }, [isAuthenticated])

  const loadGames = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getLobbyGames(50, 0)
      
      if (response.success && response.data) {
        setGames(response.data)
      }
    } catch (error) {
      console.error('Failed to load games:', error)
      toast.error('Failed to load games')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle join game
  const handleJoinGame = async (gameId: string) => {
    try {
      soundEffects.click()
      const response = await apiClient.joinGame(gameId)
      
      if (response.success) {
        toast.success('Joined game successfully!')
        router.push(`/game/${gameId}`)
      } else {
        toast.error(response.message || 'Failed to join game')
      }
    } catch (error: any) {
      console.error('Failed to join game:', error)
      toast.error(error.message || 'Failed to join game')
    }
  }

  // Handle create game
  const handleCreateGame = async (gameData: {
    game_mode: GameMode
    time_control: number
    increment_seconds?: number
  }) => {
    try {
      soundEffects.click()
      const response = await apiClient.createGame(gameData)
      
      if (response.success && response.data) {
        toast.success('Game created successfully!')
        router.push(`/game/${response.data.game.id}`)
      } else {
        toast.error(response.message || 'Failed to create game')
      }
    } catch (error: any) {
      console.error('Failed to create game:', error)
      toast.error(error.message || 'Failed to create game')
    }
  }

  // Filter games
  const filteredGames = games.filter(game => {
    const matchesSearch = game.white_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.black_username?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMode = selectedMode === 'all' || game.game_mode === selectedMode
    return matchesSearch && matchesMode
  })

  // Format time control
  const formatTimeControl = (timeControl: number, increment: number = 0) => {
    const minutes = Math.floor(timeControl / 60)
    const seconds = timeControl % 60
    
    if (increment > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}+${increment}`
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get mode color
  const getModeColor = (mode: GameMode) => {
    switch (mode) {
      case 'bullet': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'blitz': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'rapid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'classical': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="text-2xl">♔</div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chess Multiplayer
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-medium">{user?.username}</span>
              </div>
              <button
                onClick={() => router.push('/profile')}
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium"
              >
                {user?.username?.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreateGame(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Create Game
                </button>
                
                <button
                  onClick={loadGames}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Clock size={20} />
                  Refresh Games
                </button>
              </div>

              {/* User Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Your Stats
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Rating:</span>
                    <span className="font-medium">{user?.elo_rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Games:</span>
                    <span className="font-medium">{user?.games_played}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wins:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{user?.games_won}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search games..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value as GameMode | 'all')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Modes</option>
                    <option value="bullet">Bullet</option>
                    <option value="blitz">Blitz</option>
                    <option value="rapid">Rapid</option>
                    <option value="classical">Classical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Games List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available Games ({filteredGames.length})
                </h2>
              </div>
              
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading games...</p>
                  </div>
                ) : filteredGames.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">♟️</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchTerm || selectedMode !== 'all' 
                        ? 'No games match your search criteria'
                        : 'No games available at the moment'
                      }
                    </p>
                    <button
                      onClick={() => setShowCreateGame(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Create First Game
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredGames.map((game) => (
                      <motion.div
                        key={game.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">♔</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {game.white_username || 'Waiting for player...'}
                              </span>
                              <span className="text-gray-500">vs</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {game.black_username || 'Waiting for player...'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModeColor(game.game_mode)}`}>
                                {game.game_mode}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatTimeControl(game.time_control, game.increment_seconds)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={14} />
                                {game.spectator_count} spectators
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleJoinGame(game.id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          Join Game
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Game Modal */}
      {showCreateGame && (
        <CreateGameModal
          onClose={() => setShowCreateGame(false)}
          onCreateGame={handleCreateGame}
        />
      )}
    </div>
  )
}

// Create Game Modal Component
function CreateGameModal({ 
  onClose, 
  onCreateGame 
}: { 
  onClose: () => void
  onCreateGame: (gameData: { game_mode: GameMode; time_control: number; increment_seconds?: number }) => void
}) {
  const [gameData, setGameData] = useState({
    game_mode: 'blitz' as GameMode,
    time_control: 300, // 5 minutes
    increment_seconds: 5,
  })

  const timeControls = {
    bullet: [
      { label: '1+0', time: 60, increment: 0 },
      { label: '1+1', time: 60, increment: 1 },
      { label: '2+1', time: 120, increment: 1 },
    ],
    blitz: [
      { label: '3+0', time: 180, increment: 0 },
      { label: '3+2', time: 180, increment: 2 },
      { label: '5+0', time: 300, increment: 0 },
      { label: '5+3', time: 300, increment: 3 },
    ],
    rapid: [
      { label: '10+0', time: 600, increment: 0 },
      { label: '10+5', time: 600, increment: 5 },
      { label: '15+10', time: 900, increment: 10 },
      { label: '30+0', time: 1800, increment: 0 },
    ],
    classical: [
      { label: '30+0', time: 1800, increment: 0 },
      { label: '60+0', time: 3600, increment: 0 },
      { label: '90+30', time: 5400, increment: 30 },
    ],
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateGame(gameData)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New Game
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Game Mode
            </label>
            <select
              value={gameData.game_mode}
              onChange={(e) => setGameData({ ...gameData, game_mode: e.target.value as GameMode })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="bullet">Bullet</option>
              <option value="blitz">Blitz</option>
              <option value="rapid">Rapid</option>
              <option value="classical">Classical</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Control
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeControls[gameData.game_mode].map((control) => (
                <button
                  key={control.label}
                  type="button"
                  onClick={() => setGameData({
                    ...gameData,
                    time_control: control.time,
                    increment_seconds: control.increment,
                  })}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    gameData.time_control === control.time && gameData.increment_seconds === control.increment
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {control.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Create Game
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}