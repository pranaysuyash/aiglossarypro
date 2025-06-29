/**
 * Response Compression Middleware
 * 
 * Implements intelligent compression for API responses to reduce network payload
 * and improve response times. Uses gzip compression with appropriate thresholds.
 */

import { gzip } from 'zlib';
import { promisify } from 'util';
import type { Request, Response, NextFunction } from 'express';

const gzipAsync = promisify(gzip);

// Simple compression middleware without external dependencies
export async function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Override res.json to add compression
  res.json = function(body: any) {
    const jsonString = JSON.stringify(body);
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
    
    // Only compress if the response is large enough and client accepts gzip
    if (sizeInBytes > 1024 && req.headers['accept-encoding']?.includes('gzip')) {
      gzipAsync(Buffer.from(jsonString, 'utf8'))
        .then(compressed => {
          this.set({
            'Content-Encoding': 'gzip',
            'Content-Type': 'application/json',
            'Content-Length': compressed.length.toString(),
            'X-Original-Size': sizeInBytes.toString(),
            'X-Compressed-Size': compressed.length.toString(),
            'X-Compression-Ratio': ((1 - compressed.length / sizeInBytes) * 100).toFixed(2) + '%'
          });
          this.end(compressed);
        })
        .catch(() => {
          // Fallback to uncompressed
          originalJson.call(this, body);
        });
    } else {
      return originalJson.call(this, body);
    }
  };
  
  next();
}

// Response monitoring middleware
export function responseMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    const jsonString = JSON.stringify(body);
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
    
    // Add size headers for monitoring
    this.set({
      'X-Response-Size': sizeInBytes.toString(),
      'X-Compressed': this.getHeader('content-encoding') ? 'true' : 'false'
    });
    
    // Log large responses for optimization opportunities
    if (sizeInBytes > 50 * 1024) { // 50KB
      console.warn(`Large API response detected: ${req.path} - ${(sizeInBytes / 1024).toFixed(2)}KB`);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
}

// Middleware to set optimal cache headers for compressed content
export function cacheOptimizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set Vary header for proper caching with compression
  const varyHeader = res.getHeader('Vary');
  if (varyHeader) {
    if (!varyHeader.toString().includes('Accept-Encoding')) {
      res.set('Vary', `${varyHeader}, Accept-Encoding`);
    }
  } else {
    res.set('Vary', 'Accept-Encoding');
  }
  
  next();
}

// Combined middleware stack for optimal performance
export function performanceMiddleware() {
  return [
    cacheOptimizationMiddleware,
    compressionMiddleware,
    responseMonitoringMiddleware
  ];
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
  const savingsPercentage = ((estimatedSavings / originalSize) * 100);
  
  return {
    originalSize,
    estimatedCompressedSize,
    estimatedSavings,
    savingsPercentage
  };
}