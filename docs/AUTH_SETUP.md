# Authentication Setup Guide

## Cost-Free Authentication System

This project now uses a simple JWT + OAuth system that's completely free and works with any cloud provider.

### 🆓 What's Free:
- **JWT tokens** for session management
- **Google OAuth** (free for most usage)
- **GitHub OAuth** (completely free)
- **Your own database** for user storage

### 🔧 Setup Instructions

#### 1. Google OAuth Setup (Free)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
7. For production, add: `https://yourdomain.com/api/auth/google/callback`

#### 2. GitHub OAuth Setup (Free)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3001` (or your domain)
   - Authorization callback URL: `http://localhost:3001/api/auth/github/callback`
4. Click "Register application"

#### 3. Environment Variables
Add these to your `.env` file:

```bash
# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3001/api/auth/github/callback
```

### 🚀 Usage

#### Login URLs:
- Google: `GET /api/auth/google`
- GitHub: `GET /api/auth/github`

#### Authentication:
- Current user: `GET /api/auth/me`
- Logout: `POST /api/auth/logout`

#### In Your Frontend:
```javascript
// Login
window.location.href = '/api/auth/google'; // or /api/auth/github

// Check if logged in
fetch('/api/auth/me')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('User:', data.data);
    }
  });

// Logout
fetch('/api/auth/logout', { method: 'POST' })
  .then(() => window.location.reload());
```

#### In Your API Routes:
```typescript
import { authenticate, requireAdmin } from '../auth/simpleAuth';

// Protected route
app.get('/api/protected', authenticate, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  res.json({ message: 'Hello ' + user.claims.name });
});

// Admin route
app.get('/api/admin', authenticate, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

### 🔒 Security Features:
- HTTP-only cookies for token storage
- 7-day token expiration
- Secure cookies in production
- Admin role management
- CSRF protection through SameSite cookies

### 💰 Cost Comparison:
- **This system**: $0/month
- **Auth0**: $23/month (starts at 1000 users)
- **AWS Cognito**: $0.0055 per MAU (can get expensive)
- **Firebase Auth**: $0.006 per verification

### 🔄 Migration from Replit Auth:
The old Replit auth system is deprecated but still supported as fallback. To fully migrate:

1. Set up Google/GitHub OAuth credentials
2. Add JWT_SECRET to your .env
3. The system will automatically use the new auth
4. Remove Replit auth variables from .env when ready

### 🧪 Development Mode:
Without any OAuth credentials, the system falls back to mock authentication for development.