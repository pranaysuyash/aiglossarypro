/**
 * Firebase Client Configuration
 * Handles authentication on the client side
 */

import { initializeApp } from 'firebase/app';
import {
  type AuthProvider,
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

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
  (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
);

if (missingKeys.length > 0) {
  console.error('❌ Missing Firebase configuration keys:', missingKeys);
  console.error(
    'Please check your .env file for the following VITE_FIREBASE_* variables:',
    missingKeys.map((key) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
  );
}

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

try {
  if (missingKeys.length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
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
  try {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized');
    }

    const provider: AuthProvider | null =
      providerName === 'google' ? googleProvider : githubProvider;
    if (!provider) {
      throw new Error(`${providerName} provider is not available`);
    }

    const result = await signInWithPopup(auth, provider);

    // Get ID token to send to backend
    const idToken = await result.user.getIdToken();

    return {
      user: result.user,
      idToken,
      provider: providerName,
    };
  } catch (error) {
    console.error(`Error signing in with ${providerName}:`, error);
    throw error; // Preserve the original error for better error handling
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized');
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();

    return {
      user: result.user,
      idToken,
    };
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error; // Preserve the original error for better error handling
  }
}

/**
 * Create account with email and password
 */
export async function createAccount(email: string, password: string) {
  try {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized');
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();

    return {
      user: result.user,
      idToken,
    };
  } catch (error) {
    console.error('Error creating account:', error);
    throw error; // Preserve the original error for better error handling
  }
}

/**
 * Sign out
 */
export async function signOutUser() {
  try {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized');
    }
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth?.currentUser || null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    console.warn('Firebase auth not initialized, cannot subscribe to auth changes');
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Get ID token for API calls
 */
export async function getIdToken(): Promise<string | null> {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Refresh ID token
 */
export async function refreshIdToken(): Promise<string | null> {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    return await user.getIdToken(true); // Force refresh
  } catch (error) {
    console.error('Error refreshing ID token:', error);
    return null;
  }
}

// Export auth instance
export { auth };
