-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "elo_rating" INTEGER NOT NULL DEFAULT 1200,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "games_won" INTEGER NOT NULL DEFAULT 0,
    "games_lost" INTEGER NOT NULL DEFAULT 0,
    "games_drawn" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "white_player_id" TEXT,
    "black_player_id" TEXT,
    "game_mode" TEXT NOT NULL,
    "time_control" INTEGER NOT NULL,
    "increment_seconds" INTEGER NOT NULL DEFAULT 0,
    "delay_seconds" INTEGER,
    "delay_mode" TEXT NOT NULL DEFAULT 'none',
    "fen_position" TEXT NOT NULL,
    "pgn" TEXT NOT NULL DEFAULT '',
    "white_time_remaining" INTEGER NOT NULL,
    "black_time_remaining" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "result" TEXT,
    "winner_id" TEXT,
    "end_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "Game_white_player_id_fkey" FOREIGN KEY ("white_player_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Game_black_player_id_fkey" FOREIGN KEY ("black_player_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Move" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "move_number" INTEGER NOT NULL,
    "player_color" TEXT NOT NULL,
    "from_square" TEXT NOT NULL,
    "to_square" TEXT NOT NULL,
    "piece" TEXT NOT NULL,
    "notation" TEXT NOT NULL,
    "captured_piece" TEXT,
    "is_check" BOOLEAN NOT NULL DEFAULT false,
    "is_checkmate" BOOLEAN NOT NULL DEFAULT false,
    "is_castling" BOOLEAN NOT NULL DEFAULT false,
    "time_taken" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Move_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Game_status_created_at_idx" ON "Game"("status", "created_at");

-- CreateIndex
CREATE INDEX "Game_white_player_id_idx" ON "Game"("white_player_id");

-- CreateIndex
CREATE INDEX "Game_black_player_id_idx" ON "Game"("black_player_id");

-- CreateIndex
CREATE INDEX "Move_game_id_move_number_idx" ON "Move"("game_id", "move_number");
