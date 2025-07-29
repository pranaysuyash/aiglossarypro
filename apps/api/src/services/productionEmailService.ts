/**
 * Production Email Service with Resend Integration
 * Handles all email delivery for production deployment
 */

import { Resend } from 'resend';
import { log as logger } from '../utils/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class ProductionEmailService {
  private resend: Resend | null = null;
  private fallbackSMTP: any = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@aiglossarypro.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'AI Glossary Pro';

    this.initializeServices();
  }

  private initializeServices() {
    // Initialize Resend (preferred)
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      logger.info('Resend email service initialized');
    } else {
      logger.warn('RESEND_API_KEY not found, Resend service not available');
    }

    // Fallback to SMTP if Resend not available
    if (!this.resend && process.env.SMTP_HOST) {
      try {
        const nodemailer = require('nodemailer');
        this.fallbackSMTP = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        logger.info('SMTP fallback service initialized');
      } catch (error) {
        logger.error('Failed to initialize SMTP fallback:', error);
      }
    }

    if (!this.resend && !this.fallbackSMTP) {
      logger.warn('No email service configured. Emails will be logged only.');
    }
  }

  /**
   * Send email using Resend (preferred) or SMTP fallback
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text, replyTo, attachments } = options;

    // Check if email is enabled
    if (process.env.EMAIL_ENABLED !== 'true') {
      logger.info('Email service disabled, logging email instead:', {
        to: Array.isArray(to) ? to : [to],
        subject,
        htmlLength: html.length,
      });
      return true;
    }

    try {
      // Try Resend first
      if (this.resend) {
        return await this.sendWithResend(options);
      }

      // Fallback to SMTP
      if (this.fallbackSMTP) {
        return await this.sendWithSMTP(options);
      }

      // No service available
      logger.error('No email service available');
      return false;
    } catch (error) {
      logger.error('Email send failed:', {
        error: error instanceof Error ? error.message : String(error),
        to: Array.isArray(to) ? to : [to],
        subject,
      });
      return false;
    }
  }

  private async sendWithResend(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, html, text, replyTo } = options;
      const recipients = Array.isArray(to) ? to : [to];

      const result = await this.resend!.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipients,
        subject,
        html,
        text: text || this.stripHtml(html),
        ...(replyTo && { reply_to: replyTo }),
      });

      logger.info('Email sent successfully via Resend:', {
        id: result.data?.id,
        to: recipients,
        subject,
      });

      return true;
    } catch (error) {
      logger.error('Resend email failed:', error);
      throw error;
    }
  }

  private async sendWithSMTP(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, html, text, replyTo, attachments } = options;
      const recipients = Array.isArray(to) ? to : [to];

      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipients.join(', '),
        subject,
        html,
        text: text || this.stripHtml(html),
        ...(replyTo && { replyTo }),
        ...(attachments && { attachments }),
      };

      const result = await this.fallbackSMTP.sendMail(mailOptions);

      logger.info('Email sent successfully via SMTP:', {
        messageId: result.messageId,
        to: recipients,
        subject,
      });

      return true;
    } catch (error) {
      logger.error('SMTP email failed:', error);
      throw error;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Email Templates
   */
  getWelcomeTemplate(userName?: string): EmailTemplate {
    const name = userName || 'there';
    return {
      subject: 'Welcome to AI Glossary Pro!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to AI Glossary Pro!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Thank you for joining AI Glossary Pro! You now have access to our comprehensive AI/ML glossary 
              with thousands of terms, detailed explanations, and real-world examples.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">What's included:</h3>
              <ul style="color: #555; line-height: 1.6;">
                <li>🔍 Advanced search capabilities</li>
                <li>📚 Comprehensive term definitions</li>
                <li>💡 Real-world examples and use cases</li>
                <li>🎯 Personalized learning paths</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://aiglossary.pro'}" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Start Exploring
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Need help? Reply to this email or visit our <a href="${process.env.CLIENT_URL || 'https://aiglossary.pro'}/support">support center</a>.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to AI Glossary Pro!

Hello ${name}!

Thank you for joining AI Glossary Pro! You now have access to our comprehensive AI/ML glossary with thousands of terms, detailed explanations, and real-world examples.

What's included:
- Advanced search capabilities
- Comprehensive term definitions
- Real-world examples and use cases
- Personalized learning paths

Start exploring: ${process.env.CLIENT_URL || 'https://aiglossary.pro'}

Need help? Reply to this email or visit our support center.

Best regards,
The AI Glossary Pro Team`,
    };
  }

  getPremiumWelcomeTemplate(data: { userName?: string; orderNumber?: string }): EmailTemplate {
    const name = data.userName || 'there';
    return {
      subject: '🎉 Welcome to AI Glossary Pro Premium!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Premium Access Activated!</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Congratulations! Your AI Glossary Pro Premium access has been activated. 
              You now have unlimited access to all premium features.
            </p>
            ${data.orderNumber ? `<p style="color: #666; font-size: 14px;"><strong>Order #:</strong> ${data.orderNumber}</p>` : ''}
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin-top: 0;">🚀 Premium Features Unlocked:</h3>
              <ul style="color: #555; line-height: 1.6;">
                <li>✅ Unlimited search and browsing</li>
                <li>✅ Advanced AI-powered explanations</li>
                <li>✅ Downloadable content</li>
                <li>✅ Priority support</li>
                <li>✅ Exclusive premium content</li>
                <li>✅ Personalized learning recommendations</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://aiglossary.pro'}/dashboard" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Access Premium Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Questions about your premium access? Contact our support team - we're here to help!
            </p>
          </div>
        </div>
      `,
      text: `🎉 Welcome to AI Glossary Pro Premium!

Hello ${name}!

Congratulations! Your AI Glossary Pro Premium access has been activated. You now have unlimited access to all premium features.

${data.orderNumber ? `Order #: ${data.orderNumber}` : ''}

🚀 Premium Features Unlocked:
- Unlimited search and browsing
- Advanced AI-powered explanations
- Downloadable content
- Priority support
- Exclusive premium content
- Personalized learning recommendations

Access your premium dashboard: ${process.env.CLIENT_URL || 'https://aiglossary.pro'}/dashboard

Questions about your premium access? Contact our support team - we're here to help!

Best regards,
The AI Glossary Pro Team`,
    };
  }

  getPasswordResetTemplate(resetToken: string): EmailTemplate {
    const resetUrl = `${process.env.CLIENT_URL || 'https://aiglossary.pro'}/reset-password?token=${resetToken}`;
    return {
      subject: 'Reset Your AI Glossary Pro Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #667eea; padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #555; line-height: 1.6;">
              You requested a password reset for your AI Glossary Pro account. 
              Click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link: ${resetUrl}
            </p>
          </div>
        </div>
      `,
      text: `Password Reset Request

You requested a password reset for your AI Glossary Pro account. 

Reset your password here: ${resetUrl}

This link will expire in 1 hour. If you didn't request this reset, please ignore this email.

Best regards,
The AI Glossary Pro Team`,
    };
  }

  /**
   * Quick send methods for common emails
   */
  async sendWelcomeEmail(to: string, userName?: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(userName);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPremiumWelcomeEmail(
    to: string,
    data: { userName?: string; orderNumber?: string }
  ): Promise<boolean> {
    const template = this.getPremiumWelcomeTemplate(data);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const template = this.getPasswordResetTemplate(resetToken);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Test email configuration
   */
  async testConfiguration(testEmail: string): Promise<boolean> {
    try {
      const result = await this.sendEmail({
        to: testEmail,
        subject: 'AI Glossary Pro - Email Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Email Configuration Test</h2>
            <p>This is a test email to verify your AI Glossary Pro email configuration is working correctly.</p>
            <p><strong>✅ If you received this email, your email service is properly configured!</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3>Configuration Details:</h3>
              <ul>
                <li>Service: ${this.resend ? 'Resend' : 'SMTP'}</li>
                <li>From: ${this.fromEmail}</li>
                <li>Test Time: ${new Date().toISOString()}</li>
              </ul>
            </div>
            <p style="color: #666; font-size: 14px;">
              This is an automated test email from AI Glossary Pro.
            </p>
          </div>
        `,
      });

      logger.info('Email configuration test completed', {
        success: result,
        testEmail,
        service: this.resend ? 'Resend' : 'SMTP',
      });

      return result;
    } catch (error) {
      logger.error('Email configuration test failed:', {
        error: error instanceof Error ? error.message : String(error),
        testEmail,
      });
      return false;
    }
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    available: boolean;
    service: string;
    configured: boolean;
  } {
    return {
      available: !!(this.resend || this.fallbackSMTP),
      service: this.resend ? 'Resend' : this.fallbackSMTP ? 'SMTP' : 'None',
      configured: process.env.EMAIL_ENABLED === 'true',
    };
  }
}

// Export singleton instance
export const productionEmailService = new ProductionEmailService();
