-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
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
    "active_color" TEXT NOT NULL DEFAULT 'white',
    "timer_last_stamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "result" TEXT,
    "winner_id" TEXT,
    "end_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "Game_white_player_id_fkey" FOREIGN KEY ("white_player_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Game_black_player_id_fkey" FOREIGN KEY ("black_player_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("black_player_id", "black_time_remaining", "completed_at", "created_at", "delay_mode", "delay_seconds", "end_reason", "fen_position", "game_mode", "id", "increment_seconds", "pgn", "result", "status", "time_control", "white_player_id", "white_time_remaining", "winner_id") SELECT "black_player_id", "black_time_remaining", "completed_at", "created_at", "delay_mode", "delay_seconds", "end_reason", "fen_position", "game_mode", "id", "increment_seconds", "pgn", "result", "status", "time_control", "white_player_id", "white_time_remaining", "winner_id" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_status_created_at_idx" ON "Game"("status", "created_at");
CREATE INDEX "Game_white_player_id_idx" ON "Game"("white_player_id");
CREATE INDEX "Game_black_player_id_idx" ON "Game"("black_player_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
