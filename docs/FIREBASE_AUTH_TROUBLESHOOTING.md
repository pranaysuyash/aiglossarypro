# Firebase Authentication Troubleshooting Guide

## Common Error: auth/network-request-failed

This error typically occurs when Firebase authentication cannot communicate with Firebase servers. Here are the common causes and solutions:

### 1. CORS Configuration Issues

**Problem**: Firebase Auth Domain not in allowed origins
**Solution**: Already fixed by adding Firebase domains to CORS allowed origins:
```typescript
'https://aiglossarypro.firebaseapp.com', // Firebase Auth Domain
'https://accounts.google.com', // Google OAuth
'https://api.github.com', // GitHub OAuth
```

### 2. Browser Extensions Interference

**Problem**: Ad blockers, privacy extensions, or password managers can interfere with Firebase Auth
**Solution**: 
- Try in incognito mode without extensions
- Disable extensions one by one to identify the culprit
- Common problematic extensions:
  - uBlock Origin
  - Privacy Badger
  - LastPass
  - 1Password
  - Ghostery

### 3. Firebase Configuration

**Problem**: Missing or incorrect Firebase configuration
**Solution**: Verify all Firebase environment variables are set correctly:
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Network/Firewall Issues

**Problem**: Corporate firewall or network blocking Firebase
**Solution**:
- Check if you can access https://aiglossarypro.firebaseapp.com
- Try on a different network (mobile hotspot)
- Check browser console for mixed content warnings

### 5. Local Development Issues

**Problem**: Server not running or misconfigured
**Solution**:
1. Ensure both frontend and backend are running:
   ```bash
   # Terminal 1 - Backend
   npm run dev:server
   
   # Terminal 2 - Frontend
   npm run dev
   ```

2. Check server is accessible:
   ```bash
   curl http://localhost:3001/api/health
   ```

3. Restart both servers if needed

### 6. Firebase Console Configuration

**Problem**: OAuth redirect URIs not configured
**Solution**:
1. Go to Firebase Console > Authentication > Settings
2. Add authorized domains:
   - localhost
   - 127.0.0.1
   - aiglossarypro.com (for production)

3. For Google OAuth, also check:
   - Google Cloud Console > APIs & Services > Credentials
   - Add OAuth 2.0 redirect URIs

### Debugging Steps

1. **Check Browser Console**:
   - Look for specific error messages
   - Check Network tab for failed requests
   - Look for CORS errors

2. **Test in Different Environment**:
   ```bash
   # Test with curl
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

3. **Enable Firebase Debug Mode**:
   ```javascript
   // In firebase.ts
   if (import.meta.env.DEV) {
     console.log('Firebase Config:', firebaseConfig);
     console.log('Auth initialized:', !!auth);
   }
   ```

4. **Check Server Logs**:
   - Look for CORS rejection messages
   - Check for authentication middleware errors

### Quick Fix Checklist

- [ ] Server is running on port 3001
- [ ] Frontend is running on port 3000
- [ ] No browser extensions blocking requests
- [ ] Firebase configuration is correct in .env
- [ ] CORS is properly configured (already fixed)
- [ ] Network allows Firebase connections
- [ ] OAuth redirect URIs are configured in Firebase Console

### Alternative Login Method

If Firebase auth continues to fail, you can use the demo account:
- Email: demo@aiglosspro.com
- Password: demo123456

This uses the same authentication flow but may help identify if the issue is account-specific.