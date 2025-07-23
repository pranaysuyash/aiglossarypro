/**
 * Auth debugging utilities for development
 */

import { authQueryDeduplicator } from '@/lib/authQueryDeduplicator';
import { AuthStateManager } from '@/lib/AuthStateManager';
import { resetAuthQueryTracker } from '@/lib/authQueryOptions';
import { clearAllAuthData } from '@/lib/authPersistence';

export async function forceResetAuthState() {
  console.log('🔄 Force resetting all auth state...');
  
  try {
    // 1. Clear auth query deduplicator
    authQueryDeduplicator.clear();
    console.log('✅ Auth query deduplicator cleared');
    
    // 2. Reset auth state manager
    AuthStateManager.getInstance().reset();
    console.log('✅ Auth state manager reset');
    
    // 3. Reset auth query tracker
    resetAuthQueryTracker();
    console.log('✅ Auth query tracker reset');
    
    // 4. Clear all persisted auth data
    clearAllAuthData();
    console.log('✅ All persisted auth data cleared');
    
    // 5. Clear any Firebase-related storage
    const firebaseKeys = Object.keys(localStorage).filter(key => 
      key.includes('firebase') || key.includes('auth')
    );
    firebaseKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed localStorage key: ${key}`);
    });
    
    // 6. Clear Firebase IndexedDB
    try {
      await indexedDB.deleteDatabase('firebaseLocalStorageDb');
      console.log('✅ Firebase IndexedDB cleared');
    } catch (err) {
      console.warn('Could not delete Firebase IndexedDB:', err);
    }
    
    console.log('✅ Auth state force reset complete');
    console.log('🔄 Please reload the page to start fresh');
    
    return true;
  } catch (error) {
    console.error('❌ Error during auth state reset:', error);
    return false;
  }
}

// Debug function to inspect current auth state
export function inspectAuthState() {
  console.group('🔍 Current Auth State');
  
  // Auth State Manager
  const authStateManager = AuthStateManager.getInstance();
  console.log('AuthStateManager state:', authStateManager.getState());
  
  // Auth Query Deduplicator
  console.log('AuthQueryDeduplicator state:', authQueryDeduplicator.getState());
  
  // Local Storage auth keys
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') || key.includes('firebase')
  );
  console.log('Auth-related localStorage keys:', authKeys);
  authKeys.forEach(key => {
    console.log(`  ${key}:`, localStorage.getItem(key));
  });
  
  // Service Workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Active service workers:', registrations.length);
    registrations.forEach((reg, i) => {
      console.log(`  SW${i}: ${reg.scope} (active: ${!!reg.active})`);
    });
  });
  
  console.groupEnd();
}

// Add to window for easy console access in development
if (import.meta.env.DEV) {
  (window as any).forceResetAuthState = forceResetAuthState;
  (window as any).inspectAuthState = inspectAuthState;
  console.log('💡 Auth debug utilities available:');
  console.log('  - forceResetAuthState() : Clear all auth state');
  console.log('  - inspectAuthState() : View current auth state');
}

// Network request interceptor for debugging
export function setupNetworkDebugger() {
  if (!import.meta.env.DEV) return;
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource, init] = args;
    if (typeof resource === 'string' && resource.includes('identitytoolkit')) {
      console.group('🌐 Firebase Auth Request');
      console.log('URL:', resource);
      console.log('Method:', init?.method || 'GET');
      console.log('Headers:', init?.headers);
      console.log('Body:', init?.body);
      console.groupEnd();
    }
    return originalFetch.apply(this, args);
  };
  
  // Intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string) {
    if (url.includes('identitytoolkit')) {
      console.log('🌐 XHR Firebase Auth Request:', method, url);
    }
    return originalOpen.apply(this, arguments as any);
  };
  
  console.log('🔍 Network debugger enabled for Firebase requests');
}