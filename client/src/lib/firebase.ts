/**
 * Firebase Client Configuration
 * Handles authentication on the client side with timeout handling
 */

import { initializeApp } from 'firebase/app';
import {
  type AuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { authStatePersistence } from './AuthStatePersistence';
import { firebaseErrorHandler } from './FirebaseErrorHandler';
import { DEFAULT_TIMEOUTS, timeoutQueue, withTimeout } from './FirebaseTimeoutWrapper';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredConfigKeys.filter(
  key => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingKeys.length > 0) {
  console.error('❌ Missing Firebase configuration keys:', missingKeys);
  console.error(
    'Please check your .env file for the following VITE_FIREBASE_* variables:',
    missingKeys.map(key => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
  );
}

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

try {
  if (missingKeys.length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Check if user just logged out
    const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';

    // Set Firebase persistence based on logout state
    if (auth) {
      if (justLoggedOut) {
        // Use in-memory persistence after logout to prevent auto-reauth
        setPersistence(auth, inMemoryPersistence).catch(error => {
          console.warn('Failed to set Firebase persistence:', error);
        });
        console.log('✅ Firebase initialized with in-memory persistence (post-logout)');
      } else {
        // Use local persistence for normal operation
        setPersistence(auth, browserLocalPersistence).catch(error => {
          console.warn('Failed to set Firebase persistence:', error);
        });
        console.log('✅ Firebase initialized with local persistence');
      }
    }
  } else {
    console.warn('⚠️ Firebase not initialized due to missing configuration');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('This may cause authentication issues. Please check your Firebase configuration.');
}

// Auth providers - only initialize if Firebase is available
export const googleProvider = auth ? new GoogleAuthProvider() : null;
export const githubProvider = auth ? new GithubAuthProvider() : null;

// Configure providers
if (googleProvider) {
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}
if (githubProvider) {
  githubProvider.addScope('user:email');
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithProvider(providerName: 'google' | 'github') {
  const operationKey = `signInWithProvider-${providerName}`;

  return timeoutQueue.add(operationKey, async () => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized');
      }

      const provider: AuthProvider | null =
        providerName === 'google' ? googleProvider : githubProvider;
      if (!provider) {
        throw new Error(`${providerName} provider is not available`);
      }

      // Wrap the popup operation with timeout
      const result = await withTimeout(
        () => signInWithPopup(auth!, provider),
        {
          ...DEFAULT_TIMEOUTS.signIn,
          operation: `signInWithProvider-${providerName}`,
        }
      );

      // Get ID token with timeout
      const idToken = await withTimeout(
        () => result.user.getIdToken(),
        {
          ...DEFAULT_TIMEOUTS.tokenRefresh,
          operation: 'getIdToken',
        }
      );

      // Store authentication state for persistence
      const userData = {
        id: result.user.uid,
        uid: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || result.user.email || '',
        displayName: result.user.displayName || undefined,
        profileImageUrl: result.user.photoURL || undefined,
        createdAt: new Date(),
      };

      await authStatePersistence.storeAuthState(userData, idToken);

      return {
        user: result.user,
        idToken,
        provider: providerName,
      };
    } catch (error) {
      const firebaseError = await firebaseErrorHandler.handleAuthError(
        error as Error,
        `signInWithProvider-${providerName}`,
        { provider: providerName }
      );
      throw firebaseError;
    }
  }, DEFAULT_TIMEOUTS.signIn);
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const operationKey = `signInWithEmail-${email}`;

  return timeoutQueue.add(operationKey, async () => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized');
      }

      // Wrap the sign in operation with timeout
      const result = await withTimeout(
        () => signInWithEmailAndPassword(auth!, email, password),
        {
          ...DEFAULT_TIMEOUTS.signIn,
          operation: 'signInWithEmail',
        }
      );

      // Get ID token with timeout
      const idToken = await withTimeout(
        () => result.user.getIdToken(),
        {
          ...DEFAULT_TIMEOUTS.tokenRefresh,
          operation: 'getIdToken',
        }
      );

      // Store authentication state for persistence
      const userData = {
        id: result.user.uid,
        uid: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || result.user.email || '',
        displayName: result.user.displayName || undefined,
        profileImageUrl: result.user.photoURL || undefined,
        createdAt: new Date(),
      };

      await authStatePersistence.storeAuthState(userData, idToken);

      return {
        user: result.user,
        idToken,
      };
    } catch (error) {
      const firebaseError = await firebaseErrorHandler.handleAuthError(
        error as Error,
        'signInWithEmail',
        { email: email.substring(0, 3) + '***' } // Partial email for privacy
      );
      throw firebaseError;
    }
  }, DEFAULT_TIMEOUTS.signIn);
}

/**
 * Create account with email and password
 */
export async function createAccount(email: string, password: string) {
  const operationKey = `createAccount-${email}`;

  return timeoutQueue.add(operationKey, async () => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized');
      }

      // Wrap the account creation with timeout
      const result = await withTimeout(
        () => createUserWithEmailAndPassword(auth!, email, password),
        {
          ...DEFAULT_TIMEOUTS.signUp,
          operation: 'createAccount',
        }
      );

      // Get ID token with timeout
      const idToken = await withTimeout(
        () => result.user.getIdToken(),
        {
          ...DEFAULT_TIMEOUTS.tokenRefresh,
          operation: 'getIdToken',
        }
      );

      // Store authentication state for persistence
      const userData = {
        id: result.user.uid,
        uid: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || result.user.email || '',
        displayName: result.user.displayName || undefined,
        profileImageUrl: result.user.photoURL || undefined,
        createdAt: new Date(),
      };

      await authStatePersistence.storeAuthState(userData, idToken);

      return {
        user: result.user,
        idToken,
      };
    } catch (error) {
      const firebaseError = await firebaseErrorHandler.handleAuthError(
        error as Error,
        'createAccount',
        { email: email.substring(0, 3) + '***' } // Partial email for privacy
      );
      throw firebaseError;
    }
  }, DEFAULT_TIMEOUTS.signUp);
}

/**
 * Sign out
 */
export async function signOutUser() {
  const operationKey = 'signOut';

  return timeoutQueue.add(operationKey, async () => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized');
      }

      // Step 1: Clear Firebase auth state completely with timeout
      await withTimeout(
        () => signOut(auth!),
        {
          ...DEFAULT_TIMEOUTS.signOut,
          operation: 'signOut',
        }
      );

      // Step 2: Clear any Firebase-related localStorage keys
      const firebaseKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('firebase:') || key.includes('firebase') || key.includes('authUser'))) {
          firebaseKeys.push(key);
        }
      }
      firebaseKeys.forEach(key => localStorage.removeItem(key));

      // Step 3: Clear any Firebase-related sessionStorage keys
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('firebase:') || key.includes('firebase') || key.includes('authUser'))) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach(key => sessionStorage.removeItem(key));

      // Step 4: Clear Firebase IndexedDB if possible (with timeout)
      try {
        if ('indexedDB' in window) {
          await withTimeout(async () => {
            const databases = await indexedDB.databases();
            for (const db of databases) {
              if (db.name && (db.name.includes('firebase') || db.name.includes('firebaseLocalStorageDb'))) {
                await indexedDB.deleteDatabase(db.name);
                console.log(`✅ Deleted Firebase IndexedDB: ${db.name}`);
              }
            }
          }, {
            timeout: 2000,
            operation: 'clearIndexedDB',
            retryOnTimeout: false,
            maxRetries: 0,
          });
        }
      } catch (e) {
        console.warn('⚠️ Failed to clear Firebase IndexedDB:', e);
      }

      // Clear authentication state persistence
      await authStatePersistence.clearAuthState();

      console.log('✅ Firebase signout and cleanup completed');
    } catch (error) {
      const firebaseError = await firebaseErrorHandler.handleAuthError(
        error as Error,
        'signOut',
        {}
      );
      throw firebaseError;
    }
  }, DEFAULT_TIMEOUTS.signOut);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth?.currentUser || null;
}

/**
 * Recover authentication state after page refresh or network errors
 */
export async function recoverAuthState() {
  try {
    const recovery = await authStatePersistence.retrieveAuthState();

    if (recovery.success && recovery.user) {
      console.log('✅ Authentication state recovered successfully');
      return recovery.user;
    } else if (recovery.error) {
      console.warn('⚠️ Auth state recovery failed:', recovery.error);

      // Try network error recovery
      const networkRecovery = await authStatePersistence.recoverFromNetworkError();
      if (networkRecovery.success && networkRecovery.user) {
        console.log('✅ Authentication state recovered from network error');
        return networkRecovery.user;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Auth state recovery error:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    console.warn('Firebase auth not initialized, cannot subscribe to auth changes');
    return () => { }; // Return empty unsubscribe function
  }

  // Check if we're in a logout state
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';

    if (justLoggedOut && user) {
      // If we just logged out but Firebase still has a user, force sign out
      console.log('⚠️ Detected auth state after logout, forcing sign out...');
      signOut(auth).then(() => {
        callback(null);
      }).catch(() => {
        callback(null);
      });
      return;
    }

    // Normal auth state change
    callback(user);
  });

  return unsubscribe;
}

/**
 * Get ID token for API calls
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = getCurrentUser();
    if (!user) { return null; }

    return await withTimeout(
      () => user.getIdToken(),
      {
        ...DEFAULT_TIMEOUTS.tokenRefresh,
        operation: 'getIdToken',
      }
    );
  } catch (error) {
    const firebaseError = await firebaseErrorHandler.handleAuthError(
      error as Error,
      'getIdToken',
      { hasUser: !!user }
    );
    console.error('Error getting ID token:', firebaseError);
    return null;
  }
}

/**
 * Refresh ID token
 */
export async function refreshIdToken(): Promise<string | null> {
  try {
    const user = getCurrentUser();
    if (!user) { return null; }

    return await withTimeout(
      () => user.getIdToken(true), // Force refresh
      {
        ...DEFAULT_TIMEOUTS.tokenRefresh,
        operation: 'refreshIdToken',
      }
    );
  } catch (error) {
    const firebaseError = await firebaseErrorHandler.handleAuthError(
      error as Error,
      'refreshIdToken',
      { hasUser: !!user }
    );
    console.error('Error refreshing ID token:', firebaseError);
    return null;
  }
}

// Export auth instance
export { auth };

// Google Sign In
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase authentication or Google provider is not initialized');
  }
  return signInWithPopup(auth, googleProvider);
};
