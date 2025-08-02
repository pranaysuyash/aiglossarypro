import type { NextFunction, Request, Response } from 'express';
import { analyticsService } from '../../services/analyticsService';
import { performanceTrackingMiddleware } from '../analyticsMiddleware';

// Mock the analytics service
jest.mock('../../services/analyticsService', () => ({
  analyticsService: {
    trackPerformance: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Analytics Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnd: Function;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request
    mockReq = {
      method: 'GET',
      path: '/api/test',
      route: { path: '/api/test' },
      ip: '127.0.0.1',
      headers: {},
      startTime: Date.now(),
    };

    // Create mock response with proper end function
    originalEnd = jest.fn((_chunk?: any, _encoding?: BufferEncoding, callback?: () => void) => {
      if (callback) {callback();}
      return mockRes as Response;
    });

    mockRes = {
      statusCode: 200,
      end: originalEnd,
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('performanceTrackingMiddleware', () => {
    it('should add startTime to request', () => {
      const middleware = performanceTrackingMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.startTime).toBeDefined();
      expect(typeof mockReq.startTime).toBe('number');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract user IP correctly', () => {
      const middleware = performanceTrackingMiddleware();

      // Test with x-forwarded-for header
      mockReq.headers = { 'x-forwarded-for': '192.168.1.1' };

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.userIp).toBe('192.168.1.1');
    });

    it('should override res.end with tracking functionality', () => {
      const middleware = performanceTrackingMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Verify res.end was overridden
      expect(mockRes.end).not.toBe(originalEnd);
      expect(typeof mockRes.end).toBe('function');
    });

    describe('res.end override', () => {
      it('should handle calls with no parameters', async () => {
        const middleware = performanceTrackingMiddleware();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        // Call the overridden end function with no parameters
        const _result = (mockRes.end as unknown).call(mockRes);

        // Wait for async tracking
        await new Promise(resolve => setImmediate(resolve));

        expect(originalEnd).toHaveBeenCalledWith(undefined, undefined, undefined);
        expect(analyticsService.trackPerformance).toHaveBeenCalled();
      });

      it('should handle calls with chunk parameter only', async () => {
        const middleware = performanceTrackingMiddleware();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        const chunk = 'test data';
        const _result = (mockRes.end as unknown).call(mockRes, chunk);

        await new Promise(resolve => setImmediate(resolve));

        expect(originalEnd).toHaveBeenCalledWith(chunk, undefined, undefined);
        expect(analyticsService.trackPerformance).toHaveBeenCalled();
      });

      it('should handle calls with chunk and encoding parameters', async () => {
        const middleware = performanceTrackingMiddleware();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        const chunk = Buffer.from('test data');
        const encoding: BufferEncoding = 'utf8';
        const _result = (mockRes.end as unknown).call(mockRes, chunk, encoding);

        await new Promise(resolve => setImmediate(resolve));

        expect(originalEnd).toHaveBeenCalledWith(chunk, encoding, undefined);
        expect(analyticsService.trackPerformance).toHaveBeenCalled();
      });

      it('should handle calls with all parameters including callback', async () => {
        const middleware = performanceTrackingMiddleware();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        const chunk = 'test data';
        const encoding: BufferEncoding = 'utf8';
        const callback = vi.fn();

        const _result = (mockRes.end as unknown).call(mockRes, chunk, encoding, callback);

        await new Promise(resolve => setImmediate(resolve));

        expect(originalEnd).toHaveBeenCalledWith(chunk, encoding, callback);
        expect(analyticsService.trackPerformance).toHaveBeenCalled();
      });

      it('should track performance with correct parameters', async () => {
        const middleware = performanceTrackingMiddleware();
        mockReq.startTime = Date.now() - 100; // 100ms ago
        mockRes.statusCode = 201;

        middleware(mockReq as Request, mockRes as Response, mockNext);

        // Call end to trigger tracking
        (mockRes.end as unknown).call(mockRes, 'response data');

        await new Promise(resolve => setImmediate(resolve));

        expect(analyticsService.trackPerformance).toHaveBeenCalledWith(
          '/api/test',
          'GET',
          expect.any(Number), // responseTime
          201,
          expect.any(Number), // memoryUsageMb
          expect.any(Number) // cpuPercent
        );

        // Verify response time is calculated correctly
        const trackCall = (analyticsService.trackPerformance as unknown).mock.calls[0];
        const responseTime = trackCall[2];
        expect(responseTime).toBeGreaterThanOrEqual(100);
        expect(responseTime).toBeLessThan(200); // Should be close to 100ms
      });

      it('should handle errors in analytics tracking gracefully', async () => {
        const middleware = performanceTrackingMiddleware();
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

        // Make trackPerformance throw an error
        (analyticsService.trackPerformance as unknown).mockRejectedValueOnce(
          new Error('Tracking failed')
        );

        middleware(mockReq as Request, mockRes as Response, mockNext);

        // Call end
        (mockRes.end as unknown).call(mockRes);

        await new Promise(resolve => setImmediate(resolve));

        // Should still call original end despite tracking error
        expect(originalEnd).toHaveBeenCalled();

        // Error should be caught (no unhandled rejection)
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });

      it('should preserve the original context (this) when calling end', async () => {
        const middleware = performanceTrackingMiddleware();
        middleware(mockReq as Request, mockRes as Response, mockNext);

        let capturedThis: any;
        originalEnd = vi.fn(function (this: any) {
          capturedThis = this;
          return this;
        });
        mockRes.end = originalEnd;

        // Re-apply middleware to override the new mock
        middleware(mockReq as Request, mockRes as Response, vi.fn());

        const _result = (mockRes.end as unknown).call(mockRes);

        expect(capturedThis).toBe(mockRes);
      });
    });
  });
});
