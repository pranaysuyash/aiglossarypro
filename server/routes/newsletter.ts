import { Router } from 'express';
import { db } from '../db';
import { logger } from '../utils/logger';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional()
});

// Helper function to extract location data from request
function extractLocationData(req: any) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const acceptLanguage = req.get('Accept-Language') || 'en';
  
  // Hash IP for privacy
  const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');
  
  // Extract primary language from Accept-Language header
  const language = acceptLanguage.split(',')[0].split('-')[0] || 'en';
  
  return {
    hashedIp,
    userAgent,
    language
  };
}

// Newsletter subscription endpoint
router.post('/subscribe', async (req, res) => {
  try {
    const { email, utm_source, utm_medium, utm_campaign } = emailSchema.parse(req.body);
    const { hashedIp, userAgent, language } = extractLocationData(req);
    
    // Check if email already exists
    const existingSubscription = await db.query(
      'SELECT id FROM newsletter_subscriptions WHERE email = ?',
      [email]
    );
    
    if (existingSubscription.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }
    
    // Insert new subscription with location and attribution data
    await db.query(
      `INSERT INTO newsletter_subscriptions (
        email, subscribed_at, status, language, user_agent, ip_address,
        utm_source, utm_medium, utm_campaign
      ) VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)`,
      [email, 'active', language, userAgent, hashedIp, utm_source, utm_medium, utm_campaign]
    );
    
    logger.info(`New newsletter subscription: ${email} (${language})`);
    
    res.json({
      success: true,
      message: 'Successfully subscribed to our newsletter!'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }
    
    logger.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.'
    });
  }
});

// Contact form endpoint
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message, utm_source, utm_medium, utm_campaign } = contactSchema.parse(req.body);
    const { hashedIp, userAgent, language } = extractLocationData(req);
    
    // Insert contact form submission with location data
    await db.query(
      `INSERT INTO contact_submissions (
        name, email, subject, message, submitted_at, status, language,
        user_agent, ip_address, utm_source, utm_medium, utm_campaign
      ) VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, subject, message, 'new', language, userAgent, hashedIp, utm_source, utm_medium, utm_campaign]
    );
    
    logger.info(`New contact form submission from: ${email} (${language})`);
    
    res.json({
      success: true,
      message: 'Your message has been sent! We\'ll respond within 24 hours.'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }
    
    logger.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// Unsubscribe endpoint
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = emailSchema.parse(req.body);
    
    await db.query(
      'UPDATE newsletter_subscriptions SET status = ?, unsubscribed_at = NOW() WHERE email = ?',
      ['unsubscribed', email]
    );
    
    logger.info(`Newsletter unsubscribe: ${email}`);
    
    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
    
  } catch (error) {
    logger.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe. Please try again later.'
    });
  }
});

export default router;