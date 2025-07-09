#!/usr/bin/env node

import dotenv from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Load environment variables
dotenv.config();

let adminInitialized = false;

function initializeFirebaseAdmin() {
  if (adminInitialized) return;

  try {
    let privateKey;

    if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
      privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    } else {
      throw new Error('No Firebase private key found');
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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

async function getUserByEmail(email) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const userRecord = await getAuth().getUserByEmail(email);
    return userRecord;
  } catch (_error) {
    return null; // User doesn't exist
  }
}

async function createFirebaseUser(email, password, displayName) {
  try {
    if (!adminInitialized) {
      initializeFirebaseAdmin();
    }

    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Set to true for test users
    });

    return userRecord;
  } catch (error) {
    console.error('Error creating Firebase user:', error);
    return null;
  }
}

const testUsers = [
  {
    email: 'admin@aimlglossary.com',
    password: 'admin123',
    displayName: 'Admin User',
    type: 'admin',
  },
  {
    email: 'premium@aimlglossary.com',
    password: 'premium123',
    displayName: 'Premium User',
    type: 'premium',
  },
  {
    email: 'test@aimlglossary.com',
    password: 'test123',
    displayName: 'Test User',
    type: 'free',
  },
];

async function setupFirebaseUsers() {
  try {
    console.log('🔧 Setting up Firebase test users...');

    // Initialize Firebase Admin
    initializeFirebaseAdmin();

    for (const testUser of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await getUserByEmail(testUser.email);

        if (existingUser) {
          console.log(`✅ User ${testUser.email} already exists (UID: ${existingUser.uid})`);
          continue;
        }

        // Create new user
        const firebaseUser = await createFirebaseUser(
          testUser.email,
          testUser.password,
          testUser.displayName
        );

        if (firebaseUser) {
          console.log(`✅ Created ${testUser.type} user: ${testUser.email}`);
          console.log(`   Password: ${testUser.password}`);
          console.log(`   UID: ${firebaseUser.uid}`);
        } else {
          console.log(`❌ Failed to create user: ${testUser.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating user ${testUser.email}:`, error.message);
      }
    }

    console.log('\n🎉 Firebase test users setup complete!');
    console.log('\nTest Users:');
    console.log('1. admin@aimlglossary.com / admin123 (Admin user with lifetime access)');
    console.log('2. premium@aimlglossary.com / premium123 (Premium user with lifetime access)');
    console.log('3. test@aimlglossary.com / test123 (Free tier user)');
    console.log('\nYou can now use these credentials to test Firebase authentication.');
  } catch (error) {
    console.error('❌ Error setting up Firebase users:', error);
    process.exit(1);
  }
}

// Run the setup
setupFirebaseUsers();
