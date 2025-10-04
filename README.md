# Multiplayer Chess Game Backend API

A robust backend API for a multiplayer chess game with real-time features, built with Node.js, Express, Socket.io, and PostgreSQL.

## Features

### Core Functionality
- ✅ RESTful API with WebSocket support for real-time gameplay
- ✅ JWT-based user authentication and authorization
- ✅ Game room management (create, join, leave, spectate)
- ✅ Server-side chess rules validation using chess.js
- ✅ Support for multiple concurrent games
- ✅ Real-time game state synchronization
- ✅ Server-side timer management with multiple time controls
- ✅ ELO rating system

### Game Modes
- **Bullet**: 1 minute per player
- **Blitz**: 3-5 minutes per player
- **Rapid**: 10-30 minutes per player
- **Classical**: 30+ minutes per player
- **Increment modes**: Fischer (add seconds per move)
- **Delay modes**: Bronstein, Simple delay

### Real-time Features
- Live move broadcasting
- Timer synchronization
- Chat messages
- Draw offers and responses
- Resignation handling
- Reconnection handling with game state recovery
- Spectator support

### Security & Performance
- Rate limiting on all endpoints
- Input sanitization and validation
- Server-side move validation (never trust client)
- Secure WebSocket connections
- CORS configuration
- SQL injection prevention
- Redis caching for performance

## Tech Stack

- **Backend**: Node.js, Express.js
- **Real-time**: Socket.io
- **Database**: PostgreSQL
- **Cache**: Redis
- **Chess Engine**: chess.js
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest, Supertest
- **Logging**: Winston

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multiplayer-chess-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=chess_game
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb chess_game
   
   # Run migrations
   npm run migrate
   ```

5. **Set up Redis** (optional, for caching and sessions)
   ```bash
   # Install and start Redis
   redis-server
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update user profile
- `POST /api/auth/refresh-token` - Refresh access token

### Games
- `GET /api/games/lobby` - Get available games
- `POST /api/games/create` - Create new game
- `POST /api/games/:id/join` - Join game
- `GET /api/games/:id` - Get game details
- `POST /api/games/:id/move` - Make a move
- `POST /api/games/:id/resign` - Resign from game
- `POST /api/games/:id/draw` - Offer/accept/decline draw
- `GET /api/games/:id/history` - Get game move history
- `GET /api/games/my-games` - Get user's active games

### Users
- `GET /api/users/:id/profile` - Get user profile
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:id/game-history` - Get user's game history
- `GET /api/users/leaderboard` - Get leaderboard
- `GET /api/users/search` - Search users

### Health Check
- `GET /api/health` - API health status

## WebSocket Events

### Client to Server
- `join_game` - Join a game room
- `leave_game` - Leave a game room
- `make_move` - Make a chess move
- `chat_message` - Send chat message
- `draw_offer` - Offer/accept/decline draw
- `resign` - Resign from game
- `spectate_game` - Start spectating a game
- `ping` - Ping for connection health

### Server to Client
- `connected` - Connection established
- `game_joined` - Successfully joined game
- `game_left` - Successfully left game
- `move_made` - Move was made
- `chat_message` - Chat message received
- `draw_offered` - Draw offer received
- `draw_accepted` - Draw was accepted
- `draw_declined` - Draw was declined
- `player_resigned` - Player resigned
- `game_completed` - Game ended
- `player_joined` - Player joined game
- `player_left` - Player left game
- `timer_sync` - Timer synchronization
- `error` - Error occurred

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `username` (VARCHAR) - Unique username
- `email` (VARCHAR) - Unique email
- `password_hash` (VARCHAR) - Hashed password
- `avatar_url` (VARCHAR) - Profile picture URL
- `elo_rating` (INTEGER) - Current ELO rating
- `games_played` (INTEGER) - Total games played
- `games_won` (INTEGER) - Games won
- `games_lost` (INTEGER) - Games lost
- `games_drawn` (INTEGER) - Games drawn
- `is_active` (BOOLEAN) - Account status
- `last_login` (TIMESTAMP) - Last login time
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

### Games Table
- `id` (UUID) - Primary key
- `white_player_id` (UUID) - White player user ID
- `black_player_id` (UUID) - Black player user ID
- `game_mode` (VARCHAR) - Game mode (bullet, blitz, rapid, classical)
- `time_control` (INTEGER) - Time per player in seconds
- `increment_seconds` (INTEGER) - Fischer increment
- `delay_seconds` (INTEGER) - Bronstein/Simple delay
- `fen_position` (TEXT) - Current board position
- `pgn` (TEXT) - Move history in PGN format
- `white_time_remaining` (INTEGER) - White player's remaining time
- `black_time_remaining` (INTEGER) - Black player's remaining time
- `status` (VARCHAR) - Game status (waiting, active, completed, abandoned)
- `result` (VARCHAR) - Game result (white_wins, black_wins, draw)
- `winner_id` (UUID) - Winner's user ID
- `end_reason` (VARCHAR) - How the game ended
- `draw_offer_by` (UUID) - Who offered draw
- `draw_offer_at` (TIMESTAMP) - When draw was offered
- `spectator_count` (INTEGER) - Number of spectators
- `created_at` (TIMESTAMP) - Game creation time
- `completed_at` (TIMESTAMP) - Game completion time

### Moves Table
- `id` (UUID) - Primary key
- `game_id` (UUID) - Game ID
- `move_number` (INTEGER) - Move number in game
- `player_color` (VARCHAR) - Player color (white/black)
- `from_square` (VARCHAR) - Source square
- `to_square` (VARCHAR) - Destination square
- `piece` (VARCHAR) - Piece moved
- `notation` (VARCHAR) - Algebraic notation
- `captured_piece` (VARCHAR) - Captured piece (if any)
- `is_check` (BOOLEAN) - Was this a check?
- `is_checkmate` (BOOLEAN) - Was this checkmate?
- `is_castling` (BOOLEAN) - Was this castling?
- `is_en_passant` (BOOLEAN) - Was this en passant?
- `is_promotion` (BOOLEAN) - Was this a promotion?
- `promoted_piece` (VARCHAR) - Piece promoted to
- `time_taken` (INTEGER) - Time taken for move in milliseconds
- `timestamp` (TIMESTAMP) - When move was made

## Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Development

### Project Structure
```
src/
├── controllers/     # API route handlers
├── models/         # Database models
├── middleware/      # Express middleware
├── routes/         # API routes
├── services/       # Business logic services
├── utils/          # Utility functions
├── database/       # Database connection and migrations
├── websocket/      # WebSocket handlers
└── server.js       # Main server file
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with test data

### Environment Variables
See `.env.example` for all available environment variables.

## Security Considerations

- All chess moves are validated server-side using chess.js
- Rate limiting prevents abuse
- Input sanitization prevents XSS
- SQL injection prevention through parameterized queries
- JWT tokens for authentication
- Secure WebSocket connections
- CORS configuration
- Helmet for security headers

## Performance Optimizations

- Redis caching for active games
- Database indexing on frequently queried fields
- Connection pooling
- Compression middleware
- Efficient WebSocket room management
- Timer service for game time management

## Deployment

### Docker (Recommended)
```bash
# Build image
docker build -t chess-api .

# Run container
docker run -p 3000:3000 --env-file .env chess-api
```

### Manual Deployment
1. Set up PostgreSQL and Redis servers
2. Configure environment variables
3. Run database migrations
4. Start the application with PM2 or similar process manager

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository or contact the development team.