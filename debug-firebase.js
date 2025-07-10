/**
 * Firebase Debug Script
 * Test Firebase configuration and initialization
 */

const { initializeFirebaseAdmin, verifyFirebaseToken } = require('./server/config/firebase');

console.log('🔍 Testing Firebase configuration...\n');

// Test environment variables
console.log('Environment Variables:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_PRIVATE_KEY_BASE64:', process.env.FIREBASE_PRIVATE_KEY_BASE64 ? '✅ Set' : '❌ Missing');

// Test Firebase initialization
try {
  console.log('\n🔥 Initializing Firebase Admin...');
  initializeFirebaseAdmin();
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🔍 Firebase configuration test complete');
