'use client'

import { motion } from 'framer-motion'
import { Piece } from 'chess.js'

interface ChessPieceProps {
  piece: Piece
  square: string
  isDragging?: boolean
}

const PIECE_SYMBOLS = {
  p: { white: '♙', black: '♟' },
  r: { white: '♖', black: '♜' },
  n: { white: '♘', black: '♞' },
  b: { white: '♗', black: '♝' },
  q: { white: '♕', black: '♛' },
  k: { white: '♔', black: '♚' },
}

export function ChessPiece({ piece, square, isDragging = false }: ChessPieceProps) {
  const symbol = PIECE_SYMBOLS[piece.type][piece.color]

  return (
    <motion.div
      className={`
        chess-piece text-4xl md:text-5xl lg:text-6xl
        ${piece.color === 'w' ? 'text-white drop-shadow-lg' : 'text-gray-900 drop-shadow-sm'}
        ${isDragging ? 'dragging' : ''}
        select-none pointer-events-none
      `}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {symbol}
    </motion.div>
  )
}