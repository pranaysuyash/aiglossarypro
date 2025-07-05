/**
 * Email Send Job Processor
 * Handles email sending with templates and attachments
 */

import { Job } from 'bullmq';
import { EmailSendJobData } from '../types';
import { log as logger } from '../../utils/logger';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

interface EmailSendJobResult {
  sent: boolean;
  messageId?: string;
  recipients: string[];
  duration: number;
  error?: string;
}

// Email templates function
function getEmailTemplates() {
  return {
  welcome: {
    subject: 'Welcome to AI Glossary Pro',
    html: `
      <h1>Welcome to AI Glossary Pro!</h1>
      <p>Hello {{name}},</p>
      <p>Thank you for joining AI Glossary Pro. You now have access to our comprehensive AI/ML glossary.</p>
      <p>Best regards,<br>The AI Glossary Pro Team</p>
    `,
    text: `
      Welcome to AI Glossary Pro!
      
      Hello {{name}},
      
      Thank you for joining AI Glossary Pro. You now have access to our comprehensive AI/ML glossary.
      
      Best regards,
      The AI Glossary Pro Team
    `,
  },
  import_complete: {
    subject: 'Excel Import Completed',
    html: `
      <h1>Excel Import Completed</h1>
      <p>Hello {{name}},</p>
      <p>Your Excel import has been completed successfully.</p>
      <ul>
        <li>Terms imported: {{termsImported}}</li>
        <li>Categories imported: {{categoriesImported}}</li>
        <li>Duration: {{duration}}ms</li>
      </ul>
      <p>You can now access your imported data in the dashboard.</p>
      <p>Best regards,<br>The AI Glossary Pro Team</p>
    `,
    text: `
      Excel Import Completed
      
      Hello {{name}},
      
      Your Excel import has been completed successfully.
      
      Terms imported: {{termsImported}}
      Categories imported: {{categoriesImported}}
      Duration: {{duration}}ms
      
      You can now access your imported data in the dashboard.
      
      Best regards,
      The AI Glossary Pro Team
    `,
  },
  ai_generation_complete: {
    subject: 'AI Content Generation Completed',
    html: `
      <h1>AI Content Generation Completed</h1>
      <p>Hello \{{name}},</p>
      <p>Your AI content generation has been completed.</p>
      <ul>
        <li>Terms processed: \{{termsProcessed}}</li>
        <li>Sections generated: \{{sectionsGenerated}}</li>
        <li>Tokens used: \{{tokensUsed}}</li>
        <li>Cost: $\{{cost}}</li>
      </ul>
      <p>You can now review the generated content in your dashboard.</p>
      <p>Best regards,<br>The AI Glossary Pro Team</p>
    `,
    text: `
      AI Content Generation Completed
      
      Hello \{{name}},
      
      Your AI content generation has been completed.
      
      Terms processed: \{{termsProcessed}}
      Sections generated: \{{sectionsGenerated}}
      Tokens used: \{{tokensUsed}}
      Cost: $\{{cost}}
      
      You can now review the generated content in your dashboard.
      
      Best regards,
      The AI Glossary Pro Team
    `,
  },
  newsletter: {
    subject: 'AI Glossary Pro Newsletter - {{date}}',
    html: `
      <h1>AI Glossary Pro Newsletter</h1>
      <p>Hello {{name}},</p>
      <p>Here's what's new in the world of AI/ML:</p>
      <div>{{content}}</div>
      <p>Best regards,<br>The AI Glossary Pro Team</p>
      <p><small><a href="{{unsubscribeUrl}}">Unsubscribe</a></small></p>
    `,
    text: `
      AI Glossary Pro Newsletter
      
      Hello {{name}},
      
      Here's what's new in the world of AI/ML:
      
      {{content}}
      
      Best regards,
      The AI Glossary Pro Team
      
      Unsubscribe: {{unsubscribeUrl}}
    `,
  },
  };
}

// Create transporter
const createTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // In development, use Ethereal for testing
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    logger.info('Using mock email transport for development');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  return nodemailer.createTransport(emailConfig);
};

export async function emailSendProcessor(
  job: Job<EmailSendJobData>
): Promise<EmailSendJobResult> {
  const startTime = Date.now();
  const { to, subject, template, data, attachments } = job.data;

  const recipients = Array.isArray(to) ? to : [to];
  logger.info(`Starting email send job ${job.id} to ${recipients.length} recipients`);

  const result: EmailSendJobResult = {
    sent: false,
    recipients,
    duration: 0,
  };

  try {
    await job.updateProgress({
      progress: 10,
      message: 'Preparing email content',
      stage: 'preparation',
    });

    // Get template content
    const emailTemplates = getEmailTemplates();
    const templateContent = emailTemplates[template as keyof typeof emailTemplates];
    if (!templateContent) {
      throw new Error(`Email template not found: ${template}`);
    }

    // Process template with data
    const processedSubject = subject || processTemplate(templateContent.subject, data);
    const processedHtml = processTemplate(templateContent.html, data);
    const processedText = processTemplate(templateContent.text, data);

    await job.updateProgress({
      progress: 30,
      message: 'Creating email transport',
      stage: 'transport',
    });

    // Create transporter
    const transporter = createTransporter();

    // Verify transporter connection
    try {
      await transporter.verify();
      logger.info('Email transporter verified successfully');
    } catch (error) {
      logger.warn('Email transporter verification failed:', { error: error instanceof Error ? error.message : String(error) });
      // Continue anyway in case verification fails but sending works
    }

    await job.updateProgress({
      progress: 50,
      message: 'Sending email',
      stage: 'sending',
    });

    // Prepare email options
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@aiglossarypro.com',
      to: recipients.join(', '),
      subject: processedSubject,
      html: processedHtml,
      text: processedText,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    result.sent = true;
    result.messageId = info.messageId;
    result.duration = Date.now() - startTime;

    await job.updateProgress({
      progress: 100,
      message: 'Email sent successfully',
      stage: 'completed',
      details: {
        messageId: result.messageId,
        recipients: recipients.length,
        duration: result.duration,
      },
    });

    logger.info(`Email send job ${job.id} completed successfully`, {
      messageId: result.messageId,
      recipients: recipients.length,
      duration: result.duration,
    });

    return result;

  } catch (error) {
    logger.error(`Email send job ${job.id} failed:`, { error: error instanceof Error ? error.message : String(error) });
    
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.duration = Date.now() - startTime;
    
    throw error;
  }
}

/**
 * Process email template with data
 */
function processTemplate(template: string, data: Record<string, any>): string {
  let processed = template;
  
  // Replace placeholders with data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(placeholder, String(value));
  });
  
  // Handle conditional blocks
  processed = processed.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
    return data[condition] ? content : '';
  });
  
  // Handle loops
  processed = processed.replace(/{{#each\s+(\w+)}}(.*?){{\/each}}/gs, (match, arrayName, content) => {
    const array = data[arrayName];
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      let itemContent = content;
      if (typeof item === 'object') {
        Object.entries(item).forEach(([key, value]) => {
          itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });
      } else {
        itemContent = itemContent.replace(/{{this}}/g, String(item));
      }
      return itemContent;
    }).join('');
  });
  
  return processed;
}