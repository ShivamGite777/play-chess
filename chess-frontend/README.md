# Chess Multiplayer Frontend

A modern, responsive multiplayer chess game built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🎮 Core Gameplay
- **Full Chess Implementation**: All FIDE rules including castling, en passant, pawn promotion, check, checkmate, stalemate
- **Real-time Multiplayer**: WebSocket-based real-time gameplay with live move synchronization
- **Multiple Time Controls**: Bullet (1 min), Blitz (3-5 min), Rapid (10-30 min), Classical (30+ min)
- **Increment/Delay Modes**: Fischer increment and Bronstein/Simple delay support
- **Live Timers**: Real-time countdown timers with low-time warnings
- **Move Validation**: Server-side validation using chess.js (never trust client)

### 🎨 UI/UX Design
- **Modern Interface**: Clean, intuitive design with smooth animations
- **Dark/Light Themes**: Automatic theme detection with manual toggle
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Smooth Animations**: 300-500ms transitions for piece movements
- **Drag & Drop**: Intuitive piece movement with click-to-move alternative
- **Board Flip**: Switch perspective option
- **Visual Feedback**: Legal move highlighting, check indicators, last move highlighting

### 🔊 Sound Effects
- **Comprehensive Audio**: Move sounds, capture sounds, check alerts, victory fanfare
- **Contextual Sounds**: Different sounds for different actions (castling, promotion, etc.)
- **Timer Warnings**: Urgent ticking sounds for low time
- **Mute Toggle**: Easy sound control with volume adjustment

### 🏆 Game Features
- **Game Lobby**: Browse and join available games
- **Player Profiles**: Avatars, ratings, statistics
- **Chat System**: In-game chat with emoji support
- **Draw Offers**: Offer, accept, or decline draw requests
- **Resignation**: Clean resignation handling
- **Spectator Mode**: Watch games in real-time
- **Game History**: Move history with algebraic notation
- **PGN Export**: Save games in standard format

### ♿ Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with screen readers
- **High Contrast**: High contrast mode option
- **Font Sizing**: Adjustable font sizes
- **Focus Management**: Proper focus indicators

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Chess Logic**: chess.js
- **Real-time**: Socket.io Client
- **Notifications**: React Hot Toast
- **Sound**: Howler.js
- **Icons**: Lucide React
- **Effects**: React Confetti

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chess-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your backend API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=ws://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── game/              # Game pages
│   ├── lobby/             # Lobby page
│   └── profile/           # Profile pages
├── components/            # React components
│   ├── chess/            # Chess-specific components
│   ├── game/             # Game UI components
│   ├── ui/               # Reusable UI components
│   └── providers.tsx     # App providers
├── lib/                   # Utility libraries
│   ├── api.ts            # API client
│   ├── socket.ts         # WebSocket manager
│   └── sounds.ts         # Sound effects
├── stores/               # Zustand stores
│   ├── authStore.ts      # Authentication state
│   ├── gameStore.ts      # Game state
│   └── settingsStore.ts  # User settings
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Key Components

### Chess Board (`ChessBoard.tsx`)
- Interactive chess board with piece movement
- Legal move highlighting
- Drag and drop support
- Visual feedback for checks and captures

### Game Timer (`GameTimer.tsx`)
- Real-time countdown timers
- Low time warnings with visual indicators
- Sound alerts for critical time

### WebSocket Manager (`socket.ts`)
- Handles real-time communication
- Automatic reconnection
- Event handling for all game actions

### Sound Manager (`sounds.ts`)
- Comprehensive sound effects
- Volume control
- Context-aware audio feedback

## State Management

The app uses Zustand for state management with three main stores:

- **AuthStore**: User authentication and profile data
- **GameStore**: Current game state, moves, and UI state
- **SettingsStore**: User preferences and settings

## API Integration

The frontend communicates with the backend through:

- **REST API**: Authentication, game management, user data
- **WebSocket**: Real-time game events, moves, chat

## Responsive Design

The app is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Built-in bundle analyzer
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment

The app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Docker** (see Dockerfile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team