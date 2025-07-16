#!/usr/bin/env node

import { config } from 'dotenv';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Load environment variables
config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  const testEmail = process.argv[2] || 'test@example.com';
  const testType = process.argv[3] || 'basic';

  if (process.env.EMAIL_ENABLED !== 'true') {
    console.error('❌ Email is not enabled (EMAIL_ENABLED !== true)');
    process.exit(1);
  }

  try {
    // Import email functions
    const { sendPurchaseInstructionsEmail, testEmailConfiguration } = await import(
      '../server/utils/email.js'
    );

    if (testType === 'purchase') {
      console.log('📧 Testing purchase instructions email...');
      await sendPurchaseInstructionsEmail(testEmail);
      console.log('✅ Purchase instructions email sent successfully!');
      console.log('   Sent to:', testEmail);
      console.log('\n💡 This is the email that will be sent to customers after they purchase.');
    } else {
      // Basic configuration test
      // Test Resend if configured
      if (process.env.RESEND_API_KEY) {
        console.log('📧 Testing Resend email service...');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
          from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
          to: testEmail,
          subject: 'AI Glossary Pro - Email Test',
          html: `
            <h2>Email Configuration Test</h2>
            <p>This is a test email from AI Glossary Pro.</p>
            <p>If you're receiving this, your email configuration is working correctly!</p>
            <p>Configuration details:</p>
            <ul>
              <li>Service: Resend</li>
              <li>From: ${process.env.EMAIL_FROM}</li>
              <li>Environment: ${process.env.NODE_ENV}</li>
            </ul>
          `,
        });

        if (error) {
          console.error('❌ Resend error:', error);
          process.exit(1);
        }

        console.log('✅ Resend email sent successfully!');
        console.log('   Email ID:', data.id);
        console.log('   Sent to:', testEmail);
      }

      // Test SMTP if configured
      else if (process.env.SMTP_HOST) {
        console.log('📧 Testing SMTP email service...');

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        // Send test email
        const info = await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.FROM_EMAIL || process.env.EMAIL_FROM}>`,
          to: testEmail,
          subject: 'AI Glossary Pro - Email Test',
          html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email from AI Glossary Pro.</p>
          <p>If you're receiving this, your email configuration is working correctly!</p>
          <p>Configuration details:</p>
          <ul>
            <li>Service: SMTP (${process.env.SMTP_HOST})</li>
            <li>From: ${process.env.FROM_EMAIL || process.env.EMAIL_FROM}</li>
            <li>Environment: ${process.env.NODE_ENV}</li>
          </ul>
        `,
        });

        console.log('✅ SMTP email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Sent to:', testEmail);
      }

      // Test SendGrid if configured
      else if (process.env.SENDGRID_API_KEY) {
        console.log('📧 Testing SendGrid email service...');

        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: testEmail,
          from: {
            email: process.env.EMAIL_FROM,
            name: process.env.EMAIL_FROM_NAME,
          },
          subject: 'AI Glossary Pro - Email Test',
          html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email from AI Glossary Pro.</p>
          <p>If you're receiving this, your email configuration is working correctly!</p>
          <p>Configuration details:</p>
          <ul>
            <li>Service: SendGrid</li>
            <li>From: ${process.env.EMAIL_FROM}</li>
            <li>Environment: ${process.env.NODE_ENV}</li>
          </ul>
        `,
        };

        await sgMail.default.send(msg);
        console.log('✅ SendGrid email sent successfully!');
        console.log('   Sent to:', testEmail);
      } else {
        console.error('❌ No email service configured!');
        console.log('\nPlease configure one of the following:');
        console.log('  - Resend: Set RESEND_API_KEY');
        console.log('  - SMTP: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
        console.log('  - SendGrid: Set SENDGRID_API_KEY');
        process.exit(1);
      }
    }

    console.log('\n✅ Email test completed successfully!');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

// Run the test
console.log('Usage: node test-email.js [recipient-email] [test-type]');
console.log('Examples:');
console.log('  node test-email.js your@email.com          # Basic configuration test');
console.log('  node test-email.js your@email.com purchase # Test purchase instructions email\n');

testEmail().catch(console.error);
