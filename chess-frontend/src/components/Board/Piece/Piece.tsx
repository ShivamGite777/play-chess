import React from 'react'
import { motion } from 'framer-motion'
import { Piece as ChessPiece } from 'chess.js'

interface PieceProps {
  piece: ChessPiece
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

export function Piece({ piece, square, isDragging = false }: PieceProps) {
  const symbol = PIECE_SYMBOLS[piece.type][piece.color]
  const pieceName = getPieceName(piece.type, piece.color)

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
      role="img"
      aria-label={`${pieceName} on ${square}`}
      draggable={true}
    >
      {symbol}
    </motion.div>
  )
}

function getPieceName(type: string, color: string): string {
  const pieceNames = {
    p: color === 'w' ? 'White Pawn' : 'Black Pawn',
    r: color === 'w' ? 'White Rook' : 'Black Rook',
    n: color === 'w' ? 'White Knight' : 'Black Knight',
    b: color === 'w' ? 'White Bishop' : 'Black Bishop',
    q: color === 'w' ? 'White Queen' : 'Black Queen',
    k: color === 'w' ? 'White King' : 'Black King',
  }
  return pieceNames[type as keyof typeof pieceNames] || 'Unknown Piece'
}