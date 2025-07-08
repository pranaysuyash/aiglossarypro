import { log as logger } from './logger';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getEmailVerificationTemplate,
  getLearningProgressTemplate,
  getSystemNotificationTemplate
} from './emailTemplates';

interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create transporter singleton
let transporter: Transporter | null = null;

function createTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const emailService = process.env.EMAIL_SERVICE?.toLowerCase();
  
  // Configuration for different email services
  let config: EmailConfig;
  
  switch (emailService) {
    case 'gmail':
      config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_APP_PASSWORD!,
        },
      };
      break;
      
    case 'outlook':
    case 'hotmail':
      config = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASSWORD!,
        },
      };
      break;
      
    case 'yahoo':
      config = {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_APP_PASSWORD!,
        },
      };
      break;
      
    case 'smtp':
    default:
      config = {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASSWORD!,
        },
      };
      break;
  }

  transporter = nodemailer.createTransport(config);
  
  return transporter;
}

/**
 * Send email using configured email service
 * Supports multiple email providers including Gmail, Outlook, Yahoo, and custom SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text, attachments } = options;

  // Check if email is enabled
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    logger.info('Email service not enabled, skipping email send', {
      to,
      subject
    });
    return;
  }

  // Validate required environment variables
  const fromEmail = process.env.EMAIL_FROM;
  if (!fromEmail) {
    logger.error('EMAIL_FROM environment variable is required');
    throw new Error('EMAIL_FROM environment variable is required');
  }

  try {
    const emailTransporter = createTransporter();

    // Verify transporter configuration
    try {
      await emailTransporter.verify();
      logger.info('Email transporter verified successfully');
    } catch (verifyError) {
      logger.error('Email transporter verification failed', {
        error: verifyError instanceof Error ? verifyError.message : String(verifyError)
      });
      throw new Error('Email service configuration is invalid');
    }

    // Prepare email message
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'AI Glossary Pro',
        address: fromEmail,
      },
      to: to.join(', '),
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      attachments,
    };

    // Send the email
    const result = await emailTransporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      messageId: result.messageId,
      to,
      subject,
      preview: html.substring(0, 200) + '...'
    });

  } catch (error) {
    logger.error('Error sending email', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      to,
      subject
    });
    throw error;
  }
}

/**
 * Test email configuration by sending a test email
 */
export async function testEmailConfiguration(testEmail: string): Promise<boolean> {
  try {
    await sendEmail({
      to: [testEmail],
      subject: 'AI Glossary Pro - Email Configuration Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify your AI Glossary Pro email configuration is working correctly.</p>
        <p>If you received this email, your email service is properly configured!</p>
        <hr>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
    });
    
    logger.info('Test email sent successfully', { testEmail });
    return true;
  } catch (error) {
    logger.error('Test email failed', {
      error: error instanceof Error ? error.message : String(error),
      testEmail
    });
    return false;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userEmail: string, userName?: string): Promise<void> {
  const template = getWelcomeEmailTemplate(userName);
  
  await sendEmail({
    to: [userEmail],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<void> {
  const template = getPasswordResetEmailTemplate(resetToken);
  
  await sendEmail({
    to: [userEmail],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(userEmail: string, verificationToken: string, userName?: string): Promise<void> {
  const template = getEmailVerificationTemplate(verificationToken, userName);
  
  await sendEmail({
    to: [userEmail],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send learning progress notification
 */
export async function sendLearningProgressEmail(userEmail: string, userName: string, milestone: string, progress: number): Promise<void> {
  const template = getLearningProgressTemplate(userName, milestone, progress);
  
  await sendEmail({
    to: [userEmail],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Send system notification email
 */
export async function sendSystemNotificationEmail(
  userEmail: string, 
  title: string, 
  message: string, 
  actionUrl?: string, 
  actionText?: string
): Promise<void> {
  const template = getSystemNotificationTemplate(title, message, actionUrl, actionText);
  
  await sendEmail({
    to: [userEmail],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}