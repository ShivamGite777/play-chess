import React from 'react'
import { motion } from 'framer-motion'

interface SquareProps {
  square: string
  isLight: boolean
  isSelected: boolean
  isPossibleMove: boolean
  isLastMove: boolean
  isCheck: boolean
  isHovered: boolean
  showCoordinates: boolean
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  disabled: boolean
  children: React.ReactNode
}

export function Square({
  square,
  isLight,
  isSelected,
  isPossibleMove,
  isLastMove,
  isCheck,
  isHovered,
  showCoordinates,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  disabled,
  children
}: SquareProps) {
  const file = square[0]
  const rank = square[1]
  const isCorner = (file === 'a' || file === 'h') && (rank === '1' || rank === '8')

  const getSquareClasses = () => {
    let classes = 'chess-square relative w-full h-full flex items-center justify-center transition-all duration-200'
    
    // Base colors
    if (isLight) {
      classes += ' bg-chess-light'
    } else {
      classes += ' bg-chess-dark'
    }
    
    // State-based styling
    if (isSelected) {
      classes += ' ring-2 ring-blue-500 ring-opacity-50'
    }
    
    if (isPossibleMove) {
      classes += ' highlighted'
    }
    
    if (isLastMove) {
      classes += ' last-move'
    }
    
    if (isCheck) {
      classes += ' check'
    }
    
    if (isHovered && !disabled) {
      classes += ' hover:bg-opacity-80'
    }
    
    if (disabled) {
      classes += ' cursor-not-allowed opacity-50'
    } else {
      classes += ' cursor-pointer'
    }
    
    return classes
  }

  return (
    <motion.div
      className={getSquareClasses()}
      data-square={square}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      role="gridcell"
      aria-label={`Square ${square}`}
      tabIndex={disabled ? -1 : 0}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
    >
      {/* Coordinates */}
      {showCoordinates && (
        <>
          {/* File coordinates (a-h) */}
          {rank === '1' && (
            <span className="absolute bottom-1 left-1 text-xs text-gray-600 dark:text-gray-400 pointer-events-none font-medium">
              {file}
            </span>
          )}
          
          {/* Rank coordinates (1-8) */}
          {file === 'a' && (
            <span className="absolute top-1 left-1 text-xs text-gray-600 dark:text-gray-400 pointer-events-none font-medium">
              {rank}
            </span>
          )}
        </>
      )}

      {/* Piece */}
      {children}

      {/* Square highlights */}
      <SquareHighlights
        isSelected={isSelected}
        isPossibleMove={isPossibleMove}
        isLastMove={isLastMove}
        isCheck={isCheck}
      />
    </motion.div>
  )
}

// Square highlights component
function SquareHighlights({
  isSelected,
  isPossibleMove,
  isLastMove,
  isCheck
}: {
  isSelected: boolean
  isPossibleMove: boolean
  isLastMove: boolean
  isCheck: boolean
}) {
  return (
    <>
      {/* Selected square highlight */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-blue-500 bg-opacity-30 rounded-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Last move highlight */}
      {isLastMove && (
        <motion.div
          className="absolute inset-0 bg-yellow-400 bg-opacity-40 rounded-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Check highlight */}
      {isCheck && (
        <motion.div
          className="absolute inset-0 bg-red-500 bg-opacity-50 rounded-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Possible move indicator */}
      {isPossibleMove && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-3 h-3 bg-green-500 bg-opacity-60 rounded-full" />
        </motion.div>
      )}
    </>
  )
}