/**
 * Browser-based test script to diagnose and fix auth issues
 * Copy and paste this into your browser console
 */

console.log('🧪 Auth Diagnostic & Fix Script');
console.log('================================\n');

// Test credentials
const TEST_USERS = {
  free: { email: 'free@aiglossarypro.com', password: 'freepass123' },
  premium: { email: 'premium@aiglossarypro.com', password: 'premiumpass123' },
  admin: { email: 'admin@aiglossarypro.com', password: 'adminpass123' }
};

// 1. Check for service workers
async function checkServiceWorkers() {
  console.group('🔍 Service Worker Check');
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} service worker(s)`);
    registrations.forEach((reg, i) => {
      console.log(`  SW${i}: ${reg.scope} (active: ${!!reg.active})`);
    });
    console.groupEnd();
    return registrations.length;
  } catch (error) {
    console.error('Error checking service workers:', error);
    console.groupEnd();
    return 0;
  }
}

// 2. Clear all browser state
async function clearAllState() {
  console.group('🧹 Clearing all browser state...');
  
  try {
    // Unregister service workers
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    console.log('✅ Service workers unregistered');
    
    // Clear caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(n => caches.delete(n)));
    console.log('✅ Caches cleared');
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Storage cleared');
    
    // Clear IndexedDB
    const databases = ['firebaseLocalStorageDb', 'ai-glossary-queue', 'AIGlossaryDB'];
    for (const db of databases) {
      try {
        await indexedDB.deleteDatabase(db);
        console.log(`✅ IndexedDB ${db} cleared`);
      } catch (e) {
        console.warn(`Could not clear ${db}:`, e);
      }
    }
    
    console.log('✅ All state cleared!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  
  console.groupEnd();
}

// 3. Test direct Firebase API
async function testFirebaseAPI(apiKey) {
  console.group('🌐 Testing Firebase REST API');
  
  if (!apiKey) {
    console.error('Please provide your Firebase API key');
    console.log('Get it from: import.meta.env.VITE_FIREBASE_API_KEY');
    console.groupEnd();
    return false;
  }
  
  const user = TEST_USERS.free;
  
  try {
    console.log(`Testing with: ${user.email}`);
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          returnSecureToken: true
        }),
      }
    );
    
    console.log('Response status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Firebase API working!');
      console.log('User:', data.email);
    } else {
      const error = await response.json();
      console.error('❌ Firebase API error:', error);
    }
    
    console.groupEnd();
    return response.ok;
  } catch (error) {
    console.error('❌ Network error:', error);
    console.groupEnd();
    return false;
  }
}

// 4. Check current auth state
function checkAuthState() {
  console.group('📊 Current Auth State');
  
  // Auth-related localStorage
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') || key.includes('firebase')
  );
  console.log(`Found ${authKeys.length} auth-related keys:`);
  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value?.substring(0, 50) + '...');
  });
  
  // Check for blocking timestamps
  const blockers = ['lastCheck', 'lastQuery', 'cooldown'].filter(term =>
    authKeys.some(key => key.includes(term))
  );
  if (blockers.length > 0) {
    console.warn('⚠️ Found potential blocking keys:', blockers);
  }
  
  console.groupEnd();
}

// 5. Quick fix function
async function quickFix() {
  console.log('\n🚀 Running quick fix...\n');
  
  // Step 1: Check current state
  const swCount = await checkServiceWorkers();
  checkAuthState();
  
  if (swCount > 0 || Object.keys(localStorage).some(k => k.includes('auth'))) {
    console.log('\n⚠️ Found issues that need fixing\n');
    
    // Step 2: Clear everything
    await clearAllState();
    
    console.log('\n✅ Fixed! Please reload the page and try logging in.\n');
    console.log('💡 If using the app, navigate to: /?cleanup=true');
  } else {
    console.log('\n✅ No issues found! Auth should work normally.\n');
  }
}

// 6. Advanced diagnostics
function setupNetworkLogger() {
  console.log('🔍 Setting up network logger...');
  
  // Log all fetch requests
  const origFetch = window.fetch;
  window.fetch = function(...args) {
    const [url] = args;
    if (url.includes('firebase') || url.includes('identitytoolkit')) {
      console.log('🌐 Firebase request:', url);
    }
    return origFetch.apply(this, args);
  };
  
  console.log('✅ Network logger active');
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('Running full diagnostics...\n');
  
  await checkServiceWorkers();
  checkAuthState();
  
  console.log('\n💡 Available commands:');
  console.log('  quickFix()                    - Clear all state and fix auth');
  console.log('  clearAllState()               - Manually clear everything');
  console.log('  testFirebaseAPI("YOUR_KEY")   - Test Firebase directly');
  console.log('  setupNetworkLogger()          - Log Firebase requests');
  console.log('  window.forceResetAuthState()  - Reset auth state (if available)');
  console.log('  window.clearAllBrowserState() - Clear browser state (if available)');
}

// Export functions
window.authFix = {
  quickFix,
  clearAllState,
  testFirebaseAPI,
  checkAuthState,
  checkServiceWorkers,
  setupNetworkLogger,
  runDiagnostics
};

// Auto-run diagnostics
runDiagnostics();

console.log('\n✅ Auth fix script loaded. Use authFix.quickFix() to fix issues.');