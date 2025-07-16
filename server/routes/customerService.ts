import { type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  insertCustomerFeedbackSchema,
  insertKnowledgeBaseArticleSchema,
  insertRefundRequestSchema,
  insertSupportTicketSchema,
  insertTicketMessageSchema,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
} from '../../shared/schema';
import type { AuthenticatedRequest } from '../../shared/types';
import { authenticateFirebaseToken } from '../middleware/firebaseAuth';
import { validateRequest } from '../middleware/validateRequest';
import {
  CustomerFeedbackService,
  KnowledgeBaseService,
  MetricsService,
  RefundService,
  SupportTicketService,
} from '../services/customerService';
import { log as logger } from '../utils/logger';

const router = Router();

// Create requireAuth middleware using Firebase auth
const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.firebaseToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Use Firebase auth middleware logic
    await authenticateFirebaseToken(req, res, next);
  } catch {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

// Validation schemas
const createTicketSchema = insertSupportTicketSchema.extend({
  initialMessage: z.string().optional(),
});

const updateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
  internalNote: z.string().optional(),
});

const addMessageSchema = insertTicketMessageSchema;

const searchTicketsSchema = z.object({
  query: z.string().optional(),
  status: z.array(z.enum(TICKET_STATUSES)).optional(),
  type: z.array(z.enum(TICKET_TYPES)).optional(),
  priority: z.array(z.enum(TICKET_PRIORITIES)).optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

const updateRefundStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processed', 'failed']),
  adminNotes: z.string().optional(),
  gumroadRefundId: z.string().optional(),
});

const voteOnArticleSchema = z.object({
  helpful: z.boolean(),
});

// ============================================
// SUPPORT TICKETS ENDPOINTS
// ============================================

// Create support ticket (public endpoint for guest users)
router.post(
  '/tickets',
  validateRequest({ body: createTicketSchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { initialMessage, ...ticketData } = req.body;

      // If user is authenticated, use their info
      if (req.user) {
        const user = req.user as AuthenticatedRequest['user'];
        ticketData.userId = user.id;
        if (!ticketData.customerEmail) {
          ticketData.customerEmail = user.email || '';
        }
        if (!ticketData.customerName) {
          ticketData.customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
      }

      const ticket = await SupportTicketService.createTicket({ ...ticketData, initialMessage });

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Support ticket created successfully',
      });
    } catch (error) {
      logger.error('Error creating support ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create support ticket',
      });
    }
  }
);

// Get ticket by ID (accessible by ticket owner or admins)
router.get('/tickets/:ticketId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const ticket = await SupportTicketService.getTicketById(ticketId, true);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    // Check access permissions
    if (req.user) {
      const user = req.user as AuthenticatedRequest['user'];
      const canAccess =
        user.isAdmin || ticket.userId === user.id || ticket.customerEmail === user.email;

      if (!canAccess) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
    });
  }
});

// Get tickets by user (requires authentication)
router.get(
  '/tickets/user/:userId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Users can only access their own tickets unless they're admin
      if (!req.user.isAdmin && userId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      const result = await SupportTicketService.getTicketsByUser(
        userId,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error fetching user tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user tickets',
      });
    }
  }
);

// Get tickets by email (for guest users)
router.get('/tickets/email/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Rate limiting should be applied to this endpoint
    const result = await SupportTicketService.getTicketsByEmail(email, Number(page), Number(limit));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching tickets by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
    });
  }
});

// Update ticket status (admin only)
router.patch(
  '/tickets/:ticketId/status',
  requireAuth,
  validateRequest({ body: updateTicketStatusSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      const { ticketId } = req.params;
      const { status, internalNote } = req.body;

      const ticket = await SupportTicketService.updateTicketStatus(
        ticketId,
        status,
        req.user.id,
        internalNote
      );

      res.json({
        success: true,
        data: ticket,
        message: 'Ticket status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating ticket status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update ticket status',
      });
    }
  }
);

// Add message to ticket
router.post(
  '/tickets/:ticketId/messages',
  validateRequest({ body: addMessageSchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const messageData = req.body;

      // Verify ticket exists and user has access
      const ticket = await SupportTicketService.getTicketById(ticketId, false);
      if (!ticket) {
        res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
        return;
      }

      // Check permissions
      if (req.user) {
        const user = req.user as AuthenticatedRequest['user'];
        const canAccess =
          user.isAdmin || ticket.userId === user.id || ticket.customerEmail === user.email;

        if (!canAccess) {
          res.status(403).json({
            success: false,
            error: 'Access denied',
          });
          return;
        }

        // Set sender info from authenticated user
        messageData.senderId = user.id;
        messageData.senderType = user.isAdmin ? 'agent' : 'customer';
        messageData.senderEmail = user.email;
        messageData.senderName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }

      messageData.ticketId = ticketId;

      const message = await SupportTicketService.addMessage(messageData);

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message added successfully',
      });
    } catch (error) {
      logger.error('Error adding message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add message',
      });
    }
  }
);

// Search tickets (admin only)
router.get(
  '/tickets',
  requireAuth,
  validateRequest({ query: searchTicketsSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      const { query, page, limit, ...filters } = req.query;

      const result = await SupportTicketService.searchTickets(query || '', filters, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error searching tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search tickets',
      });
    }
  }
);

// ============================================
// REFUND REQUESTS ENDPOINTS
// ============================================

// Create refund request
router.post(
  '/refunds',
  requireAuth,
  validateRequest({ body: insertRefundRequestSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const refundData = {
        ...req.body,
        userId: req.user.id,
      };

      const refundRequest = await RefundService.createRefundRequest(refundData);

      res.status(201).json({
        success: true,
        data: refundRequest,
        message: 'Refund request created successfully',
      });
    } catch (error) {
      logger.error('Error creating refund request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create refund request',
      });
    }
  }
);

// Update refund status (admin only)
router.patch(
  '/refunds/:refundId',
  requireAuth,
  validateRequest({ body: updateRefundStatusSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      const { refundId } = req.params;
      const { status, adminNotes, gumroadRefundId } = req.body;

      const refundRequest = await RefundService.updateRefundStatus(
        refundId,
        status,
        adminNotes,
        gumroadRefundId
      );

      res.json({
        success: true,
        data: refundRequest,
        message: 'Refund status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating refund status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update refund status',
      });
    }
  }
);

// Get user's refund requests
router.get(
  '/refunds/user/:userId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      // Users can only access their own refunds unless they're admin
      if (!req.user.isAdmin && userId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied',
        });
        return;
      }

      const refunds = await RefundService.getRefundsByUser(userId);

      res.json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      logger.error('Error fetching user refunds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch refunds',
      });
    }
  }
);

// ============================================
// KNOWLEDGE BASE ENDPOINTS
// ============================================

// Search knowledge base articles (public)
router.get('/knowledge-base/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query, category } = req.query;

    const articles = await KnowledgeBaseService.searchArticles(
      (query as string) || '',
      category as string,
      true // Only published articles for public access
    );

    res.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    logger.error('Error searching knowledge base:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search knowledge base',
    });
  }
});

// Get knowledge base article by slug (public)
router.get('/knowledge-base/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const article = await KnowledgeBaseService.getArticleBySlug(slug);

    if (!article) {
      res.status(404).json({
        success: false,
        error: 'Article not found',
      });
      return;
    }

    // Only show published articles to non-admin users
    if (
      !article.isPublished &&
      (!req.user || !(req.user as AuthenticatedRequest['user']).isAdmin)
    ) {
      res.status(404).json({
        success: false,
        error: 'Article not found',
      });
      return;
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    logger.error('Error fetching knowledge base article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article',
    });
  }
});

// Vote on knowledge base article helpfulness
router.post(
  '/knowledge-base/:articleId/vote',
  validateRequest({ body: voteOnArticleSchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { articleId } = req.params;
      const { helpful } = req.body;

      await KnowledgeBaseService.voteOnArticle(articleId, helpful);

      res.json({
        success: true,
        message: 'Vote recorded successfully',
      });
    } catch (error) {
      logger.error('Error recording article vote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record vote',
      });
    }
  }
);

// Create knowledge base article (admin only)
router.post(
  '/knowledge-base',
  requireAuth,
  validateRequest({ body: insertKnowledgeBaseArticleSchema }),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      const articleData = {
        ...req.body,
        authorId: req.user.id,
      };

      const article = await KnowledgeBaseService.createArticle(articleData);

      res.status(201).json({
        success: true,
        data: article,
        message: 'Knowledge base article created successfully',
      });
    } catch (error) {
      logger.error('Error creating knowledge base article:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create article',
      });
    }
  }
);

// ============================================
// CUSTOMER FEEDBACK ENDPOINTS
// ============================================

// Submit customer feedback
router.post(
  '/feedback',
  validateRequest({ body: insertCustomerFeedbackSchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const feedbackData = req.body;

      if (req.user) {
        feedbackData.userId = (req.user as AuthenticatedRequest['user']).id;
      }

      const feedback = await CustomerFeedbackService.submitFeedback(feedbackData);

      res.status(201).json({
        success: true,
        data: feedback,
        message: 'Feedback submitted successfully',
      });
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback',
      });
    }
  }
);

// Get feedback for a ticket (admin only)
router.get(
  '/feedback/ticket/:ticketId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      const { ticketId } = req.params;
      const feedback = await CustomerFeedbackService.getFeedbackByTicket(ticketId);

      res.json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      logger.error('Error fetching ticket feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feedback',
      });
    }
  }
);

// ============================================
// METRICS ENDPOINTS (Admin only)
// ============================================

// Get daily metrics
router.get(
  '/metrics/daily',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user.isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
        return;
      }

      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      const metrics = await MetricsService.calculateDailyMetrics(targetDate);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error fetching daily metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics',
      });
    }
  }
);

export default router;
