import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  User, 
  LogOut, 
  Settings, 
  Volume2, 
  VolumeX,
  Sun,
  Moon,
  Monitor,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { useWebSocket } from '../../../contexts/WebSocketContext'
import { soundEffects } from '../../../utils/sounds'

export function Navigation() {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme, getEffectiveTheme, settings, updateSettings } = useTheme()
  const { isConnected, latency, connectionQuality } = useWebSocket()
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)

  const handleLogout = () => {
    soundEffects.click()
    logout()
    setShowUserMenu(false)
  }

  const handleThemeToggle = () => {
    soundEffects.click()
    toggleTheme()
  }

  const handleSoundToggle = () => {
    soundEffects.click()
    updateSettings({ soundEnabled: !settings.soundEnabled })
  }

  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="h-4 w-4 text-red-500" />
    
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'good':
        return <Wifi className="h-4 w-4 text-yellow-500" />
      case 'fair':
        return <Wifi className="h-4 w-4 text-orange-500" />
      case 'poor':
        return <Wifi className="h-4 w-4 text-red-500" />
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />
    }
  }

  const getThemeIcon = () => {
    const effectiveTheme = getEffectiveTheme()
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'auto':
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={() => soundEffects.click()}
            >
              <span className="text-2xl">♔</span>
              <span>Chess Multiplayer</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              onClick={() => soundEffects.click()}
            >
              <Home className="h-4 w-4 inline mr-2" />
              Lobby
            </Link>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              {getConnectionIcon()}
              <span className="hidden sm:inline">
                {isConnected ? `${latency}ms` : 'Disconnected'}
              </span>
            </div>

            {/* Theme Toggle */}
            <motion.button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`Current theme: ${theme}`}
            >
              {getThemeIcon()}
            </motion.button>

            {/* Sound Toggle */}
            <motion.button
              onClick={handleSoundToggle}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={settings.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </motion.button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <motion.button
                  onClick={() => {
                    soundEffects.click()
                    setShowUserMenu(!showUserMenu)
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.username}
                  </span>
                </motion.button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        soundEffects.click()
                        setShowUserMenu(false)
                      }}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        soundEffects.click()
                        setShowSettings(true)
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                onClick={() => soundEffects.click()}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          settings={settings}
          updateSettings={updateSettings}
        />
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  )
}

// Settings Modal Component
function SettingsModal({ 
  onClose, 
  settings, 
  updateSettings 
}: { 
  onClose: () => void
  settings: any
  updateSettings: (settings: any) => void
}) {
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
          Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Show Coordinates</span>
            <input
              type="checkbox"
              checked={settings.showCoordinates}
              onChange={(e) => updateSettings({ showCoordinates: e.target.checked })}
              className="rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Show Move History</span>
            <input
              type="checkbox"
              checked={settings.showMoveHistory}
              onChange={(e) => updateSettings({ showMoveHistory: e.target.checked })}
              className="rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Show Captured Pieces</span>
            <input
              type="checkbox"
              checked={settings.showCapturedPieces}
              onChange={(e) => updateSettings({ showCapturedPieces: e.target.checked })}
              className="rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">High Contrast</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              className="rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Pattern Overlay</span>
            <input
              type="checkbox"
              checked={settings.patternOverlay}
              onChange={(e) => updateSettings({ patternOverlay: e.target.checked })}
              className="rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Animations</span>
            <input
              type="checkbox"
              checked={settings.animationsEnabled}
              onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
              className="rounded"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}