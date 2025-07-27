import type { NextFunction, Request, Response } from 'express';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { log } from '../../utils/logger';
import { rateLimitLoggingMiddleware } from '../loggingMiddleware';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  log: {
    security: {
      rateLimitExceeded: vi.fn(),
    },
  },
}));

describe('Logging Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnd: Function;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock request
    mockReq = {
      path: '/api/test',
      userId: 'test-user-123',
    };

    // Create mock response with proper end function
    originalEnd = vi.fn((_chunk?: any, _encoding?: BufferEncoding, callback?: () => void) => {
      if (callback) {callback();}
      return mockRes as Response;
    });

    mockRes = {
      statusCode: 200,
      end: originalEnd,
      get: vi.fn(),
      setHeader: vi.fn(),
    };

    mockNext = vi.fn();
  });

  describe('rateLimitLoggingMiddleware', () => {
    it('should override res.end function', () => {
      rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.end).not.toBe(originalEnd);
      expect(typeof mockRes.end).toBe('function');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not log when status code is not 429', () => {
      mockRes.statusCode = 200;

      rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Call the overridden end function
      (mockRes.end as unknown).call(mockRes);

      expect(log.security.rateLimitExceeded).not.toHaveBeenCalled();
      expect(originalEnd).toHaveBeenCalledWith(undefined, undefined, undefined);
    });

    it('should log rate limit exceeded when status code is 429', () => {
      mockRes.statusCode = 429;
      (mockRes.get as vi.Mock).mockReturnValue('100');

      rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Call the overridden end function
      (mockRes.end as unknown).call(mockRes);

      expect(log.security.rateLimitExceeded).toHaveBeenCalledWith(
        'test-user-123',
        '/api/test',
        100
      );
      expect(originalEnd).toHaveBeenCalled();
    });

    it('should handle anonymous users when userId is not set', () => {
      mockReq.userId = undefined;
      mockRes.statusCode = 429;
      (mockRes.get as vi.Mock).mockReturnValue('50');

      rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      (mockRes.end as unknown).call(mockRes);

      expect(log.security.rateLimitExceeded).toHaveBeenCalledWith('anonymous', '/api/test', 50);
    });

    describe('res.end override parameter handling', () => {
      beforeEach(() => {
        // Setup for 429 status to ensure logging
        mockRes.statusCode = 429;
        (mockRes.get as vi.Mock).mockReturnValue('100');
        rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);
      });

      it('should handle calls with no parameters', () => {
        const _result = (mockRes.end as unknown).call(mockRes);

        expect(originalEnd).toHaveBeenCalledWith(undefined, undefined, undefined);
        expect(log.security.rateLimitExceeded).toHaveBeenCalled();
      });

      it('should handle calls with chunk parameter only', () => {
        const chunk = 'test response';
        const _result = (mockRes.end as unknown).call(mockRes, chunk);

        expect(originalEnd).toHaveBeenCalledWith(chunk, undefined, undefined);
        expect(log.security.rateLimitExceeded).toHaveBeenCalled();
      });

      it('should handle calls with chunk and encoding parameters', () => {
        const chunk = Buffer.from('test response');
        const encoding: BufferEncoding = 'utf8';
        const _result = (mockRes.end as unknown).call(mockRes, chunk, encoding);

        expect(originalEnd).toHaveBeenCalledWith(chunk, encoding, undefined);
        expect(log.security.rateLimitExceeded).toHaveBeenCalled();
      });

      it('should handle calls with all parameters including callback', () => {
        const chunk = 'test response';
        const encoding: BufferEncoding = 'utf8';
        const callback = vi.fn();

        const _result = (mockRes.end as unknown).call(mockRes, chunk, encoding, callback);

        expect(originalEnd).toHaveBeenCalledWith(chunk, encoding, callback);
        expect(log.security.rateLimitExceeded).toHaveBeenCalled();
      });

      it('should handle undefined encoding properly', () => {
        const chunk = 'test response';
        const encoding = undefined;
        const callback = vi.fn();

        const _result = (mockRes.end as unknown).call(mockRes, chunk, encoding, callback);

        expect(originalEnd).toHaveBeenCalledWith(chunk, undefined, callback);
      });

      it('should preserve the original context (this)', () => {
        let capturedThis: any;
        originalEnd = vi.fn(function (this: any) {
          capturedThis = this;
          return this;
        });
        mockRes.end = originalEnd;

        // Re-apply middleware
        rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, vi.fn());

        (mockRes.end as unknown).call(mockRes);

        expect(capturedThis).toBe(mockRes);
      });
    });

    it('should handle missing rate limit header gracefully', () => {
      mockRes.statusCode = 429;
      (mockRes.get as vi.Mock).mockReturnValue(undefined);

      rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      (mockRes.end as unknown).call(mockRes);

      expect(log.security.rateLimitExceeded).toHaveBeenCalledWith(
        'test-user-123',
        '/api/test',
        0 // Default when header is missing
      );
    });

    it('should handle non-numeric rate limit header', () => {
      mockRes.statusCode = 429;
      (mockRes.get as vi.Mock).mockReturnValue('invalid');

      rateLimitLoggingMiddleware(mockReq as Request, mockRes as Response, mockNext);

      (mockRes.end as unknown).call(mockRes);

      expect(log.security.rateLimitExceeded).toHaveBeenCalledWith(
        'test-user-123',
        '/api/test',
        0 // parseInt('invalid') || 0
      );
    });
  });
});
