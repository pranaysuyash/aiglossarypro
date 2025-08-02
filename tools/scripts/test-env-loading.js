#!/usr/bin/env tsx
/**
 * Test Environment Loading
 * Test how .env file is loaded and check Firebase private key
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
// Manually load .env file
console.log(chalk.blue('🔍 Testing .env file loading...'));
const result = dotenv.config();
if (result.error) {
    console.error(chalk.red('❌ Error loading .env file:'), result.error);
    process.exit(1);
}
console.log(chalk.green('✅ .env file loaded successfully'));
// Check Firebase environment variables
console.log(chalk.cyan('📍 Checking Firebase environment variables:'));
console.log(chalk.gray(`  FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'NOT SET'}`));
console.log(chalk.gray(`  FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET'}`));
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
    console.log(chalk.gray(`  FIREBASE_PRIVATE_KEY raw length: ${privateKey.length}`));
    // Process the private key
    const processedKey = privateKey.replace(/\\n/g, '\n');
    console.log(chalk.gray(`  FIREBASE_PRIVATE_KEY processed length: ${processedKey.length}`));
    console.log(chalk.gray(`  Starts with BEGIN: ${processedKey.includes('-----BEGIN PRIVATE KEY-----')}`));
    console.log(chalk.gray(`  Ends with END: ${processedKey.includes('-----END PRIVATE KEY-----')}`));
    // Show first and last 50 characters for debugging
    console.log(chalk.gray(`  First 50 chars: ${processedKey.substring(0, 50)}`));
    console.log(chalk.gray(`  Last 50 chars: ${processedKey.substring(processedKey.length - 50)}`));
    // Count newlines
    const newlineCount = (processedKey.match(/\n/g) || []).length;
    console.log(chalk.gray(`  Newline count: ${newlineCount}`));
}
else {
    console.log(chalk.red('❌ FIREBASE_PRIVATE_KEY not found'));
}
