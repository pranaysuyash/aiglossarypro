import type { Express } from "express";
import { performanceMiddleware } from "../middleware/performanceMonitor";

// Import modular route handlers
import { registerAuthRoutes } from "./auth";
import { registerCategoryRoutes } from "./categories";
import { registerTermRoutes } from "./terms";
import { registerSectionRoutes } from "./sections";
import { registerSearchRoutes } from "./search";
import { registerUserRoutes } from "./user";
import { registerUserProgressRoutes } from "./user/progress";
import { registerAdminRoutes } from "./admin/index";
import { registerMonitoringRoutes } from "./monitoring";
import { registerFeedbackRoutes } from "./feedback";
import { registerCrossReferenceRoutes } from "./crossReference";
import { registerAnalyticsRoutes } from "./analytics";
import { registerMediaRoutes } from "./media";
import { registerSeoRoutes } from "./seo";
import { registerContentRoutes } from "./content";
import { registerGumroadRoutes } from "./gumroad";
import { log as logger } from "../utils/logger";

// Import existing specialized route modules
import cacheRoutes from "./cache";
import s3Routes from "../s3Routes";
import s3RoutesOptimized from "../s3RoutesOptimized";
import s3MonitoringRoutes from "../s3MonitoringRoutes";
import { registerEnhancedRoutes } from "../enhancedRoutes";
import { registerEnhancedDemoRoutes } from "../enhancedDemoRoutes";
import { setupSwagger } from "../swagger/setup";

/**
 * Main route registration function
 * This replaces the monolithic routes.ts file with a modular structure
 */
export async function registerRoutes(app: Express): Promise<void> {
  try {
    logger.info("🔧 Setting up application routes...");
    
    // Add performance monitoring middleware
    app.use(performanceMiddleware);
    logger.info("📊 Performance monitoring enabled");
  
  // Authentication and S3 initialization moved to server/index.ts
  
  // Register core API routes
  logger.info("📝 Registering core API routes...");
  registerAuthRoutes(app);
  registerCategoryRoutes(app);
  registerTermRoutes(app);
  registerSectionRoutes(app);
  logger.info("✅ Section routes registered - 42-section content API now available");
  registerSearchRoutes(app);
  registerUserRoutes(app);
  registerUserProgressRoutes(app);
  
  // Register admin routes (with proper role checking in production)
  registerAdminRoutes(app);
  
  // Register monitoring routes (for error tracking and system health)
  registerMonitoringRoutes(app);
  logger.info("✅ Monitoring routes registered");
  
  // Register feedback routes (for user feedback and suggestions)
  registerFeedbackRoutes(app);
  logger.info("✅ Feedback routes registered");
  
  // Register cross-reference routes (for automatic term linking)
  registerCrossReferenceRoutes(app);
  logger.info("✅ Cross-reference routes registered");
  
  // Register analytics routes
  registerAnalyticsRoutes(app);
  logger.info("✅ Analytics routes registered");
  
  // Register media routes (for rich content support)
  registerMediaRoutes(app);
  logger.info("✅ Media routes registered");
  
  // Register SEO routes (for search engine optimization)
  registerSeoRoutes(app);
  logger.info("✅ SEO routes registered");
  
  // Register content accessibility routes
  registerContentRoutes(app);
  logger.info("✅ Content accessibility routes registered");
  
  // Register Gumroad monetization routes
  registerGumroadRoutes(app);
  logger.info("✅ Gumroad monetization routes registered");
  
  // Mount S3 routes
  app.use('/api/s3', s3Routes);
  app.use('/api/s3-optimized', s3RoutesOptimized);
  app.use('/api/s3-monitoring', s3MonitoringRoutes);
  logger.info("✅ S3 routes mounted");
  
  // Register enhanced parsing system routes
  registerEnhancedRoutes(app);
  registerEnhancedDemoRoutes(app);
  logger.info("✅ Enhanced routes registered");
  
  // Register cache management routes
  app.use('/api/cache', cacheRoutes);
  logger.info("✅ Cache management routes registered");
  
  // Health check endpoint
  app.get('/api/health', (_, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // API documentation endpoint - redirects to comprehensive Swagger docs
  app.get('/api', (_, res) => {
    res.json({
      success: true,
      message: "AI Glossary Pro API",
      version: "2.0.0",
      documentation: {
        swagger: "/api/docs",
        interactive: "/api/docs",
        json: "/api/docs/swagger.json"
      },
      info: {
        description: "Comprehensive AI/ML terminology API with 10,000+ terms",
        features: [
          "42-section content architecture",
          "Advanced search & filtering",
          "Real-time recommendations",
          "Progress tracking",
          "Mobile-optimized responsive design",
          "Lifetime updates"
        ],
        pricing: {
          lifetime: "$249 USD",
          features: "PPP discounts available for 20+ countries",
          comparison: "Save $300-600 annually vs DataCamp/Coursera"
        },
        authentication: {
          type: "JWT Bearer tokens",
          rateLimit: {
            free: "50 requests/day (7-day grace period)",
            lifetime: "Unlimited requests"
          }
        }
      },
      quickStart: "Visit /api/docs for complete API documentation with interactive examples"
    });
  });
  
  // Set up Swagger API documentation
  setupSwagger(app);
  logger.info("📚 API documentation setup complete");
  
  logger.info("✅ All routes registered successfully");
  
  } catch (error) {
    logger.error("❌ Error registering routes", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    
    // Register fallback error route
    app.get('/api/*', (_, res) => {
      res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable - route registration failed',
        message: 'Please contact support if this issue persists'
      });
    });
    
    throw error; // Re-throw to let server handle startup failure
  }
}