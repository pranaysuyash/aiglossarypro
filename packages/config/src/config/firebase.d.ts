/**
 * Firebase Authentication Configuration
 * Provides a unified authentication solution with multiple providers
 */
import type { DecodedIdToken } from 'firebase-admin/auth';
export declare function initializeFirebaseAdmin(): void;
export declare function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null>;
export declare function createCustomToken(uid: string, claims?: object): Promise<string | null>;
export declare function getUserByEmail(email: string): Promise<import("firebase-admin/auth").UserRecord | null>;
export declare function createFirebaseUser(email: string, password: string, displayName?: string): Promise<import("firebase-admin/auth").UserRecord | null>;
export declare function setCustomUserClaims(uid: string, claims: object): Promise<boolean>;
export declare function deleteFirebaseUser(uid: string): Promise<boolean>;
export declare const firebaseAuth: () => import("firebase-admin/auth").Auth;
