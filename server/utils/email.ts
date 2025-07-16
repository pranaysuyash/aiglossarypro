import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import {
  getEmailVerificationTemplate,
  getLearningProgressTemplate,
  getPasswordResetEmailTemplate,
  getPremiumWelcomeEmailTemplate,
  getSystemNotificationTemplate,
  getWelcomeEmailTemplate,
  type PremiumWelcomeEmailData,
} from './emailTemplates';
import { log as logger } from './logger';

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

// Initialize Resend client if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
      subject,
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
    // Use Resend if available (preferred)
    if (resend) {
      logger.info('Using Resend for email delivery');

      const { data, error } = await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME || 'AI Glossary Pro'} <${fromEmail}>`,
        to: to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content instanceof Buffer ? att.content : Buffer.from(att.content),
        })),
      });

      if (error) {
        logger.error('Resend email failed', {
          error,
          to,
          subject,
        });
        throw new Error(`Resend email failed: ${error.message}`);
      }

      logger.info('Email sent successfully via Resend', {
        messageId: data?.id,
        to,
        subject,
        preview: `${html.substring(0, 200)}...`,
      });

      return;
    }

    // Fall back to SMTP if Resend is not configured
    logger.info('Using SMTP for email delivery');
    const emailTransporter = createTransporter();

    // Verify transporter configuration
    try {
      await emailTransporter.verify();
      logger.info('Email transporter verified successfully');
    } catch (verifyError) {
      logger.error('Email transporter verification failed', {
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
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

    logger.info('Email sent successfully via SMTP', {
      messageId: result.messageId,
      to,
      subject,
      preview: `${html.substring(0, 200)}...`,
    });
  } catch (error) {
    logger.error('Error sending email', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      to,
      subject,
    });
    throw error;
  }
}

/**
 * Send premium welcome email
 */
export async function sendPremiumWelcomeEmail(data: PremiumWelcomeEmailData): Promise<void> {
  const template = getPremiumWelcomeEmailTemplate(data);

  await sendEmail({
    to: [data.userEmail],
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
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
      testEmail,
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
export async function sendEmailVerificationEmail(
  userEmail: string,
  verificationToken: string,
  userName?: string
): Promise<void> {
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
export async function sendLearningProgressEmail(
  userEmail: string,
  userName: string,
  milestone: string,
  progress: number
): Promise<void> {
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

/**
 * Build purchase instructions HTML email template
 */
export function buildPurchaseInstructionsHtml(email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 30px;
          margin: 20px 0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white !important;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .steps {
          background-color: white;
          border-radius: 5px;
          padding: 20px;
          margin: 20px 0;
        }
        .step {
          margin: 15px 0;
          padding-left: 30px;
          position: relative;
        }
        .step::before {
          content: attr(data-step);
          position: absolute;
          left: 0;
          background-color: #007bff;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 30px;
        }
        .support-note {
          background-color: #e9ecef;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Your AI Glossary Pro Access is Ready!</h1>
          <p>Thank you for purchasing lifetime access to AI Glossary Pro.</p>
        </div>
        
        <p>Hi there,</p>
        
        <p>Your purchase has been confirmed, and your lifetime access is ready to activate. Follow these simple steps to get started:</p>
        
        <div class="steps">
          <div class="step" data-step="1">
            <strong>Visit AI Glossary Pro</strong><br>
            Go to <a href="https://aiglossarypro.com">aiglossarypro.com</a>
          </div>
          
          <div class="step" data-step="2">
            <strong>Sign In</strong><br>
            Click "Sign in with Google" or "Sign in with GitHub"<br>
            <em>Important: Use this email address (${email}) when signing in</em>
          </div>
          
          <div class="step" data-step="3">
            <strong>Enjoy Lifetime Access</strong><br>
            That's it! You now have full access to all premium features.
          </div>
        </div>
        
        <center>
          <a href="https://aiglossarypro.com" class="button">Go to AI Glossary Pro →</a>
        </center>
        
        <div class="support-note">
          <strong>Need help?</strong><br>
          If you use a different email address for your Google or GitHub account, just reply to this email and we'll transfer your license. We're here to help!
        </div>
        
        <div class="footer">
          <p>Welcome to the AI Glossary Pro community!</p>
          <p style="color: #999;">This email was sent to ${email} because a purchase was made using this email address.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Build purchase instructions text email template
 */
export function buildPurchaseInstructionsText(email: string): string {
  return `
🎉 Your AI Glossary Pro Access is Ready!

Thank you for purchasing lifetime access to AI Glossary Pro.

Your purchase has been confirmed, and your lifetime access is ready to activate. Follow these simple steps to get started:

1. Visit AI Glossary Pro
   Go to https://aiglossarypro.com

2. Sign In
   Click "Sign in with Google" or "Sign in with GitHub"
   Important: Use this email address (${email}) when signing in

3. Enjoy Lifetime Access
   That's it! You now have full access to all premium features.

Need help?
If you use a different email address for your Google or GitHub account, just reply to this email and we'll transfer your license. We're here to help!

Welcome to the AI Glossary Pro community!

---
This email was sent to ${email} because a purchase was made using this email address.
  `.trim();
}

/**
 * Send purchase confirmation email with login instructions
 */
export async function sendPurchaseInstructionsEmail(email: string): Promise<void> {
  await sendEmail({
    to: [email],
    subject: '🎉 Your AI Glossary Pro access is ready!',
    html: buildPurchaseInstructionsHtml(email),
    text: buildPurchaseInstructionsText(email),
  });
}
