import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { soundEffects } from '../../../utils/sounds'

interface PromotionModalProps {
  isOpen: boolean
  onClose: () => void
  onPromote: (piece: 'q' | 'r' | 'b' | 'n') => void
}

const PROMOTION_PIECES = [
  { symbol: '♕', value: 'q', name: 'Queen', description: 'Most powerful piece' },
  { symbol: '♖', value: 'r', name: 'Rook', description: 'Moves horizontally and vertically' },
  { symbol: '♗', value: 'b', name: 'Bishop', description: 'Moves diagonally' },
  { symbol: '♘', value: 'n', name: 'Knight', description: 'Moves in L-shape' },
] as const

export function PromotionModal({ isOpen, onClose, onPromote }: PromotionModalProps) {
  if (!isOpen) return null

  const handlePromote = (piece: 'q' | 'r' | 'b' | 'n') => {
    soundEffects.click()
    onPromote(piece)
  }

  const handleClose = () => {
    soundEffects.click()
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-title"
        aria-describedby="promotion-description"
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4 modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              id="promotion-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Choose Promotion Piece
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close promotion modal"
            >
              <X size={20} />
            </button>
          </div>

          <p 
            id="promotion-description"
            className="text-sm text-gray-600 dark:text-gray-400 mb-4"
          >
            Select which piece to promote your pawn to:
          </p>

          <div className="grid grid-cols-2 gap-4">
            {PROMOTION_PIECES.map((piece) => (
              <motion.button
                key={piece.value}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                onClick={() => handlePromote(piece.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Promote to ${piece.name}`}
              >
                <span className="text-4xl mb-2">{piece.symbol}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {piece.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {piece.description}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleClose}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel promotion
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}