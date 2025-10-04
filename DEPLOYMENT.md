# Deployment Guide for Chess Multiplayer API

This Node.js backend API requires specific deployment considerations due to its real-time features and database dependencies.

## ⚠️ Important Note

**Netlify is primarily designed for static sites and JAMstack applications.** While we've created a basic setup for Netlify, this chess API has limitations when deployed as serverless functions:

- ❌ No WebSocket support (Socket.io won't work)
- ❌ No persistent connections
- ❌ No Redis caching
- ❌ Limited database connection pooling
- ❌ Cold start delays

## 🚀 Recommended Deployment Platforms

### 1. Railway.app (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Pros:**
- ✅ Full Node.js support
- ✅ WebSocket support
- ✅ PostgreSQL and Redis add-ons
- ✅ Automatic deployments from Git
- ✅ Free tier available

### 2. Render.com
```bash
# Connect your GitHub repository
# Set build command: npm run build
# Set start command: npm start
# Add PostgreSQL and Redis services
```

**Pros:**
- ✅ Full Node.js support
- ✅ WebSocket support
- ✅ Managed databases
- ✅ Free tier available

### 3. DigitalOcean App Platform
```bash
# Connect your GitHub repository
# Set build command: npm run build
# Set start command: npm start
# Add PostgreSQL and Redis databases
```

**Pros:**
- ✅ Full Node.js support
- ✅ WebSocket support
- ✅ Managed databases
- ✅ Good performance

### 4. Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and deploy
heroku login
heroku create your-chess-api
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

**Pros:**
- ✅ Full Node.js support
- ✅ WebSocket support
- ✅ Add-ons for databases
- ✅ Easy deployment

### 5. Docker Deployment (VPS)
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run individual container
docker build -t chess-api .
docker run -p 3000:3000 --env-file .env chess-api
```

**Pros:**
- ✅ Full control
- ✅ Best performance
- ✅ All features supported
- ✅ Cost-effective for production

## 🔧 Environment Variables

Set these environment variables on your deployment platform:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=chess_game
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Game Configuration
MAX_GAMES_PER_USER=5
GAME_CLEANUP_INTERVAL=3600000
TIMER_SYNC_INTERVAL=1000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
```

## 📊 Database Setup

### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE chess_game;

-- Run migrations
npm run migrate
```

### Redis Setup
```bash
# Install Redis
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
# Clone repository
git clone <your-repo>
cd multiplayer-chess-backend

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f chess-api
```

### Manual Docker Deployment
```bash
# Build image
docker build -t chess-api .

# Run with external database
docker run -d \
  --name chess-api \
  -p 3000:3000 \
  --env-file .env \
  chess-api
```

## 🔍 Health Checks

After deployment, verify your API is working:

```bash
# Health check
curl https://your-api-domain.com/api/health

# Expected response
{
  "success": true,
  "message": "Chess API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 📈 Monitoring

### Logs
- Check application logs for errors
- Monitor database connections
- Watch Redis memory usage

### Performance
- Monitor response times
- Check WebSocket connections
- Track database query performance

### Security
- Monitor failed login attempts
- Check for suspicious API usage
- Review rate limiting effectiveness

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Check Redis server status
   - Verify Redis credentials
   - Check Redis memory limits

3. **WebSocket Not Working**
   - Ensure platform supports WebSockets
   - Check firewall settings
   - Verify Socket.io configuration

4. **Rate Limiting Too Strict**
   - Adjust rate limit settings
   - Check for legitimate traffic patterns
   - Monitor for abuse

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development LOG_LEVEL=debug npm start
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - uses: railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 💡 Best Practices

1. **Environment Variables**
   - Never commit secrets to Git
   - Use different environments (dev, staging, prod)
   - Rotate secrets regularly

2. **Database**
   - Use connection pooling
   - Monitor query performance
   - Regular backups

3. **Security**
   - Enable HTTPS
   - Use strong JWT secrets
   - Implement rate limiting
   - Monitor for attacks

4. **Performance**
   - Use Redis for caching
   - Optimize database queries
   - Monitor memory usage
   - Scale horizontally when needed

5. **Monitoring**
   - Set up health checks
   - Monitor error rates
   - Track performance metrics
   - Set up alerts

## 📞 Support

If you encounter issues during deployment:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure database and Redis are accessible
4. Test the health endpoint
5. Review the troubleshooting section above

For additional help, create an issue in the repository or contact the development team.