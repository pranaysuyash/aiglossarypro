import { and, desc, eq, gte, like, or, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  type NewSupportActivity,
  type NewSupportMessage,
  type NewSupportTicket,
  type SupportTicket,
  supportActivities,
  supportAttachments,
  supportCannedResponses,
  supportMessages,
  supportTickets,
} from '../db/support-schema';
import { productionEmailService } from './productionEmailService';
import { log } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export class SupportService {
  constructor() {}

  /**
   * Load email template from file
   */
  private async loadEmailTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(__dirname, '..', 'email-templates', 'support', `${templateName}.html`);
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      log.error('Error loading email template', { templateName, error });
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  /**
   * Replace template variables
   */
  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Generate a unique ticket number
   */
  private generateTicketNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TICK-${year}${month}${day}-${random}`;
  }

  /**
   * Create a new support ticket
   */
  async createTicket(data: {
    userId: string;
    userEmail: string;
    userName?: string;
    subject: string;
    description: string;
    category: NewSupportTicket['category'];
    priority?: NewSupportTicket['priority'];
    attachments?: Array<{
      fileName: string;
      fileType: string;
      fileSize: number;
      fileUrl: string;
    }>;
  }): Promise<SupportTicket> {
    try {
      // Generate unique ticket number
      const ticketNumber = this.generateTicketNumber();

      // Create the ticket
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          ticketNumber,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          subject: data.subject,
          description: data.description,
          category: data.category,
          priority: data.priority || 'medium',
          status: 'open',
          metadata: JSON.stringify({
            source: 'web',
            userAgent: 'unknown',
          }),
        })
        .returning();

      // Create initial message
      await this.addMessage({
        ticketId: ticket.id,
        userId: data.userId,
        userType: 'customer',
        message: data.description,
      });

      // Handle attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        for (const attachment of data.attachments) {
          await db.insert(supportAttachments).values({
            ticketId: ticket.id,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            fileUrl: attachment.fileUrl,
            uploadedBy: data.userId,
          });
        }
      }

      // Log activity
      await this.logActivity({
        ticketId: ticket.id,
        userId: data.userId,
        activityType: 'ticket_created',
        description: `Ticket created: ${ticket.subject}`,
      });

      // Send notification to support team (admin)
      try {
        const adminTemplate = await this.loadEmailTemplate('new-ticket-admin');
        const adminHtml = this.replaceTemplateVariables(adminTemplate, {
          ticketNumber,
          subject: data.subject,
          category: data.category,
          priority: data.priority || 'medium',
          userEmail: data.userEmail,
          userName: data.userName || 'Customer',
          description: data.description,
          appUrl: process.env.CLIENT_URL || 'https://aiglossary.pro',
        });

        await productionEmailService.sendEmail({
          to: process.env.SUPPORT_EMAIL || 'support@aiglossarypro.com',
          subject: `New Support Ticket: ${ticketNumber}`,
          html: adminHtml,
        });
      } catch (error) {
        log.error('Failed to send admin notification', { error });
      }

      // Send confirmation to user
      try {
        const userTemplate = await this.loadEmailTemplate('ticket-confirmation');
        const userHtml = this.replaceTemplateVariables(userTemplate, {
          ticketNumber,
          subject: data.subject,
          userName: data.userName || 'Customer',
          appUrl: process.env.CLIENT_URL || 'https://aiglossary.pro',
        });

        await productionEmailService.sendEmail({
          to: data.userEmail,
          subject: `Support Ticket Created: ${ticketNumber}`,
          html: userHtml,
        });
      } catch (error) {
        log.error('Failed to send user confirmation', { error });
      }

      log.info('Support ticket created', { ticketId: ticket.id, ticketNumber });
      return ticket;
    } catch (error) {
      log.error('Error creating support ticket', { error });
      throw error;
    }
  }

  /**
   * Get ticket by ID or ticket number
   */
  async getTicket(identifier: string, userId?: string): Promise<SupportTicket | null> {
    try {
      const conditions = [
        eq(supportTickets.id, identifier),
        eq(supportTickets.ticketNumber, identifier),
      ];

      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(
          userId
            ? and(or(...conditions), eq(supportTickets.userId, userId))
            : or(...conditions)
        )
        .limit(1);

      return ticket || null;
    } catch (error) {
      log.error('Error fetching ticket', { error, identifier });
      throw error;
    }
  }

  /**
   * Get all tickets for a user
   */
  async getUserTickets(
    userId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const conditions = [eq(supportTickets.userId, userId)];
      if (options.status) {
        conditions.push(eq(supportTickets.status, options.status));
      }

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(and(...conditions))
        .orderBy(desc(supportTickets.createdAt))
        .limit(options.limit || 20)
        .offset(options.offset || 0);

      return tickets;
    } catch (error) {
      log.error('Error fetching user tickets', { error, userId });
      throw error;
    }
  }

  /**
   * Get all tickets (admin)
   */
  async getAllTickets(options: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const conditions = [];

      if (options.status) {
        conditions.push(eq(supportTickets.status, options.status));
      }
      if (options.priority) {
        conditions.push(eq(supportTickets.priority, options.priority));
      }
      if (options.category) {
        conditions.push(eq(supportTickets.category, options.category));
      }
      if (options.assignedTo) {
        conditions.push(eq(supportTickets.assignedTo, options.assignedTo));
      }
      if (options.search) {
        conditions.push(
          or(
            like(supportTickets.subject, `%${options.search}%`),
            like(supportTickets.ticketNumber, `%${options.search}%`),
            like(supportTickets.userEmail, `%${options.search}%`)
          )
        );
      }

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(supportTickets.createdAt))
        .limit(options.limit || 50)
        .offset(options.offset || 0);

      return tickets;
    } catch (error) {
      log.error('Error fetching all tickets', { error });
      throw error;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status'],
    userId: string
  ) {
    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId))
        .limit(1) as SupportTicket[];

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const oldStatus = ticket.status;
      const updates: Partial<SupportTicket> = { status };

      // Set timestamps based on status
      if (status === 'resolved') {
        updates.resolvedAt = new Date().toISOString();
      } else if (status === 'closed') {
        updates.closedAt = new Date().toISOString();
      }

      // Update ticket
      await db
        .update(supportTickets)
        .set(updates)
        .where(eq(supportTickets.id, ticketId));

      // Log activity
      await this.logActivity({
        ticketId,
        userId,
        activityType: 'status_change',
        description: `Status changed from ${oldStatus} to ${status}`,
        oldValue: oldStatus,
        newValue: status,
      });

      // Send notifications
      if (status === 'resolved' || status === 'closed') {
        try {
          const statusTemplate = await this.loadEmailTemplate('ticket-status-change');
          const statusHtml = this.replaceTemplateVariables(statusTemplate, {
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            userName: ticket.userName || 'Customer',
            status,
            appUrl: process.env.CLIENT_URL || 'https://aiglossary.pro',
          });

          await productionEmailService.sendEmail({
            to: ticket.userEmail,
            subject: `Support Ticket ${status === 'resolved' ? 'Resolved' : 'Closed'}: ${ticket.ticketNumber}`,
            html: statusHtml,
          });
        } catch (error) {
          log.error('Failed to send status change notification', { error });
        }
      }

      log.info('Ticket status updated', { ticketId, oldStatus, newStatus: status });
    } catch (error) {
      log.error('Error updating ticket status', { error, ticketId });
      throw error;
    }
  }

  /**
   * Assign ticket to support agent
   */
  async assignTicket(ticketId: string, assignToUserId: string, assignedByUserId: string) {
    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId))
        .limit(1) as SupportTicket[];

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const oldAssignee = ticket.assignedTo;

      // Update ticket
      await db
        .update(supportTickets)
        .set({
          assignedTo: assignToUserId,
          status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        })
        .where(eq(supportTickets.id, ticketId));

      // Log activity
      await this.logActivity({
        ticketId,
        userId: assignedByUserId,
        activityType: 'assignment',
        description: `Ticket assigned to user ${assignToUserId}`,
        oldValue: oldAssignee || 'unassigned',
        newValue: assignToUserId,
      });

      log.info('Ticket assigned', { ticketId, assignedTo: assignToUserId });
    } catch (error) {
      log.error('Error assigning ticket', { error, ticketId });
      throw error;
    }
  }

  /**
   * Add message to ticket
   */
  async addMessage(data: {
    ticketId: string;
    userId: string;
    userType: NewSupportMessage['userType'];
    message: string;
    isInternalNote?: boolean;
    attachments?: string[];
  }) {
    try {
      const [message] = await db
        .insert(supportMessages)
        .values({
          ticketId: data.ticketId,
          userId: data.userId,
          userType: data.userType,
          message: data.message,
          isInternalNote: data.isInternalNote || false,
          attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        })
        .returning();

      // Update first response time if this is the first support response
      if (data.userType === 'support' || data.userType === 'admin') {
        const [ticket] = await db
          .select()
          .from(supportTickets)
          .where(eq(supportTickets.id, data.ticketId))
          .limit(1) as SupportTicket[];

        if (ticket && !ticket.firstResponseAt) {
          await db
            .update(supportTickets)
            .set({ firstResponseAt: new Date().toISOString() })
            .where(eq(supportTickets.id, data.ticketId));
        }

        // Send notification to customer if not internal note
        if (!data.isInternalNote && ticket) {
          try {
            const replyTemplate = await this.loadEmailTemplate('ticket-reply');
            const replyHtml = this.replaceTemplateVariables(replyTemplate, {
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              userName: ticket.userName || 'Customer',
              message: data.message,
              appUrl: process.env.CLIENT_URL || 'https://aiglossary.pro',
            });

            await productionEmailService.sendEmail({
              to: ticket.userEmail,
              subject: `New Reply to Your Support Ticket: ${ticket.ticketNumber}`,
              html: replyHtml,
            });
          } catch (error) {
            log.error('Failed to send reply notification', { error });
          }
        }
      }

      log.info('Message added to ticket', { ticketId: data.ticketId, messageId: message.id });
      return message;
    } catch (error) {
      log.error('Error adding message to ticket', { error });
      throw error;
    }
  }

  /**
   * Get ticket messages
   */
  async getTicketMessages(ticketId: string, includeInternal = false) {
    try {
      const conditions = [eq(supportMessages.ticketId, ticketId)];
      if (!includeInternal) {
        conditions.push(eq(supportMessages.isInternalNote, false));
      }

      const messages = await db
        .select()
        .from(supportMessages)
        .where(and(...conditions))
        .orderBy(supportMessages.createdAt);

      return messages;
    } catch (error) {
      log.error('Error fetching ticket messages', { error, ticketId });
      throw error;
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(options: { userId?: string; dateFrom?: Date } = {}) {
    try {
      const conditions = [];
      if (options.userId) {
        conditions.push(eq(supportTickets.userId, options.userId));
      }
      if (options.dateFrom) {
        conditions.push(gte(supportTickets.createdAt, options.dateFrom.toISOString()));
      }

      const stats = await db
        .select({
          totalTickets: sql<number>`count(*)`,
          openTickets: sql<number>`sum(case when status = 'open' then 1 else 0 end)`,
          inProgressTickets: sql<number>`sum(case when status = 'in_progress' then 1 else 0 end)`,
          resolvedTickets: sql<number>`sum(case when status = 'resolved' then 1 else 0 end)`,
          closedTickets: sql<number>`sum(case when status = 'closed' then 1 else 0 end)`,
          avgResponseTime: sql<number>`avg(julianday(first_response_at) - julianday(created_at)) * 24 * 60`,
          avgResolutionTime: sql<number>`avg(julianday(resolved_at) - julianday(created_at)) * 24 * 60`,
          avgSatisfactionRating: sql<number>`avg(satisfaction_rating)`,
        })
        .from(supportTickets)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return stats[0];
    } catch (error) {
      log.error('Error fetching ticket statistics', { error });
      throw error;
    }
  }

  /**
   * Log ticket activity
   */
  private async logActivity(data: NewSupportActivity) {
    try {
      await db.insert(supportActivities).values(data);
    } catch (error) {
      log.error('Error logging activity', { error });
      // Don't throw - activity logging shouldn't break main operations
    }
  }

  /**
   * Get canned responses
   */
  async getCannedResponses(category?: string) {
    try {
      const conditions = category ? [eq(supportCannedResponses.category, category)] : [];
      
      const responses = await db
        .select()
        .from(supportCannedResponses)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(supportCannedResponses.usageCount));

      return responses;
    } catch (error) {
      log.error('Error fetching canned responses', { error });
      throw error;
    }
  }

  /**
   * Create canned response
   */
  async createCannedResponse(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    createdBy: string;
  }) {
    try {
      const [response] = await db
        .insert(supportCannedResponses)
        .values({
          title: data.title,
          content: data.content,
          category: data.category,
          tags: data.tags ? JSON.stringify(data.tags) : null,
          createdBy: data.createdBy,
        })
        .returning();

      log.info('Canned response created', { responseId: response.id });
      return response;
    } catch (error) {
      log.error('Error creating canned response', { error });
      throw error;
    }
  }

  /**
   * Submit satisfaction rating
   */
  async submitSatisfactionRating(
    ticketId: string,
    rating: number,
    comment?: string
  ) {
    try {
      await db
        .update(supportTickets)
        .set({
          satisfactionRating: rating,
          satisfactionComment: comment,
        })
        .where(eq(supportTickets.id, ticketId));

      log.info('Satisfaction rating submitted', { ticketId, rating });
    } catch (error) {
      log.error('Error submitting satisfaction rating', { error, ticketId });
      throw error;
    }
  }



}

// Export singleton instance
export const supportService = new SupportService();