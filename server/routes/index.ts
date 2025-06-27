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