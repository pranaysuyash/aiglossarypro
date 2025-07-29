#!/usr/bin/env node

/**
 * Simple Resend email test script
 */

import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: '.env.production' });

async function testEmail() {
  console.log('🧪 Testing Resend Email Configuration...\n');

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set in .env.production');
    process.exit(1);
  }

  console.log('✓ Resend API key found');
  console.log(`✓ Sending from: ${process.env.EMAIL_FROM || 'onboarding@resend.dev'}`);

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: process.argv[2] || 'founder@psrstech.com',
      subject: 'AI Glossary Pro - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">AI Glossary Pro Email Test</h1>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>API Key: ✓ Configured</li>
            <li>From: ${process.env.EMAIL_FROM || 'onboarding@resend.dev'}</li>
            <li>Service: Resend</li>
            <li>Environment: Production</li>
          </ul>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is a test email from your AI Glossary Pro deployment.
          </p>
        </div>
      `,
    });

    console.log('\n✅ Email sent successfully!');
    console.log('📧 Email ID:', result.data?.id);
    console.log('\nCheck your inbox for the test email.');
  } catch (error) {
    console.error('\n❌ Failed to send email:', error.message);
    if (error.message.includes('domain')) {
      console.log('\n💡 Tip: You may need to verify your domain in Resend dashboard');
      console.log('   For testing, you can use "onboarding@resend.dev" as the from address');
    }
  }
}

console.log('Usage: node test-resend-email.js [recipient-email]');
console.log('Example: node test-resend-email.js founder@psrstech.com\n');

testEmail();
