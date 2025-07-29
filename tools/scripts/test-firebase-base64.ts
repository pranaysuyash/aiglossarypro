#!/usr/bin/env tsx

/**
 * Test Firebase Base64 Configuration
 */

import chalk from 'chalk';
import dotenv from 'dotenv';
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

// Load environment
dotenv.config();

async function testFirebaseBase64() {
  console.log(chalk.blue('🔍 Testing Firebase base64 configuration...'));

  try {
    console.log(chalk.cyan('📍 Environment variables:'));
    console.log(
      chalk.gray(`  FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'NOT SET'}`)
    );
    console.log(
      chalk.gray(`  FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET'}`)
    );
    console.log(
      chalk.gray(
        `  FIREBASE_PRIVATE_KEY_BASE64: ${process.env.FIREBASE_PRIVATE_KEY_BASE64 ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY_BASE64.length})` : 'NOT SET'}`
      )
    );

    // Decode the base64 private key
    if (!process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      console.log(chalk.red('❌ FIREBASE_PRIVATE_KEY_BASE64 not found'));
      return false;
    }

    const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString(
      'utf8'
    );
    console.log(chalk.cyan('📍 Decoded private key:'));
    console.log(chalk.gray(`  Length: ${privateKey.length}`));
    console.log(
      chalk.gray(`  Starts with BEGIN: ${privateKey.includes('-----BEGIN PRIVATE KEY-----')}`)
    );
    console.log(chalk.gray(`  Ends with END: ${privateKey.includes('-----END PRIVATE KEY-----')}`));

    // Test Firebase initialization
    console.log(chalk.cyan('📍 Initializing Firebase Admin SDK...'));

    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    };

    const app = initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      },
      'test-app'
    );

    console.log(chalk.green('✅ Firebase Admin SDK initialized successfully'));

    // Test creating a custom token
    console.log(chalk.cyan('📍 Testing custom token creation...'));
    const auth = getAdminAuth(app);
    const customToken = await auth.createCustomToken('test-uid-12345');

    console.log(chalk.green('✅ Custom token created successfully'));
    console.log(chalk.gray(`  Token length: ${customToken.length}`));

    return true;
  } catch (error) {
    console.error(chalk.red('❌ Firebase base64 test failed:'), error);
    return false;
  }
}

testFirebaseBase64()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  });
