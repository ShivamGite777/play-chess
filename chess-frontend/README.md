# Chess Multiplayer Frontend - Revamped

A modern, production-ready frontend for a real-time multiplayer chess application built with React, TypeScript, and Vite.

## 🚀 Features

### Core Gameplay
- **Dynamic 8x8 chessboard** with alternating square colors
- **Drag-and-drop piece movement** with visual feedback
- **Click-to-move alternative** for accessibility
- **Animated piece transitions** using CSS transforms (300ms easing)
- **Move validation** with immediate visual feedback
- **Captured pieces display** on both sides of the board
- **Move history panel** with algebraic notation
- **Game timer** with countdown for timed matches
- **Check/checkmate visual indicators**

### Real-Time Multiplayer
- **WebSocket integration** for live move synchronization
- **Opponent connection status** with latency indicator
- **Game state updates** and reconnection handling
- **Chat messages** (optional)

### User Interface
- **Modern responsive design** optimized for all devices
- **Dark/Light theme** with system preference detection
- **Accessibility features** (WCAG 2.1 AA compliant)
- **Sound effects** with volume control
- **Smooth animations** and transitions

## 🛠 Technology Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with CSS Grid/Flexbox
- **State Management**: Context API for global state
- **WebSocket**: Socket.io-client for real-time communication
- **Chess Logic**: chess.js library for move validation
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📁 Project Structure

```
src/
├── components/
│   ├── Board/              # Chess board components
│   │   ├── Board.tsx      # Main board component
│   │   ├── Square/         # Square component
│   │   └── Piece/          # Piece component
│   ├── Game/               # Game-related components
│   ├── Lobby/              # Lobby components
│   ├── Auth/               # Authentication components
│   ├── Profile/            # User profile components
│   └── shared/             # Shared components
│       ├── Layout/         # Layout components
│       ├── Navigation/     # Navigation components
│       └── Modal/          # Modal components
├── contexts/               # React contexts
│   ├── ThemeContext.tsx    # Theme management
│   ├── AuthContext.tsx     # Authentication state
│   └── WebSocketContext.tsx # WebSocket management
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
│   ├── api.ts             # API client
│   └── sounds.ts          # Sound effects
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles
    └── index.css          # Tailwind CSS and custom styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend API URL:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=ws://localhost:3000
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🎮 Usage

### Basic Gameplay
1. **Select a piece** by clicking on it
2. **Move the piece** by clicking on a highlighted square
3. **Drag and drop** pieces for intuitive movement
4. **Use keyboard navigation** for accessibility

### Keyboard Shortcuts
- `Tab` - Navigate through interactive elements
- `Arrow Keys` - Navigate board squares
- `Enter/Space` - Select and move pieces
- `Escape` - Cancel piece selection
- `?` - Show help overlay
- `Ctrl + Z` - Request takeback
- `Ctrl + D` - Offer draw

### Accessibility Features
- **Screen reader support** with proper ARIA labels
- **Keyboard navigation** for all functionality
- **High contrast mode** for better visibility
- **Pattern overlay** for colorblind users
- **Scalable UI** with rem/em units

## 🎨 Customization

### Themes
The app supports three theme modes:
- **Light**: Traditional chess colors
- **Dark**: Dark theme with navy/teal squares
- **Auto**: Follows system preference

### Sound Effects
- Move piece sounds
- Capture sounds
- Check alerts
- Game end sounds
- Toggle-able with volume control

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:ui
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment

The app can be deployed to:
- **Vercel** (recommended for Vite)
- **Netlify**
- **Railway**
- **Docker** (see Dockerfile)

## 🔧 Development

### Code Quality
- **TypeScript strict mode** enabled
- **ESLint** for code linting
- **Prettier** for code formatting
- **Component structure** following React best practices

### Performance Optimizations
- **Code splitting** by route
- **Lazy loading** for components
- **Memoization** with React.memo
- **Debounced WebSocket events**
- **Optimized bundle** with manual chunks

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

### Mobile Optimizations
- **Touch-friendly targets** (minimum 44x44px)
- **Swipe gestures** for navigation
- **Collapsible panels** for move history
- **Virtual keyboard handling**

## 🎯 Performance Metrics

Target performance goals:
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)
- **Move Latency**: <100ms
- **Bundle Size**: <500KB gzipped
- **First Contentful Paint**: <1.5s

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team