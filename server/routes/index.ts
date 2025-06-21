import type { Express } from "express";
import { setupAuth } from "../replitAuth";
import { initS3Client } from "../s3Service";
import { features } from "../config";

// Import modular route handlers
import { registerAuthRoutes } from "./auth";
import { registerCategoryRoutes } from "./categories";
import { registerTermRoutes } from "./terms";
import { registerSearchRoutes } from "./search";
import { registerUserRoutes } from "./user";
import { registerAdminRoutes } from "./admin";
import { registerAnalyticsRoutes } from "./analytics";

// Import existing specialized route modules
import cacheRoutes from "./cache";
import s3Routes from "../s3Routes";
import s3RoutesOptimized from "../s3RoutesOptimized";
import s3MonitoringRoutes from "../s3MonitoringRoutes";
import { registerEnhancedRoutes } from "../enhancedRoutes";
import { registerEnhancedDemoRoutes } from "../enhancedDemoRoutes";

/**
 * Main route registration function
 * This replaces the monolithic routes.ts file with a modular structure
 */
export async function registerRoutes(app: Express): Promise<void> {
  console.log("🔧 Setting up application routes...");
  
  // Set up authentication first
  await setupAuth(app);
  console.log("✅ Authentication setup complete");
  
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
  registerSearchRoutes(app);
  registerUserRoutes(app);
  
  // Register admin routes (with proper role checking in production)
  registerAdminRoutes(app);
  
  // Register analytics routes
  if (features.analyticsEnabled) {
    registerAnalyticsRoutes(app);
    console.log("✅ Analytics routes registered");
  }
  
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
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // API documentation endpoint
  app.get('/api', (req, res) => {
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
  
  console.log("✅ All routes registered successfully");
}