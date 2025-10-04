import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Chess } from 'chess.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Square } from './Square/Square'
import { Piece } from './Piece/Piece'
import { PromotionModal } from '../shared/Modal/PromotionModal'
import { useTheme } from '../../contexts/ThemeContext'
import { soundEffects } from '../../utils/sounds'
import { BoardUIState, GameState, PlayerColor } from '../../types'

interface BoardProps {
  gameState: GameState | null
  onMove?: (move: { from: string; to: string; promotion?: string }) => void
  disabled?: boolean
  playerColor?: PlayerColor
  isPlayer?: boolean
  className?: string
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

export function Board({ 
  gameState, 
  onMove, 
  disabled = false, 
  playerColor = 'white',
  isPlayer = false,
  className = ''
}: BoardProps) {
  const { settings } = useTheme()
  const [chess, setChess] = useState<Chess | null>(null)
  const [uiState, setUIState] = useState<BoardUIState>({
    selectedSquare: null,
    possibleMoves: [],
    lastMove: null,
    isFlipped: false,
    showCoordinates: settings.showCoordinates,
    showMoveHistory: settings.showMoveHistory,
    showCapturedPieces: settings.showCapturedPieces,
    isPromoting: false,
    promotionSquare: null,
    hoveredSquare: null,
  })

  // Initialize chess instance
  useEffect(() => {
    if (gameState) {
      const newChess = new Chess(gameState.fen)
      setChess(newChess)
      
      // Update last move if available
      if (gameState.moves.length > 0) {
        const lastMove = gameState.moves[gameState.moves.length - 1]
        setUIState(prev => ({
          ...prev,
          lastMove: { from: lastMove.from, to: lastMove.to }
        }))
      }
    }
  }, [gameState])

  // Update settings when they change
  useEffect(() => {
    setUIState(prev => ({
      ...prev,
      showCoordinates: settings.showCoordinates,
      showMoveHistory: settings.showMoveHistory,
      showCapturedPieces: settings.showCapturedPieces,
    }))
  }, [settings])

  // Get possible moves for selected square
  const getPossibleMoves = useCallback((square: string) => {
    if (!chess) return []
    
    const moves = chess.moves({ square, verbose: true })
    return moves.map(move => move.to)
  }, [chess])

  // Handle square click
  const handleSquareClick = useCallback((square: string) => {
    if (disabled || !chess || !isPlayer) return

    soundEffects.click()

    // If no square is selected, select this square if it has a piece
    if (!uiState.selectedSquare) {
      const piece = chess.get(square as any)
      if (piece && piece.color === chess.turn()) {
        setUIState(prev => ({
          ...prev,
          selectedSquare: square,
          possibleMoves: getPossibleMoves(square)
        }))
        return
      }
    }

    // If a square is selected, try to make a move
    if (uiState.selectedSquare) {
      // If clicking the same square, deselect
      if (uiState.selectedSquare === square) {
        setUIState(prev => ({
          ...prev,
          selectedSquare: null,
          possibleMoves: []
        }))
        return
      }

      // If clicking a possible move, make the move
      if (uiState.possibleMoves.includes(square)) {
        const move = chess.move({
          from: uiState.selectedSquare as any,
          to: square as any,
        })

        if (move) {
          // Check if promotion is needed
          if (move.flags.includes('p')) {
            setUIState(prev => ({
              ...prev,
              isPromoting: true,
              promotionSquare: square,
              selectedSquare: null,
              possibleMoves: []
            }))
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
          setUIState(prev => ({
            ...prev,
            lastMove: { from: move.from, to: move.to },
            selectedSquare: null,
            possibleMoves: []
          }))

          // Call onMove callback
          onMove?.({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          })
        }
      } else {
        // Select new square if it has a piece of the current player
        const piece = chess.get(square as any)
        if (piece && piece.color === chess.turn()) {
          setUIState(prev => ({
            ...prev,
            selectedSquare: square,
            possibleMoves: getPossibleMoves(square)
          }))
        } else {
          setUIState(prev => ({
            ...prev,
            selectedSquare: null,
            possibleMoves: []
          }))
        }
      }
    }
  }, [chess, uiState.selectedSquare, uiState.possibleMoves, disabled, isPlayer, getPossibleMoves, onMove])

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, square: string) => {
    if (disabled || !chess || !isPlayer) return

    const piece = chess.get(square as any)
    if (!piece || piece.color !== chess.turn()) return

    // Set drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'scale(1.2)'
    dragImage.style.opacity = '0.8'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 40, 40)
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
  }, [chess, disabled, isPlayer])

  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent, square: string) => {
    if (disabled || !chess || !isPlayer) return

    const targetSquare = e.currentTarget.getAttribute('data-square')
    if (targetSquare && uiState.possibleMoves.includes(targetSquare)) {
      const move = chess.move({
        from: square as any,
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
        setUIState(prev => ({
          ...prev,
          lastMove: { from: move.from, to: move.to },
          selectedSquare: null,
          possibleMoves: []
        }))

        // Call onMove callback
        onMove?.({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        })
      }
    }

    setUIState(prev => ({
      ...prev,
      selectedSquare: null,
      possibleMoves: []
    }))
  }, [chess, uiState.possibleMoves, disabled, isPlayer, onMove])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Handle promotion
  const handlePromotion = useCallback((piece: 'q' | 'r' | 'b' | 'n') => {
    if (uiState.selectedSquare && uiState.promotionSquare) {
      onMove?.({
        from: uiState.selectedSquare,
        to: uiState.promotionSquare,
        promotion: piece,
      })
    }
    setUIState(prev => ({
      ...prev,
      isPromoting: false,
      promotionSquare: null,
      selectedSquare: null,
      possibleMoves: []
    }))
  }, [uiState.selectedSquare, uiState.promotionSquare, onMove])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!chess || !isPlayer) return

    // Arrow key navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      // TODO: Implement arrow key navigation
    }

    // Escape to deselect
    if (e.key === 'Escape') {
      setUIState(prev => ({
        ...prev,
        selectedSquare: null,
        possibleMoves: []
      }))
    }
  }, [chess, isPlayer])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Render board
  const renderBoard = useMemo(() => {
    if (!chess) return null

    const squares = []
    const ranks = uiState.isFlipped ? [...RANKS].reverse() : RANKS
    const files = uiState.isFlipped ? [...FILES].reverse() : FILES

    for (const rank of ranks) {
      for (const file of files) {
        const square = `${file}${rank}`
        const piece = chess.get(square as any)
        const isLight = (file.charCodeAt(0) - 97 + parseInt(rank)) % 2 === 0
        const isSelected = uiState.selectedSquare === square
        const isPossibleMove = uiState.possibleMoves.includes(square)
        const isLastMove = uiState.lastMove && (uiState.lastMove.from === square || uiState.lastMove.to === square)
        const isCheck = piece && chess.isCheck() && piece.color === chess.turn()
        const isHovered = uiState.hoveredSquare === square

        squares.push(
          <Square
            key={square}
            square={square}
            isLight={isLight}
            isSelected={isSelected}
            isPossibleMove={isPossibleMove}
            isLastMove={isLastMove}
            isCheck={isCheck}
            isHovered={isHovered}
            showCoordinates={uiState.showCoordinates}
            onClick={() => handleSquareClick(square)}
            onDragStart={(e) => handleDragStart(e, square)}
            onDragEnd={(e) => handleDragEnd(e, square)}
            onDragOver={handleDragOver}
            disabled={disabled || !isPlayer}
          >
            {piece && (
              <Piece
                piece={piece}
                square={square}
                isDragging={false}
              />
            )}
          </Square>
        )
      }
    }

    return squares
  }, [
    chess,
    uiState,
    handleSquareClick,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    disabled,
    isPlayer
  ])

  if (!chess) {
    return (
      <div className={`w-full max-w-2xl mx-auto aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">Loading board...</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        className="chess-board w-full max-w-2xl mx-auto aspect-square rounded-lg overflow-hidden shadow-chess-lg"
        role="grid"
        aria-label="Chess board"
        aria-rowcount="8"
        aria-colcount="8"
      >
        <div className="grid grid-cols-8 h-full">
          {renderBoard}
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={uiState.isPromoting}
        onClose={() => setUIState(prev => ({
          ...prev,
          isPromoting: false,
          promotionSquare: null,
          selectedSquare: null,
          possibleMoves: []
        }))}
        onPromote={handlePromotion}
      />
    </div>
  )
}