# Multiplayer Chess Game

A modern, fully-featured chess game built with React, TypeScript, and chess.js, featuring all official FIDE rules, multiple time controls, and an elegant user interface.

## Features

### Core Chess Functionality
- **Complete FIDE Rules Implementation**: All official chess rules including:
  - Castling (kingside and queenside)
  - En passant captures
  - Pawn promotion
  - Check and checkmate detection
  - Stalemate detection
  - Threefold repetition
  - Fifty-move rule
  - Insufficient material detection

### Game Modes
- **Bullet**: 1 minute per player
- **Blitz**: 3 minutes + 2 second increment
- **Rapid**: 10 minutes + 5 second increment
- **Classical**: 30 minutes + 30 second increment

### User Interface
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Interactive Board**:
  - Drag-and-drop piece movement
  - Click-to-move alternative
  - Legal move highlighting
  - Check state visual indicator
  - Board flip option to switch perspective
- **Live Timers**: Countdown timers with visual warnings for low time
- **Captured Pieces Display**: Shows captured pieces with material advantage calculation
- **Move History**:
  - Complete move list in algebraic notation
  - PGN export functionality
- **Player Profiles**: Display with username and rating

### Sound Effects
- Piece movement sounds
- Capture sound
- Castling sound
- Check warning tone
- Checkmate fanfare
- Game start chime
- Timer tick (last 10 seconds)
- Mute/unmute toggle

### Victory Screens
- **Animated Game Results**: Beautiful victory/defeat modals with:
  - Confetti animation for winners
  - Result reason display (checkmate, resignation, timeout, etc.)
  - Personalized congratulations with player name
  - Rematch option

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- High contrast support through theme system
- Clear visual feedback for all actions

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Chess Logic**: chess.js (complete chess rules validation)
- **Board Rendering**: react-chessboard
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Sound**: Web Audio API
- **Notifications**: react-hot-toast

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ChessBoard.tsx          # Main chess board component
│   ├── GameTimer.tsx           # Countdown timer component
│   ├── CapturedPieces.tsx      # Captured pieces display
│   ├── MoveHistory.tsx         # Move list with PGN export
│   ├── GameResult.tsx          # Victory/defeat modal
│   ├── GameControls.tsx        # Resign and draw offer buttons
│   ├── GameModeSelector.tsx    # Time control selection
│   ├── PlayerInfo.tsx          # Player profile display
│   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   └── SoundToggle.tsx         # Sound mute/unmute
├── store/
│   ├── gameStore.ts            # Game state management
│   ├── themeStore.ts           # Theme preferences
│   └── soundStore.ts           # Sound system
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
└── index.css                   # Global styles and animations
```

## How to Play

1. **Start a Game**: Select your preferred time control and click "Start Game"
2. **Make Moves**:
   - Drag and drop pieces to move them
   - Or click a piece, then click the destination square
   - Legal moves are highlighted when a piece is selected
3. **Special Moves**:
   - Castling: Move the king two squares toward the rook
   - En Passant: Automatically available when valid
   - Promotion: Pawns automatically promote to queen (can be extended)
4. **Game Controls**:
   - Offer Draw: Propose a draw to your opponent
   - Resign: Concede the game
   - Flip Board: Change your viewing perspective
5. **Export Game**: Click "Export PGN" in the move history to save the game

## Game Rules Implemented

### Victory Conditions
- **Checkmate**: King is in check and has no legal moves
- **Resignation**: Player chooses to resign
- **Timeout**: Player runs out of time

### Draw Conditions
- **Stalemate**: No legal moves but not in check
- **Threefold Repetition**: Same position occurs three times
- **Fifty-Move Rule**: 50 moves without pawn move or capture
- **Insufficient Material**: Neither player can checkmate
- **Agreement**: Both players agree to a draw

## Future Enhancements

The following features are planned for future releases:

- Real-time multiplayer with WebSocket/Socket.io
- Game lobby with matchmaking
- In-game chat system
- Player rankings and statistics
- Game replay functionality
- Opening book integration
- Analysis board with engine evaluation
- Tournament mode
- Puzzle training mode

## License

MIT
