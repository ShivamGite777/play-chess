'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Flag, Handshake, MessageSquare, Settings, Eye } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { useSocket } from '@/lib/socket'
import { soundEffects } from '@/lib/sounds'
import toast from 'react-hot-toast'

interface GameControlsProps {
  gameId: string
  onToggleChat: () => void
  onToggleSettings: () => void
  onToggleSpectator: () => void
}

export function GameControls({ 
  gameId, 
  onToggleChat, 
  onToggleSettings, 
  onToggleSpectator 
}: GameControlsProps) {
  const { game, isPlayer, isSpectator } = useGameStore()
  const { resign, offerDraw } = useSocket()
  const [showDrawMenu, setShowDrawMenu] = useState(false)
  const [isResigning, setIsResigning] = useState(false)

  // Handle resignation
  const handleResign = async () => {
    if (isResigning) return
    
    setIsResigning(true)
    soundEffects.resignation()
    
    try {
      await resign(gameId)
      toast.success('You have resigned from the game')
    } catch (error) {
      toast.error('Failed to resign')
    } finally {
      setIsResigning(false)
    }
  }

  // Handle draw offer
  const handleDrawOffer = async (action: 'offer' | 'accept' | 'decline') => {
    soundEffects.drawOffer()
    
    try {
      await offerDraw(gameId, action)
      
      switch (action) {
        case 'offer':
          toast.success('Draw offer sent')
          break
        case 'accept':
          toast.success('Draw accepted')
          break
        case 'decline':
          toast.info('Draw declined')
          break
      }
    } catch (error) {
      toast.error('Failed to process draw offer')
    }
    
    setShowDrawMenu(false)
  }

  // Check if draw offer is pending
  const hasDrawOffer = game?.draw_offer_by && game.draw_offer_by !== game.white_player_id && game.draw_offer_by !== game.black_player_id

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {/* Player controls */}
      {isPlayer && (
        <>
          {/* Resign button */}
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
            onClick={handleResign}
            disabled={isResigning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Flag size={16} />
            {isResigning ? 'Resigning...' : 'Resign'}
          </motion.button>

          {/* Draw button */}
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            onClick={() => setShowDrawMenu(!showDrawMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Handshake size={16} />
            Draw
          </motion.button>

          {/* Draw menu */}
          {showDrawMenu && (
            <motion.div
              className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col gap-1">
                <button
                  className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  onClick={() => handleDrawOffer('offer')}
                >
                  Offer Draw
                </button>
                {hasDrawOffer && (
                  <>
                    <button
                      className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-green-600 dark:text-green-400"
                      onClick={() => handleDrawOffer('accept')}
                    >
                      Accept Draw
                    </button>
                    <button
                      className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-red-600 dark:text-red-400"
                      onClick={() => handleDrawOffer('decline')}
                    >
                      Decline Draw
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Spectator controls */}
      {isSpectator && (
        <motion.button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          onClick={onToggleSpectator}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Eye size={16} />
          Leave Spectator
        </motion.button>
      )}

      {/* Chat button */}
      <motion.button
        className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        onClick={onToggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare size={16} />
        Chat
      </motion.button>

      {/* Settings button */}
      <motion.button
        className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        onClick={onToggleSettings}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings size={16} />
        Settings
      </motion.button>
    </div>
  )
}