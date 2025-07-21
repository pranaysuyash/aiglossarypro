import { z } from 'zod';

// User-related schemas
export const userSchemas = {
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number'),
    name: z.string().min(1).max(100).optional(),
    marketingConsent: z.boolean().optional()
  }),
  
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }),
  
  updateProfile: z.object({
    name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      emailNotifications: z.boolean().optional(),
      language: z.string().optional()
    }).optional()
  }),
  
  updateSettings: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    emailNotifications: z.boolean().optional(),
    language: z.string().min(2).max(10).optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    autoplayVideos: z.boolean().optional(),
    showDifficulty: z.boolean().optional(),
    showProgress: z.boolean().optional(),
    compactView: z.boolean().optional()
  }).strict(),
  
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
  })
};

// Content-related schemas
export const contentSchemas = {
  createTerm: z.object({
    term: z.string().min(1).max(200),
    definition: z.string().min(1).max(5000),
    category: z.string().min(1).max(100),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    relatedTerms: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    examples: z.array(z.object({
      code: z.string(),
      language: z.string(),
      description: z.string().optional()
    })).optional()
  }),
  
  updateTerm: z.object({
    term: z.string().min(1).max(200).optional(),
    definition: z.string().min(1).max(5000).optional(),
    category: z.string().min(1).max(100).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    relatedTerms: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  }),
  
  searchTerms: z.object({
    q: z.string().min(1).max(500),
    category: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.array(z.string()).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['relevance', 'name', 'created', 'updated']).default('relevance')
  }),
  
  bulkImport: z.object({
    terms: z.array(z.object({
      term: z.string().min(1).max(200),
      definition: z.string().min(1).max(5000),
      category: z.string().min(1).max(100),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced'])
    })).min(1).max(1000, 'Maximum 1000 terms per import')
  }),
  
  batchAnalyzeAccessibility: z.object({
    termIds: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(1000).default(100).optional()
  })
};

// Analytics schemas
export const analyticsSchemas = {
  trackEvent: z.object({
    eventName: z.string().min(1).max(100),
    eventData: z.record(z.string(), z.any()).optional(),
    timestamp: z.string().datetime().optional(),
    sessionId: z.string().optional()
  }),
  
  pageView: z.object({
    path: z.string().min(1),
    referrer: z.string().optional(),
    duration: z.number().positive().optional(),
    sessionId: z.string().optional()
  }),
  
  searchAnalytics: z.object({
    query: z.string().min(1).max(500),
    resultsCount: z.number().int().min(0),
    clickedResult: z.string().optional(),
    searchDuration: z.number().positive().optional()
  })
};

// Admin schemas
export const adminSchemas = {
  createUser: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['user', 'premium', 'admin']),
    name: z.string().min(1).max(100).optional(),
    sendWelcomeEmail: z.boolean().default(true)
  }),
  
  updateUserRole: z.object({
    userId: z.string(),
    role: z.enum(['user', 'premium', 'admin']),
    reason: z.string().optional()
  }),
  
  systemSettings: z.object({
    maintenanceMode: z.boolean().optional(),
    signupsEnabled: z.boolean().optional(),
    apiRateLimit: z.number().int().positive().optional(),
    emailSettings: z.object({
      provider: z.enum(['smtp', 'sendgrid', 'ses']).optional(),
      fromEmail: z.string().email().optional(),
      fromName: z.string().optional()
    }).optional()
  }),
  
  bulkAction: z.object({
    action: z.enum(['delete', 'export', 'archive', 'publish']),
    entityType: z.enum(['users', 'terms', 'categories']),
    ids: z.array(z.string()).min(1).max(1000),
    options: z.record(z.string(), z.any()).optional()
  }),
  
  maintenance: z.object({
    operation: z.enum(['reindex', 'cleanup', 'vacuum'])
  })
};

// Payment/subscription schemas
export const paymentSchemas = {
  createCheckoutSession: z.object({
    priceId: z.string(),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
    metadata: z.record(z.string(), z.string()).optional()
  }),
  
  webhookEvent: z.object({
    type: z.string(),
    data: z.object({
      object: z.any()
    }),
    created: z.number(),
    id: z.string()
  }),
  
  applyCoupon: z.object({
    couponCode: z.string().min(1).max(50),
    priceId: z.string()
  })
};

// File upload schemas
export const fileSchemas = {
  uploadFile: z.object({
    filename: z.string()
      .regex(/^[a-zA-Z0-9-_\.]+$/, 'Invalid filename')
      .max(255),
    mimeType: z.string(),
    size: z.number().positive().max(10 * 1024 * 1024, 'File size must be less than 10MB')
  }),
  
  bulkUpload: z.object({
    files: z.array(z.object({
      filename: z.string(),
      mimeType: z.string(),
      size: z.number().positive()
    })).min(1).max(10, 'Maximum 10 files per upload')
  })
};

// API parameter schemas
export const paramSchemas = {
  id: z.object({
    id: z.string().uuid('Invalid ID format')
  }),
  
  numericId: z.object({
    id: z.coerce.number().int().positive()
  }),
  
  slug: z.object({
    slug: z.string()
      .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
      .min(1)
      .max(200)
  })
};

// Query parameter schemas  
export const querySchemas = {
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().optional()
  }),
  
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, {
    message: 'Start date must be before end date'
  }),
  
  filters: z.object({
    status: z.enum(['active', 'inactive', 'pending']).optional(),
    type: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
};