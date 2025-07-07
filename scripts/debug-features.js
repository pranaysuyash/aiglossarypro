#!/usr/bin/env node

/**
 * Debug script to check feature flags and environment variables
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Debug');
console.log('============================');

console.log('Firebase Environment Variables:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
console.log('- FIREBASE_PRIVATE_KEY_BASE64:', process.env.FIREBASE_PRIVATE_KEY_BASE64 ? '✅ Set' : '❌ Missing');

console.log('\nFeature Flags:');
const firebaseAuthEnabled = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64));
console.log('- firebaseAuthEnabled:', firebaseAuthEnabled ? '✅ ENABLED' : '❌ DISABLED');

console.log('\nDetailed Firebase Check:');
console.log('- Has FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
console.log('- Has FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
console.log('- Has FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('- Has FIREBASE_PRIVATE_KEY_BASE64:', !!process.env.FIREBASE_PRIVATE_KEY_BASE64);
console.log('- Has either private key:', !!(process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64));

console.log('\nOther Auth Features:');
const simpleAuthEnabled = !!(process.env.JWT_SECRET && (process.env.GOOGLE_CLIENT_ID || process.env.GITHUB_CLIENT_ID));
console.log('- simpleAuthEnabled:', simpleAuthEnabled ? '✅ ENABLED' : '❌ DISABLED');
console.log('- Has JWT_SECRET:', !!process.env.JWT_SECRET);
console.log('- Has GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);
console.log('- Has GITHUB_CLIENT_ID:', !!process.env.GITHUB_CLIENT_ID);

console.log('\nExpected Authentication Method:');
if (firebaseAuthEnabled) {
  console.log('🔥 Firebase Authentication should be used');
} else if (simpleAuthEnabled) {
  console.log('🔑 Simple JWT + OAuth should be used');
} else {
  console.log('🔧 Mock Authentication will be used (development only)');
} 