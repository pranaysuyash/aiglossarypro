#!/usr/bin/env tsx
/**
 * Test Firebase Configuration
 * Verify Firebase Admin SDK setup
 */
import chalk from 'chalk';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
async function testFirebaseConfig() {
    console.log(chalk.blue('🔍 Testing Firebase Admin SDK configuration...'));
    try {
        // Log environment variables (without sensitive data)
        console.log(chalk.cyan('📍 Environment variables:'));
        console.log(chalk.gray(`  FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'NOT SET'}`));
        console.log(chalk.gray(`  FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET'}`));
        console.log(chalk.gray(`  FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : 'NOT SET'}`));
        // Check if all required env vars are present
        if (!process.env.FIREBASE_PROJECT_ID ||
            !process.env.FIREBASE_CLIENT_EMAIL ||
            !process.env.FIREBASE_PRIVATE_KEY) {
            console.log(chalk.red('❌ Missing required Firebase environment variables'));
            return false;
        }
        // Test private key format
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        console.log(chalk.cyan('📍 Private key format check:'));
        console.log(chalk.gray(`  Starts with BEGIN: ${privateKey.includes('-----BEGIN PRIVATE KEY-----')}`));
        console.log(chalk.gray(`  Ends with END: ${privateKey.includes('-----END PRIVATE KEY-----')}`));
        console.log(chalk.gray(`  Length after processing: ${privateKey.length}`));
        // Try to initialize Firebase Admin
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        };
        console.log(chalk.cyan('📍 Initializing Firebase Admin SDK...'));
        const app = initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log(chalk.green('✅ Firebase Admin SDK initialized successfully'));
        // Test creating a custom token (this validates the private key works)
        console.log(chalk.cyan('📍 Testing custom token creation...'));
        const auth = getAdminAuth(app);
        const customToken = await auth.createCustomToken('test-uid-12345');
        console.log(chalk.green('✅ Custom token created successfully'));
        console.log(chalk.gray(`  Token length: ${customToken.length}`));
        return true;
    }
    catch (error) {
        console.error(chalk.red('❌ Firebase configuration test failed:'), error);
        if (error instanceof Error) {
            if (error.message.includes('PEM')) {
                console.log(chalk.yellow('💡 Suggestion: Check the FIREBASE_PRIVATE_KEY format in .env'));
                console.log(chalk.yellow('   Make sure it includes proper \\n characters and is enclosed in quotes'));
            }
            else if (error.message.includes('project')) {
                console.log(chalk.yellow('💡 Suggestion: Verify FIREBASE_PROJECT_ID is correct'));
            }
            else if (error.message.includes('email')) {
                console.log(chalk.yellow('💡 Suggestion: Verify FIREBASE_CLIENT_EMAIL is correct'));
            }
        }
        return false;
    }
}
// Run the test
testFirebaseConfig()
    .then(success => {
    process.exit(success ? 0 : 1);
})
    .catch(error => {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
});
