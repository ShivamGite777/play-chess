-- Chess Game Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    elo_rating INTEGER DEFAULT 1200,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    white_player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    black_player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('bullet', 'blitz', 'rapid', 'classical')),
    time_control INTEGER NOT NULL, -- seconds per player
    increment_seconds INTEGER DEFAULT 0, -- Fischer increment
    delay_seconds INTEGER DEFAULT 0, -- Bronstein/Simple delay
    fen_position TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn TEXT DEFAULT '',
    white_time_remaining INTEGER NOT NULL,
    black_time_remaining INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
    result VARCHAR(20) CHECK (result IN ('white_wins', 'black_wins', 'draw')),
    winner_id UUID REFERENCES users(id),
    end_reason VARCHAR(30) CHECK (end_reason IN ('checkmate', 'resignation', 'timeout', 'stalemate', 'draw_agreement', 'abandonment')),
    draw_offer_by UUID REFERENCES users(id),
    draw_offer_at TIMESTAMP,
    spectator_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moves table
CREATE TABLE moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,
    player_color VARCHAR(5) NOT NULL CHECK (player_color IN ('white', 'black')),
    from_square VARCHAR(2) NOT NULL,
    to_square VARCHAR(2) NOT NULL,
    piece VARCHAR(10) NOT NULL,
    notation VARCHAR(20) NOT NULL,
    captured_piece VARCHAR(10),
    is_check BOOLEAN DEFAULT false,
    is_checkmate BOOLEAN DEFAULT false,
    is_castling BOOLEAN DEFAULT false,
    is_en_passant BOOLEAN DEFAULT false,
    is_promotion BOOLEAN DEFAULT false,
    promoted_piece VARCHAR(10),
    time_taken INTEGER, -- milliseconds
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, move_number)
);

-- Game spectators table
CREATE TABLE game_spectators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat' CHECK (message_type IN ('chat', 'system', 'draw_offer', 'resignation')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_elo_rating ON users(elo_rating);
CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_black_player ON games(black_player_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_moves_game_id ON moves(game_id);
CREATE INDEX idx_moves_timestamp ON moves(timestamp);
CREATE INDEX idx_chat_game_id ON chat_messages(game_id);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update games played
        UPDATE users SET games_played = games_played + 1 WHERE id = NEW.white_player_id;
        UPDATE users SET games_played = games_played + 1 WHERE id = NEW.black_player_id;
        
        -- Update wins/losses/draws
        IF NEW.result = 'white_wins' THEN
            UPDATE users SET games_won = games_won + 1 WHERE id = NEW.white_player_id;
            UPDATE users SET games_lost = games_lost + 1 WHERE id = NEW.black_player_id;
        ELSIF NEW.result = 'black_wins' THEN
            UPDATE users SET games_won = games_won + 1 WHERE id = NEW.black_player_id;
            UPDATE users SET games_lost = games_lost + 1 WHERE id = NEW.white_player_id;
        ELSIF NEW.result = 'draw' THEN
            UPDATE users SET games_drawn = games_drawn + 1 WHERE id = NEW.white_player_id;
            UPDATE users SET games_drawn = games_drawn + 1 WHERE id = NEW.black_player_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stats_trigger AFTER UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();