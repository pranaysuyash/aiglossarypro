import type { Express } from 'express';
import { registerEnhancedDemoRoutes } from '../enhancedDemoRoutes';
import { registerEnhancedRoutes } from '../enhancedRoutes';
import { performanceMiddleware } from '../middleware/performanceMonitor';
import s3MonitoringRoutes from '../s3MonitoringRoutes';
import s3Routes from '../s3Routes';
import s3RoutesOptimized from '../s3RoutesOptimized';
import { setupSwagger } from '../swagger/setup';
import { log as logger } from '../utils/logger';
// Import A/B testing routes (simplified version)
import abTestRoutes from './abTestsSimplified';
import { registerAdaptiveContentRoutes } from './adaptiveContent';
import { registerAdaptiveSearchRoutes } from './adaptiveSearch';
import { registerContentManagementRoutes } from './admin/contentManagement';
import { registerAdminRoutes } from './admin/index';
import { registerAnalyticsRoutes } from './analytics';
// Import modular route handlers
import { registerAuthRoutes } from './auth';
// Import existing specialized route modules

// import cacheAnalyticsRoutes from './cacheAnalytics';
import { registerCategoryRoutes } from './categories';
import { registerCodeExamplesRoutes } from './codeExamples';
import { registerContentRoutes } from './content';
import { registerCrossReferenceRoutes } from './crossReference';
import customerServiceRoutes from './customerService';
import { registerDailyTermsRoutes } from './dailyTerms';
import { registerEarlyBirdRoutes } from './earlyBird';
import { registerEngagementRoutes } from './engagement';
import { registerFeedbackRoutes } from './feedback';
import { registerHealthCheckRoutes } from './healthCheck';
import { registerGuestPreviewRoutes } from './guestPreview';
import { registerGumroadRoutes } from './gumroad';
import gumroadWebhookRoutes from './gumroadWebhooks';
import { registerJobRoutes } from './jobs';
import { registerLearningPathsRoutes } from './learningPaths';
import { registerMediaRoutes } from './media';
import monitoringRoutes from './monitoring';
// Import newsletter routes
import newsletterRoutes from './newsletter';
import { registerPersonalizationRoutes } from './personalization';
import { registerPersonalizedHomepageRoutes } from './personalizedHomepage';
import predictiveAnalyticsRoutes from './predictiveAnalytics';
import { registerProgressRoutes } from './progress';
// Import quality evaluation routes
import qualityEvaluationRoutes from './qualityEvaluation';
import { referralRoutes } from './referral';
import referralsRoutes from './referrals';
import { registerRelationshipRoutes } from './relationships';
import { registerSearchRoutes } from './search';
import { registerSectionRoutes } from './sections';
import { registerSeoRoutes } from './seo';
import { registerSubcategoryRoutes } from './subcategories';
// Import surprise discovery routes
import surpriseDiscoveryRoutes from './surpriseDiscovery';
import { registerTermRoutes } from './terms';
import { registerTrendingRoutes } from './trending';
import { registerUserRoutes } from './user';
import { registerUserProgressRoutes } from './user/progress';
import { setupSupportRoutes } from './support';
// Import enhanced 295-column routes
import enhanced295Routes from './enhanced295Routes';
import enhancedTermsRoutes from './enhancedTerms';
// Import pricing phase routes
// import pricingPhaseRoutes from './pricingPhase'; // TODO: Fix systemConfig table

/**
 * Main route registration function
 * This replaces the monolithic routes.ts file with a modular structure
 */
export async function registerRoutes(app: Express): Promise<void> {
  try {
    logger.info('🔧 Setting up application routes...');

    // Add performance monitoring middleware
    app.use(performanceMiddleware);
    logger.info('📊 Performance monitoring enabled');

    // Authentication and S3 initialization moved to server/index.ts

    // Register core API routes
    logger.info('📝 Registering core API routes...');
    registerAuthRoutes(app);
    registerCategoryRoutes(app);
    registerSubcategoryRoutes(app);
    logger.info('✅ Subcategory routes registered - 21,993 subcategories now accessible');
    registerTermRoutes(app);
    registerDailyTermsRoutes(app);
    registerContentManagementRoutes(app);
    registerGuestPreviewRoutes(app);
    logger.info('✅ Guest preview routes registered - unauthenticated preview access enabled');
    registerSectionRoutes(app);
    logger.info('✅ Section routes registered - 42-section content API now available');
    registerSearchRoutes(app);
    registerAdaptiveSearchRoutes(app);
    logger.info('✅ Adaptive search routes registered - AI-powered semantic search now available');
    // Register progress routes BEFORE user routes to ensure /api/progress/stats is handled correctly
    registerProgressRoutes(app);
    logger.info('✅ Progress tracking routes registered');
    registerUserRoutes(app);
    registerUserProgressRoutes(app);

    // Register support routes
    setupSupportRoutes(app);
    logger.info('✅ Support ticket system routes registered');

    // Register admin routes (with proper role checking in production)
    registerAdminRoutes(app);

    // Register monitoring routes (for error tracking and system health)
    app.use('/api/monitoring', monitoringRoutes);
    logger.info('✅ Monitoring routes registered');

    // Register feedback routes (for user feedback and suggestions)
    registerFeedbackRoutes(app);
    logger.info('✅ Feedback routes registered');

    // Register cross-reference routes (for automatic term linking)
    registerCrossReferenceRoutes(app);
    logger.info('✅ Cross-reference routes registered');

    // Register customer service routes
    app.use('/api/support', customerServiceRoutes);
    logger.info('✅ Customer service routes registered');

    // Register analytics routes
    registerAnalyticsRoutes(app);
    logger.info('✅ Analytics routes registered');

    // Register personalization routes (for AI-powered recommendations)
    registerPersonalizationRoutes(app);
    logger.info('✅ Personalization routes registered');

    // Register relationship routes (for concept discovery and visual relationships)
    registerRelationshipRoutes(app);
    logger.info('✅ Relationship discovery routes registered');

    // Register media routes (for rich content support)
    registerMediaRoutes(app);
    logger.info('✅ Media routes registered');

    // Register SEO routes (for search engine optimization)
    registerSeoRoutes(app);
    logger.info('✅ SEO routes registered');

    // Register content accessibility routes
    registerContentRoutes(app);
    logger.info('✅ Content accessibility routes registered');

    // Register Gumroad monetization routes
    registerGumroadRoutes(app);
    logger.info('✅ Gumroad monetization routes registered');

    // Register Gumroad webhook routes
    app.use('/api/webhooks/gumroad', gumroadWebhookRoutes);
    logger.info('✅ Gumroad webhook routes registered');

    // Register referral system routes
    app.use('/api/referral', referralRoutes);
    app.use('/api/referrals', referralsRoutes);
    logger.info('✅ Referral system routes registered');

    // Register early bird pricing routes
    registerEarlyBirdRoutes(app);
    logger.info('✅ Early bird pricing routes registered');
    
    // Register pricing phase management routes
    // app.use('/api/pricing', pricingPhaseRoutes); // TODO: Fix systemConfig table
    // logger.info('✅ Pricing phase management routes registered');

    // Register newsletter and contact routes
    app.use('/api/newsletter', newsletterRoutes);
    logger.info('✅ Newsletter and contact routes registered');

    // Register A/B testing routes
    app.use('/api/ab-tests', abTestRoutes);
    logger.info('✅ A/B testing routes registered');

    // Register Quality Evaluation routes
    app.use('/api/quality', qualityEvaluationRoutes);
    logger.info('✅ Quality Evaluation routes registered');

    // Mount S3 routes
    app.use('/api/s3', s3Routes);
    app.use('/api/s3-optimized', s3RoutesOptimized);
    app.use('/api/s3-monitoring', s3MonitoringRoutes);
    logger.info('✅ S3 routes mounted');

    // Register enhanced parsing system routes
    registerEnhancedRoutes(app);
    registerEnhancedDemoRoutes(app);
    logger.info('✅ Enhanced routes registered');

    // Register 295-column content generation routes
    app.use('/api/enhanced-295', enhanced295Routes);
    logger.info('✅ Enhanced 295-column content generation routes registered');

    // Register enhanced terms routes
    enhancedTermsRoutes(app);
    logger.info('✅ Enhanced terms routes registered');

    // Register cache management routes (currently disabled - cache.ts is empty)
    // app.use('/api/cache', cacheRoutes);
    

    // Register cache analytics routes
    // Temporarily disabled - causing server startup issues
    // app.use('/api/cache-analytics', cacheAnalyticsRoutes);
    // logger.info('✅ Cache analytics routes registered');

    // Register job management routes
    registerJobRoutes(app);
    logger.info('✅ Job management routes registered');

    // Register Learning Paths routes
    registerLearningPathsRoutes(app);
    logger.info('✅ Learning Paths routes registered');

    // Register Code Examples routes
    registerCodeExamplesRoutes(app);
    logger.info('✅ Code Examples routes registered');

    // Register Trending Analytics routes
    registerTrendingRoutes(app);
    logger.info('✅ Trending Analytics routes registered');

    // Register Personalized Homepage routes
    registerPersonalizedHomepageRoutes(app);
    logger.info('✅ Personalized Homepage routes registered');

    // Register Engagement Tracking routes
    registerEngagementRoutes(app);
    logger.info('✅ Engagement Tracking routes registered');

    // Register Surprise Discovery routes
    app.use('/api/surprise-discovery', surpriseDiscoveryRoutes);
    logger.info('✅ Surprise Discovery routes registered');

    // Register Adaptive Content routes
    registerAdaptiveContentRoutes(app);
    logger.info('✅ Adaptive Content routes registered');

    // Register Predictive Analytics routes
    app.use('/api/predictive-analytics', predictiveAnalyticsRoutes);
    logger.info('✅ Predictive Analytics routes registered');

    // Register comprehensive health check routes
    registerHealthCheckRoutes(app);
    logger.info('✅ Comprehensive health check routes registered');

    // Basic health check endpoint for backward compatibility
    app.get('/api/health', (_, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API documentation endpoint - redirects to comprehensive Swagger docs
    app.get('/api', (_, res) => {
      res.json({
        success: true,
        message: 'AI Glossary Pro API',
        version: '2.0.0',
        documentation: {
          swagger: '/api/docs',
          interactive: '/api/docs',
          json: '/api/docs/swagger.json',
        },
        info: {
          description: 'Comprehensive AI/ML terminology API with 10,000+ terms',
          features: [
            '42-section content architecture',
            'Advanced search & filtering',
            'Real-time recommendations',
            'Progress tracking',
            'Mobile-optimized responsive design',
            'Lifetime updates',
          ],
          pricing: {
            lifetime: '$249 USD',
            features: 'PPP discounts available for 20+ countries',
            comparison: 'Save $300-600 annually vs DataCamp/Coursera',
          },
          authentication: {
            type: 'JWT Bearer tokens',
            rateLimit: {
              free: '50 requests/day (7-day grace period)',
              lifetime: 'Unlimited requests',
            },
          },
        },
        quickStart: 'Visit /api/docs for complete API documentation with interactive examples',
      });
    });

    // Set up Swagger API documentation
    setupSwagger(app);
    logger.info('📚 API documentation setup complete');

    logger.info('✅ All routes registered successfully');
  } catch (error) {
    logger.error('❌ Error registering routes', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Register fallback error route
    app.get('/api/*', (_, res) => {
      res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable - route registration failed',
        message: 'Please contact support if this issue persists',
      });
    });

    throw error; // Re-throw to let server handle startup failure
  }
}
