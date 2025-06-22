import type { Express } from "express";
import { registerAdminStatsRoutes } from "./stats";
import { registerAdminImportRoutes } from "./imports";
import { registerAdminUserRoutes } from "./users";
import { registerAdminMaintenanceRoutes } from "./maintenance";
import { registerAdminContentRoutes } from "./content";
import { registerAdminMonitoringRoutes } from "./monitoring";

/**
 * Main admin route registration function
 * Replaces the monolithic admin.ts file with modular structure
 */
export function registerAdminRoutes(app: Express): void {
  console.log('📋 Registering modular admin routes...');
  
  // Register all admin sub-modules
  registerAdminStatsRoutes(app);
  registerAdminImportRoutes(app);
  registerAdminUserRoutes(app);
  registerAdminMaintenanceRoutes(app);
  registerAdminContentRoutes(app);
  registerAdminMonitoringRoutes(app);
  
  console.log('✅ All admin routes registered successfully');
} 