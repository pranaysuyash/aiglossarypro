/**
 * User Feedback and Term Suggestion Routes
 * Allows users to provide feedback and suggest new terms
 */

import type { Express, Request, Response } from 'express';
import { enhancedStorage as storage } from '../enhancedStorage';
import { requireAdmin } from '../middleware/adminAuth';
import { mockRequireAdmin } from '../middleware/dev/mockAuth';
import { asyncHandler, handleDatabaseError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../types/express';

// TODO: Phase 2 - Move table creation to storage layer migration
// Feedback table should be created via Drizzle schema and migrations
// For now, commenting out direct table creation

const initializeFeedbackStorage = async () => {
  // TODO: Phase 2 - Add initializeFeedbackSchema() to enhancedStorage
  console.log('⚠️ Feedback schema initialization moved to Phase 2 storage layer');
};

// Initialize feedback storage
initializeFeedbackStorage();

export function registerFeedbackRoutes(app: Express): void {
  // Choose admin middleware based on environment
  const _adminMiddleware = mockRequireAdmin;

  /**
   * Submit feedback for a specific term
   * POST /api/feedback/term/:termId
   */
  app.post(
    '/api/feedback/term/:termId',
    asyncHandler(async (req: Request, res: Response) => {
      const { termId } = req.params;
      const { type, rating, message, contactEmail } = req.body;

      // Validation
      if (!type || !['helpful', 'error_report', 'suggestion'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Valid feedback type is required (helpful, error_report, suggestion)',
        });
      }

      if (type === 'helpful' && (!rating || rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating between 1-5 is required for helpful feedback',
        });
      }

      try {
        // Verify term exists using Phase 2D method
        const termExists = await storage.verifyTermExists(termId);
        if (!termExists) {
          return res.status(404).json({
            success: false,
            message: 'Term not found',
          });
        }

        // Submit term feedback using Phase 2D method
        const feedbackData = {
          termId,
          type,
          rating,
          message,
          contactEmail,
          userId: (req as AuthenticatedRequest).user?.id || null,
        };

        const result = await storage.submitTermFeedback(feedbackData);

        res.json({
          success: true,
          message: 'Feedback submitted successfully',
          data: result,
        });
      } catch (error) {
        const errorId = await handleDatabaseError(error, req);
        res.status(500).json({
          success: false,
          message: 'Failed to submit feedback',
          errorId,
        });
      }
    })
  );

  /**
   * Submit general feedback or term request
   * POST /api/feedback/general
   */
  app.post(
    '/api/feedback/general',
    asyncHandler(async (req: Request, res: Response) => {
      const { type, message, contactEmail, termName, termDefinition } = req.body;

      // Validation
      if (!type || !['term_request', 'general', 'suggestion'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Valid feedback type is required (term_request, general, suggestion)',
        });
      }

      if (!message || message.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Message must be at least 10 characters long',
        });
      }

      if (type === 'term_request' && !termName) {
        return res.status(400).json({
          success: false,
          message: 'Term name is required for term requests',
        });
      }

      try {
        // Submit general feedback using Phase 2D method
        const feedbackData = {
          type,
          message,
          contactEmail,
          termName,
          termDefinition,
          userId: (req as AuthenticatedRequest).user?.id || null,
        };

        const result = await storage.submitGeneralFeedback(feedbackData);

        res.json({
          success: true,
          message: 'Feedback submitted successfully',
          data: result,
        });
      } catch (error) {
        const errorId = await handleDatabaseError(error, req);
        res.status(500).json({
          success: false,
          message: 'Failed to submit feedback',
          errorId,
        });
      }
    })
  );

  /**
   * Get feedback for admin review (admin only)
   * GET /api/feedback?type=term_request&status=pending&limit=50
   */
  app.get(
    '/api/feedback',
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
      const { type, status = 'pending', limit = 50, offset = 0, termId } = req.query;

      try {
        // Use Phase 2D method to get feedback with filters and pagination
        const filters = {
          status,
          type,
          termId,
        };

        const pagination = {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        };

        const result = await storage.getFeedback(filters, pagination);

        res.json({
          success: true,
          data: result,
        });
      } catch (error) {
        const errorId = await handleDatabaseError(error, req);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch feedback',
          errorId,
        });
      }
    })
  );

  /**
   * Update feedback status (admin only)
   * PUT /api/feedback/:feedbackId
   */
  app.put(
    '/api/feedback/:feedbackId',
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
      const { feedbackId } = req.params;
      const { status, adminNotes } = req.body;

      if (!status || !['pending', 'reviewed', 'implemented', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required (pending, reviewed, implemented, rejected)',
        });
      }

      try {
        // Use Phase 2D method to update feedback status
        const result = await storage.updateFeedbackStatus(feedbackId, status, adminNotes);

        res.json({
          success: true,
          message: 'Feedback status updated successfully',
          data: result,
        });
      } catch (error) {
        const errorId = await handleDatabaseError(error, req);
        res.status(500).json({
          success: false,
          message: 'Failed to update feedback status',
          errorId,
        });
      }
    })
  );

  /**
   * Get feedback statistics (admin only)
   * GET /api/feedback/stats
   */
  app.get(
    '/api/feedback/stats',
    requireAdmin,
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // Use Phase 2D method to get feedback statistics
        const stats = await storage.getFeedbackStats();

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        const errorId = await handleDatabaseError(error, req);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch feedback statistics',
          errorId,
        });
      }
    })
  );
}
