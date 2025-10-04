const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Game = require('../../src/models/Game');
const { generateTokenPair } = require('../../src/utils/jwt');

describe('Game API Integration Tests', () => {
  let user1, user2;
  let token1, token2;
  let testGame;

  beforeAll(async () => {
    // Create test users
    user1 = await User.create({
      username: 'player1',
      email: 'player1@example.com',
      password: 'Password123'
    });

    user2 = await User.create({
      username: 'player2',
      email: 'player2@example.com',
      password: 'Password123'
    });

    const tokens1 = generateTokenPair(user1);
    const tokens2 = generateTokenPair(user2);
    token1 = tokens1.accessToken;
    token2 = tokens2.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    const { query } = require('../../src/database/connection');
    await query('DELETE FROM users WHERE id IN ($1, $2)', [user1.id, user2.id]);
  });

  describe('Game Creation and Management', () => {
    it('should create a new game', async () => {
      const gameData = {
        game_mode: 'blitz',
        time_control: 300, // 5 minutes
        increment_seconds: 5
      };

      const response = await request(app)
        .post('/api/games/create')
        .set('Authorization', `Bearer ${token1}`)
        .send(gameData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.game.white_player_id).toBe(user1.id);
      expect(response.body.game.game_mode).toBe('blitz');
      expect(response.body.game.status).toBe('waiting');

      testGame = response.body.game;
    });

    it('should join a game', async () => {
      const response = await request(app)
        .post(`/api/games/${testGame.id}/join`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.game.black_player_id).toBe(user2.id);
      expect(response.body.game.status).toBe('active');
    });

    it('should get game details', async () => {
      const response = await request(app)
        .get(`/api/games/${testGame.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.game.id).toBe(testGame.id);
      expect(response.body.game.white_player).toBeDefined();
      expect(response.body.game.black_player).toBeDefined();
      expect(response.body.isPlayer).toBe(true);
    });
  });

  describe('Game Moves', () => {
    it('should make a valid move', async () => {
      const moveData = {
        from: 'e2',
        to: 'e4'
      };

      const response = await request(app)
        .post(`/api/games/${testGame.id}/move`)
        .set('Authorization', `Bearer ${token1}`)
        .send(moveData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.move).toBeDefined();
      expect(response.body.gameState).toBeDefined();
      expect(response.body.gameState.fen).toBeDefined();
    });

    it('should fail to make invalid move', async () => {
      const moveData = {
        from: 'e4',
        to: 'e6' // Invalid move from e4
      };

      const response = await request(app)
        .post(`/api/games/${testGame.id}/move`)
        .set('Authorization', `Bearer ${token1}`)
        .send(moveData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail to make move out of turn', async () => {
      const moveData = {
        from: 'e7',
        to: 'e5'
      };

      // Player 2 tries to move when it's player 1's turn
      const response = await request(app)
        .post(`/api/games/${testGame.id}/move`)
        .set('Authorization', `Bearer ${token2}`)
        .send(moveData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('turn');
    });
  });

  describe('Game Actions', () => {
    it('should offer a draw', async () => {
      const response = await request(app)
        .post(`/api/games/${testGame.id}/draw`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ action: 'offer' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('offer');
    });

    it('should accept a draw', async () => {
      const response = await request(app)
        .post(`/api/games/${testGame.id}/draw`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ action: 'accept' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('accept');
    });

    it('should get game history', async () => {
      const response = await request(app)
        .get(`/api/games/${testGame.id}/history`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.moves).toBeDefined();
      expect(response.body.stats).toBeDefined();
    });
  });

  describe('Game Lobby', () => {
    it('should get lobby games', async () => {
      const response = await request(app)
        .get('/api/games/lobby')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.games).toBeDefined();
      expect(Array.isArray(response.body.games)).toBe(true);
    });

    it('should get user active games', async () => {
      const response = await request(app)
        .get('/api/games/my-games')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.games).toBeDefined();
      expect(Array.isArray(response.body.games)).toBe(true);
    });
  });
});