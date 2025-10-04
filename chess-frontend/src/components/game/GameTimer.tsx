'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { soundEffects } from '@/lib/sounds'
import { useEffect, useState } from 'react'

interface GameTimerProps {
  playerColor: 'white' | 'black'
}

export function GameTimer({ playerColor }: GameTimerProps) {
  const { timer, game } = useGameStore()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isLowTime, setIsLowTime] = useState(false)
  const [isCriticalTime, setIsCriticalTime] = useState(false)

  // Update time remaining
  useEffect(() => {
    if (!timer) return

    const time = playerColor === 'white' ? timer.whiteTime : timer.blackTime
    setTimeRemaining(time)
    
    // Check for low time warnings
    setIsLowTime(time <= 30000 && time > 10000) // 30 seconds
    setIsCriticalTime(time <= 10000) // 10 seconds

    // Play timer tick sound for critical time
    if (time <= 10000 && time > 0 && timer.currentPlayer === playerColor) {
      const interval = setInterval(() => {
        soundEffects.timerTick()
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [timer, playerColor])

  // Format time display
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get timer class based on time remaining
  const getTimerClass = () => {
    let baseClass = 'timer font-mono font-bold text-2xl md:text-3xl transition-all duration-300'
    
    if (isCriticalTime) {
      baseClass += ' text-red-600 dark:text-red-400 timer-critical'
    } else if (isLowTime) {
      baseClass += ' text-orange-500 dark:text-orange-400 timer-low'
    } else {
      baseClass += ' text-gray-900 dark:text-gray-100'
    }
    
    return baseClass
  }

  // Get player name
  const getPlayerName = () => {
    if (!game) return playerColor === 'white' ? 'White' : 'Black'
    
    const player = playerColor === 'white' ? game.white_player : game.black_player
    return player?.username || (playerColor === 'white' ? 'White' : 'Black')
  }

  // Check if it's this player's turn
  const isActiveTurn = timer?.currentPlayer === playerColor

  return (
    <motion.div
      className={`
        flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-300
        ${isActiveTurn 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
        }
        ${isCriticalTime ? 'animate-pulse' : ''}
      `}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Player name */}
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {getPlayerName()}
      </div>

      {/* Timer display */}
      <motion.div
        className={getTimerClass()}
        animate={isCriticalTime ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isCriticalTime ? Infinity : 0 }}
      >
        {formatTime(timeRemaining)}
      </motion.div>

      {/* Turn indicator */}
      {isActiveTurn && (
        <motion.div
          className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Your turn
        </motion.div>
      )}

      {/* Time warning */}
      {isLowTime && !isCriticalTime && (
        <motion.div
          className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Low time!
        </motion.div>
      )}

      {/* Critical time warning */}
      {isCriticalTime && (
        <motion.div
          className="mt-2 text-xs text-red-600 dark:text-red-400 font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          CRITICAL TIME!
        </motion.div>
      )}
    </motion.div>
  )
}