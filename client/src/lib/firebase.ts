/**
 * Firebase Client Configuration
 * Handles authentication on the client side
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type AuthProvider
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

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configure providers
googleProvider.addScope('email');
googleProvider.addScope('profile');
githubProvider.addScope('user:email');

/**
 * Sign in with OAuth provider
 */
export async function signInWithProvider(providerName: 'google' | 'github') {
  try {
    const provider: AuthProvider = providerName === 'google' ? googleProvider : githubProvider;
    const result = await signInWithPopup(auth!, provider);
    
    // Get ID token to send to backend
    const idToken = await result.user.getIdToken();
    
    return {
      user: result.user,
      idToken,
      provider: providerName
    };
  } catch (error: any) {
    console.error(`Error signing in with ${providerName}:`, error);
    throw new Error(error.message || `Failed to sign in with ${providerName}`);
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth!, email, password);
    const idToken = await result.user.getIdToken();
    
    return {
      user: result.user,
      idToken
    };
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

/**
 * Create account with email and password
 */
export async function createAccount(email: string, password: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth!, email, password);
    const idToken = await result.user.getIdToken();
    
    return {
      user: result.user,
      idToken
    };
  } catch (error: any) {
    console.error('Error creating account:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

/**
 * Sign out
 */
export async function signOutUser() {
  try {
    await signOut(auth!);
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
  return onAuthStateChanged(auth!, callback);
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