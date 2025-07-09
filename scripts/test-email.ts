#!/usr/bin/env node

/**
 * Email Service Test Script
 *
 * Tests email delivery functionality
 */

import dotenv from 'dotenv';
import { testEmailConfiguration } from '../server/utils/email.js';

// Load environment variables
dotenv.config();

const testEmail = process.argv[2];

if (!testEmail) {
  console.error('Usage: npm run test:email <email-address>');
  process.exit(1);
}

console.log('🔍 Testing email service...');
console.log(`📧 Sending test email to: ${testEmail}`);

testEmailConfiguration(testEmail)
  .then((success) => {
    if (success) {
      console.log('✅ Email service test passed!');
      console.log('📬 Check your inbox for the test email.');
    } else {
      console.log('❌ Email service test failed!');
      console.log('🔧 Please check your email configuration.');
    }
  })
  .catch((error) => {
    console.error('❌ Email service test failed:', error.message);
    process.exit(1);
  });
