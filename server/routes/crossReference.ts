/**
 * Cross-Reference and Term Linking Routes
 * Provides endpoints for managing automatic term links and references
 */

import type { Express, Request, Response } from 'express';
import { crossReferenceService } from '../services/crossReferenceService';
import { asyncHandler, handleDatabaseError } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/adminAuth';
import { mockRequireAdmin } from '../middleware/dev/mockAuth';
import { features } from '../config';
import { BULK_LIMITS } from '../constants';
import { validateBody, validateParamsMiddleware, processTextSchema, bulkProcessSchema, termIdParamSchema } from '../utils/validation';

export function registerCrossReferenceRoutes(app: Express): void {
  // Choose admin middleware based on environment
  const adminMiddleware = mockRequireAdmin;

  /**
   * Process text for automatic term linking
   * POST /api/cross-reference/process
   */
  app.post('/api/cross-reference/process', adminMiddleware, validateBody(processTextSchema), asyncHandler(async (req: Request, res: Response) => {
    const { text, excludeTermId } = req.body;

    try {
      const result = await crossReferenceService.processTextForLinks(text, excludeTermId);

      res.json({
        success: true,
        data: result,
        message: `Added ${result.linksAdded} automatic links`
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to process text for links',
        errorId
      });
    }
  }));

  /**
   * Get cross-references for a specific term
   * GET /api/cross-reference/term/:termId
   */
  app.get('/api/cross-reference/term/:termId', adminMiddleware, validateParamsMiddleware(termIdParamSchema), asyncHandler(async (req: Request, res: Response) => {
    const { termId } = req.params;

    try {
      const crossReferences = await crossReferenceService.findCrossReferences(termId);

      res.json({
        success: true,
        data: {
          termId,
          crossReferences,
          total: crossReferences.length
        }
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to find cross-references',
        errorId
      });
    }
  }));

  /**
   * Update a term's definition with automatic links (admin only)
   * PUT /api/cross-reference/term/:termId/update-links
   */
  app.put('/api/cross-reference/term/:termId/update-links', requireAdmin, validateParamsMiddleware(termIdParamSchema), asyncHandler(async (req: Request, res: Response) => {
    const { termId } = req.params;

    try {
      const updated = await crossReferenceService.updateTermWithLinks(termId);

      if (updated) {
        res.json({
          success: true,
          message: 'Term definition updated with automatic links'
        });
      } else {
        res.json({
          success: true,
          message: 'No links were added (term may already have links or no references found)'
        });
      }

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to update term with links',
        errorId
      });
    }
  }));

  /**
   * Bulk process multiple terms (admin only)
   * POST /api/cross-reference/bulk-process
   */
  app.post('/api/cross-reference/bulk-process', requireAdmin, validateBody(bulkProcessSchema), asyncHandler(async (req: Request, res: Response) => {
    const { termIds } = req.body;

    try {
      const results = await crossReferenceService.bulkProcessTerms(termIds);
      
      const summary = {
        totalProcessed: results.size,
        totalLinksAdded: Array.from(results.values()).reduce((sum, result) => sum + result.linksAdded, 0),
        termsWithLinks: Array.from(results.values()).filter(result => result.linksAdded > 0).length
      };

      res.json({
        success: true,
        data: {
          summary,
          results: Object.fromEntries(results)
        },
        message: `Processed ${summary.totalProcessed} terms, added ${summary.totalLinksAdded} links`
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk process terms',
        errorId
      });
    }
  }));

  /**
   * Initialize term cache (admin only)
   * POST /api/cross-reference/initialize-cache
   */
  app.post('/api/cross-reference/initialize-cache', requireAdmin, asyncHandler(async (req: Request, res: Response) => {

    try {
      await crossReferenceService.initializeTermCache();

      res.json({
        success: true,
        message: 'Term cache initialized successfully'
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize term cache',
        errorId
      });
    }
  }));
}