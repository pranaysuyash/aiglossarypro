#!/usr/bin/env node

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

console.log('Firebase Admin SDK Connectivity Test\n');

// First test: Direct HTTPS request
async function testDirectHttps() {
  console.log('1. Testing direct HTTPS connectivity to Firebase...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: '/identitytoolkit/v3/relyingparty/getAccountInfo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      console.log(`   ✅ Connected in ${Date.now() - startTime}ms`);
      console.log(`   Status: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.error(`   ❌ Connection failed: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.error('   ❌ Request timed out after 5 seconds');
      req.destroy();
      resolve(false);
    });

    req.write(JSON.stringify({ idToken: 'test' }));
    req.end();
  });
}

// Second test: Firebase Admin SDK initialization
async function testFirebaseAdminInit() {
  console.log('\n2. Testing Firebase Admin SDK initialization...');
  
  try {
    let privateKey;
    
    if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
      console.log('   Using base64 encoded private key');
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
      privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      console.log('   Using plain text private key');
    } else {
      throw new Error('No Firebase private key found');
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    };

    console.log('   Project ID:', serviceAccount.projectId);
    console.log('   Client Email:', serviceAccount.clientEmail);
    console.log('   Private Key:', privateKey ? 'Present' : 'Missing');

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('   ✅ Firebase Admin SDK initialized');
    return { app, auth: getAuth(app) };
  } catch (error) {
    console.error('   ❌ Failed to initialize:', error.message);
    return null;
  }
}

// Third test: Verify a test token
async function testTokenVerification(auth) {
  console.log('\n3. Testing token verification (with invalid token)...');
  
  const testToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QifQ.eyJ1aWQiOiJ0ZXN0In0.dGVzdA';
  const startTime = Date.now();
  
  try {
    // This should fail with invalid token error
    await auth.verifyIdToken(testToken);
    console.log('   ⚠️  Unexpected: Token was verified (should have failed)');
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log(`   ✅ Got expected error in ${elapsed}ms: ${error.code || error.message}`);
    
    if (elapsed > 10000) {
      console.log('   ⚠️  Warning: Verification took too long (>10s)');
    }
  }
}

// Fourth test: Check DNS resolution
async function testDnsResolution() {
  console.log('\n4. Testing DNS resolution...');
  
  const { promises: dns } = await import('dns');
  const domains = [
    'www.googleapis.com',
    'oauth2.googleapis.com',
    'securetoken.googleapis.com'
  ];
  
  for (const domain of domains) {
    try {
      const addresses = await dns.resolve4(domain);
      console.log(`   ✅ ${domain}: ${addresses[0]}`);
    } catch (error) {
      console.log(`   ❌ ${domain}: DNS resolution failed`);
    }
  }
}

// Run all tests
async function runTests() {
  await testDnsResolution();
  await testDirectHttps();
  
  const firebase = await testFirebaseAdminInit();
  if (firebase?.auth) {
    await testTokenVerification(firebase.auth);
  }
  
  console.log('\n✅ Tests complete');
  process.exit(0);
}

runTests().catch(console.error);