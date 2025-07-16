import type { Express } from 'express';
import multer from 'multer';
import { supportService } from '../services/supportService';
import { log } from '../utils/logger';
import { asyncHandler, validateAuth, validateAdminAuth } from './routeUtils';
import { z } from 'zod';
import { uploadFileToS3 } from '../s3';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  },
});

// Validation schemas
const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum(['bug', 'feature_request', 'billing', 'account', 'content', 'technical', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
});

const addMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  isInternalNote: z.boolean().optional(),
});

const satisfactionRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export function setupSupportRoutes(app: Express) {
  // Create a new support ticket
  app.post(
    '/api/support/tickets',
    validateAuth,
    upload.array('attachments', 5),
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      const validation = createTicketSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ticket data',
          details: validation.error.errors,
        });
      }

      // Handle file uploads
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            const fileKey = `support/${user.id}/${Date.now()}-${file.originalname}`;
            const uploadResult = await uploadFileToS3(file.buffer, fileKey, file.mimetype);
            
            attachments.push({
              fileName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              fileUrl: uploadResult.url,
            });
          } catch (error) {
            log.error('Error uploading attachment', { error });
          }
        }
      }

      const ticket = await supportService.createTicket({
        userId: user.id,
        userEmail: user.email,
        userName: user.name || user.firstName,
        ...validation.data,
        attachments,
      });

      res.json({
        success: true,
        data: ticket,
      });
    })
  );

  // Get user's tickets
  app.get(
    '/api/support/tickets',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      const { status, limit = 20, offset = 0 } = req.query;

      const tickets = await supportService.getUserTickets(user.id, {
        status: status as string,
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json({
        success: true,
        data: tickets,
      });
    })
  );

  // Get all tickets (admin only)
  app.get(
    '/api/admin/support/tickets',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { status, priority, category, assignedTo, search, limit = 50, offset = 0 } = req.query;

      const tickets = await supportService.getAllTickets({
        status: status as string,
        priority: priority as string,
        category: category as string,
        assignedTo: assignedTo as string,
        search: search as string,
        limit: Number(limit),
        offset: Number(offset),
      });

      res.json({
        success: true,
        data: tickets,
      });
    })
  );

  // Get single ticket
  app.get(
    '/api/support/tickets/:ticketId',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      const { ticketId } = req.params;

      const ticket = await supportService.getTicket(
        ticketId,
        user.isAdmin ? undefined : user.id
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      res.json({
        success: true,
        data: ticket,
      });
    })
  );

  // Update ticket (admin only)
  app.patch(
    '/api/admin/support/tickets/:ticketId',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { ticketId } = req.params;
      const validation = updateTicketSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid update data',
          details: validation.error.errors,
        });
      }

      if (validation.data.status) {
        await supportService.updateTicketStatus(ticketId, validation.data.status, user.id);
      }

      if (validation.data.assignedTo) {
        await supportService.assignTicket(ticketId, validation.data.assignedTo, user.id);
      }

      res.json({
        success: true,
        message: 'Ticket updated successfully',
      });
    })
  );

  // Get ticket messages
  app.get(
    '/api/support/tickets/:ticketId/messages',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      const { ticketId } = req.params;

      // Verify user has access to ticket
      const ticket = await supportService.getTicket(
        ticketId,
        user.isAdmin ? undefined : user.id
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      const messages = await supportService.getTicketMessages(
        ticketId,
        user.isAdmin // Include internal notes for admins
      );

      res.json({
        success: true,
        data: messages,
      });
    })
  );

  // Add message to ticket
  app.post(
    '/api/support/tickets/:ticketId/messages',
    validateAuth,
    upload.array('attachments', 3),
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      const { ticketId } = req.params;
      const validation = addMessageSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message data',
          details: validation.error.errors,
        });
      }

      // Verify user has access to ticket
      const ticket = await supportService.getTicket(
        ticketId,
        user.isAdmin ? undefined : user.id
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      // Handle file uploads
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            const fileKey = `support/${ticketId}/${Date.now()}-${file.originalname}`;
            const uploadResult = await uploadFileToS3(file.buffer, fileKey, file.mimetype);
            attachments.push(uploadResult.url);
          } catch (error) {
            log.error('Error uploading message attachment', { error });
          }
        }
      }

      const message = await supportService.addMessage({
        ticketId,
        userId: user.id,
        userType: user.isAdmin ? 'admin' : 'customer',
        message: validation.data.message,
        isInternalNote: validation.data.isInternalNote,
        attachments,
      });

      res.json({
        success: true,
        data: message,
      });
    })
  );

  // Submit satisfaction rating
  app.post(
    '/api/support/tickets/:ticketId/satisfaction',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      const { ticketId } = req.params;
      const validation = satisfactionRatingSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid rating data',
          details: validation.error.errors,
        });
      }

      // Verify user owns the ticket
      const ticket = await supportService.getTicket(ticketId, user.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      await supportService.submitSatisfactionRating(
        ticketId,
        validation.data.rating,
        validation.data.comment
      );

      res.json({
        success: true,
        message: 'Thank you for your feedback',
      });
    })
  );

  // Get support statistics
  app.get(
    '/api/support/stats',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      const { dateFrom } = req.query;

      const stats = await supportService.getTicketStats({
        userId: user.isAdmin ? undefined : user.id,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      });

      res.json({
        success: true,
        data: stats,
      });
    })
  );

  // Get admin support statistics
  app.get(
    '/api/admin/support/stats',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { dateFrom } = req.query;
      const stats = await supportService.getTicketStats({
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      });

      res.json({
        success: true,
        data: stats,
      });
    })
  );

  // Update ticket status (admin only)
  app.put(
    '/api/admin/support/tickets/:ticketId/status',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { ticketId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
        });
      }

      await supportService.updateTicketStatus(ticketId, status, user.id);

      res.json({
        success: true,
        message: 'Ticket status updated successfully',
      });
    })
  );

  // Assign ticket (admin only)
  app.put(
    '/api/admin/support/tickets/:ticketId/assign',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { ticketId } = req.params;
      const { assignToUserId } = req.body;

      if (!assignToUserId) {
        return res.status(400).json({
          success: false,
          error: 'assignToUserId is required',
        });
      }

      await supportService.assignTicket(ticketId, assignToUserId, user.id);

      res.json({
        success: true,
        message: 'Ticket assigned successfully',
      });
    })
  );

  // Get ticket messages (admin version)
  app.get(
    '/api/admin/support/tickets/:ticketId/messages',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { ticketId } = req.params;

      // Verify ticket exists
      const ticket = await supportService.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      const messages = await supportService.getTicketMessages(ticketId, true); // Include internal notes

      res.json({
        success: true,
        data: messages,
      });
    })
  );

  // Add message to ticket (admin version)
  app.post(
    '/api/admin/support/tickets/:ticketId/messages',
    validateAuth,
    upload.array('attachments', 3),
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { ticketId } = req.params;
      const validation = addMessageSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid message data',
          details: validation.error.errors,
        });
      }

      // Verify ticket exists
      const ticket = await supportService.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      // Handle file uploads
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            const fileKey = `support/${ticketId}/${Date.now()}-${file.originalname}`;
            const uploadResult = await uploadFileToS3(file.buffer, fileKey, file.mimetype);
            attachments.push(uploadResult.url);
          } catch (error) {
            log.error('Error uploading message attachment', { error });
          }
        }
      }

      const message = await supportService.addMessage({
        ticketId,
        userId: user.id,
        userType: 'admin',
        message: validation.data.message,
        isInternalNote: validation.data.isInternalNote || false,
        attachments,
      });

      res.json({
        success: true,
        data: message,
      });
    })
  );

  // Get canned responses (admin only)
  app.get(
    '/api/admin/support/canned-responses',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { category } = req.query;
      const responses = await supportService.getCannedResponses(category as string);

      res.json({
        success: true,
        data: responses,
      });
    })
  );

  // Create canned response (admin only)
  app.post(
    '/api/admin/support/canned-responses',
    validateAuth,
    asyncHandler(async (req, res) => {
      const user = req.user as any;
      
      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      const { title, content, category, tags } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Title and content are required',
        });
      }

      const response = await supportService.createCannedResponse({
        title,
        content,
        category,
        tags,
        createdBy: user.id,
      });

      res.json({
        success: true,
        data: response,
      });
    })
  );

  log.info('Support routes registered');
}