# Chess Multiplayer Frontend Deployment Guide

This guide covers deploying the Chess Multiplayer frontend application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Backend API running (see backend deployment guide)
- npm or yarn package manager

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend API URL
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🐳 Docker Deployment

### Single Container
```bash
# Build image
docker build -t chess-frontend .

# Run container
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://your-backend-url:3000 \
  -e NEXT_PUBLIC_WS_URL=ws://your-backend-url:3000 \
  chess-frontend
```

### Full Stack with Docker Compose
```bash
# From the chess-frontend directory
docker-compose -f docker-compose.full.yml up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API
- Frontend application

## ☁️ Cloud Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - `NEXT_PUBLIC_WS_URL`: Your WebSocket URL
3. Deploy automatically on push

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `out`
4. Set environment variables in Netlify dashboard

### Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:3000` |
| `NODE_ENV` | Environment | `production` |

## 📱 Mobile Deployment

### Progressive Web App (PWA)
The app includes PWA capabilities:
- Offline support
- Installable on mobile devices
- Push notifications (when implemented)

### Mobile Optimization
- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for mobile performance

## 🔒 Security Considerations

### Content Security Policy
- Configured CSP headers
- XSS protection
- CSRF protection

### HTTPS
- Always use HTTPS in production
- Secure WebSocket connections (WSS)

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run analyze

# Build for production
npm run build
```

### Caching
- Static assets cached
- API responses cached
- Service worker for offline support

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📈 Monitoring

### Health Checks
- Built-in health check endpoint
- Performance monitoring
- Error tracking

### Analytics
- User behavior tracking
- Performance metrics
- Error reporting

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Frontend
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
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Check environment variables

2. **WebSocket Connection Issues**
   - Verify WebSocket URL
   - Check firewall settings
   - Ensure backend is running

3. **Performance Issues**
   - Enable production build
   - Check bundle size
   - Optimize images

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📞 Support

For deployment issues:
1. Check the logs
2. Verify environment variables
3. Test backend connectivity
4. Create an issue in the repository

## 🎯 Best Practices

1. **Environment Management**
   - Use different environments (dev, staging, prod)
   - Never commit secrets
   - Use environment-specific configurations

2. **Performance**
   - Enable compression
   - Use CDN for static assets
   - Optimize images
   - Implement caching

3. **Security**
   - Use HTTPS everywhere
   - Implement CSP
   - Regular security updates
   - Monitor for vulnerabilities

4. **Monitoring**
   - Set up error tracking
   - Monitor performance
   - Track user analytics
   - Set up alerts