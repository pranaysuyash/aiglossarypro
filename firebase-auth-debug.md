# Firebase Auth Network Error Debug Guide

## Problem Summary
- Firebase `signInWithEmailAndPassword` times out after 60 seconds with "Network Error"
- Works from Node.js (353ms response time)
- Service worker is configured to skip Firebase requests
- DNS resolution works correctly

## Root Cause Analysis

Based on the investigation:

1. **Service Worker Check**: The service worker correctly skips Firebase auth URLs:
```javascript
if (
  url.hostname.includes('identitytoolkit.googleapis.com') ||
  url.hostname.includes('securetoken.googleapis.com') ||
  url.hostname.includes('firebaseapp.com') ||
  url.hostname.includes('googleapis.com') ||
  url.pathname.includes('/api/auth/')
) {
  return; // Let these requests pass through
}
```

2. **Direct API Test**: Firebase endpoint responds in 353ms from Node.js
3. **Timeout Configuration**: Set to 60 seconds in FirebaseTimeoutWrapper

## Most Likely Causes

1. **Browser Extension Interference**
   - Chrome extensions can intercept/block requests
   - The "message channel closed" errors suggest extension issues
   - Test in Incognito mode with extensions disabled

2. **Corporate Proxy/Firewall**
   - Some corporate networks block Firebase domains
   - Check if you're behind a proxy

3. **Service Worker Cache**
   - Even though we skip Firebase URLs, cached service worker might interfere
   - Try: `navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))`

4. **CORS Preflight Issues**
   - Firebase SDK might be triggering CORS preflight that's being blocked

## Immediate Solutions

### 1. Test in Incognito Mode
Open Chrome in Incognito mode (Cmd+Shift+N) and test login

### 2. Disable Service Worker Completely
Add this to your main.tsx temporarily:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}
```

### 3. Add Network Debugging
Update firebase.ts to add network debugging:
```javascript
// Before signInWithEmailAndPassword
console.log('Network status:', navigator.onLine);
console.log('Service Workers:', await navigator.serviceWorker.getRegistrations());

// Test direct fetch
try {
  const testResponse = await fetch('https://identitytoolkit.googleapis.com/v1/test');
  console.log('Direct fetch test:', testResponse.status);
} catch (e) {
  console.error('Direct fetch failed:', e);
}
```

### 4. Use the Test Files
1. Open `test-firebase-auth-isolated.html` in your browser
2. Click "Disable Service Worker" first
3. Then click "Test Firebase Auth"
4. Check the console for detailed logs

## What to Check in Chrome DevTools

1. **Network Tab**:
   - Filter by "identitytoolkit"
   - Look for the POST request to `/v1/accounts:signInWithPassword`
   - Check if request shows as "Pending" or has specific error

2. **Application Tab**:
   - Service Workers → Check "Bypass for network"
   - Clear all site data and retry

3. **Console**:
   - Look for any CORS errors
   - Check for extension-related errors

## Next Steps

If the issue persists after trying the above:
1. Check if you're behind a corporate proxy
2. Try a different network (mobile hotspot)
3. Test in a different browser (Firefox/Safari)
4. Check Firebase Console for any domain configuration issues

The fact that it works from Node.js but not the browser strongly suggests:
- Browser-specific interference (extensions, service worker)
- Network-level blocking (proxy, firewall)
- CORS/security policy issues