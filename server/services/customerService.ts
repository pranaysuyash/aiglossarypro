import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  customerFeedback,
  customerServiceMetrics,
  InsertCustomerFeedback,
  InsertKnowledgeBaseArticle,
  InsertRefundRequest,
  InsertSupportTicket,
  InsertTicketMessage,
  knowledgeBaseArticles,
  purchases,
  refundRequests,
  ResponseTemplate,
  responseTemplates,
  supportTickets,
  ticketAttachments,
  ticketMessages,
  users,
} from '../../shared/schema';
import { log as logger } from '../utils/logger';
import { emailService } from './emailService';

// Ticket number generation
export async function generateTicketNumber(): Promise<string> {
  try {
    const year = new Date().getFullYear();
    const yearStr = year.toString();
    
    // Get count of tickets for this year
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportTickets)
      .where(ilike(supportTickets.ticketNumber, `TICK-${yearStr}-%`));
    
    const count = result[0]?.count || 0;
    const nextNum = (count + 1).toString().padStart(3, '0');
    
    return `TICK-${yearStr}-${nextNum}`;
  } catch (error) {
    logger.error('Error generating ticket number:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `TICK-${new Date().getFullYear()}-${timestamp}`;
  }
}

// Support Ticket Operations
export class SupportTicketService {
  static async createTicket(ticketData: InsertSupportTicket & { initialMessage?: string }) {
    try {
      const ticketNumber = await generateTicketNumber();
      
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          ...ticketData,
          ticketNumber,
        })
        .returning();

      // Create initial message if provided
      if (ticketData.initialMessage) {
        await db.insert(ticketMessages).values({
          ticketId: ticket.id,
          senderId: ticketData.userId,
          senderType: 'customer',
          senderEmail: ticketData.customerEmail,
          senderName: ticketData.customerName,
          content: ticketData.initialMessage,
          contentType: 'text',
        });
      }

      // Auto-send welcome email based on ticket type
      await this.triggerAutoResponse(ticket.id, 'ticket_created');

      // Send email notification
      try {
        await emailService.sendTicketCreatedNotification(ticket);
      } catch (error) {
        logger.error('Error sending ticket created email:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
        // Don't fail ticket creation if email fails
      }

      logger.info('Support ticket created:', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        type: ticket.type,
        priority: ticket.priority,
      });

      return ticket;
    } catch (error) {
      logger.error('Error creating support ticket:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to create support ticket');
    }
  }

  static async getTicketById(ticketId: string, includeMessages = true) {
    try {
      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId))
        .limit(1);

      if (!ticket.length) {
        return null;
      }

      const ticketData = ticket[0];
      
      if (includeMessages) {
        const messages = await db
          .select()
          .from(ticketMessages)
          .where(eq(ticketMessages.ticketId, ticketId))
          .orderBy(ticketMessages.createdAt);

        const attachments = await db
          .select()
          .from(ticketAttachments)
          .where(eq(ticketAttachments.ticketId, ticketId))
          .orderBy(ticketAttachments.createdAt);

        return {
          ...ticketData,
          messages,
          attachments,
        };
      }

      return ticketData;
    } catch (error) {
      logger.error('Error fetching ticket:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to fetch ticket');
    }
  }

  static async getTicketsByUser(userId: string, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId))
        .orderBy(desc(supportTickets.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId));

      return {
        tickets,
        total: totalCount[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      };
    } catch (error) {
      logger.error('Error fetching user tickets:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to fetch user tickets');
    }
  }

  static async getTicketsByEmail(email: string, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.customerEmail, email))
        .orderBy(desc(supportTickets.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.customerEmail, email));

      return {
        tickets,
        total: totalCount[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      };
    } catch (error) {
      logger.error('Error fetching tickets by email:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to fetch tickets by email');
    }
  }

  static async updateTicketStatus(
    ticketId: string, 
    status: string, 
    updatedBy?: string,
    internalNote?: string
  ) {
    try {
      // Get current ticket for email notification
      const currentTicket = await this.getTicketById(ticketId, false);
      const oldStatus = currentTicket?.status;

      const updateData: any = { status };
      
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      } else if (status === 'closed') {
        updateData.closedAt = new Date();
      }

      const [updatedTicket] = await db
        .update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, ticketId))
        .returning();

      // Add internal note if provided
      if (internalNote && updatedBy) {
        await db.insert(ticketMessages).values({
          ticketId,
          senderId: updatedBy,
          senderType: 'agent',
          content: internalNote,
          contentType: 'text',
          isInternal: true,
        });
      }

      // Trigger auto-response for status changes
      await this.triggerAutoResponse(ticketId, 'status_changed');

      // Send email notification if status changed
      if (oldStatus && oldStatus !== status) {
        try {
          await emailService.sendTicketStatusUpdateNotification(updatedTicket, oldStatus);
        } catch (error) {
          logger.error('Error sending status update email:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
          // Don't fail status update if email fails
        }
      }

      logger.info('Ticket status updated:', {
        ticketId,
        status,
        updatedBy,
      });

      return updatedTicket;
    } catch (error) {
      logger.error('Error updating ticket status:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to update ticket status');
    }
  }

  static async addMessage(messageData: InsertTicketMessage) {
    try {
      const [message] = await db
        .insert(ticketMessages)
        .values(messageData)
        .returning();

      // Update ticket's last response time
      await db
        .update(supportTickets)
        .set({
          lastResponseAt: new Date(),
          firstResponseAt: sql`COALESCE(first_response_at, NOW())`,
        })
        .where(eq(supportTickets.id, messageData.ticketId));

      // Send email notification if message is from support team
      if (messageData.senderType === 'agent' && !messageData.isInternal) {
        try {
          const ticket = await this.getTicketById(messageData.ticketId, false);
          if (ticket) {
            await emailService.sendNewMessageNotification(ticket, message, true);
          }
        } catch (error) {
          logger.error('Error sending message notification email:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
          // Don't fail message creation if email fails
        }
      }

      logger.info('Message added to ticket:', {
        messageId: message.id,
        ticketId: messageData.ticketId,
        senderType: messageData.senderType,
      });

      return message;
    } catch (error) {
      logger.error('Error adding message:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to add message');
    }
  }

  static async searchTickets(
    query: string, 
    filters: {
      status?: string[];
      type?: string[];
      priority?: string[];
      assignedTo?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    page = 1,
    limit = 10
  ) {
    try {
      const offset = (page - 1) * limit;
      const whereConditions = [];

      // Text search in subject, description, and ticket number
      if (query) {
        whereConditions.push(
          or(
            ilike(supportTickets.subject, `%${query}%`),
            ilike(supportTickets.description, `%${query}%`),
            ilike(supportTickets.ticketNumber, `%${query}%`),
            ilike(supportTickets.customerEmail, `%${query}%`)
          )
        );
      }

      // Filter by status
      if (filters.status?.length) {
        whereConditions.push(inArray(supportTickets.status, filters.status));
      }

      // Filter by type
      if (filters.type?.length) {
        whereConditions.push(inArray(supportTickets.type, filters.type));
      }

      // Filter by priority
      if (filters.priority?.length) {
        whereConditions.push(inArray(supportTickets.priority, filters.priority));
      }

      // Filter by assigned agent
      if (filters.assignedTo) {
        whereConditions.push(eq(supportTickets.assignedToId, filters.assignedTo));
      }

      // Date range filter
      if (filters.dateFrom) {
        whereConditions.push(sql`${supportTickets.createdAt} >= ${filters.dateFrom}`);
      }
      if (filters.dateTo) {
        whereConditions.push(sql`${supportTickets.createdAt} <= ${filters.dateTo}`);
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const tickets = await db
        .select({
          ticket: supportTickets,
          assignedAgent: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(supportTickets)
        .leftJoin(users, eq(supportTickets.assignedToId, users.id))
        .where(whereClause)
        .orderBy(desc(supportTickets.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(whereClause);

      return {
        tickets: tickets.map(t => ({
          ...t.ticket,
          assignedAgent: t.assignedAgent,
        })),
        total: totalCount[0]?.count || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
      };
    } catch (error) {
      logger.error('Error searching tickets:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to search tickets');
    }
  }

  static async triggerAutoResponse(ticketId: string, triggerType: string) {
    try {
      const ticket = await this.getTicketById(ticketId, false);
      if (!ticket) return;

      // Find matching auto-response templates
      const templates = await db
        .select()
        .from(responseTemplates)
        .where(
          and(
            eq(responseTemplates.triggerType, triggerType),
            eq(responseTemplates.isActive, true),
            eq(responseTemplates.isAutoResponse, true)
          )
        );

      for (const template of templates) {
        // Check if template applies to this ticket type
        if (!template.ticketTypes?.includes(ticket.type)) continue;

        // Replace template variables
        let content = template.content;
        let subject = template.subject || '';

        content = content.replace(/\{\{ticket_number\}\}/g, ticket.ticketNumber);
        subject = subject.replace(/\{\{ticket_number\}\}/g, ticket.ticketNumber);

        // Send auto-response message
        await this.addMessage({
          ticketId: ticket.id,
          senderType: 'system',
          senderEmail: 'noreply@aiglossary.pro',
          senderName: 'AI Glossary Pro Support',
          content,
          contentType: 'text',
          isAutoResponse: true,
        });

        // Update template usage count
        await db
          .update(responseTemplates)
          .set({ usageCount: sql`${responseTemplates.usageCount} + 1` })
          .where(eq(responseTemplates.id, template.id));
      }
    } catch (error) {
      logger.error('Error triggering auto-response:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      // Don't throw - auto-responses shouldn't break the main flow
    }
  }
}

// Refund Request Service
export class RefundService {
  static async createRefundRequest(refundData: InsertRefundRequest) {
    try {
      const [refundRequest] = await db
        .insert(refundRequests)
        .values(refundData)
        .returning();

      // Send email notification
      try {
        // Get customer info from purchase or user
        let customerEmail = '';
        let customerName = '';

        if (refundData.purchaseId) {
          const [purchase] = await db
            .select()
            .from(purchases)
            .where(eq(purchases.id, refundData.purchaseId))
            .limit(1);
          
          if (purchase) {
            const purchaseData = purchase.purchaseData as Record<string, unknown> | null;
            customerEmail = (purchaseData?.email as string) || '';
            customerName = (purchaseData?.fullName as string) || '';
          }
        }

        if (!customerEmail && refundData.userId) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, refundData.userId))
            .limit(1);
          
          if (user) {
            customerEmail = user.email || '';
            customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          }
        }

        if (customerEmail) {
          await emailService.sendRefundRequestNotification(
            customerEmail,
            customerName,
            refundRequest.id,
            refundRequest.gumroadOrderId,
            refundRequest.requestedAmount
          );
        }
      } catch (error) {
        logger.error('Error sending refund request email:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
        // Don't fail refund creation if email fails
      }

      logger.info('Refund request created:', {
        refundId: refundRequest.id,
        gumroadOrderId: refundRequest.gumroadOrderId,
        requestedAmount: refundRequest.requestedAmount,
      });

      return refundRequest;
    } catch (error) {
      logger.error('Error creating refund request:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to create refund request');
    }
  }

  static async updateRefundStatus(
    refundId: string, 
    status: string, 
    adminNotes?: string,
    gumroadRefundId?: string
  ) {
    try {
      const updateData: any = { status, adminNotes };
      
      if (status === 'approved') {
        updateData.approvedAt = new Date();
      } else if (status === 'rejected') {
        updateData.rejectedAt = new Date();
      } else if (status === 'processed') {
        updateData.processedAt = new Date();
        if (gumroadRefundId) {
          updateData.gumroadRefundId = gumroadRefundId;
        }
      }

      const [refundRequest] = await db
        .update(refundRequests)
        .set(updateData)
        .where(eq(refundRequests.id, refundId))
        .returning();

      logger.info('Refund status updated:', {
        refundId,
        status,
        gumroadRefundId,
      });

      return refundRequest;
    } catch (error) {
      logger.error('Error updating refund status:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to update refund status');
    }
  }

  static async getRefundsByUser(userId: string) {
    try {
      return await db
        .select()
        .from(refundRequests)
        .where(eq(refundRequests.userId, userId))
        .orderBy(desc(refundRequests.createdAt));
    } catch (error) {
      logger.error('Error fetching user refunds:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to fetch user refunds');
    }
  }
}

// Knowledge Base Service
export class KnowledgeBaseService {
  static async createArticle(articleData: InsertKnowledgeBaseArticle) {
    try {
      const [article] = await db
        .insert(knowledgeBaseArticles)
        .values(articleData)
        .returning();

      logger.info('Knowledge base article created:', {
        articleId: article.id,
        slug: article.slug,
        title: article.title,
      });

      return article;
    } catch (error) {
      logger.error('Error creating knowledge base article:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to create knowledge base article');
    }
  }

  static async searchArticles(query: string, categoryId?: string, published = true) {
    try {
      const whereConditions = [];

      // Text search
      if (query) {
        whereConditions.push(
          or(
            ilike(knowledgeBaseArticles.title, `%${query}%`),
            ilike(knowledgeBaseArticles.content, `%${query}%`),
            ilike(knowledgeBaseArticles.excerpt, `%${query}%`)
          )
        );
      }

      // Category filter
      if (categoryId) {
        whereConditions.push(eq(knowledgeBaseArticles.categoryId, categoryId));
      }

      // Published filter
      if (published) {
        whereConditions.push(eq(knowledgeBaseArticles.isPublished, true));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const articles = await db
        .select()
        .from(knowledgeBaseArticles)
        .where(whereClause)
        .orderBy(desc(knowledgeBaseArticles.viewCount), desc(knowledgeBaseArticles.createdAt));

      return articles;
    } catch (error) {
      logger.error('Error searching knowledge base articles:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to search knowledge base articles');
    }
  }

  static async getArticleBySlug(slug: string) {
    try {
      const [article] = await db
        .select()
        .from(knowledgeBaseArticles)
        .where(eq(knowledgeBaseArticles.slug, slug))
        .limit(1);

      if (article) {
        // Increment view count
        await db
          .update(knowledgeBaseArticles)
          .set({ viewCount: sql`${knowledgeBaseArticles.viewCount} + 1` })
          .where(eq(knowledgeBaseArticles.id, article.id));
      }

      return article;
    } catch (error) {
      logger.error('Error fetching knowledge base article:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to fetch knowledge base article');
    }
  }

  static async voteOnArticle(articleId: string, helpful: boolean) {
    try {
      const updateData = helpful 
        ? { helpfulVotes: sql`${knowledgeBaseArticles.helpfulVotes} + 1` }
        : { notHelpfulVotes: sql`${knowledgeBaseArticles.notHelpfulVotes} + 1` };

      await db
        .update(knowledgeBaseArticles)
        .set(updateData)
        .where(eq(knowledgeBaseArticles.id, articleId));

      logger.info('Article vote recorded:', { articleId, helpful });
    } catch (error) {
      logger.error('Error recording article vote:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to record article vote');
    }
  }
}

// Customer Feedback Service
export class CustomerFeedbackService {
  static async submitFeedback(feedbackData: InsertCustomerFeedback) {
    try {
      const [feedback] = await db
        .insert(customerFeedback)
        .values(feedbackData)
        .returning();

      logger.info('Customer feedback submitted:', {
        feedbackId: feedback.id,
        ticketId: feedback.ticketId,
        rating: feedback.rating,
        feedbackType: feedback.feedbackType,
      });

      return feedback;
    } catch (error) {
      logger.error('Error submitting customer feedback:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to submit customer feedback');
    }
  }

  static async getFeedbackByTicket(ticketId: string) {
    try {
      return await db
        .select()
        .from(customerFeedback)
        .where(eq(customerFeedback.ticketId, ticketId))
        .orderBy(desc(customerFeedback.createdAt));
    } catch (error) {
      logger.error('Error fetching ticket feedback:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to fetch ticket feedback');
    }
  }
}

// Customer Service Metrics
export class MetricsService {
  static async calculateDailyMetrics(date: Date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Total tickets created today
      const totalTickets = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(
          and(
            sql`${supportTickets.createdAt} >= ${startOfDay}`,
            sql`${supportTickets.createdAt} <= ${endOfDay}`
          )
        );

      // Open tickets
      const openTickets = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.status, 'open'));

      // Resolved tickets today
      const resolvedTickets = await db
        .select({ count: sql<number>`count(*)` })
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.status, 'resolved'),
            sql`${supportTickets.resolvedAt} >= ${startOfDay}`,
            sql`${supportTickets.resolvedAt} <= ${endOfDay}`
          )
        );

      // Average response time (in hours)
      const avgResponseTime = await db
        .select({
          avg: sql<number>`EXTRACT(EPOCH FROM AVG(first_response_at - created_at)) / 3600`,
        })
        .from(supportTickets)
        .where(
          and(
            sql`${supportTickets.firstResponseAt} IS NOT NULL`,
            sql`${supportTickets.createdAt} >= ${startOfDay}`,
            sql`${supportTickets.createdAt} <= ${endOfDay}`
          )
        );

      // Customer satisfaction average
      const satisfaction = await db
        .select({
          avg: sql<number>`AVG(rating)`,
        })
        .from(customerFeedback)
        .where(
          and(
            sql`${customerFeedback.createdAt} >= ${startOfDay}`,
            sql`${customerFeedback.createdAt} <= ${endOfDay}`
          )
        );

      const metrics = {
        totalTickets: totalTickets[0]?.count || 0,
        openTickets: openTickets[0]?.count || 0,
        resolvedTickets: resolvedTickets[0]?.count || 0,
        avgResponseTimeHours: Math.round(avgResponseTime[0]?.avg || 0),
        customerSatisfaction: Math.round((satisfaction[0]?.avg || 0) * 100),
      };

      // Save metrics to database
      await db.insert(customerServiceMetrics).values({
        metricType: 'daily_summary',
        metricPeriod: 'daily',
        metricDate: startOfDay,
        ...metrics,
      });

      return metrics;
    } catch (error) {
      logger.error('Error calculating daily metrics:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      throw new Error('Failed to calculate daily metrics');
    }
  }
}