"use strict";
/**
 * Firebase Authentication Configuration
 * Provides a unified authentication solution with multiple providers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAuth = void 0;
exports.initializeFirebaseAdmin = initializeFirebaseAdmin;
exports.verifyFirebaseToken = verifyFirebaseToken;
exports.createCustomToken = createCustomToken;
exports.getUserByEmail = getUserByEmail;
exports.createFirebaseUser = createFirebaseUser;
exports.setCustomUserClaims = setCustomUserClaims;
exports.deleteFirebaseUser = deleteFirebaseUser;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const logger_1 = __importDefault(require("../utils/logger"));
// Firebase Admin SDK initialization
let adminInitialized = false;
function initializeFirebaseAdmin() {
    if (adminInitialized) {
        return;
    }
    try {
        // Use service account credentials from environment
        let privateKey;
        // Check if using base64 encoded private key
        if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
            privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
        }
        else if (process.env.FIREBASE_PRIVATE_KEY) {
            privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        }
        else {
            throw new Error('No Firebase private key found in environment variables');
        }
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
        };
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
        adminInitialized = true;
        logger_1.default.info('✅ Firebase Admin SDK initialized');
    }
    catch (error) {
        logger_1.default.error('❌ Failed to initialize Firebase Admin:', error);
        throw error;
    }
}
// Timeout wrapper for async operations
async function withTimeout(promise, timeoutMs, operation) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
}
// Verify Firebase ID token with timeout
async function verifyFirebaseToken(idToken) {
    try {
        logger_1.default.info('🔐 verifyFirebaseToken called', {
            tokenLength: idToken?.length,
            adminInitialized
        });
        if (!adminInitialized) {
            logger_1.default.info('🔐 Initializing Firebase Admin SDK...');
            initializeFirebaseAdmin();
        }
        logger_1.default.info('🔐 Calling getAdminAuth().verifyIdToken with 5s timeout...');
        // Add 5 second timeout to prevent hanging
        const decodedToken = await withTimeout((0, auth_1.getAuth)().verifyIdToken(idToken), 5000, 'Firebase token verification');
        logger_1.default.info('✅ Token verified successfully', {
            uid: decodedToken.uid,
            email: decodedToken.email
        });
        return decodedToken;
    }
    catch (error) {
        const err = error;
        if (err.message?.includes('timed out')) {
            logger_1.default.error('⏱️ Firebase token verification timed out', {
                message: err.message
            });
        }
        else {
            logger_1.default.error('❌ Error verifying Firebase token:', error);
            logger_1.default.error('❌ Error details:', {
                message: err.message,
                code: err.code,
                stack: err.stack?.split('\n').slice(0, 3)
            });
        }
        return null;
    }
}
// Create custom token for server-side auth with timeout
async function createCustomToken(uid, claims) {
    try {
        if (!adminInitialized) {
            initializeFirebaseAdmin();
        }
        const customToken = await withTimeout((0, auth_1.getAuth)().createCustomToken(uid, claims), 5000, 'Create custom token');
        return customToken;
    }
    catch (error) {
        logger_1.default.error('Error creating custom token:', error);
        return null;
    }
}
// Get user by email with timeout
async function getUserByEmail(email) {
    try {
        if (!adminInitialized) {
            initializeFirebaseAdmin();
        }
        const userRecord = await withTimeout((0, auth_1.getAuth)().getUserByEmail(email), 5000, 'Get user by email');
        return userRecord;
    }
    catch (error) {
        logger_1.default.error('Error getting user by email:', error);
        return null;
    }
}
// Create user with timeout
async function createFirebaseUser(email, password, displayName) {
    try {
        if (!adminInitialized) {
            initializeFirebaseAdmin();
        }
        const userRecord = await withTimeout((0, auth_1.getAuth)().createUser({
            email,
            password,
            displayName: displayName || null,
            emailVerified: false,
        }), 5000, 'Create Firebase user');
        return userRecord;
    }
    catch (error) {
        logger_1.default.error('Error creating Firebase user:', error);
        return null;
    }
}
// Set custom user claims (for admin roles) with timeout
async function setCustomUserClaims(uid, claims) {
    try {
        if (!adminInitialized) {
            initializeFirebaseAdmin();
        }
        await withTimeout((0, auth_1.getAuth)().setCustomUserClaims(uid, claims), 5000, 'Set custom claims');
        return true;
    }
    catch (error) {
        logger_1.default.error('Error setting custom claims:', error);
        return false;
    }
}
// Delete user with timeout
async function deleteFirebaseUser(uid) {
    try {
        if (!adminInitialized) {
            initializeFirebaseAdmin();
        }
        await withTimeout((0, auth_1.getAuth)().deleteUser(uid), 5000, 'Delete Firebase user');
        return true;
    }
    catch (error) {
        logger_1.default.error('Error deleting Firebase user:', error);
        return false;
    }
}
// Export Firebase Auth instance
const firebaseAuth = () => {
    if (!adminInitialized) {
        initializeFirebaseAdmin();
    }
    return (0, auth_1.getAuth)();
};
exports.firebaseAuth = firebaseAuth;
