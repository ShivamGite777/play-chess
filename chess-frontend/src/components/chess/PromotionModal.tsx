'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface PromotionModalProps {
  isOpen: boolean
  onClose: () => void
  onPromote: (piece: 'q' | 'r' | 'b' | 'n') => void
}

const PROMOTION_PIECES = [
  { symbol: '♕', value: 'q', name: 'Queen' },
  { symbol: '♖', value: 'r', name: 'Rook' },
  { symbol: '♗', value: 'b', name: 'Bishop' },
  { symbol: '♘', value: 'n', name: 'Knight' },
] as const

export function PromotionModal({ isOpen, onClose, onPromote }: PromotionModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Choose Promotion Piece
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PROMOTION_PIECES.map((piece) => (
              <motion.button
                key={piece.value}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => onPromote(piece.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-4xl mb-2">{piece.symbol}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {piece.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}