import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import * as fs from 'node:fs';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleDatabaseError,
  handleExternalAPIError,
  errorLogger,
  ErrorCategory,
  gracefulShutdown
} from '../errorHandler';

// Mock dependencies
vi.mock('node:fs');
vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let app: express.Application;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    
    mockReq = {
      path: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
      body: {},
      query: {},
      params: {},
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();

    // Mock fs methods
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(fs.appendFileSync).mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle validation errors', async () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';

      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid input provided.',
          errorId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Unauthorized');
      error.name = 'UnauthorizedError';

      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required.',
        })
      );
    });

    it('should handle database errors', async () => {
      const error = new Error('Database constraint violation');
      (error as unknown).code = '23505'; // Unique constraint violation

      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Database operation failed.',
        })
      );
    });

    it('should handle file system errors', async () => {
      const error = new Error('ENOENT: no such file or directory');

      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Requested resource not found.',
        })
      );
    });

    it('should handle timeout errors', async () => {
      const error = new Error('Operation timeout exceeded');

      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(504);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Operation timed out. Please try again.',
        })
      );
    });

    it('should handle generic errors', async () => {
      const error = new Error('Something went wrong');

      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'An unexpected error occurred. Please try again later.',
        })
      );
    });

    it('should include error details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Test stack trace';

      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = vi.mocked(mockRes.json).mock.calls[0][0];
      expect(response.details).toBeDefined();
      expect(response.details.message).toBe('Test error');
      expect(response.details.stack).toBe('Test stack trace');

      process.env.NODE_ENV = originalEnv;
    });

    it('should sanitize sensitive data in request body', async () => {
      mockReq.body = {
        username: 'testuser',
        password: 'secret123',
        token: 'auth-token',
        data: {
          secret: 'hidden',
          normal: 'visible',
        },
      };

      const error = new Error('Test error');
      await errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Check that fs.appendFileSync was called
      expect(fs.appendFileSync).toHaveBeenCalled();
      const logContent = vi.mocked(fs.appendFileSync).mock.calls[0][1] as string;
      const parsedLog = JSON.parse(logContent.trim());

      expect(parsedLog.context.body.password).toBe('[REDACTED]');
      expect(parsedLog.context.body.token).toBe('[REDACTED]');
      expect(parsedLog.context.body.data.secret).toBe('[REDACTED]');
      expect(parsedLog.context.body.data.normal).toBe('visible');
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const asyncRoute = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      app.get('/test', asyncRoute);

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should catch and forward async errors', async () => {
      const asyncRoute = asyncHandler(async () => {
        throw new Error('Async error');
      });

      app.get('/test', asyncRoute);
      app.use(errorHandler);

      const response = await request(app).get('/test');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('handleDatabaseError', () => {
    it('should categorize unique constraint violations as low severity', async () => {
      const error = new Error('Unique constraint violation');
      (error as unknown).code = '23505';

      const errorId = await handleDatabaseError(error, mockReq as Request);

      expect(errorId).toMatch(/^err_/);
      const recentErrors = errorLogger.getRecentErrors(1);
      expect(recentErrors[0].severity).toBe('low');
      expect(recentErrors[0].category).toBe(ErrorCategory.DATABASE);
    });

    it('should categorize connection errors as critical', async () => {
      const error = new Error('Connection refused');
      (error as unknown).code = 'ECONNREFUSED';

      await handleDatabaseError(error, mockReq as Request);

      const recentErrors = errorLogger.getRecentErrors(1);
      expect(recentErrors[0].severity).toBe('critical');
    });

    it('should categorize timeout errors as high severity', async () => {
      const error = new Error('Query timeout exceeded');

      await handleDatabaseError(error, mockReq as Request);

      const recentErrors = errorLogger.getRecentErrors(1);
      expect(recentErrors[0].severity).toBe('high');
    });
  });

  describe('handleExternalAPIError', () => {
    it('should handle 5xx errors as high severity', async () => {
      const error = new Error('Service unavailable');
      (error as unknown).status = 503;

      await handleExternalAPIError(error, mockReq as Request, 'OpenAI');

      const recentErrors = errorLogger.getRecentErrors(1);
      expect(recentErrors[0].severity).toBe('high');
      expect(recentErrors[0].message).toContain('OpenAI');
    });

    it('should handle rate limit errors as medium severity', async () => {
      const error = new Error('Rate limit exceeded');
      (error as unknown).status = 429;

      await handleExternalAPIError(error, mockReq as Request, 'GPT-4');

      const recentErrors = errorLogger.getRecentErrors(1);
      expect(recentErrors[0].severity).toBe('medium');
    });

    it('should handle 4xx errors as low severity', async () => {
      const error = new Error('Bad request');
      (error as unknown).status = 400;

      await handleExternalAPIError(error, mockReq as Request, 'API');

      const recentErrors = errorLogger.getRecentErrors(1);
      expect(recentErrors[0].severity).toBe('low');
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route details', () => {
      mockReq.path = '/api/nonexistent';
      mockReq.method = 'POST';

      notFoundHandler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Route not found',
        path: '/api/nonexistent',
        method: 'POST',
        timestamp: expect.any(String),
      });
    });
  });

  describe('errorLogger', () => {
    it('should maintain error history', async () => {
      // Clear previous errors
      errorLogger.getRecentErrors(1000).forEach(() => {});

      // Log multiple errors
      for (let i = 0; i < 5; i++) {
        const error = new Error(`Test error ${i}`);
        await errorLogger.logError(error, mockReq as Request, ErrorCategory.UNKNOWN, 'low');
      }

      const recentErrors = errorLogger.getRecentErrors(3);
      expect(recentErrors).toHaveLength(3);
      expect(recentErrors[0].message).toBe('Test error 4');
      expect(recentErrors[2].message).toBe('Test error 2');
    });

    it('should filter errors by category', async () => {
      const dbError = new Error('Database error');
      const apiError = new Error('API error');

      await errorLogger.logError(dbError, mockReq as Request, ErrorCategory.DATABASE, 'medium');
      await errorLogger.logError(apiError, mockReq as Request, ErrorCategory.EXTERNAL_API, 'low');

      const dbErrors = errorLogger.getErrorsByCategory(ErrorCategory.DATABASE, 10);
      const apiErrors = errorLogger.getErrorsByCategory(ErrorCategory.EXTERNAL_API, 10);

      expect(dbErrors.some(e => e.message === 'Database error')).toBe(true);
      expect(apiErrors.some(e => e.message === 'API error')).toBe(true);
    });

    it('should generate error statistics', async () => {
      // Clear and add specific errors
      await errorLogger.logError(new Error('E1'), mockReq as Request, ErrorCategory.DATABASE, 'high');
      await errorLogger.logError(new Error('E2'), mockReq as Request, ErrorCategory.DATABASE, 'high');
      await errorLogger.logError(new Error('E3'), mockReq as Request, ErrorCategory.API_ERROR, 'low');

      const stats = errorLogger.getErrorStats();
      expect(stats['DATABASE_high']).toBeGreaterThanOrEqual(2);
      expect(stats['API_ERROR_low']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('gracefulShutdown', () => {
    it('should handle shutdown signals', async () => {
      const mockServer = {
        close: vi.fn((cb) => cb()),
      };

      const mockJobQueueManager = {
        shutdown: vi.fn().mockResolvedValue(undefined),
      };

      vi.doMock('../jobs/queue', () => ({
        jobQueueManager: mockJobQueueManager,
      }));

      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit');
      });

      gracefulShutdown(mockServer);

      // Simulate SIGTERM
      process.emit('SIGTERM');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockServer.close).toHaveBeenCalled();
      expect(mockJobQueueManager.shutdown).toHaveBeenCalled();

      processExitSpy.mockRestore();
    });

    it('should handle uncaught exceptions', async () => {
      const mockServer = {
        close: vi.fn(),
      };

      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit');
      });

      gracefulShutdown(mockServer);

      const uncaughtError = new Error('Uncaught test error');
      
      try {
        process.emit('uncaughtException', uncaughtError);
      } catch (e) {
        // Expected due to mocked process.exit
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const recentErrors = errorLogger.getRecentErrors(1);
      expect(recentErrors[0].severity).toBe('critical');
      expect(recentErrors[0].message).toContain('Uncaught test error');

      processExitSpy.mockRestore();
    });
  });
});