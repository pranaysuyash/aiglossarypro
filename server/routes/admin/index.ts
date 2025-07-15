import type { Express } from 'express';
import { log as logger } from '../../utils/logger';
import aiGenerationRoutes from './aiGeneration';
import columnBatchProcessingRoutes from './columnBatchProcessing';
import { registerAdminContentRoutes } from './content';
import contentEditingRoutes from './contentEditing';
import enhancedTermsRoutes from './enhancedTerms';
import { registerAdminJobRoutes } from './jobs';
import { registerAdminMaintenanceRoutes } from './maintenance';
import { registerAdminMonitoringRoutes } from './monitoring';
import { registerAdminNewsletterRoutes } from './newsletter';
import peopleRoutes from './people';
import { registerAdminRevenueRoutes } from './revenue';
import safetyRoutes from './safety';
import { registerAdminStatsRoutes } from './stats';
import { registerAdminTermsRoutes } from './terms';
import { registerAdminUserRoutes } from './users';

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

  // Register AI generation routes
  app.use('/api/admin/ai', aiGenerationRoutes);
  logger.info('✅ AI generation routes registered at /api/admin/ai');

  // Register column batch processing routes
  app.use('/api/admin/column-batch', columnBatchProcessingRoutes);
  logger.info('✅ Column batch processing routes registered at /api/admin/column-batch');

  // Register content editing routes
  app.use('/api/admin/content-editing', contentEditingRoutes);
  logger.info('✅ Content editing routes registered at /api/admin/content-editing');

  // Register enhanced terms routes
  app.use('/api/admin', enhancedTermsRoutes);
  logger.info('✅ Enhanced terms routes registered at /api/admin');

  // Register safety routes
  app.use('/api/admin/safety', safetyRoutes);
  logger.info('✅ Safety routes registered at /api/admin/safety');

  // Register people routes (feature-flagged for future release)
  app.use('/api/admin/people', peopleRoutes);
  logger.info('✅ People routes registered at /api/admin/people (feature-flagged)');

  logger.info('✅ All admin routes registered successfully');
}
