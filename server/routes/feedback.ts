/**
 * User Feedback and Term Suggestion Routes
 * Allows users to provide feedback and suggest new terms
 */

import type { Express, Request, Response } from 'express';
import { enhancedStorage as storage } from '../enhancedStorage';
// TODO: Phase 2 - Remove direct db usage after storage layer implementation
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { asyncHandler, handleDatabaseError, ErrorCategory } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/adminAuth';
import { mockRequireAdmin } from '../middleware/dev/mockAuth';
import { features } from '../config';

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
  const adminMiddleware = features.replitAuthEnabled ? requireAdmin : mockRequireAdmin;

  /**
   * Submit feedback for a specific term
   * POST /api/feedback/term/:termId
   */
  app.post('/api/feedback/term/:termId', adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { termId } = req.params;
    const { type, rating, message, contactEmail } = req.body;

    // Validation
    if (!type || !['helpful', 'error_report', 'suggestion'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid feedback type is required (helpful, error_report, suggestion)'
      });
    }

    if (type === 'helpful' && (!rating || rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating between 1-5 is required for helpful feedback'
      });
    }

    try {
      // TODO: Phase 2 - Replace with storage layer methods
      // Expected: await storage.getTermById(termId) and await storage.submitTermFeedback()
      
      // For now, return error since storage methods don't exist
      return res.status(501).json({
        success: false,
        message: 'Term feedback submission requires storage layer enhancement in Phase 2'
      });
      
      // TODO: Implement these methods in enhancedStorage:
      // - async verifyTermExists(termId: string): Promise<boolean>
      // - async submitTermFeedback(data: TermFeedback): Promise<FeedbackResult>

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        errorId
      });
    }
  }));

  /**
   * Submit general feedback or term request
   * POST /api/feedback/general
   */
  app.post('/api/feedback/general', adminMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { type, message, contactEmail, termName, termDefinition } = req.body;

    // Validation
    if (!type || !['term_request', 'general', 'suggestion'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid feedback type is required (term_request, general, suggestion)'
      });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
      });
    }

    if (type === 'term_request' && !termName) {
      return res.status(400).json({
        success: false,
        message: 'Term name is required for term requests'
      });
    }

    try {
      // TODO: Phase 2 - Replace with storage layer method
      // Expected: await storage.submitGeneralFeedback()
      
      // For now, return error since storage method doesn't exist
      return res.status(501).json({
        success: false,
        message: 'General feedback submission requires storage layer enhancement in Phase 2'
      });
      
      // TODO: Implement in enhancedStorage:
      // - async submitGeneralFeedback(data: GeneralFeedback): Promise<FeedbackResult>

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        errorId
      });
    }
  }));

  /**
   * Get feedback for admin review (admin only)
   * GET /api/feedback?type=term_request&status=pending&limit=50
   */
  app.get('/api/feedback', requireAdmin, asyncHandler(async (req: Request, res: Response) => {

    const { 
      type, 
      status = 'pending', 
      limit = 50, 
      offset = 0,
      termId 
    } = req.query;

    try {
      let whereConditions = [`status = '${status}'`];
      
      if (type) {
        whereConditions.push(`type = '${type}'`);
      }
      
      if (termId) {
        whereConditions.push(`term_id = '${termId}'`);
      }

      const whereClause = whereConditions.join(' AND ');
      
      const feedback = await db.execute(sql`
        SELECT 
          f.id,
          f.type,
          f.term_id,
          f.rating,
          f.message,
          f.contact_email,
          f.status,
          f.admin_notes,
          f.created_at,
          f.updated_at,
          t.name as term_name
        FROM user_feedback f
        LEFT JOIN terms t ON f.term_id = t.id
        WHERE ${sql.raw(whereClause)}
        ORDER BY f.created_at DESC
        LIMIT ${parseInt(limit as string)} 
        OFFSET ${parseInt(offset as string)}
      `);

      // Get total count for pagination
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total 
        FROM user_feedback 
        WHERE ${sql.raw(whereClause)}
      `);

      const total = parseInt(countResult.rows[0]?.total || '0');

      res.json({
        success: true,
        data: {
          feedback: feedback.rows,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: total > parseInt(offset as string) + parseInt(limit as string)
          }
        }
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        errorId
      });
    }
  }));

  /**
   * Update feedback status (admin only)
   * PUT /api/feedback/:feedbackId
   */
  app.put('/api/feedback/:feedbackId', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    
    const { feedbackId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'reviewed', 'implemented', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, reviewed, implemented, rejected)'
      });
    }

    try {
      const result = await db.execute(sql`
        UPDATE user_feedback 
        SET 
          status = ${status},
          admin_notes = ${adminNotes || null},
          updated_at = NOW()
        WHERE id = ${feedbackId}
        RETURNING id, type, status, updated_at
      `);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        message: 'Feedback status updated successfully',
        data: result.rows[0]
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback status',
        errorId
      });
    }
  }));

  /**
   * Get feedback statistics (admin only)
   * GET /api/feedback/stats
   */
  app.get('/api/feedback/stats', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get feedback counts by type and status
      const stats = await db.execute(sql`
        SELECT 
          type,
          status,
          COUNT(*) as count
        FROM user_feedback 
        GROUP BY type, status
        ORDER BY type, status
      `);

      // Get average rating for helpful feedback
      const ratingStats = await db.execute(sql`
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_ratings,
          COUNT(*) FILTER (WHERE rating >= 4) as positive_ratings
        FROM user_feedback 
        WHERE type = 'helpful' AND rating IS NOT NULL
      `);

      // Get recent feedback activity
      const recentActivity = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as feedback_count
        FROM user_feedback 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      const ratingData = ratingStats.rows[0];
      const averageRating = parseFloat(ratingData?.average_rating || '0');
      const totalRatings = parseInt(ratingData?.total_ratings || '0');
      const positiveRatings = parseInt(ratingData?.positive_ratings || '0');

      res.json({
        success: true,
        data: {
          byTypeAndStatus: stats.rows,
          ratings: {
            averageRating: averageRating.toFixed(2),
            totalRatings,
            positiveRatings,
            satisfactionRate: totalRatings > 0 ? ((positiveRatings / totalRatings) * 100).toFixed(1) : '0'
          },
          recentActivity: recentActivity.rows,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      const errorId = await handleDatabaseError(error, req);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback statistics',
        errorId
      });
    }
  }));
}