# Development Setup Guide

## Quick Start

The easiest way to start the development environment is using our smart development script that automatically handles port conflicts and process management:

```bash
npm run dev
```

This command will:
- ✅ Automatically detect and kill existing processes using ports 3001 and 5173
- 🧹 Clean up any orphaned development processes
- 🚀 Start both backend and frontend servers
- 📊 Check server status and display ready URLs
- 🛡️ Handle graceful shutdown with Ctrl+C

## Available Development Commands

### Primary Commands
- `npm run dev` - **Recommended**: Smart development script with automatic port management
- `npm run start:dev` - Alias for `npm run dev`
- `npm run dev:smart` - Alias for `npm run dev`

### Alternative Commands
- `npm run dev:basic` - Basic concurrent start (no port management)
- `npm run dev:server` - Start backend server only
- `npm run dev:client` - Start frontend client only

## Development Environment

### Ports
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:3001
- **API Documentation (Swagger)**: http://localhost:3001/api/docs

### Features of Smart Development Script

#### Automatic Port Management
- Detects processes using ports 3001 and 5173
- Safely terminates conflicting processes
- Prevents "port already in use" errors

#### Process Cleanup
- Kills orphaned npm/tsx/vite processes
- Ensures clean environment on each start
- Graceful shutdown handling

#### Status Monitoring
- Waits for servers to be ready
- Displays server status with colored output
- Shows accessible URLs when ready

#### Error Handling
- Comprehensive error reporting
- Fallback mechanisms for process cleanup
- Clear status messages throughout startup

## Manual Port Management

If you need to manually clean up ports:

```bash
# Check what's using the ports
lsof -i:3001 -i:5173

# Kill specific processes
kill -9 <PID>

# Or kill all related processes
pkill -f "npm run dev"
pkill -f "tsx server/index.ts"
pkill -f "vite"
```

## Troubleshooting

### Port Already in Use
The smart development script automatically handles this, but if you're using `dev:basic`:
```bash
# Kill processes using our ports
lsof -ti:3001,5173 | xargs kill -9
```

### Stuck Processes
```bash
# Nuclear option - kills all node processes (use with caution)
pkill -f node
```

### Cache Issues
```bash
# Clear npm cache
npm cache clean --force

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Issues
```bash
# Check database status
npm run db:status

# Push schema changes
npm run db:push

# Open database studio
npm run db:studio
```

## Development Workflow

1. **Start Development Environment**
   ```bash
   npm run dev
   ```

2. **Access Applications**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs

3. **Stop Development Environment**
   - Press `Ctrl+C` in the terminal
   - The script will automatically clean up all processes

## Performance Monitoring

### React Performance
```bash
# Start with React Scan monitoring
npm run dev:scan

# Generate performance report
npm run dev:scan:report
```

### Performance Analysis
```bash
# Analyze performance metrics
npm run perf:analyze

# Generate performance dashboard
npm run perf:dashboard
```

## Testing

### Run Tests
```bash
# Unit tests
npm run test:unit

# Component tests
npm run test:component

# Visual tests
npm run test:visual

# All tests
npm run test:all
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage in UI
npm run test:ui
```

## Building for Production

```bash
# Standard build
npm run build

# Build with CDN optimization
npm run build:cdn

# Analyze bundle size
npm run build:analyze
```

## Environment Variables

Create a `.env` file in the project root with:

```env
# Database
DATABASE_URL="your_database_url"

# Redis (for caching and job queues)
REDIS_URL="your_redis_url"

# Authentication (optional - uses mock auth in development)
JWT_SECRET="your_jwt_secret"

# External APIs (optional)
OPENAI_API_KEY="your_openai_key"

# Image optimization (optional)
VITE_CLOUDINARY_CLOUD_NAME="your_cloudinary_name"
VITE_IMAGEKIT_PUBLIC_KEY="your_imagekit_key"
```

## IDE Setup

### VS Code Extensions
- ESLint
- Prettier
- TypeScript Hero
- Auto Rename Tag
- Bracket Pair Colorizer

### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Tips for Development

1. **Use the smart development script** (`npm run dev`) for the best experience
2. **Check the terminal output** - it provides helpful status information
3. **Use Ctrl+C to stop** - don't kill the terminal, let the script clean up
4. **Check the API docs** at http://localhost:3001/api/docs for available endpoints
5. **Monitor the cache warming** - initial startup may take a moment while cache warms up

## Common Issues and Solutions

### Issue: "Cannot find module" errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript compilation errors
**Solution**:
```bash
npm run check
```

### Issue: Database connection errors
**Solution**: Check your `.env` file and ensure DATABASE_URL is correct

### Issue: Redis connection errors
**Solution**: Either set up Redis or the app will fall back to in-memory caching

---

For more detailed information, check the other documentation files in the `docs/` directory. 