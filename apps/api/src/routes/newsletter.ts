import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { contactSubmissions, newsletterSubscriptions } from '@aiglossarypro/shared/schema';
import { db } from '@aiglossarypro/database';
import { validate } from '../middleware/validationMiddleware';
import { newsletterSchemas } from '../schemas/engagementValidation';
import { log } from '../utils/logger';

const router = Router();

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message is too long'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

// Helper function to extract location data from request
function extractLocationData(req: Request) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const acceptLanguage = req.get('Accept-Language') || 'en';

  // Hash IP for privacy
  const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');

  // Extract primary language from Accept-Language header
  const language = acceptLanguage.split(',')[0].split('-')[0] || 'en';

  return {
    hashedIp,
    userAgent,
    language,
  };
}

// Newsletter subscription endpoint
router.post('/subscribe', 
  validate.body(newsletterSchemas.subscribe, { 
    sanitizeHtml: true,
    logErrors: true 
  }),
  async (req, res) => {
  try {
    // Extract additional fields that aren't in the newsletter schema
    const { email, marketingConsent } = req.body;
    const { utm_source, utm_medium, utm_campaign } = req.body;
    const { hashedIp, userAgent, language } = extractLocationData(req);

    // Check if email already exists
    const existingSubscription = await db
      .select({ id: newsletterSubscriptions.id })
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email));

    if (existingSubscription.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed to our newsletter',
      });
    }

    // Insert new subscription with location and attribution data
    await db.insert(newsletterSubscriptions).values({
      email,
      status: 'active',
      language,
      userAgent,
      ipAddress: hashedIp,
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
    });

    log.info(`New newsletter subscription: ${email} (${language})`);

    res.json({
      success: true,
      message: 'Successfully subscribed to our newsletter!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }

    log.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    });
  }
});

// Contact form endpoint
router.post('/contact', 
  validate.body(contactSchema, { 
    sanitizeHtml: true,
    sanitizeSql: true,
    logErrors: true 
  }),
  async (req, res) => {
  try {
    const { name, email, subject, message, utm_source, utm_medium, utm_campaign } = req.body;
    const { hashedIp, userAgent, language } = extractLocationData(req);

    // Insert contact form submission with location data
    await db.insert(contactSubmissions).values({
      name,
      email,
      subject,
      message,
      status: 'new',
      language,
      userAgent,
      ipAddress: hashedIp,
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
    });

    log.info(`New contact form submission from: ${email} (${language})`);

    res.json({
      success: true,
      message: "Your message has been sent! We'll respond within 24 hours.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }

    log.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
    });
  }
});

// Unsubscribe endpoint
router.post('/unsubscribe', 
  validate.body(newsletterSchemas.unsubscribe.omit({ token: true }).extend({ email: z.string().email() }), { 
    sanitizeHtml: true,
    logErrors: true 
  }),
  async (req, res) => {
  try {
    const { email } = req.body;

    await db
      .update(newsletterSubscriptions)
      .set({
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscriptions.email, email));

    log.info(`Newsletter unsubscribe: ${email}`);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    });
  } catch (error) {
    log.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe. Please try again later.',
    });
  }
});

export default router;
