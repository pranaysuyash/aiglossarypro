import { and, asc, count, desc, eq, inArray, isNotNull, like, or, sql } from 'drizzle-orm';
import type { Express, Request, Response } from 'express'
import type { Request, Response } from 'express';
import { z } from 'zod';
import { contactSubmissions, newsletterSubscriptions } from '../../../shared/schema';
import { db } from '../../db';
import { canPerformAdminAction } from '../../utils/accessControl';
import { log } from '../../utils/logger';

// Validation schemas
const newsletterFiltersSchema = z.object({
  status: z.enum(['active', 'unsubscribed', 'all']).optional(),
  search: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  language: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sort: z.enum(['created_at', 'email', 'language']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const contactFiltersSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved', 'all']).optional(),
  search: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  language: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sort: z.enum(['created_at', 'name', 'email', 'subject']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const bulkActionSchema = z.object({
  action: z.enum(['mark_resolved', 'mark_in_progress', 'mark_new', 'unsubscribe']),
  ids: z.array(z.number()).min(1),
});

const updateContactStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved']),
  notes: z.string().optional(),
});

/**
 * Admin middleware to check if user can perform admin actions
 */
function requireAdminAccess(req: Request, res: Response, next: Request) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!canPerformAdminAction(user as any)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    log.error('Admin auth middleware error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Get newsletter subscriptions with filtering, search, and pagination
 */
async function getNewsletterSubscriptions(req: Request, res: Response) {
  try {
    const filters = newsletterFiltersSchema.parse(req.query);

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const sort = filters.sort || 'createdAt';
    const order = filters.order || 'desc';

    // Build WHERE conditions
    const whereConditions = [];

    if (filters.status && filters.status !== 'all') {
      whereConditions.push(eq(newsletterSubscriptions.status, filters.status));
    }

    if (filters.search) {
      whereConditions.push(like(newsletterSubscriptions.email, `%${filters.search}%`));
    }

    if (filters.utm_source) {
      whereConditions.push(eq(newsletterSubscriptions.utmSource, filters.utm_source));
    }

    if (filters.utm_medium) {
      whereConditions.push(eq(newsletterSubscriptions.utmMedium, filters.utm_medium));
    }

    if (filters.utm_campaign) {
      whereConditions.push(eq(newsletterSubscriptions.utmCampaign, filters.utm_campaign));
    }

    if (filters.language) {
      whereConditions.push(eq(newsletterSubscriptions.language, filters.language));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ total: count() })
      .from(newsletterSubscriptions)
      .where(whereClause);

    const total = countResult[0].total;

    // Get subscriptions
    const orderBy =
      order === 'desc'
        ? desc(newsletterSubscriptions.createdAt)
        : asc(newsletterSubscriptions.createdAt);

    const subscriptions = await db
      .select({
        id: newsletterSubscriptions.id,
        email: newsletterSubscriptions.email,
        status: newsletterSubscriptions.status,
        language: newsletterSubscriptions.language,
        utmSource: newsletterSubscriptions.utmSource,
        utmMedium: newsletterSubscriptions.utmMedium,
        utmCampaign: newsletterSubscriptions.utmCampaign,
        createdAt: newsletterSubscriptions.createdAt,
        unsubscribedAt: newsletterSubscriptions.unsubscribedAt,
        userAgent: newsletterSubscriptions.userAgent,
      })
      .from(newsletterSubscriptions)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get analytics data
    const analyticsResult = await db
      .select({
        totalSubscriptions: count(),
        activeSubscriptions: count(
          sql`CASE WHEN ${newsletterSubscriptions.status} = 'active' THEN 1 END`
        ),
        unsubscribed: count(
          sql`CASE WHEN ${newsletterSubscriptions.status} = 'unsubscribed' THEN 1 END`
        ),
        uniqueLanguages: sql<number>`COUNT(DISTINCT ${newsletterSubscriptions.language})`,
        uniqueSources: sql<number>`COUNT(DISTINCT ${newsletterSubscriptions.utmSource})`,
      })
      .from(newsletterSubscriptions)
      .where(whereClause);

    const analytics = analyticsResult[0];

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        analytics: {
          total_subscriptions: analytics.totalSubscriptions,
          active_subscriptions: analytics.activeSubscriptions,
          unsubscribed: analytics.unsubscribed,
          unique_languages: analytics.uniqueLanguages,
          unique_sources: analytics.uniqueSources,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    }

    log.error('Get newsletter subscriptions error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve newsletter subscriptions',
    });
  }
}

/**
 * Get contact form submissions with filtering, search, and pagination
 */
async function getContactSubmissions(req: Request, res: Response) {
  try {
    const filters = contactFiltersSchema.parse(req.query);

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const sort = filters.sort || 'createdAt';
    const order = filters.order || 'desc';

    // Build WHERE conditions
    const whereConditions = [];

    if (filters.status && filters.status !== 'all') {
      whereConditions.push(eq(contactSubmissions.status, filters.status));
    }

    if (filters.search) {
      whereConditions.push(
        or(
          like(contactSubmissions.name, `%${filters.search}%`),
          like(contactSubmissions.email, `%${filters.search}%`),
          like(contactSubmissions.subject, `%${filters.search}%`),
          like(contactSubmissions.message, `%${filters.search}%`)
        )
      );
    }

    if (filters.utm_source) {
      whereConditions.push(eq(contactSubmissions.utmSource, filters.utm_source));
    }

    if (filters.utm_medium) {
      whereConditions.push(eq(contactSubmissions.utmMedium, filters.utm_medium));
    }

    if (filters.utm_campaign) {
      whereConditions.push(eq(contactSubmissions.utmCampaign, filters.utm_campaign));
    }

    if (filters.language) {
      whereConditions.push(eq(contactSubmissions.language, filters.language));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ total: count() })
      .from(contactSubmissions)
      .where(whereClause);

    const total = countResult[0].total;

    // Get submissions
    const orderBy =
      order === 'desc' ? desc(contactSubmissions.createdAt) : asc(contactSubmissions.createdAt);

    const submissions = await db
      .select()
      .from(contactSubmissions)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get analytics data
    const analyticsResult = await db
      .select({
        totalSubmissions: count(),
        newSubmissions: count(sql`CASE WHEN ${contactSubmissions.status} = 'new' THEN 1 END`),
        inProgressSubmissions: count(
          sql`CASE WHEN ${contactSubmissions.status} = 'in_progress' THEN 1 END`
        ),
        resolvedSubmissions: count(
          sql`CASE WHEN ${contactSubmissions.status} = 'resolved' THEN 1 END`
        ),
        uniqueLanguages: sql<number>`COUNT(DISTINCT ${contactSubmissions.language})`,
        uniqueSources: sql<number>`COUNT(DISTINCT ${contactSubmissions.utmSource})`,
      })
      .from(contactSubmissions)
      .where(whereClause);

    const analytics = analyticsResult[0];

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        analytics: {
          total_submissions: analytics.totalSubmissions,
          new_submissions: analytics.newSubmissions,
          in_progress_submissions: analytics.inProgressSubmissions,
          resolved_submissions: analytics.resolvedSubmissions,
          unique_languages: analytics.uniqueLanguages,
          unique_sources: analytics.uniqueSources,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    }

    log.error('Get contact submissions error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact submissions',
    });
  }
}

/**
 * Get newsletter analytics - subscriptions over time, popular sources, etc.
 */
async function getNewsletterAnalytics(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    // Subscriptions over time
    const subscriptionsOverTime = await db
      .select({
        date: sql<string>`DATE(${newsletterSubscriptions.createdAt})`,
        count: count(),
        activeCount: count(sql`CASE WHEN ${newsletterSubscriptions.status} = 'active' THEN 1 END`),
      })
      .from(newsletterSubscriptions)
      .where(sql`${newsletterSubscriptions.createdAt} >= ${pastDate}`)
      .groupBy(sql`DATE(${newsletterSubscriptions.createdAt})`)
      .orderBy(desc(sql`DATE(${newsletterSubscriptions.createdAt})`));

    // Popular UTM sources
    const popularSources = await db
      .select({
        utmSource: newsletterSubscriptions.utmSource,
        count: count(),
        activeCount: count(sql`CASE WHEN ${newsletterSubscriptions.status} = 'active' THEN 1 END`),
      })
      .from(newsletterSubscriptions)
      .where(
        and(
          isNotNull(newsletterSubscriptions.utmSource),
          sql`${newsletterSubscriptions.utmSource} != ''`,
          sql`${newsletterSubscriptions.createdAt} >= ${pastDate}`
        )
      )
      .groupBy(newsletterSubscriptions.utmSource)
      .orderBy(desc(count()))
      .limit(10);

    // Language breakdown
    const languageBreakdown = await db
      .select({
        language: newsletterSubscriptions.language,
        count: count(),
        activeCount: count(sql`CASE WHEN ${newsletterSubscriptions.status} = 'active' THEN 1 END`),
      })
      .from(newsletterSubscriptions)
      .where(sql`${newsletterSubscriptions.createdAt} >= ${pastDate}`)
      .groupBy(newsletterSubscriptions.language)
      .orderBy(desc(count()));

    // UTM campaign performance
    const campaignPerformance = await db
      .select({
        utmCampaign: newsletterSubscriptions.utmCampaign,
        count: count(),
        activeCount: count(sql`CASE WHEN ${newsletterSubscriptions.status} = 'active' THEN 1 END`),
      })
      .from(newsletterSubscriptions)
      .where(
        and(
          isNotNull(newsletterSubscriptions.utmCampaign),
          sql`${newsletterSubscriptions.utmCampaign} != ''`,
          sql`${newsletterSubscriptions.createdAt} >= ${pastDate}`
        )
      )
      .groupBy(newsletterSubscriptions.utmCampaign)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      success: true,
      data: {
        subscriptionsOverTime,
        popularSources,
        languageBreakdown,
        campaignPerformance,
        period: `${days} days`,
      },
    });
  } catch (error) {
    log.error('Get newsletter analytics error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve newsletter analytics',
    });
  }
}

/**
 * Get contact form analytics
 */
async function getContactAnalytics(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    // Submissions over time
    const submissionsOverTime = await db
      .select({
        date: sql<string>`DATE(${contactSubmissions.createdAt})`,
        count: count(),
        newCount: count(sql`CASE WHEN ${contactSubmissions.status} = 'new' THEN 1 END`),
        resolvedCount: count(sql`CASE WHEN ${contactSubmissions.status} = 'resolved' THEN 1 END`),
      })
      .from(contactSubmissions)
      .where(sql`${contactSubmissions.createdAt} >= ${pastDate}`)
      .groupBy(sql`DATE(${contactSubmissions.createdAt})`)
      .orderBy(desc(sql`DATE(${contactSubmissions.createdAt})`));

    // Popular UTM sources
    const popularSources = await db
      .select({
        utmSource: contactSubmissions.utmSource,
        count: count(),
      })
      .from(contactSubmissions)
      .where(
        and(
          isNotNull(contactSubmissions.utmSource),
          sql`${contactSubmissions.utmSource} != ''`,
          sql`${contactSubmissions.createdAt} >= ${pastDate}`
        )
      )
      .groupBy(contactSubmissions.utmSource)
      .orderBy(desc(count()))
      .limit(10);

    // Language breakdown
    const languageBreakdown = await db
      .select({
        language: contactSubmissions.language,
        count: count(),
      })
      .from(contactSubmissions)
      .where(sql`${contactSubmissions.createdAt} >= ${pastDate}`)
      .groupBy(contactSubmissions.language)
      .orderBy(desc(count()));

    // Response time analytics (simplified)
    const responseTimeAnalytics = await db
      .select({
        avgResponseHours: sql<number>`AVG(CASE WHEN ${contactSubmissions.status} = 'resolved' AND ${contactSubmissions.updatedAt} IS NOT NULL THEN EXTRACT(EPOCH FROM (${contactSubmissions.updatedAt} - ${contactSubmissions.createdAt})) / 3600 END)`,
        resolvedCount: count(sql`CASE WHEN ${contactSubmissions.status} = 'resolved' THEN 1 END`),
        totalCount: count(),
      })
      .from(contactSubmissions)
      .where(sql`${contactSubmissions.createdAt} >= ${pastDate}`);

    res.json({
      success: true,
      data: {
        submissionsOverTime,
        popularSources,
        languageBreakdown,
        responseTimeAnalytics: responseTimeAnalytics[0],
        period: `${days} days`,
      },
    });
  } catch (error) {
    log.error('Get contact analytics error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact analytics',
    });
  }
}

/**
 * Export newsletter subscriptions as CSV
 */
async function exportNewsletterSubscriptions(req: Request, res: Response) {
  try {
    const filters = newsletterFiltersSchema.parse(req.query);

    // Build WHERE conditions (same as getNewsletterSubscriptions)
    const whereConditions = [];

    if (filters.status && filters.status !== 'all') {
      whereConditions.push(eq(newsletterSubscriptions.status, filters.status));
    }

    if (filters.search) {
      whereConditions.push(like(newsletterSubscriptions.email, `%${filters.search}%`));
    }

    if (filters.utm_source) {
      whereConditions.push(eq(newsletterSubscriptions.utmSource, filters.utm_source));
    }

    if (filters.utm_medium) {
      whereConditions.push(eq(newsletterSubscriptions.utmMedium, filters.utm_medium));
    }

    if (filters.utm_campaign) {
      whereConditions.push(eq(newsletterSubscriptions.utmCampaign, filters.utm_campaign));
    }

    if (filters.language) {
      whereConditions.push(eq(newsletterSubscriptions.language, filters.language));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const subscriptions = await db
      .select({
        email: newsletterSubscriptions.email,
        status: newsletterSubscriptions.status,
        language: newsletterSubscriptions.language,
        utmSource: newsletterSubscriptions.utmSource,
        utmMedium: newsletterSubscriptions.utmMedium,
        utmCampaign: newsletterSubscriptions.utmCampaign,
        createdAt: newsletterSubscriptions.createdAt,
        unsubscribedAt: newsletterSubscriptions.unsubscribedAt,
      })
      .from(newsletterSubscriptions)
      .where(whereClause)
      .orderBy(desc(newsletterSubscriptions.createdAt));

    // Generate CSV
    const csvHeaders = [
      'Email',
      'Status',
      'Language',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Created At',
      'Unsubscribed At',
    ];
    const csvRows = subscriptions.map(sub => [
      sub.email,
      sub.status,
      sub.language,
      sub.utmSource || '',
      sub.utmMedium || '',
      sub.utmCampaign || '',
      sub.createdAt?.toISOString() || '',
      sub.unsubscribedAt?.toISOString() || '',
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="newsletter-subscriptions-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    log.error('Export newsletter subscriptions error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to export newsletter subscriptions',
    });
  }
}

/**
 * Export contact submissions as CSV
 */
async function exportContactSubmissions(req: Request, res: Response) {
  try {
    const filters = contactFiltersSchema.parse(req.query);

    // Build WHERE conditions (same as getContactSubmissions)
    const whereConditions = [];

    if (filters.status && filters.status !== 'all') {
      whereConditions.push(eq(contactSubmissions.status, filters.status));
    }

    if (filters.search) {
      whereConditions.push(
        or(
          like(contactSubmissions.name, `%${filters.search}%`),
          like(contactSubmissions.email, `%${filters.search}%`),
          like(contactSubmissions.subject, `%${filters.search}%`),
          like(contactSubmissions.message, `%${filters.search}%`)
        )
      );
    }

    if (filters.utm_source) {
      whereConditions.push(eq(contactSubmissions.utmSource, filters.utm_source));
    }

    if (filters.utm_medium) {
      whereConditions.push(eq(contactSubmissions.utmMedium, filters.utm_medium));
    }

    if (filters.utm_campaign) {
      whereConditions.push(eq(contactSubmissions.utmCampaign, filters.utm_campaign));
    }

    if (filters.language) {
      whereConditions.push(eq(contactSubmissions.language, filters.language));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const submissions = await db
      .select()
      .from(contactSubmissions)
      .where(whereClause)
      .orderBy(desc(contactSubmissions.createdAt));

    // Generate CSV
    const csvHeaders = [
      'Name',
      'Email',
      'Subject',
      'Message',
      'Status',
      'Language',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Created At',
      'Updated At',
      'Notes',
    ];
    const csvRows = submissions.map(sub => [
      sub.name,
      sub.email,
      sub.subject,
      sub.message.replace(/"/g, '""'), // Escape quotes in message
      sub.status,
      sub.language || '',
      sub.utmSource || '',
      sub.utmMedium || '',
      sub.utmCampaign || '',
      sub.createdAt?.toISOString() || '',
      sub.updatedAt?.toISOString() || '',
      sub.notes || '',
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contact-submissions-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    log.error('Export contact submissions error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to export contact submissions',
    });
  }
}

/**
 * Update contact submission status
 */
async function updateContactStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = updateContactStatusSchema.parse(req.body);

    await db
      .update(contactSubmissions)
      .set({
        status,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(contactSubmissions.id, parseInt(id)));

    res.json({
      success: true,
      message: 'Contact submission status updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    log.error('Update contact status error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status',
    });
  }
}

/**
 * Bulk actions for contact submissions
 */
async function bulkContactActions(req: Request, res: Response) {
  try {
    const { action, ids } = bulkActionSchema.parse(req.body);

    switch (action) {
      case 'mark_resolved':
        await db
          .update(contactSubmissions)
          .set({ status: 'resolved', updatedAt: new Date() })
          .where(inArray(contactSubmissions.id, ids));
        break;
      case 'mark_in_progress':
        await db
          .update(contactSubmissions)
          .set({ status: 'in_progress', updatedAt: new Date() })
          .where(inArray(contactSubmissions.id, ids));
        break;
      case 'mark_new':
        await db
          .update(contactSubmissions)
          .set({ status: 'new', updatedAt: new Date() })
          .where(inArray(contactSubmissions.id, ids));
        break;
      case 'unsubscribe':
        await db
          .update(newsletterSubscriptions)
          .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
          .where(inArray(newsletterSubscriptions.id, ids));
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action',
        });
    }

    res.json({
      success: true,
      message: `Bulk action ${action} completed successfully for ${ids.length} items`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    log.error('Bulk contact actions error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action',
    });
  }
}

/**
 * Register newsletter and contact admin routes
 */
export function registerAdminNewsletterRoutes(app: Express): void {
  log.info('📧 Registering admin newsletter routes...');

  // Newsletter routes
  app.get('/api/admin/newsletter/subscriptions', requireAdminAccess, getNewsletterSubscriptions);
  app.get('/api/admin/newsletter/analytics', requireAdminAccess, getNewsletterAnalytics);
  app.get('/api/admin/newsletter/export', requireAdminAccess, exportNewsletterSubscriptions);

  // Contact routes
  app.get('/api/admin/contact/submissions', requireAdminAccess, getContactSubmissions);
  app.get('/api/admin/contact/analytics', requireAdminAccess, getContactAnalytics);
  app.get('/api/admin/contact/export', requireAdminAccess, exportContactSubmissions);
  app.put('/api/admin/contact/submissions/:id/status', requireAdminAccess, updateContactStatus);
  app.post('/api/admin/contact/bulk-actions', requireAdminAccess, bulkContactActions);

  log.info('✅ Admin newsletter routes registered');
}
