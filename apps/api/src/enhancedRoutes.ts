import type { Express, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import logger from './utils/logger';
import { enhancedStorage } from './enhancedTermsStorage';
import { multiAuthMiddleware } from './middleware/multiAuth';
import { isUserAdmin } from './utils/authUtils';

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size for complex Excel files
  },
  fileFilter: (_req, file, cb) => {
    // Accept Excel files and CSV files
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/csv'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  },
});

// Validation schemas
const searchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  categories: z.string().optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
  hasCodeExamples: z.coerce.boolean().optional(),
  hasInteractiveElements: z.coerce.boolean().optional(),
  applicationDomains: z.string().optional(),
  techniques: z.string().optional(),
});

const filterQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  mainCategories: z.string().optional(),
  subCategories: z.string().optional(),
  difficultyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
  applicationDomains: z.string().optional(),
  techniques: z.string().optional(),
  hasImplementation: z.coerce.boolean().optional(),
  hasInteractiveElements: z.coerce.boolean().optional(),
  hasCaseStudies: z.coerce.boolean().optional(),
  hasCodeExamples: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'viewCount', 'difficulty', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const userPreferencesSchema = z.object({
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  preferredSections: z.array(z.string()).optional(),
  hiddenSections: z.array(z.string()).optional(),
  showMathematicalDetails: z.boolean().optional(),
  showCodeExamples: z.boolean().optional(),
  showInteractiveElements: z.boolean().optional(),
  favoriteCategories: z.array(z.string()).optional(),
  favoriteApplications: z.array(z.string()).optional(),
  compactMode: z.boolean().optional(),
  darkMode: z.boolean().optional(),
});

export function registerEnhancedRoutes(app: Express): void {
  // ========================
  // Excel Upload & Processing
  // ========================

  /**
   * Enhanced Excel upload with advanced parsing
   * POST /api/enhanced/upload
   */
  app.post(
    '/api/enhanced/upload',
    multiAuthMiddleware,
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userId = req.user.claims.sub;
        const isAdmin = await isUserAdmin(userId);

        // Check admin permissions
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Admin privileges required.',
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
        }

        logger.info(`Processing enhanced Excel upload: ${req.file.originalname}`);

        logger.info('⚠️  Excel upload functionality has been disabled');

        res.json({
          success: false,
          message: 'Excel upload functionality has been disabled',
          processed: 0,
          cached: 0,
          errors: ['Excel upload functionality has been removed'],
          total: 0,
        });
      } catch (error) {
        logger.error('Error processing enhanced Excel upload:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to process Excel file',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * Get upload processing status
   * GET /api/enhanced/upload/status
   */
  app.get(
    '/api/enhanced/upload/status',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userId = req.user.claims.sub;
        const isAdmin = await isUserAdmin(userId);

        if (!isAdmin) {
          return res.status(403).json({ message: 'Admin privileges required' });
        }

        const stats = await enhancedStorage.getProcessingStats();
        res.json(stats);
      } catch (error) {
        logger.error('Error fetching processing status:', error);
        res.status(500).json({ message: 'Failed to fetch processing status' });
      }
    }
  );

  // ========================
  // Enhanced Term Retrieval
  // ========================

  /**
   * Get list of enhanced terms with pagination
   * GET /api/enhanced/terms
   */
  app.get('/api/enhanced/terms', async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '20', search } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // Cap at 100
      const offset = (pageNum - 1) * limitNum;

      // For now, return empty array as placeholder
      // TODO: Implement proper enhanced terms listing in enhancedStorage
      const result = {
        terms: [],
        total: 0,
      };

      res.json({
        success: true,
        data: result.terms || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total || 0,
          pages: Math.ceil((result.total || 0) / limitNum),
        },
      });
    } catch (error) {
      logger.error('Error fetching enhanced terms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch enhanced terms',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  });

  /**
   * Get enhanced term by ID or slug with full section data
   * GET /api/enhanced/terms/:identifier
   */
  app.get('/api/enhanced/terms/:identifier', async (req: Request, res: Response) => {
    try {
      const identifier = req.params.identifier;
      const userId = req.isAuthenticated?.() ? req.user?.claims.sub : null;

      const term = await enhancedStorage.getEnhancedTermWithSections(identifier, userId);

      if (!term) {
        return res.status(404).json({ message: 'Term not found' });
      }

      // Record view for analytics
      if (userId || !userId) {
        // Allow anonymous views too
        await enhancedStorage.recordTermView(term.id, userId);
      }

      res.json(term);
    } catch (error) {
      logger.error(`Error fetching enhanced term ${req.params.identifier}:`, error);
      res.status(500).json({ message: 'Failed to fetch term' });
    }
  });

  /**
   * Get term sections by display type
   * GET /api/enhanced/terms/:id/sections/:displayType
   */
  app.get('/api/enhanced/terms/:id/sections/:displayType', async (req: Request, res: Response) => {
    try {
      const { id, displayType } = req.params;
      const userId = req.isAuthenticated?.() ? req.user?.claims.sub : null;

      const sections = await enhancedStorage.getTermSectionsByType(id, displayType, userId);
      res.json(sections);
    } catch (error) {
      logger.error(`Error fetching sections for term ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch sections' });
    }
  });

  // ========================
  // Advanced Search & Filtering
  // ========================

  /**
   * Enhanced search with multiple filters and faceted search
   * GET /api/enhanced/search
   */
  app.get('/api/enhanced/search', async (req: Request, res: Response) => {
    try {
      const queryParams = searchQuerySchema.parse(req.query);
      const userId = req.isAuthenticated?.() ? req.user?.claims.sub : null;

      const results = await enhancedStorage.enhancedSearch(queryParams, userId);
      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid search parameters',
          errors: error.errors,
        });
      }

      logger.error('Error in enhanced search:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  /**
   * Advanced filtering with aggregations
   * GET /api/enhanced/filter
   */
  app.get('/api/enhanced/filter', async (req: Request, res: Response) => {
    try {
      const filterParams = filterQuerySchema.parse(req.query);
      const userId = req.isAuthenticated?.() ? req.user?.claims.sub : null;

      const results = await enhancedStorage.advancedFilter(filterParams, userId);
      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid filter parameters',
          errors: error.errors,
        });
      }

      logger.error('Error in advanced filtering:', error);
      res.status(500).json({ message: 'Filtering failed' });
    }
  });

  /**
   * Get search facets for building filter UI
   * GET /api/enhanced/facets
   */
  app.get('/api/enhanced/facets', async (_req: Request, res: Response) => {
    try {
      const facets = await enhancedStorage.getSearchFacets();
      res.json(facets);
    } catch (error) {
      logger.error('Error fetching search facets:', error);
      res.status(500).json({ message: 'Failed to fetch facets' });
    }
  });

  /**
   * Get autocomplete suggestions
   * GET /api/enhanced/suggest
   */
  app.get('/api/enhanced/suggest', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || query.length < 2) {
        return res.json([]);
      }

      const suggestions = await enhancedStorage.getAutocompleteSuggestions(query, limit);
      res.json(suggestions);
    } catch (error) {
      logger.error('Error fetching suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch suggestions' });
    }
  });

  // ========================
  // Interactive Elements
  // ========================

  /**
   * Get interactive elements for a term
   * GET /api/enhanced/terms/:id/interactive
   */
  app.get('/api/enhanced/terms/:id/interactive', async (req: Request, res: Response) => {
    try {
      const termId = req.params.id;
      const elements = await enhancedStorage.getInteractiveElements(termId);
      res.json(elements);
    } catch (error) {
      logger.error(`Error fetching interactive elements for term ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch interactive elements' });
    }
  });

  /**
   * Update interactive element state
   * POST /api/enhanced/interactive/:id/state
   */
  app.post('/api/enhanced/interactive/:id/state', async (req: Request, res: Response) => {
    try {
      const elementId = req.params.id;
      const { state } = req.body;
      const userId = req.isAuthenticated?.() ? req.user?.claims.sub : null;

      await enhancedStorage.updateInteractiveElementState(elementId, state, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error(`Error updating interactive element state ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to update element state' });
    }
  });

  // ========================
  // User Preferences & Personalization
  // ========================

  /**
   * Get user preferences for enhanced experience
   * GET /api/enhanced/preferences
   */
  app.get('/api/enhanced/preferences', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await enhancedStorage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      res.status(500).json({ message: 'Failed to fetch user preferences' });
    }
  });

  /**
   * Update user preferences
   * PUT /api/enhanced/preferences
   */
  app.put('/api/enhanced/preferences', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = userPreferencesSchema.parse(req.body);

      await enhancedStorage.updateUserPreferences(userId, preferences);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid preferences data',
          errors: error.errors,
        });
      }

      logger.error('Error updating user preferences:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  /**
   * Get personalized term recommendations
   * GET /api/enhanced/recommendations
   */
  app.get('/api/enhanced/recommendations', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;

      const recommendations = await enhancedStorage.getPersonalizedRecommendations(userId, limit);
      res.json(recommendations);
    } catch (error) {
      logger.error('Error fetching personalized recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
  });

  // ========================
  // Analytics & Content Management
  // ========================

  /**
   * Get term analytics
   * GET /api/enhanced/analytics/terms/:id
   */
  app.get(
    '/api/enhanced/analytics/terms/:id',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const isAdmin = await isUserAdmin(userId);

        // Check admin permissions
        if (!isAdmin) {
          return res.status(403).json({ message: 'Admin privileges required' });
        }

        const termId = req.params.id;
        const analytics = await enhancedStorage.getTermAnalytics(termId);
        res.json(analytics);
      } catch (error) {
        logger.error(`Error fetching analytics for term ${req.params.id}:`, error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
      }
    }
  );

  /**
   * Get overall content analytics
   * GET /api/enhanced/analytics/overview
   */
  app.get(
    '/api/enhanced/analytics/overview',
    multiAuthMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const isAdmin = await isUserAdmin(userId);

        if (!isAdmin) {
          return res.status(403).json({ message: 'Admin privileges required' });
        }

        const overview = await enhancedStorage.getAnalyticsOverview();
        res.json(overview);
      } catch (error) {
        logger.error('Error fetching analytics overview:', error);
        res.status(500).json({ message: 'Failed to fetch analytics overview' });
      }
    }
  );

  /**
   * Record content interaction for analytics
   * POST /api/enhanced/analytics/interaction
   */
  app.post('/api/enhanced/analytics/interaction', async (req: Request, res: Response) => {
    try {
      const { termId, sectionName, interactionType, data } = req.body;
      const userId = req.isAuthenticated?.() ? req.user?.claims.sub : null;

      await enhancedStorage.recordInteraction(termId, sectionName, interactionType, data, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error recording interaction:', error);
      res.status(500).json({ message: 'Failed to record interaction' });
    }
  });

  // ========================
  // Content Quality & Management
  // ========================

  /**
   * Rate term or section quality
   * POST /api/enhanced/rate
   */
  app.post('/api/enhanced/rate', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { termId, sectionName, rating, feedback } = req.body;

      if (!termId || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid rating data' });
      }

      await enhancedStorage.submitRating(termId, sectionName, rating, feedback, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error('Error submitting rating:', error);
      res.status(500).json({ message: 'Failed to submit rating' });
    }
  });

  /**
   * Get content quality reports
   * GET /api/enhanced/quality-report
   */
  app.get('/api/enhanced/quality-report', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);

      if (!isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }

      const report = await enhancedStorage.getQualityReport();
      res.json(report);
    } catch (error) {
      logger.error('Error fetching quality report:', error);
      res.status(500).json({ message: 'Failed to fetch quality report' });
    }
  });

  // ========================
  // Term Relationships
  // ========================

  /**
   * Get related terms with relationship types
   * GET /api/enhanced/terms/:id/relationships
   */
  app.get('/api/enhanced/terms/:id/relationships', async (req: Request, res: Response) => {
    try {
      const termId = req.params.id;
      const relationships = await enhancedStorage.getTermRelationships(termId);
      res.json(relationships);
    } catch (error) {
      logger.error(`Error fetching relationships for term ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch term relationships' });
    }
  });

  /**
   * Get learning path for a term (prerequisite chains)
   * GET /api/enhanced/terms/:id/learning-path
   */
  app.get('/api/enhanced/terms/:id/learning-path', async (req: Request, res: Response) => {
    try {
      const termId = req.params.id;
      const userId = req.isAuthenticated?.() ? req.user?.claims.sub : null;

      const learningPath = await enhancedStorage.getLearningPath(termId, userId);
      res.json(learningPath);
    } catch (error) {
      logger.error(`Error fetching learning path for term ${req.params.id}:`, error);
      res.status(500).json({ message: 'Failed to fetch learning path' });
    }
  });

  // ========================
  // Utility Endpoints
  // ========================

  /**
   * Get enhanced schema information for debugging
   * GET /api/enhanced/schema-info
   */
  app.get('/api/enhanced/schema-info', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);

      if (!isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }

      const schemaInfo = await enhancedStorage.getSchemaInfo();
      res.json(schemaInfo);
    } catch (error) {
      logger.error('Error fetching schema info:', error);
      res.status(500).json({ message: 'Failed to fetch schema info' });
    }
  });

  /**
   * Health check for enhanced features
   * GET /api/enhanced/health
   */
  app.get('/api/enhanced/health', async (_req: Request, res: Response) => {
    try {
      const health = await enhancedStorage.getHealthStatus();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ...health,
      });
    } catch (error) {
      logger.error('Error in health check:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get trending terms
  app.get('/api/terms/trending', async (req, res) => {
    try {
      const { timeframe = '7d', limit = 10 } = req.query;

      // Parse timeframe
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { db } = await import('./db');
      const { enhancedTerms, termViews } = await import('../shared/enhancedSchema');
      const { sql, gte, desc, eq } = await import('drizzle-orm');

      // Get trending terms based on recent view growth
      const trendingTerms = await db
        .select({
          id: enhancedTerms.id,
          name: enhancedTerms.name,
          mainCategories: enhancedTerms.mainCategories,
          shortDefinition: enhancedTerms.shortDefinition,
          totalViews: enhancedTerms.viewCount,
          recentViews: sql<number>`count(${termViews.id})`,
          trendScore: sql<number>`count(${termViews.id})::float / GREATEST(${enhancedTerms.viewCount}, 1) * 100`,
        })
        .from(enhancedTerms)
        .leftJoin(termViews, eq(termViews.termId, enhancedTerms.id))
        .where(gte(termViews.viewedAt, startDate))
        .groupBy(enhancedTerms.id)
        .having(sql`count(${termViews.id}) > 0`)
        .orderBy(desc(sql`count(${termViews.id})`))
        .limit(parseInt(limit as string));

      res.json({
        success: true,
        data: {
          timeframe,
          trending: trendingTerms,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error fetching trending terms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trending terms',
      });
    }
  });

  logger.info('✅ Enhanced API routes registered successfully');
}
