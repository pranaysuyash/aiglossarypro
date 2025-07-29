/**
 * Development cleanup utilities to fix auth and service worker issues
 */

export async function clearAllBrowserState() {
  console.log('🧹 Starting complete browser state cleanup...');
  
  // 1. Unregister all service workers
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => {
      console.log(`🔥 Unregistering service worker: ${reg.scope}`);
      return reg.unregister();
    }));
    console.log('✅ All service workers unregistered');
  } catch (error) {
    console.error('Failed to unregister service workers:', error);
  }

  // 2. Clear all caches
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => {
      console.log(`🗑️ Deleting cache: ${name}`);
      return caches.delete(name);
    }));
    console.log('✅ All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }

  // 3. Clear localStorage
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      console.log(`🗑️ Removing localStorage: ${key}`);
    });
    localStorage.clear();
    console.log('✅ localStorage cleared');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }

  // 4. Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  } catch (error) {
    console.error('Failed to clear sessionStorage:', error);
  }

  // 5. Clear IndexedDB databases
  try {
    // Known databases in this app
    const databases = [
      'firebaseLocalStorageDb',
      'ai-glossary-queue',
      'AIGlossaryDB'
    ];
    
    for (const dbName of databases) {
      try {
        await indexedDB.deleteDatabase(dbName);
        console.log(`✅ Deleted IndexedDB: ${dbName}`);
      } catch (err) {
        console.warn(`Could not delete ${dbName}:`, err);
      }
    }
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }

  // 6. Clear cookies for localhost
  try {
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`;
        console.log(`🍪 Cleared cookie: ${name}`);
      }
    });
  } catch (error) {
    console.error('Failed to clear cookies:', error);
  }

  console.log('✅ Complete browser state cleanup finished');
  console.log('🔄 Please reload the page to start fresh');
}

// Add global function for easy console access in development
if (import.meta.env.DEV) {
  (window as any).clearAllBrowserState = clearAllBrowserState;
  console.log('💡 Development cleanup available: Run clearAllBrowserState() in console');
}

// Auto-cleanup on specific conditions
export function setupAutoCleanup() {
  if (import.meta.env.DEV) {
    // Check for cleanup flag in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cleanup') === 'true') {
      console.log('🔄 Cleanup requested via URL parameter');
      clearAllBrowserState().then(() => {
        // Remove the cleanup parameter and reload
        urlParams.delete('cleanup');
        const newUrl = window.location.pathname + 
          (urlParams.toString() ? '?' + urlParams.toString() : '') + 
          window.location.hash;
        window.location.href = newUrl;
      });
    }
  }
}