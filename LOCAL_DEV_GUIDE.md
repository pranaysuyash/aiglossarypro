# Local Development Setup Guide

## Issue Fixed ✅

The blank page and 401 errors were caused by the app trying to use Replit authentication in local development mode. This has been fixed by implementing a **mock authentication system** for local development.

## What Was Changed

1. **Created Mock Authentication System**: `/server/middleware/dev/mockAuth.ts`
   - Provides a test user (`dev@example.com`) for local development
   - Bypasses Replit authentication requirements
   - Automatically creates dev user in database

2. **Updated Route Authentication**: Modified all route files to use conditional authentication:
   - `server/routes/auth.ts`
   - `server/routes/user.ts`
   - `server/routes/admin.ts`
   - Uses real Replit auth in production, mock auth in development

3. **Updated Main Route Setup**: `server/routes/index.ts`
   - Automatically chooses correct authentication system based on environment

## How to Start the Application

### 1. Start the Server (Terminal 1)
```bash
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro
npm run dev
```

### 2. Start the Client (Terminal 2)
```bash
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro
# If you have a separate client dev command:
npm run client:dev
# OR if it's integrated:
# The server should also serve the client in dev mode
```

### 3. Access the Application
- Open your browser to: `http://127.0.0.1:3001`
- You should now see the app without authentication issues
- The app will automatically log you in as "Development User"

## Development User Details

When running locally, you'll be automatically authenticated as:
- **Name**: Development User
- **Email**: dev@example.com
- **ID**: dev-user-123
- **Admin Rights**: Yes (for testing admin features)

## Verifying the Fix

1. **Check Console Logs**: Look for these messages when starting the server:
   ```
   ✅ Mock authentication setup complete (development mode)
   🔓 Development user ensured in database: dev@example.com
   ```

2. **Test Authentication**: Visit `http://127.0.0.1:3001/api/auth/user`
   - Should return user data instead of 401 error

3. **Check Browser Console**: The map error should be gone

## Troubleshooting

### If you still get 401 errors:
1. Make sure `NODE_ENV=development` in your `.env` file
2. Restart the server completely
3. Clear browser cache/cookies

### If server won't start:
1. Check if port 3001 is available: `lsof -i :3001`
2. Kill any existing processes: `pkill -f "node.*server"`
3. Install dependencies: `npm install`

### If database errors:
1. Check your `DATABASE_URL` in `.env`
2. Ensure database is accessible
3. Run migrations if needed: `npm run db:push`

## Production vs Development

| Environment | Authentication | User |
|-------------|----------------|------|
| Development (local) | Mock Auth | dev@example.com |
| Production (Replit) | Replit Auth | Real users |

The app automatically detects the environment and uses the appropriate authentication system.

## Next Steps

Once the app is working locally:
1. All features should be functional with the development user
2. You can test admin features, user favorites, progress tracking, etc.
3. For production deployment, ensure Replit auth credentials are properly configured

## Files Modified

- `server/middleware/dev/mockAuth.ts` (new)
- `server/routes/auth.ts`
- `server/routes/user.ts` 
- `server/routes/admin.ts`
- `server/routes/index.ts`

The mock authentication system is only active when `features.replitAuthEnabled` is false (i.e., when Replit auth credentials are not configured).
