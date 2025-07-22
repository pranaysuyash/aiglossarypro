# Fix for Second Login Issue

## Date: July 22, 2025

## Problem
After the first successful login and logout, subsequent login attempts fail with Firebase error `auth/invalid-credential` (400 Bad Request).

## Root Causes Identified

1. **Firebase Auth State Persistence**: Firebase maintains auth state even after logout, causing conflicts on subsequent logins
2. **Service Worker Caching**: Although we fixed the service worker to skip Firebase requests, the cached version might still be active
3. **Auth State Not Fully Cleared**: The logout process might not be completely clearing all Firebase auth state

## Solutions Implemented

### 1. Force Sign Out Before New Login
Added check in `signInWithEmail` to detect and clear any existing user session:
```typescript
// Check if there's an existing user and sign them out first
const currentUser = auth.currentUser;
if (currentUser) {
  console.log('⚠️ Found existing user session, signing out first...');
  try {
    await signOut(auth);
    // Wait a bit for the sign out to propagate
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (signOutError) {
    console.warn('Sign out before login failed:', signOutError);
  }
}
```

### 2. Updated Service Worker Version
Changed cache version to force service worker update:
```javascript
const CACHE_VERSION = 'v2'; // Increment this to force update
```

## Additional Fixes to Consider

### 1. Clear Firebase Persistence on Logout
Add to the logout function:
```javascript
// Clear Firebase persistence
if (auth) {
  await auth.setPersistence(browserSessionPersistence);
}
```

### 2. Force Reload Auth State
After logout, force reload the auth state:
```javascript
await auth.authStateReady();
```

### 3. Add Delay Between Logout and Login
The user might be trying to login too quickly after logout. Add a small delay or disable the login button briefly after logout.

## Testing Instructions

1. Clear browser cache and cookies
2. Open browser DevTools > Application > Service Workers > Unregister all
3. Reload the page
4. Try login -> logout -> login sequence

## Files Modified
- `/client/src/lib/firebase.ts` - Added sign out check before login
- `/client/public/sw.js` - Updated cache version

## Next Steps
If the issue persists, we may need to:
1. Implement a more aggressive Firebase state clearing mechanism
2. Add retry logic with exponential backoff
3. Consider using Firebase's `browserSessionPersistence` instead of `browserLocalPersistence`