/**
 * User Feedback and Term Suggestion Routes
 * Allows users to provide feedback and suggest new terms
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { asyncHandler, handleDatabaseError, ErrorCategory } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/adminAuth';

// Create feedback table if it doesn't exist
const createFeedbackTable = async () => {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL CHECK (type IN ('helpful', 'error_report', 'suggestion', 'term_request', 'general')),
        term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        message TEXT,
        contact_email VARCHAR(255),
        user_agent TEXT,
        ip_address INET,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented', 'rejected')),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index for efficient querying
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_type_status 
      ON user_feedback(type, status, created_at DESC)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_feedback_term_id 
      ON user_feedback(term_id) WHERE term_id IS NOT NULL
    `);

    console.log('✅ User feedback table initialized');
  } catch (error) {
    console.error('❌ Error creating feedback table:', error);
  }
};

// Initialize feedback table
createFeedbackTable();

export function registerFeedbackRoutes(app: Express): void {

  /**
   * Submit feedback for a specific term
   * POST /api/feedback/term/:termId
   */
  app.post('/api/feedback/term/:termId', asyncHandler(async (req: Request, res: Response) => {
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
      // Verify term exists
      const termExists = await db.execute(sql`
        SELECT id FROM terms WHERE id = ${termId}
      `);

      if (termExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Term not found'
        });
      }

      // Insert feedback
      const feedback = await db.execute(sql`
        INSERT INTO user_feedback (
          type, term_id, rating, message, contact_email, 
          user_agent, ip_address
        ) VALUES (
          ${type}, ${termId}, ${rating || null}, ${message || null}, 
          ${contactEmail || null}, ${req.get('user-agent') || null}, 
          ${req.ip || req.connection.remoteAddress || null}
        ) RETURNING id, created_at
      `);

      res.json({
        success: true,
        message: 'Thank you for your feedback!',
        data: {
          feedbackId: feedback.rows[0].id,
          submittedAt: feedback.rows[0].created_at
        }
      });

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
  app.post('/api/feedback/general', asyncHandler(async (req: Request, res: Response) => {
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
      // For term requests, include suggested term details in the message
      let fullMessage = message;
      if (type === 'term_request') {
        fullMessage = `Term Request: ${termName}\n\n`;
        if (termDefinition) {
          fullMessage += `Suggested Definition: ${termDefinition}\n\n`;
        }
        fullMessage += `Additional Details: ${message}`;
      }

      // Insert feedback
      const feedback = await db.execute(sql`
        INSERT INTO user_feedback (
          type, message, contact_email, user_agent, ip_address
        ) VALUES (
          ${type}, ${fullMessage}, ${contactEmail || null}, 
          ${req.get('user-agent') || null}, 
          ${req.ip || req.connection.remoteAddress || null}
        ) RETURNING id, created_at
      `);

      // Send appropriate response based on type
      let responseMessage = 'Thank you for your feedback!';
      if (type === 'term_request') {
        responseMessage = `Thank you for suggesting "${termName}"! We'll review your request and consider adding it to the glossary.`;
      } else if (type === 'suggestion') {
        responseMessage = 'Thank you for your suggestion! We appreciate your input and will consider it for future improvements.';
      }

      res.json({
        success: true,
        message: responseMessage,
        data: {
          feedbackId: feedback.rows[0].id,
          submittedAt: feedback.rows[0].created_at
        }
      });

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