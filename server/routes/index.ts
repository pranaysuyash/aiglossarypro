import type { Express } from "express";
import { setupAuth } from "../replitAuth";
import { initS3Client } from "../s3Service";
import { features } from "../config";
import { setupMockAuth } from "../middleware/dev/mockAuth";
import { registerSimpleAuthRoutes } from "./simpleAuth";
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
    console.log("🔧 Setting up application routes...");
    
    // Add performance monitoring middleware
    app.use(performanceMiddleware);
    console.log("📊 Performance monitoring enabled");
  
  // Set up authentication first
  try {
    if (features.simpleAuthEnabled) {
      registerSimpleAuthRoutes(app);
      console.log("✅ Simple JWT + OAuth authentication setup complete");
    } else if (features.replitAuthEnabled) {
      await setupAuth(app);
      console.log("✅ Replit authentication setup complete");
    } else {
      setupMockAuth(app);
      console.log("✅ Mock authentication setup complete (development mode)");
    }
  } catch (error) {
    console.error("❌ Error setting up authentication:", error);
    throw error;
  }
  
  // Initialize S3 client if credentials are present
  if (features.s3Enabled) {
    initS3Client();
    console.log("✅ S3 client initialized");
  }
  
  // Register core API routes
  console.log("📝 Registering core API routes...");
  registerAuthRoutes(app);
  registerCategoryRoutes(app);
  registerTermRoutes(app);
  registerSectionRoutes(app);
  console.log("✅ Section routes registered - 42-section content API now available");
  registerSearchRoutes(app);
  registerUserRoutes(app);
  registerUserProgressRoutes(app);
  
  // Register admin routes (with proper role checking in production)
  registerAdminRoutes(app);
  
  // Register monitoring routes (for error tracking and system health)
  registerMonitoringRoutes(app);
  console.log("✅ Monitoring routes registered");
  
  // Register feedback routes (for user feedback and suggestions)
  registerFeedbackRoutes(app);
  console.log("✅ Feedback routes registered");
  
  // Register cross-reference routes (for automatic term linking)
  registerCrossReferenceRoutes(app);
  console.log("✅ Cross-reference routes registered");
  
  // Register analytics routes
  if (features.analyticsEnabled) {
    registerAnalyticsRoutes(app);
    console.log("✅ Analytics routes registered");
  }
  
  // Register media routes (for rich content support)
  registerMediaRoutes(app);
  console.log("✅ Media routes registered");
  
  // Register SEO routes (for search engine optimization)
  registerSeoRoutes(app);
  console.log("✅ SEO routes registered");
  
  // Register content accessibility routes
  registerContentRoutes(app);
  console.log("✅ Content accessibility routes registered");
  
  // Register Gumroad monetization routes
  registerGumroadRoutes(app);
  console.log("✅ Gumroad monetization routes registered");
  
  // Mount S3 routes if enabled
  if (features.s3Enabled) {
    app.use('/api/s3', s3Routes);
    app.use('/api/s3-optimized', s3RoutesOptimized);
    app.use('/api/s3-monitoring', s3MonitoringRoutes);
    console.log("✅ S3 routes mounted");
  }
  
  // Register enhanced parsing system routes
  registerEnhancedRoutes(app);
  registerEnhancedDemoRoutes(app);
  console.log("✅ Enhanced routes registered");
  
  // Register cache management routes
  app.use('/api/cache', cacheRoutes);
  console.log("✅ Cache management routes registered");
  
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
  
  // API documentation endpoint
  app.get('/api', (_, res) => {
    res.json({
      success: true,
      message: "AI Glossary Pro API",
      version: "2.0.0",
      documentation: "/api/docs",
      endpoints: {
        auth: [
          "GET /api/auth/user",
          "GET /api/settings",
          "PUT /api/settings",
          "GET /api/user/export",
          "DELETE /api/user/data"
        ],
        categories: [
          "GET /api/categories",
          "GET /api/categories/:id",
          "GET /api/categories/:id/terms",
          "GET /api/categories/:id/stats"
        ],
        terms: [
          "GET /api/terms",
          "GET /api/terms/:id",
          "GET /api/terms/featured",
          "GET /api/terms/trending",
          "GET /api/terms/recent",
          "GET /api/terms/recently-viewed",
          "GET /api/terms/recommended",
          "POST /api/terms/:id/view",
          "GET /api/terms/:id/recommended",
          "GET /api/terms/:id/stats"
        ],
        sections: [
          "GET /api/terms/:termId/sections",
          "GET /api/sections/:sectionId",
          "PATCH /api/progress/:termId/:sectionId",
          "GET /api/progress/summary",
          "GET /api/content/applications",
          "GET /api/content/ethics",
          "GET /api/content/tutorials",
          "GET /api/content/quizzes",
          "GET /api/sections/search",
          "GET /api/sections/analytics"
        ],
        search: [
          "GET /api/search",
          "GET /api/search/suggestions",
          "GET /api/search/popular",
          "GET /api/search/filters",
          "POST /api/search/advanced"
        ],
        user: [
          "GET /api/favorites",
          "GET /api/favorites/:id",
          "POST /api/favorites/:id",
          "DELETE /api/favorites/:id",
          "GET /api/user/progress",
          "GET /api/progress/:id",
          "POST /api/progress/:id",
          "DELETE /api/progress/:id",
          "GET /api/user/activity",
          "GET /api/user/streak",
          "GET /api/user/stats"
        ],
        admin: [
          "GET /api/admin/stats",
          "POST /api/admin/import",
          "DELETE /api/admin/clear-data",
          "GET /api/admin/health",
          "POST /api/admin/maintenance",
          "GET /api/admin/users",
          "GET /api/admin/content/pending",
          "POST /api/admin/content/:id/approve",
          "POST /api/admin/content/:id/reject"
        ],
        revenue: [
          "GET /api/admin/revenue/dashboard",
          "GET /api/admin/revenue/purchases",
          "GET /api/admin/revenue/analytics",
          "GET /api/admin/revenue/export",
          "GET /api/admin/revenue/webhook-status",
          "POST /api/admin/revenue/verify-purchase"
        ],
        analytics: [
          "GET /api/analytics",
          "GET /api/analytics/user",
          "GET /api/analytics/content",
          "GET /api/analytics/search",
          "GET /api/analytics/categories",
          "GET /api/analytics/realtime",
          "GET /api/analytics/export",
          "GET /api/analytics/dashboard"
        ],
        system: [
          "GET /api/health",
          "GET /api"
        ]
      }
    });
  });
  
  // Set up Swagger API documentation
  setupSwagger(app);
  console.log("📚 API documentation setup complete");
  
  console.log("✅ All routes registered successfully");
  
  } catch (error) {
    console.error("❌ Error registering routes:", error);
    
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