# Firebase Authentication Setup Guide

This guide will walk you through setting up Firebase Authentication for AI/ML Glossary Pro.

## 📋 Prerequisites

- A Google account
- Access to Firebase Console
- Your production domain (for OAuth redirects)

## 🚀 Quick Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it "AI ML Glossary Pro"
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, click "Authentication" in the sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click, enable, and save
   - **Google**: Click, enable, add project public name, select support email, and save
   - **GitHub**: 
     - Click and enable
     - You'll need Client ID and Secret from GitHub (see GitHub OAuth section below)
     - Add the callback URL shown to your GitHub app

### 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Under "Your apps", click the web icon (</>) to add a web app
3. Register app with nickname "AI ML Glossary Web"
4. Copy the Firebase configuration object

### 4. Generate Service Account Key

1. In Project Settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Save the downloaded JSON file securely

### 5. Configure Environment Variables

Add these to your `.env` file:

```bash
# Firebase Client SDK (for frontend) - Add to .env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (for backend) - From service account JSON
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

### 6. Set Up GitHub OAuth (for Firebase)

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: AI/ML Glossary Pro
   - **Homepage URL**: https://your-domain.com
   - **Authorization callback URL**: Get this from Firebase Console (GitHub sign-in method)
4. Save Client ID and Secret
5. Add them to Firebase Console GitHub provider settings

### 7. Configure Authorized Domains

1. In Firebase Console → Authentication → Settings
2. Under "Authorized domains", add:
   - `localhost` (for development)
   - Your production domain

## 🔧 Implementation Steps

### 1. Update Backend Routes

Register Firebase auth routes in your server:

```typescript
// server/index.ts
import { registerFirebaseAuthRoutes } from './routes/firebaseAuth';

// After other route registrations
registerFirebaseAuthRoutes(app);
```

### 2. Update Frontend Auth

Replace the existing LoginPage with FirebaseLoginPage:

```typescript
// client/src/App.tsx
import FirebaseLoginPage from '@/components/FirebaseLoginPage';

// In routes
<Route path="/login" component={FirebaseLoginPage} />
```

### 3. Update API Client

Ensure your API client includes the auth token:

```typescript
// client/src/lib/api.ts
const token = localStorage.getItem('authToken');
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

### 4. Initialize Firebase Admin

Add to your server startup:

```typescript
// server/index.ts
import { initializeFirebaseAdmin } from './config/firebase';

// Early in server startup
initializeFirebaseAdmin();
```

## 🧪 Testing

### 1. Test Authentication Providers

```bash
# Check if Firebase is configured
curl http://localhost:3001/api/auth/providers

# Should return:
{
  "success": true,
  "data": {
    "firebase": true,
    "google": true,
    "github": true,
    "email": true
  }
}
```

### 2. Test Login Flow

1. Start dev server: `npm run dev`
2. Navigate to `/login`
3. Test each sign-in method:
   - Google OAuth
   - GitHub OAuth  
   - Email/Password registration and login

### 3. Verify User Creation

Check that users are created in both:
- Firebase Console → Authentication → Users
- Your PostgreSQL database

## 🛡️ Security Configuration

### 1. Enable Security Rules

In Firebase Console → Authentication → Settings:
- Enable "Email enumeration protection"
- Configure password policy (minimum length, require special chars, etc.)

### 2. Set Admin Users

To make a user admin:

```sql
-- In your database
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

Or via Firebase custom claims:

```typescript
// In your admin backend code
await setCustomUserClaims(uid, { admin: true });
```

### 3. Rate Limiting

Firebase automatically rate limits authentication attempts. Additional rate limiting is handled by your Express middleware.

## 🚨 Troubleshooting

### "Permission denied" errors
- Check that service account has proper roles in Google Cloud Console
- Verify FIREBASE_PRIVATE_KEY has proper newline characters

### OAuth redirect errors
- Ensure callback URLs match exactly in OAuth provider settings
- Check authorized domains in Firebase Console

### Users not saving to database
- Verify database connection
- Check that user creation includes all required fields
- Look for errors in server logs

### Token verification failures
- Ensure Firebase Admin SDK is initialized
- Check that client and admin use same project
- Verify environment variables are loaded

## 📱 Mobile App Support

If you plan to add mobile apps later:
1. Add iOS/Android apps in Firebase Console
2. Download respective config files
3. Firebase Auth will work seamlessly across platforms

## 🔄 Migration from Existing Auth

If you have existing users:

```typescript
// Migration script example
async function migrateUsers() {
  const existingUsers = await db.select().from(users);
  
  for (const user of existingUsers) {
    try {
      const firebaseUser = await createFirebaseUser(
        user.email,
        generateTempPassword(), // Or prompt for password reset
        `${user.firstName} ${user.lastName}`
      );
      
      await db.update(users)
        .set({ firebaseUid: firebaseUser.uid })
        .where(eq(users.id, user.id));
        
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error);
    }
  }
}
```

## ✅ Production Checklist

- [ ] Remove test users from Firebase Console
- [ ] Enable security rules and email protection
- [ ] Set up custom domain for auth (optional)
- [ ] Configure email templates in Firebase Console
- [ ] Set up monitoring alerts for auth failures
- [ ] Document admin user creation process
- [ ] Test password reset flow
- [ ] Verify OAuth works with production domains