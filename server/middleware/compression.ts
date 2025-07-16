/**
 * Response Compression Middleware
 *
 * Implements intelligent compression for API responses to reduce network payload
 * and improve response times. Supports Brotli (preferred) and gzip compression
 * with appropriate thresholds and optimal settings for modern browsers.
 *
 * Features:
 * - Brotli compression (better compression ratio, 20-30% smaller than gzip)
 * - Gzip fallback for older browsers
 * - Smart compression thresholds (1KB minimum)
 * - Compression ratio monitoring
 * - HTTP/2 optimized headers
 */

import { promisify } from 'node:util';
import { brotliCompress, gzip } from 'node:zlib';
import type { NextFunction, Request, Response } from 'express';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

// Enhanced compression middleware with Brotli and gzip support
export async function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  const originalSend = res.send;

  // Override res.json to add compression
  res.json = function (this: Response, body: any) {
    const jsonString = JSON.stringify(body);
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');

    // Only compress if the response is large enough (1KB threshold)
    if (sizeInBytes > 1024) {
      const acceptEncoding = req.headers['accept-encoding'] || '';

      // Prefer Brotli if supported (better compression ratio)
      if (acceptEncoding.includes('br')) {
        brotliAsync(Buffer.from(jsonString, 'utf8'), {
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: 6, // Balance between speed and compression
            [require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: sizeInBytes,
          },
        })
          .then(compressed => {
            this.set({
              'Content-Encoding': 'br',
              'Content-Type': 'application/json',
              'Content-Length': compressed.length.toString(),
              'X-Original-Size': sizeInBytes.toString(),
              'X-Compressed-Size': compressed.length.toString(),
              'X-Compression-Ratio': `${((1 - compressed.length / sizeInBytes) * 100).toFixed(2)}%`,
              'X-Compression-Method': 'brotli',
            });
            this.end(compressed);
          })
          .catch(() => {
            // Fallback to uncompressed
            originalJson.call(this, body);
          });
        return this;
      }
      // Fallback to gzip
      else if (acceptEncoding.includes('gzip')) {
        gzipAsync(Buffer.from(jsonString, 'utf8'))
          .then(compressed => {
            this.set({
              'Content-Encoding': 'gzip',
              'Content-Type': 'application/json',
              'Content-Length': compressed.length.toString(),
              'X-Original-Size': sizeInBytes.toString(),
              'X-Compressed-Size': compressed.length.toString(),
              'X-Compression-Ratio': `${((1 - compressed.length / sizeInBytes) * 100).toFixed(2)}%`,
              'X-Compression-Method': 'gzip',
            });
            this.end(compressed);
          })
          .catch(() => {
            // Fallback to uncompressed
            originalJson.call(this, body);
          });
        return this;
      }
    }

    // No compression needed or supported
    return originalJson.call(this, body);
  } as any;

  // Override res.send for other content types
  res.send = function (this: Response, body: any) {
    if (typeof body === 'string' && body.length > 1024) {
      const acceptEncoding = req.headers['accept-encoding'] || '';
      const sizeInBytes = Buffer.byteLength(body, 'utf8');

      if (acceptEncoding.includes('br')) {
        brotliAsync(Buffer.from(body, 'utf8'))
          .then(compressed => {
            this.set({
              'Content-Encoding': 'br',
              'Content-Length': compressed.length.toString(),
              'X-Original-Size': sizeInBytes.toString(),
              'X-Compressed-Size': compressed.length.toString(),
              'X-Compression-Ratio': `${((1 - compressed.length / sizeInBytes) * 100).toFixed(2)}%`,
              'X-Compression-Method': 'brotli',
            });
            this.end(compressed);
          })
          .catch(() => {
            originalSend.call(this, body);
          });
        return this;
      } else if (acceptEncoding.includes('gzip')) {
        gzipAsync(Buffer.from(body, 'utf8'))
          .then(compressed => {
            this.set({
              'Content-Encoding': 'gzip',
              'Content-Length': compressed.length.toString(),
              'X-Original-Size': sizeInBytes.toString(),
              'X-Compressed-Size': compressed.length.toString(),
              'X-Compression-Ratio': `${((1 - compressed.length / sizeInBytes) * 100).toFixed(2)}%`,
              'X-Compression-Method': 'gzip',
            });
            this.end(compressed);
          })
          .catch(() => {
            originalSend.call(this, body);
          });
        return this;
      }
    }

    return originalSend.call(this, body);
  } as any;

  next();
}

// Response monitoring middleware
export function responseMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;

  res.json = function (body: any) {
    const jsonString = JSON.stringify(body);
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');

    // Add size headers for monitoring
    this.set({
      'X-Response-Size': sizeInBytes.toString(),
      'X-Compressed': this.getHeader('content-encoding') ? 'true' : 'false',
    });

    // Log large responses for optimization opportunities
    if (sizeInBytes > 50 * 1024) {
      // 50KB
      console.warn(
        `Large API response detected: ${req.path} - ${(sizeInBytes / 1024).toFixed(2)}KB`
      );
    }

    return originalJson.call(this, body);
  };

  next();
}

// Middleware to set optimal cache headers for compressed content
export function cacheOptimizationMiddleware(_req: Request, res: Response, next: NextFunction) {
  // Set Vary header for proper caching with compression
  const varyHeader = res.getHeader('Vary');
  if (varyHeader) {
    if (!varyHeader.toString().includes('Accept-Encoding')) {
      res.set('Vary', `${varyHeader}, Accept-Encoding`);
    }
  } else {
    res.set('Vary', 'Accept-Encoding');
  }

  // Add compression method info for better cache management
  res.set('X-Compression-Enabled', 'gzip, br');

  // Set optimal cache control for compressed responses
  if (!res.getHeader('Cache-Control')) {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes default for API responses
  }

  next();
}

// Combined middleware stack for optimal performance
export function performanceMiddleware() {
  return [cacheOptimizationMiddleware, compressionMiddleware, responseMonitoringMiddleware];
}

// Utility function to check if compression is beneficial
export function shouldCompress(data: any): boolean {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');

  // Only compress if data is larger than 1KB
  return sizeInBytes > 1024;
}

// Helper to estimate compression savings
export function estimateCompressionSavings(data: any): {
  originalSize: number;
  estimatedCompressedSize: number;
  estimatedSavings: number;
  savingsPercentage: number;
} {
  const jsonString = JSON.stringify(data);
  const originalSize = Buffer.byteLength(jsonString, 'utf8');

  // Rough estimation: JSON typically compresses to 20-40% of original size
  // We'll use 30% as a conservative estimate
  const estimatedCompressedSize = Math.round(originalSize * 0.3);
  const estimatedSavings = originalSize - estimatedCompressedSize;
  const savingsPercentage = (estimatedSavings / originalSize) * 100;

  return {
    originalSize,
    estimatedCompressedSize,
    estimatedSavings,
    savingsPercentage,
  };
}
