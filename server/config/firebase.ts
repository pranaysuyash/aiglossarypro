/**
 * Firebase Authentication Configuration
 * Provides a unified authentication solution with multiple providers
 */

import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';

import logger from '../utils/logger';
// Firebase Admin SDK initialization
let adminInitialized = false;

export function initializeFirebaseAdmin() {
  if (adminInitialized) {return;}

  try {
    // Use service account credentials from environment
    let privateKey: string;

    // Check if using base64 encoded private key
    if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
      privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    } else {
      throw new Error('No Firebase private key found in environment variables');
    }

    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    };

    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID!,
    });

    adminInitialized = true;
    logger.info('✅ Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

// Timeout wrapper for async operations
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// Verify Firebase ID token with timeout
export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    logger.info('🔐 verifyFirebaseToken called', { 
      tokenLength: idToken?.length,
      adminInitialized 
    });
    
    if (!adminInitialized) {
      logger.info('🔐 Initializing Firebase Admin SDK...');
      initializeFirebaseAdmin();
    }

    logger.info('🔐 Calling getAdminAuth().verifyIdToken with 5s timeout...');
    
    // Add 5 second timeout to prevent hanging
    const decodedToken = await withTimeout(
      getAdminAuth().verifyIdToken(idToken),
      5000,
      'Firebase token verification'
    );
    
    logger.info('✅ Token verified successfully', { 
      uid: decodedToken.uid,
      email: decodedToken.email 
    });
    return decodedToken;
  } catch (error: Error | unknown) {
    if (error.message?.includes('timed out')) {
      logger.error('⏱️ Firebase token verification timed out', {
        message: error.message
      });
    } else {
      logger.error('❌ Error verifying Firebase token:', error);
      logger.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3)
      });
    }
    return null;
  }
}

// Create custom token for server-side auth with timeout
export async function createCustomToken(uid: string, claims?: object): Promise<string | null> {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const customToken = await withTimeout(
      getAdminAuth().createCustomToken(uid, claims),
      5000,
      'Create custom token'
    );
    return customToken;
  } catch (error) {
    logger.error('Error creating custom token:', error);
    return null;
  }
}

// Get user by email with timeout
export async function getUserByEmail(email: string) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const userRecord = await withTimeout(
      getAdminAuth().getUserByEmail(email),
      5000,
      'Get user by email'
    );
    return userRecord;
  } catch (error) {
    logger.error('Error getting user by email:', error);
    return null;
  }
}

// Create user with timeout
export async function createFirebaseUser(email: string, password: string, displayName?: string) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const userRecord = await withTimeout(
      getAdminAuth().createUser({
        email,
        password,
        displayName: displayName || null,
        emailVerified: false,
      }),
      5000,
      'Create Firebase user'
    );

    return userRecord;
  } catch (error) {
    logger.error('Error creating Firebase user:', error);
    return null;
  }
}

// Set custom user claims (for admin roles) with timeout
export async function setCustomUserClaims(uid: string, claims: object) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    await withTimeout(
      getAdminAuth().setCustomUserClaims(uid, claims),
      5000,
      'Set custom claims'
    );
    return true;
  } catch (error) {
    logger.error('Error setting custom claims:', error);
    return false;
  }
}

// Delete user with timeout
export async function deleteFirebaseUser(uid: string) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    await withTimeout(
      getAdminAuth().deleteUser(uid),
      5000,
      'Delete Firebase user'
    );
    return true;
  } catch (error) {
    logger.error('Error deleting Firebase user:', error);
    return false;
  }
}

// Export Firebase Auth instance
export const firebaseAuth = () => {
  if (!adminInitialized) {
    initializeFirebaseAdmin();
  }
  return getAdminAuth();
};
