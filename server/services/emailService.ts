import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { ResponseTemplate, SupportTicket, TicketMessage } from '../../shared/schema';
import { log as logger } from '../utils/logger';

interface EmailConfig {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromEmail: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export class EmailService {
  private sesClient: SESClient | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      fromEmail: process.env.SUPPORT_FROM_EMAIL || 'support@aiglossarypro.com',
      fromName: process.env.SUPPORT_FROM_NAME || 'AI Glossary Pro Support',
    };

    // Initialize SES client if credentials are available
    if (this.config.accessKeyId && this.config.secretAccessKey) {
      this.sesClient = new SESClient({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
      });
    } else {
      logger.warn('AWS SES credentials not configured. Email notifications will be disabled.');
    }
  }

  /**
   * Send email using AWS SES
   */
  private async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody: string
  ): Promise<boolean> {
    if (!this.sesClient) {
      logger.warn('SES client not configured. Skipping email send.');
      return false;
    }

    try {
      const command = new SendEmailCommand({
        Source: `${this.config.fromName} <${this.config.fromEmail}>`,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      const result = await this.sesClient.send(command);

      logger.info('Email sent successfully:', {
        to,
        subject,
        messageId: result.MessageId,
      });

      return true;
    } catch (error) {
      logger.error('Error sending email:', {
        to,
        subject,
        error,
      });
      return false;
    }
  }

  /**
   * Generate email template with ticket variables replaced
   */
  private generateTemplate(
    template: ResponseTemplate,
    ticket: SupportTicket,
    additionalVariables: Record<string, string> = {}
  ): EmailTemplate {
    const variables = {
      ticket_number: ticket.ticketNumber,
      customer_name: ticket.customerName || 'Valued Customer',
      subject: ticket.subject,
      status: ticket.status.replace('_', ' '),
      priority: ticket.priority,
      type: ticket.type.replace('_', ' '),
      support_url: `${process.env.CLIENT_URL || 'https://aiglossary.pro'}/support`,
      ...additionalVariables,
    };

    let subject = template.subject || '';
    let content = template.content;

    // Replace variables in subject and content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    });

    const htmlBody = this.generateHtmlEmail(subject, content, ticket);
    const textBody = this.generateTextEmail(content);

    return {
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Generate HTML email template
   */
  private generateHtmlEmail(subject: string, content: string, ticket: SupportTicket): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px 20px;
            border-radius: 0 0 8px 8px;
        }
        .ticket-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-open { background: #fee2e2; color: #dc2626; }
        .status-in-progress { background: #fef3c7; color: #d97706; }
        .status-waiting-for-customer { background: #dbeafe; color: #2563eb; }
        .status-resolved { background: #dcfce7; color: #16a34a; }
        .status-closed { background: #f3f4f6; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Glossary Pro</h1>
        <h2>${subject}</h2>
    </div>
    
    <div class="content">
        <div class="ticket-info">
            <h3>Ticket Information</h3>
            <p><strong>Ticket Number:</strong> #${ticket.ticketNumber}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Status:</strong> <span class="status status-${ticket.status}">${ticket.status.replace('_', ' ')}</span></p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Type:</strong> ${ticket.type.replace('_', ' ')}</p>
        </div>
        
        <div style="white-space: pre-wrap; line-height: 1.6;">
            ${content.replace(/\n/g, '<br>')}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'https://aiglossary.pro'}/support" class="button">
                View Ticket in Support Center
            </a>
        </div>
    </div>
    
    <div class="footer">
        <p>
            This email was sent regarding your support ticket #${ticket.ticketNumber}.<br>
            If you have any questions, please reply to this email or visit our 
            <a href="${process.env.CLIENT_URL || 'https://aiglossary.pro'}/support">Support Center</a>.
        </p>
        <p>
            <strong>AI Glossary Pro</strong><br>
            Your comprehensive AI/ML learning platform
        </p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email
   */
  private generateTextEmail(content: string): string {
    return `
AI Glossary Pro Support

${content}

---

Visit our Support Center: ${process.env.CLIENT_URL || 'https://aiglossary.pro'}/support

AI Glossary Pro
Your comprehensive AI/ML learning platform
`;
  }

  /**
   * Send ticket created notification
   */
  async sendTicketCreatedNotification(
    ticket: SupportTicket,
    template?: ResponseTemplate
  ): Promise<boolean> {
    try {
      if (!template) {
        // Default template if none provided
        const subject = `Support Ticket Created - #${ticket.ticketNumber}`;
        const content = `Hello ${ticket.customerName || 'Valued Customer'},

Thank you for contacting AI Glossary Pro support. We have received your support ticket and will respond within 24 hours.

Ticket Details:
- Ticket Number: #${ticket.ticketNumber}
- Subject: ${ticket.subject}
- Priority: ${ticket.priority}
- Type: ${ticket.type.replace('_', ' ')}

Our support team is committed to providing you with the best possible assistance. You can track the progress of your ticket in our Support Center.

Best regards,
AI Glossary Pro Support Team`;

        const htmlBody = this.generateHtmlEmail(subject, content, ticket);
        const textBody = this.generateTextEmail(content);

        return await this.sendEmail(ticket.customerEmail, subject, htmlBody, textBody);
      }

      const emailTemplate = this.generateTemplate(template, ticket);

      return await this.sendEmail(
        ticket.customerEmail,
        emailTemplate.subject,
        emailTemplate.htmlBody,
        emailTemplate.textBody
      );
    } catch (error) {
      logger.error('Error sending ticket created notification:', error);
      return false;
    }
  }

  /**
   * Send ticket status update notification
   */
  async sendTicketStatusUpdateNotification(
    ticket: SupportTicket,
    oldStatus: string,
    template?: ResponseTemplate
  ): Promise<boolean> {
    try {
      if (!template) {
        // Default template if none provided
        const subject = `Ticket Status Updated - #${ticket.ticketNumber}`;
        const content = `Hello ${ticket.customerName || 'Valued Customer'},

Your support ticket status has been updated.

Ticket Details:
- Ticket Number: #${ticket.ticketNumber}
- Subject: ${ticket.subject}
- Previous Status: ${oldStatus.replace('_', ' ')}
- Current Status: ${ticket.status.replace('_', ' ')}

${
  ticket.status === 'resolved'
    ? 'Your ticket has been resolved. If you need further assistance, please reply to this email and we will reopen your ticket.'
    : 'We will continue working on your ticket and provide updates as needed.'
}

You can view your ticket and add replies in our Support Center.

Best regards,
AI Glossary Pro Support Team`;

        const htmlBody = this.generateHtmlEmail(subject, content, ticket);
        const textBody = this.generateTextEmail(content);

        return await this.sendEmail(ticket.customerEmail, subject, htmlBody, textBody);
      }

      const emailTemplate = this.generateTemplate(template, ticket, {
        old_status: oldStatus.replace('_', ' '),
      });

      return await this.sendEmail(
        ticket.customerEmail,
        emailTemplate.subject,
        emailTemplate.htmlBody,
        emailTemplate.textBody
      );
    } catch (error) {
      logger.error('Error sending ticket status update notification:', error);
      return false;
    }
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    ticket: SupportTicket,
    message: TicketMessage,
    isFromSupport = true
  ): Promise<boolean> {
    try {
      if (!isFromSupport) {
        // Don't send notifications for customer messages
        return true;
      }

      const subject = `New Reply to Your Support Ticket - #${ticket.ticketNumber}`;
      const content = `Hello ${ticket.customerName || 'Valued Customer'},

You have received a new reply to your support ticket.

Ticket: #${ticket.ticketNumber} - ${ticket.subject}

Reply from Support Team:
${message.content}

You can view the full conversation and reply in our Support Center.

Best regards,
AI Glossary Pro Support Team`;

      const htmlBody = this.generateHtmlEmail(subject, content, ticket);
      const textBody = this.generateTextEmail(content);

      return await this.sendEmail(ticket.customerEmail, subject, htmlBody, textBody);
    } catch (error) {
      logger.error('Error sending new message notification:', error);
      return false;
    }
  }

  /**
   * Send refund request notification
   */
  async sendRefundRequestNotification(
    customerEmail: string,
    customerName: string,
    refundId: string,
    orderId: string,
    amount: number
  ): Promise<boolean> {
    try {
      const subject = 'Refund Request Received - AI Glossary Pro';
      const content = `Hello ${customerName || 'Valued Customer'},

We have received your refund request for AI Glossary Pro.

Refund Details:
- Order ID: ${orderId}
- Request ID: ${refundId}
- Amount: $${(amount / 100).toFixed(2)}

Our billing team will review your request and respond within 2 business days. Refunds are processed according to our refund policy.

If you have any questions about your refund request, please contact our support team.

Best regards,
AI Glossary Pro Support Team`;

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><title>${subject}</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">${subject}</h2>
        <div style="white-space: pre-wrap;">
            ${content.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://aiglossary.pro'}/support" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Contact Support
            </a>
        </div>
    </div>
</body>
</html>`;

      const textBody = this.generateTextEmail(content);

      return await this.sendEmail(customerEmail, subject, htmlBody, textBody);
    } catch (error) {
      logger.error('Error sending refund request notification:', error);
      return false;
    }
  }

  /**
   * Send refund status update notification
   */
  async sendRefundStatusUpdateNotification(
    customerEmail: string,
    customerName: string,
    refundId: string,
    orderId: string,
    status: string,
    amount?: number
  ): Promise<boolean> {
    try {
      const subject = `Refund ${status === 'processed' ? 'Processed' : 'Status Update'} - AI Glossary Pro`;

      let content = `Hello ${customerName || 'Valued Customer'},

Your refund request status has been updated.

Refund Details:
- Order ID: ${orderId}
- Request ID: ${refundId}
- Status: ${status.replace('_', ' ')}`;

      if (amount && status === 'processed') {
        content += `\n- Refunded Amount: $${(amount / 100).toFixed(2)}`;
      }

      content += `

${
  status === 'processed'
    ? 'Your refund has been processed and will appear in your account within 3-5 business days.'
    : status === 'approved'
      ? 'Your refund request has been approved and will be processed shortly.'
      : status === 'rejected'
        ? 'Your refund request has been reviewed and unfortunately cannot be approved at this time. Please contact support if you have questions.'
        : 'We will continue processing your refund request.'
}

If you have any questions, please contact our support team.

Best regards,
AI Glossary Pro Support Team`;

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><title>${subject}</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">${subject}</h2>
        <div style="white-space: pre-wrap;">
            ${content.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.CLIENT_URL || 'https://aiglossary.pro'}/support" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Contact Support
            </a>
        </div>
    </div>
</body>
</html>`;

      const textBody = this.generateTextEmail(content);

      return await this.sendEmail(customerEmail, subject, htmlBody, textBody);
    } catch (error) {
      logger.error('Error sending refund status update notification:', error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      if (!this.sesClient) {
        logger.error('SES client not configured');
        return false;
      }

      const testEmail = 'test@example.com';
      const subject = 'Test Email - AI Glossary Pro';
      const content = 'This is a test email to verify email configuration.';

      // Don't actually send test emails, just verify configuration
      logger.info('Email configuration test - SES client is configured');
      return true;
    } catch (error) {
      logger.error('Error testing email configuration:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
