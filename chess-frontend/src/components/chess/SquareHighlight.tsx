'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface SquareHighlightProps {
  square: string
  isSelected: boolean
  isPossibleMove: boolean
  isLastMove: boolean
  isCheck: boolean
}

export function SquareHighlight({
  square,
  isSelected,
  isPossibleMove,
  isLastMove,
  isCheck,
}: SquareHighlightProps) {
  return (
    <AnimatePresence>
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
    </AnimatePresence>
  )
}