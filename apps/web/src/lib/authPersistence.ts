/**
 * Auth Persistence Manager
 * Handles aggressive cleanup of authentication state across tabs
 */

// List of all possible auth-related storage keys
const AUTH_STORAGE_KEYS = [
  'authToken',
  'auth_token',
  'firebaseLocalStorageDb',
  'firebase:host:',
  'firebase:authUser:',
  'firebase:pendingRedirect:',
  'firebase:redirectUser:',
  'firebase:remember:',
  'firebase:session:',
  '__sak',
];

// List of auth-related cookie names
const AUTH_COOKIE_NAMES = [
  'authToken',
  'auth_token',
  'firebase-auth-token',
  'connect.sid',
  '__session',
];

/**
 * Clear all authentication data from all storage mechanisms
 */
export function clearAllAuthData() {
  console.log('🧹 Starting aggressive auth cleanup...');
  
  // 1. Clear localStorage
  const localStorageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && AUTH_STORAGE_KEYS.some(authKey => key.includes(authKey))) {
      localStorageKeys.push(key);
    }
  }
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`  ✓ Removed localStorage: ${key}`);
  });
  
  // 2. Clear sessionStorage
  const sessionStorageKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && AUTH_STORAGE_KEYS.some(authKey => key.includes(authKey))) {
      sessionStorageKeys.push(key);
    }
  }
  sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`  ✓ Removed sessionStorage: ${key}`);
  });
  
  // 3. Clear all cookies
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (AUTH_COOKIE_NAMES.some(cookieName => name.includes(cookieName))) {
      // Clear for all possible paths and domains
      const paths = ['/', '/api', '/auth'];
      const domains = [window.location.hostname, `.${window.location.hostname}`, ''];
      
      paths.forEach(path => {
        domains.forEach(domain => {
          const clearCookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? `;domain=${domain}` : ''}`;
          document.cookie = clearCookie;
        });
      });
      
      console.log(`  ✓ Cleared cookie: ${name}`);
    }
  });
  
  // 4. Clear IndexedDB
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name && (db.name.includes('firebase') || db.name.includes('auth'))) {
          indexedDB.deleteDatabase(db.name);
          console.log(`  ✓ Deleted IndexedDB: ${db.name}`);
        }
      });
    }).catch(e => {
      console.warn('  ⚠️ Failed to clear IndexedDB:', e);
    });
  }
  
  console.log('✅ Auth cleanup complete');
}

/**
 * Monitor for auth state across tabs
 */
export function setupAuthStateMonitor(onLogout: () => void) {
  // Monitor storage events
  window.addEventListener('storage', (event) => {
    if (event.key && AUTH_STORAGE_KEYS.some(authKey => event.key!.includes(authKey))) {
      if (event.newValue === null || event.newValue === '') {
        console.log('🔍 Detected auth removal in another tab');
        clearAllAuthData();
        onLogout();
      }
    }
  });
  
  // Disable periodic check to prevent auth loops
  // Only rely on storage events for cross-tab sync
  
  // Return no-op cleanup function
  return () => {};
}

/**
 * Mark that we're in a logout state
 */
export function markLogoutState() {
  sessionStorage.setItem('just_logged_out', 'true');
  sessionStorage.setItem('logout_timestamp', Date.now().toString());
}

/**
 * Clear logout state (after successful login)
 */
export function clearLogoutState() {
  sessionStorage.removeItem('just_logged_out');
  sessionStorage.removeItem('logout_timestamp');
}

/**
 * Check if we're in a logout state
 */
export function isInLogoutState(): boolean {
  const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';
  const logoutTimestamp = sessionStorage.getItem('logout_timestamp');
  
  if (justLoggedOut && logoutTimestamp) {
    // Consider logout state valid for 30 seconds
    const elapsed = Date.now() - parseInt(logoutTimestamp);
    if (elapsed > 30000) {
      clearLogoutState();
      return false;
    }
    return true;
  }
  
  return false;
}