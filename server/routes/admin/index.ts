import type { Express } from "express";
import { registerAdminStatsRoutes } from "./stats";
import { registerAdminUserRoutes } from "./users";
import { registerAdminMaintenanceRoutes } from "./maintenance";
import { registerAdminContentRoutes } from "./content";
import { registerAdminMonitoringRoutes } from "./monitoring";
import { registerAdminRevenueRoutes } from "./revenue";
import { registerAdminNewsletterRoutes } from "./newsletter";
import { registerAdminTermsRoutes } from "./terms";
import { registerAdminJobRoutes } from "./jobs";
import { log as logger } from "../../utils/logger";

/**
 * Main admin route registration function
 * Replaces the monolithic admin.ts file with modular structure
 */
export function registerAdminRoutes(app: Express): void {
  logger.info('📋 Registering modular admin routes...');
  
  // Register all admin sub-modules
  registerAdminStatsRoutes(app);
  registerAdminUserRoutes(app);
  registerAdminMaintenanceRoutes(app);
  registerAdminContentRoutes(app);
  registerAdminMonitoringRoutes(app);
  registerAdminRevenueRoutes(app);
  registerAdminNewsletterRoutes(app);
  registerAdminTermsRoutes(app);
  registerAdminJobRoutes(app);
  
  logger.info('✅ All admin routes registered successfully');
} 