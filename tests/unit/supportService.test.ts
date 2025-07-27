import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supportService } from '../../server/services/supportService';
import * as db from '../../server/db';
import * as logger from '../../server/utils/logger';
import { notificationService } from '../../server/services/notificationService';

// Mock dependencies
vi.mock('../../server/db');
vi.mock('../../server/services/notificationService');
vi.mock('../../server/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}));

describe('SupportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock database
    (db as any).db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('createTicket', () => {
    it('should create a support ticket successfully', async () => {
      const mockTicket = {
        id: 'ticket-123',
        userId: 'user-123',
        subject: 'Cannot access premium content',
        description: 'I purchased lifetime access but cannot view premium terms',
        category: 'access',
        priority: 'high',
        status: 'open',
        createdAt: new Date()
      };

      (db as any).db.returning.mockResolvedValue([mockTicket]);

      const result = await supportService.createTicket({
        userId: 'user-123',
        subject: 'Cannot access premium content',
        description: 'I purchased lifetime access but cannot view premium terms',
        category: 'access',
        priority: 'high'
      });

      expect(result.success).toBe(true);
      expect(result.ticket).toBeDefined();
      expect(result.ticket.id).toBe('ticket-123');
      expect(result.ticket.status).toBe('open');
      
      // Should send notification for high priority
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'support',
          priority: 'high',
          subject: expect.stringContaining('Support Ticket')
        })
      );
    });

    it('should auto-assign tickets based on category', async () => {
      const mockTicket = {
        id: 'ticket-124',
        category: 'technical',
        assignedTo: 'tech-support-team',
        status: 'assigned'
      };

      (db as any).db.returning.mockResolvedValue([mockTicket]);

      const result = await supportService.createTicket({
        userId: 'user-123',
        subject: 'API integration issue',
        description: 'Getting 401 errors',
        category: 'technical'
      });

      expect(result.ticket.assignedTo).toBe('tech-support-team');
      expect(result.ticket.status).toBe('assigned');
    });

    it('should validate ticket data', async () => {
      await expect(
        supportService.createTicket({
          userId: '',
          subject: '',
          description: 'Test',
          category: 'general'
        })
      ).rejects.toThrow('Invalid ticket data');
    });
  });

  describe('updateTicket', () => {
    it('should update ticket status', async () => {
      const mockUpdatedTicket = {
        id: 'ticket-123',
        status: 'in_progress',
        updatedAt: new Date()
      };

      (db as any).db.returning.mockResolvedValue([mockUpdatedTicket]);

      const result = await supportService.updateTicket('ticket-123', {
        status: 'in_progress',
        assignedTo: 'support-agent-1'
      });

      expect(result.success).toBe(true);
      expect(result.ticket.status).toBe('in_progress');
    });

    it('should add internal notes to tickets', async () => {
      const note = {
        ticketId: 'ticket-123',
        note: 'Verified user purchase, escalating to dev team',
        addedBy: 'support-agent-1',
        isInternal: true
      };

      (db as any).db.returning.mockResolvedValue([note]);

      const result = await supportService.addTicketNote('ticket-123', {
        note: note.note,
        addedBy: note.addedBy,
        isInternal: true
      });

      expect(result.success).toBe(true);
      expect(db.db.insert).toHaveBeenCalled();
    });
  });

  describe('respondToTicket', () => {
    it('should send response to user', async () => {
      const response = {
        ticketId: 'ticket-123',
        message: 'We have resolved your access issue. Please try logging in again.',
        respondedBy: 'support-agent-1'
      };

      (db as any).db.returning.mockResolvedValue([response]);
      (db as any).db.execute.mockResolvedValue([{
        userId: 'user-123',
        email: 'user@example.com'
      }]);

      const result = await supportService.respondToTicket('ticket-123', {
        message: response.message,
        respondedBy: response.respondedBy
      });

      expect(result.success).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'email',
          to: 'user@example.com',
          subject: expect.stringContaining('Support Ticket Update')
        })
      );
    });

    it('should update ticket status after resolution', async () => {
      const response = {
        ticketId: 'ticket-123',
        message: 'Issue resolved',
        respondedBy: 'support-agent-1',
        markAsResolved: true
      };

      (db as any).db.returning.mockResolvedValue([response]);

      await supportService.respondToTicket('ticket-123', {
        message: response.message,
        respondedBy: response.respondedBy,
        markAsResolved: true
      });

      expect(db.db.update).toHaveBeenCalled();
      expect(db.db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved'
        })
      );
    });
  });

  describe('getTickets', () => {
    it('should retrieve tickets with filters', async () => {
      const mockTickets = [
        { id: '1', status: 'open', priority: 'high' },
        { id: '2', status: 'open', priority: 'medium' }
      ];

      (db as any).db.execute.mockResolvedValue(mockTickets);

      const result = await supportService.getTickets({
        status: 'open',
        priority: ['high', 'medium'],
        limit: 10,
        offset: 0
      });

      expect(result.tickets).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should get user tickets', async () => {
      const mockUserTickets = [
        { id: '1', userId: 'user-123', status: 'open' },
        { id: '2', userId: 'user-123', status: 'resolved' }
      ];

      (db as any).db.execute.mockResolvedValue(mockUserTickets);

      const result = await supportService.getUserTickets('user-123');

      expect(result.tickets).toHaveLength(2);
      expect(result.tickets.every(t => t.userId === 'user-123')).toBe(true);
    });
  });

  describe('getTicketMetrics', () => {
    it('should calculate support metrics', async () => {
      const mockMetrics = {
        totalTickets: 100,
        openTickets: 20,
        avgResponseTime: 3600, // 1 hour in seconds
        avgResolutionTime: 86400, // 1 day in seconds
        satisfactionRate: 0.85
      };

      (db as any).db.execute.mockResolvedValue([mockMetrics]);

      const metrics = await supportService.getTicketMetrics({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(metrics.totalTickets).toBe(100);
      expect(metrics.openTickets).toBe(20);
      expect(metrics.avgResponseTime).toBe('1 hour');
      expect(metrics.avgResolutionTime).toBe('1 day');
      expect(metrics.satisfactionRate).toBe(85);
    });

    it('should track ticket trends', async () => {
      const mockTrends = [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 8 },
        { date: '2024-01-03', count: 3 }
      ];

      (db as any).db.execute.mockResolvedValue(mockTrends);

      const trends = await supportService.getTicketTrends({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
        groupBy: 'day'
      });

      expect(trends).toHaveLength(3);
      expect(trends[1].count).toBe(8);
    });
  });

  describe('escalateTicket', () => {
    it('should escalate high-priority unresolved tickets', async () => {
      const mockTicket = {
        id: 'ticket-123',
        priority: 'high',
        status: 'open',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days old
      };

      (db as any).db.execute.mockResolvedValue([mockTicket]);
      (db as any).db.returning.mockResolvedValue([{
        ...mockTicket,
        status: 'escalated',
        escalatedAt: new Date()
      }]);

      const result = await supportService.escalateTicket('ticket-123', {
        reason: 'No response for 48 hours',
        escalateTo: 'senior-support'
      });

      expect(result.success).toBe(true);
      expect(result.ticket.status).toBe('escalated');
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'critical'
        })
      );
    });
  });

  describe('automated responses', () => {
    it('should suggest automated responses for common issues', async () => {
      const ticket = {
        subject: 'Cannot login',
        description: 'I forgot my password and cannot access my account',
        category: 'access'
      };

      const suggestions = await supportService.getAutomatedResponseSuggestions(ticket);

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('template');
      expect(suggestions[0]).toHaveProperty('confidence');
      expect(suggestions[0].template).toContain('password reset');
    });
  });
});