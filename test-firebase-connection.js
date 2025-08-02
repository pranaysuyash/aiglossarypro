import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
// Test 1: Client SDK connection
async function testClientSDK() {
    console.log('\n=== Testing Firebase Client SDK ===');
    const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
    };
    console.log('Firebase config:', {
        apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
        authDomain: firebaseConfig.authDomain || 'Missing',
        projectId: firebaseConfig.projectId || 'Missing',
    });
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        console.log('✅ Firebase Client SDK initialized');
        // Try a simple auth operation
        console.log('Testing signInWithEmailAndPassword...');
        const result = await signInWithEmailAndPassword(auth, 'test@example.com', 'wrongpassword');
        console.log('Unexpected success:', result);
    }
    catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            console.log('✅ Firebase Auth is working (got expected auth error)');
        }
        else if (error.code === 'auth/network-request-failed') {
            console.error('❌ Network error:', error.message);
        }
        else {
            console.error('❌ Unexpected error:', error.code, error.message);
        }
    }
}
// Test 2: Admin SDK connection
async function testAdminSDK() {
    console.log('\n=== Testing Firebase Admin SDK ===');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    console.log('Admin SDK config:', {
        projectId: projectId || 'Missing',
        clientEmail: clientEmail || 'Missing',
        privateKey: privateKeyBase64 ? 'Set' : 'Missing',
    });
    if (!projectId || !clientEmail || !privateKeyBase64) {
        console.error('❌ Missing Firebase Admin credentials');
        return;
    }
    try {
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        console.log('✅ Firebase Admin SDK initialized');
        // Try to verify a fake token to test connection
        console.log('Testing token verification...');
        await admin.auth().verifyIdToken('fake-token');
    }
    catch (error) {
        if (error.code === 'auth/argument-error' || error.message.includes('Decoding Firebase ID token failed')) {
            console.log('✅ Firebase Admin Auth is working (got expected token error)');
        }
        else if (error.code === 'app/network-timeout' || error.message.includes('timeout')) {
            console.error('❌ Network timeout:', error.message);
        }
        else {
            console.error('❌ Unexpected error:', error.code || 'Unknown', error.message);
        }
    }
}
// Test 3: Direct HTTPS connection test
async function testDirectConnection() {
    console.log('\n=== Testing Direct HTTPS Connection ===');
    try {
        const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: 'test' }),
        });
        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response:', data);
        if (response.status === 400 || response.status === 401) {
            console.log('✅ Can reach Firebase Auth API (got expected error)');
        }
        else {
            console.log('⚠️ Unexpected response:', response.status);
        }
    }
    catch (error) {
        console.error('❌ Failed to reach Firebase API:', error.message);
    }
}
// Run all tests
async function runTests() {
    console.log('Starting Firebase connectivity tests...');
    try {
        await testDirectConnection();
        await testClientSDK();
        await testAdminSDK();
    }
    catch (error) {
        console.error('Test suite error:', error);
    }
    console.log('\nTests complete!');
    process.exit(0);
}
runTests();
