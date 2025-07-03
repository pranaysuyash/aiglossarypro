import { log as logger } from './logger';

interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured email service
 * This is a placeholder - implement with your preferred email service (SendGrid, AWS SES, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // Check if email is enabled
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    logger.info('Email service not enabled, skipping email send', {
      to,
      subject
    });
    return;
  }

  try {
    // TODO: Implement actual email sending logic
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to,
    //   from: process.env.EMAIL_FROM,
    //   subject,
    //   html,
    //   text: text || html.replace(/<[^>]*>/g, '')
    // });

    // For now, just log the email
    logger.info('Email would be sent', {
      to,
      subject,
      preview: html.substring(0, 200) + '...'
    });

  } catch (error) {
    logger.error('Error sending email', {
      error: error instanceof Error ? error.message : String(error),
      to,
      subject
    });
    throw error;
  }
}