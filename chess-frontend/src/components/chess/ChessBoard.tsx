'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chess } from 'chess.js'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { soundEffects } from '@/lib/sounds'
import { ChessPiece } from './ChessPiece'
import { SquareHighlight } from './SquareHighlight'
import { PromotionModal } from './PromotionModal'

interface ChessBoardProps {
  onMove?: (move: { from: string; to: string; promotion?: string }) => void
  disabled?: boolean
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

export function ChessBoard({ onMove, disabled = false }: ChessBoardProps) {
  const { chess, ui, setSelectedSquare, setPossibleMoves, setLastMove } = useGameStore()
  const { settings } = useSettingsStore()
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Get possible moves for selected square
  const getPossibleMoves = useCallback((square: string) => {
    if (!chess) return []
    
    const moves = chess.moves({ square, verbose: true })
    return moves.map(move => move.to)
  }, [chess])

  // Handle square click
  const handleSquareClick = useCallback((square: string) => {
    if (disabled || !chess) return

    soundEffects.click()

    // If no square is selected, select this square if it has a piece
    if (!ui.selectedSquare) {
      const piece = chess.get(square as any)
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square)
        const moves = getPossibleMoves(square)
        setPossibleMoves(moves)
        return
      }
    }

    // If a square is selected, try to make a move
    if (ui.selectedSquare) {
      // If clicking the same square, deselect
      if (ui.selectedSquare === square) {
        setSelectedSquare(null)
        setPossibleMoves([])
        return
      }

      // If clicking a possible move, make the move
      if (ui.possibleMoves.includes(square)) {
        const move = chess.move({
          from: ui.selectedSquare as any,
          to: square as any,
        })

        if (move) {
          // Check if promotion is needed
          if (move.flags.includes('p')) {
            // Handle promotion
            setSelectedSquare(null)
            setPossibleMoves([])
            // Promotion will be handled by the promotion modal
            return
          }

          // Play move sound
          if (move.captured) {
            soundEffects.capture()
          } else if (move.flags.includes('k') || move.flags.includes('q')) {
            soundEffects.castle()
          } else {
            soundEffects.move()
          }

          // Update last move
          setLastMove({ from: move.from, to: move.to })

          // Call onMove callback
          onMove?.({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          })

          // Clear selection
          setSelectedSquare(null)
          setPossibleMoves([])
        }
      } else {
        // Select new square if it has a piece of the current player
        const piece = chess.get(square as any)
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square)
          const moves = getPossibleMoves(square)
          setPossibleMoves(moves)
        } else {
          setSelectedSquare(null)
          setPossibleMoves([])
        }
      }
    }
  }, [chess, ui.selectedSquare, ui.possibleMoves, disabled, getPossibleMoves, setSelectedSquare, setPossibleMoves, setLastMove, onMove])

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, square: string) => {
    if (disabled || !chess) return

    const piece = chess.get(square as any)
    if (!piece || piece.color !== chess.turn()) return

    setDraggedPiece(square)
    
    // Calculate drag offset
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })

    // Set drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'scale(1.2)'
    dragImage.style.opacity = '0.8'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2)
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }, [chess, disabled])

  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent, square: string) => {
    if (disabled || !chess || !draggedPiece) return

    const targetSquare = e.currentTarget.getAttribute('data-square')
    if (targetSquare && ui.possibleMoves.includes(targetSquare)) {
      const move = chess.move({
        from: draggedPiece as any,
        to: targetSquare as any,
      })

      if (move) {
        // Play move sound
        if (move.captured) {
          soundEffects.capture()
        } else if (move.flags.includes('k') || move.flags.includes('q')) {
          soundEffects.castle()
        } else {
          soundEffects.move()
        }

        // Update last move
        setLastMove({ from: move.from, to: move.to })

        // Call onMove callback
        onMove?.({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        })
      }
    }

    setDraggedPiece(null)
    setSelectedSquare(null)
    setPossibleMoves([])
  }, [chess, draggedPiece, ui.possibleMoves, disabled, setLastMove, onMove, setSelectedSquare, setPossibleMoves])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Render square
  const renderSquare = (file: string, rank: string) => {
    const square = `${file}${rank}`
    const isLight = (file.charCodeAt(0) - 97 + parseInt(rank)) % 2 === 0
    const piece = chess?.get(square as any)
    const isSelected = ui.selectedSquare === square
    const isPossibleMove = ui.possibleMoves.includes(square)
    const isLastMove = ui.lastMove && (ui.lastMove.from === square || ui.lastMove.to === square)
    const isCheck = piece && chess?.isCheck() && piece.color === chess.turn()
    const isDragging = draggedPiece === square

    return (
      <motion.div
        key={square}
        className={`
          chess-square relative w-full h-full flex items-center justify-center
          ${isLight ? 'bg-chess-light' : 'bg-chess-dark'}
          ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${isPossibleMove ? 'highlighted' : ''}
          ${isLastMove ? 'last-move' : ''}
          ${isCheck ? 'check' : ''}
          ${isDragging ? 'opacity-50' : ''}
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        data-square={square}
        onClick={() => handleSquareClick(square)}
        onDragStart={(e) => handleDragStart(e, square)}
        onDragEnd={(e) => handleDragEnd(e, square)}
        onDragOver={handleDragOver}
        draggable={!disabled && !!piece}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{ duration: 0.1 }}
      >
        {/* Coordinates */}
        {settings.showCoordinates && (
          <>
            {(file === 'a' || rank === '1') && (
              <span className="absolute text-xs text-gray-600 dark:text-gray-400 pointer-events-none">
                {file === 'a' && rank}
                {rank === '1' && file}
              </span>
            )}
          </>
        )}

        {/* Piece */}
        {piece && (
          <ChessPiece
            piece={piece}
            square={square}
            isDragging={isDragging}
          />
        )}

        {/* Square highlights */}
        <SquareHighlight
          square={square}
          isSelected={isSelected}
          isPossibleMove={isPossibleMove}
          isLastMove={isLastMove}
          isCheck={isCheck}
        />
      </motion.div>
    )
  }

  // Render board
  const renderBoard = () => {
    const squares = []
    const ranks = ui.isFlipped ? [...RANKS].reverse() : RANKS
    const files = ui.isFlipped ? [...FILES].reverse() : FILES

    for (const rank of ranks) {
      for (const file of files) {
        squares.push(renderSquare(file, rank))
      }
    }

    return squares
  }

  if (!chess) {
    return (
      <div className="w-full max-w-2xl mx-auto aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading board...</div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="chess-board w-full max-w-2xl mx-auto aspect-square rounded-lg overflow-hidden shadow-chess-lg">
        <div className="grid grid-cols-8 h-full">
          {renderBoard()}
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={ui.isPromoting}
        onClose={() => {
          setSelectedSquare(null)
          setPossibleMoves([])
        }}
        onPromote={(piece) => {
          if (ui.selectedSquare && ui.promotionSquare) {
            onMove?.({
              from: ui.selectedSquare,
              to: ui.promotionSquare,
              promotion: piece,
            })
          }
          setSelectedSquare(null)
          setPossibleMoves([])
        }}
      />
    </div>
  )
}