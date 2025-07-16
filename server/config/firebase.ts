/**
 * Firebase Authentication Configuration
 * Provides a unified authentication solution with multiple providers
 */

import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

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
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    adminInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

// Verify Firebase ID token
export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}

// Create custom token for server-side auth
export async function createCustomToken(uid: string, claims?: object): Promise<string | null> {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const customToken = await getAdminAuth().createCustomToken(uid, claims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const userRecord = await getAdminAuth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Create user
export async function createFirebaseUser(email: string, password: string, displayName?: string) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const userRecord = await getAdminAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    return userRecord;
  } catch (error) {
    console.error('Error creating Firebase user:', error);
    return null;
  }
}

// Set custom user claims (for admin roles)
export async function setCustomUserClaims(uid: string, claims: object) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    await getAdminAuth().setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}

// Delete user
export async function deleteFirebaseUser(uid: string) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    await getAdminAuth().deleteUser(uid);
    return true;
  } catch (error) {
    console.error('Error deleting Firebase user:', error);
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
