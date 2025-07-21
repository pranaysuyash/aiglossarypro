import { z } from 'zod';

// Engagement-related schemas
export const engagementSchemas = {
  trackInteraction: z.object({
    sessionId: z.string().min(1),
    termId: z.string().optional(),
    interactionType: z.enum([
      'view',
      'search',
      'favorite',
      'share',
      'reading_progress',
      'scroll',
      'click',
      'copy',
      'download',
      'bookmark',
    ]),
    duration: z.number().optional(),
    metadata: z.record(z.any()).optional(),
    deviceInfo: z
      .object({
        type: z.enum(['mobile', 'tablet', 'desktop']),
        userAgent: z.string(),
        screenResolution: z.string(),
      })
      .optional(),
    contentInfo: z
      .object({
        scrollDepth: z.number().min(0).max(100),
        readingProgress: z.number().min(0).max(100),
        timeOnContent: z.number().min(0),
        wordsRead: z.number().min(0),
      })
      .optional(),
  }),

  trackReadingProgress: z.object({
    sessionId: z.string().min(1),
    termId: z.string().min(1),
    scrollDepth: z.number().min(0).max(100),
    readingProgress: z.number().min(0).max(100),
    timeOnContent: z.number().min(0),
    wordsRead: z.number().min(0).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  
  getEngagementMetrics: z.object({
    termId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    metricType: z.enum(['views', 'shares', 'favorites', 'reading_time']).optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional()
  })
};

// Referral-related schemas
export const referralSchemas = {
  generateLink: z.object({
    campaignName: z.string().optional(),
  }),
  
  trackClick: z.object({
    referralCode: z.string().min(1),
    utm: z.record(z.string()).optional(),
  }),
  
  setReferrer: z.object({
    referralCode: z.string().min(1),
  })
};

// Newsletter-related schemas
export const newsletterSchemas = {
  subscribe: z.object({
    email: z.string().email('Invalid email format'),
    preferences: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
      topics: z.array(z.string()).optional()
    }).optional(),
    marketingConsent: z.boolean()
  }),
  
  updatePreferences: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    topics: z.array(z.string()).optional(),
    active: z.boolean().optional()
  }),
  
  unsubscribe: z.object({
    token: z.string().min(1),
    reason: z.string().optional()
  })
};

// Progress tracking schemas
export const progressSchemas = {
  updateProgress: z.object({
    termId: z.string(),
    progress: z.number().min(0).max(100),
    completed: z.boolean(),
    timeSpent: z.number().positive().optional()
  }),
  
  batchUpdateProgress: z.object({
    updates: z.array(z.object({
      termId: z.string(),
      progress: z.number().min(0).max(100),
      completed: z.boolean()
    })).min(1).max(100)
  }),
  
  getProgress: z.object({
    termIds: z.array(z.string()).optional(),
    category: z.string().optional(),
    minProgress: z.number().min(0).max(100).optional()
  })
};

// Search schemas
export const searchSchemas = {
  search: z.object({
    q: z.string().min(1).max(500),
    filters: z.object({
      category: z.string().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      hasImplementation: z.boolean().optional(),
      hasInteractive: z.boolean().optional()
    }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['relevance', 'popularity', 'recent']).default('relevance')
  }),
  
  suggest: z.object({
    q: z.string().min(1).max(100),
    limit: z.coerce.number().int().min(1).max(20).default(10)
  }),
  
  trackSearch: z.object({
    query: z.string().min(1).max(500),
    resultsCount: z.number().int().min(0),
    clickedResult: z.string().optional(),
    position: z.number().int().positive().optional(),
    timeToClick: z.number().positive().optional()
  })
};