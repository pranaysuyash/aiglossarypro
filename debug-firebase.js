/**
 * Firebase Debug Script
 * Test Firebase configuration and initialization
 */

const { initializeFirebaseAdmin, verifyFirebaseToken } = require('./server/config/firebase');
const { log: logger } = require('./server/utils/logger');

logger.info('Testing Firebase configuration...');

// Test environment variables
const envVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
  FIREBASE_PRIVATE_KEY_BASE64: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'Set' : 'Missing',
};

logger.info('Environment Variables check', envVars);

// Test Firebase initialization
try {
  logger.info('Initializing Firebase Admin...');
  initializeFirebaseAdmin();
  logger.info('Firebase Admin initialized successfully');
} catch (error) {
  logger.error('Firebase Admin initialization failed', {
    message: error.message,
    stack: error.stack,
  });
}

logger.info('Firebase configuration test complete');
