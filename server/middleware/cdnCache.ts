import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';

interface CacheConfig {
  maxAge: number;
  sMaxAge?: number;
  immutable?: boolean;
  noCache?: boolean;
  mustRevalidate?: boolean;
  public?: boolean;
  private?: boolean;
  staleWhileRevalidate?: number;
  staleIfError?: number;
}

interface CDNCacheOptions {
  staticAssets: CacheConfig;
  htmlFiles: CacheConfig;
  apiResponses: CacheConfig;
  images: CacheConfig;
  fonts: CacheConfig;
  css: CacheConfig;
  javascript: CacheConfig;
  json: CacheConfig;
  defaultConfig: CacheConfig;
}

// Cache configurations for different asset types
const CACHE_CONFIGS: CDNCacheOptions = {
  // Static assets with versioned names (immutable)
  staticAssets: {
    maxAge: 31536000, // 1 year
    sMaxAge: 86400, // 1 day at edge
    immutable: true,
    public: true,
    staleWhileRevalidate: 86400,
    staleIfError: 86400,
  },

  // HTML files (shorter cache, revalidation)
  htmlFiles: {
    maxAge: 3600, // 1 hour
    sMaxAge: 1800, // 30 minutes at edge
    mustRevalidate: true,
    public: true,
    staleWhileRevalidate: 300,
    staleIfError: 3600,
  },

  // API responses (no cache)
  apiResponses: {
    maxAge: 0,
    noCache: true,
    mustRevalidate: true,
    private: true,
  },

  // Images (long cache)
  images: {
    maxAge: 31536000, // 1 year
    sMaxAge: 86400, // 1 day at edge
    immutable: true,
    public: true,
    staleWhileRevalidate: 86400,
    staleIfError: 259200, // 3 days
  },

  // Fonts (very long cache)
  fonts: {
    maxAge: 31536000, // 1 year
    sMaxAge: 86400, // 1 day at edge
    immutable: true,
    public: true,
    staleWhileRevalidate: 86400,
    staleIfError: 604800, // 1 week
  },

  // CSS files (long cache with versioning)
  css: {
    maxAge: 31536000, // 1 year
    sMaxAge: 86400, // 1 day at edge
    immutable: true,
    public: true,
    staleWhileRevalidate: 86400,
    staleIfError: 86400,
  },

  // JavaScript files (long cache with versioning)
  javascript: {
    maxAge: 31536000, // 1 year
    sMaxAge: 86400, // 1 day at edge
    immutable: true,
    public: true,
    staleWhileRevalidate: 86400,
    staleIfError: 86400,
  },

  // JSON data files
  json: {
    maxAge: 3600, // 1 hour
    sMaxAge: 1800, // 30 minutes at edge
    public: true,
    staleWhileRevalidate: 300,
    staleIfError: 3600,
  },

  // Default config for unknown file types
  defaultConfig: {
    maxAge: 3600, // 1 hour
    sMaxAge: 1800, // 30 minutes at edge
    public: true,
    staleWhileRevalidate: 300,
    staleIfError: 3600,
  },
};

/**
 * Build Cache-Control header value from config
 */
function buildCacheControlHeader(config: CacheConfig): string {
  const directives: string[] = [];

  if (config.noCache) {
    directives.push('no-cache', 'no-store', 'must-revalidate');
    return directives.join(', ');
  }

  if (config.public) {
    directives.push('public');
  } else if (config.private) {
    directives.push('private');
  }

  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`);
  }

  if (config.sMaxAge !== undefined) {
    directives.push(`s-maxage=${config.sMaxAge}`);
  }

  if (config.immutable) {
    directives.push('immutable');
  }

  if (config.mustRevalidate) {
    directives.push('must-revalidate');
  }

  if (config.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  if (config.staleIfError !== undefined) {
    directives.push(`stale-if-error=${config.staleIfError}`);
  }

  return directives.join(', ');
}

/**
 * Determine cache config based on file extension and path
 */
function getCacheConfigForRequest(req: Request): CacheConfig {
  const url = req.url;
  const extension = path.extname(url).toLowerCase();

  // API endpoints
  if (url.startsWith('/api/')) {
    return CACHE_CONFIGS.apiResponses;
  }

  // Static assets by extension
  switch (extension) {
    case '.js':
    case '.mjs':
      return CACHE_CONFIGS.javascript;

    case '.css':
      return CACHE_CONFIGS.css;

    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.svg':
    case '.webp':
    case '.avif':
    case '.ico':
      return CACHE_CONFIGS.images;

    case '.woff':
    case '.woff2':
    case '.eot':
    case '.ttf':
    case '.otf':
      return CACHE_CONFIGS.fonts;

    case '.json':
      return CACHE_CONFIGS.json;

    case '.html':
    case '':
      // HTML files or routes without extension
      return CACHE_CONFIGS.htmlFiles;

    default:
      return CACHE_CONFIGS.defaultConfig;
  }
}

/**
 * Check if the asset has a content hash (immutable)
 */
function isVersionedAsset(filename: string): boolean {
  // Check if filename contains a hash pattern like "filename-abc123.ext"
  const hashPattern = /-[a-f0-9]{6,}(\.[^.]+)?$/i;
  return hashPattern.test(filename);
}

/**
 * Add security headers for CDN responses
 */
function addSecurityHeaders(res: Response): void {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Additional performance headers
  res.setHeader('Vary', 'Accept-Encoding');
}

/**
 * Add CDN-specific headers
 */
function addCDNHeaders(res: Response, req: Request): void {
  // Add CDN identification
  res.setHeader('X-CDN-Provider', process.env.CDN_PROVIDER || 'local');
  res.setHeader('X-CDN-Version', process.env.CDN_VERSION || '1.0.0');

  // Add edge location hint (for monitoring)
  if (req.headers['cf-ray']) {
    res.setHeader('X-CDN-Edge', 'cloudflare');
  } else if (req.headers['x-amz-cf-id']) {
    res.setHeader('X-CDN-Edge', 'cloudfront');
  }

  // Add cache status
  res.setHeader('X-Cache-Status', 'MISS'); // Will be overridden by CDN if cached
}

/**
 * Main CDN cache middleware
 */
export function cdnCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip cache headers for non-GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  try {
    // Get cache configuration for this request
    let cacheConfig = getCacheConfigForRequest(req);

    // Enhance config for versioned assets
    if (isVersionedAsset(req.url)) {
      cacheConfig = {
        ...cacheConfig,
        maxAge: 31536000, // 1 year for versioned assets
        immutable: true,
      };
    }

    // Build and set Cache-Control header
    const cacheControlValue = buildCacheControlHeader(cacheConfig);
    res.setHeader('Cache-Control', cacheControlValue);

    // Add ETag for better caching
    if (!cacheConfig.noCache) {
      // Simple ETag based on URL and timestamp
      const etag = `"${Buffer.from(req.url).toString('base64').slice(0, 16)}"`;
      res.setHeader('ETag', etag);

      // Check if client has cached version
      const clientETag = req.headers['if-none-match'];
      if (clientETag === etag) {
        res.status(304).end();
        return;
      }
    }

    // Add Last-Modified header for static assets
    if (!req.url.startsWith('/api/')) {
      const lastModified = new Date().toUTCString();
      res.setHeader('Last-Modified', lastModified);
    }

    // Add security headers
    addSecurityHeaders(res);

    // Add CDN-specific headers
    addCDNHeaders(res, req);

    // Add compression hint
    res.setHeader('Content-Encoding-Hint', 'gzip, br');

    next();
  } catch (error) {
    console.error('CDN Cache Middleware Error:', error);
    next();
  }
}

/**
 * Middleware specifically for static assets
 */
export function staticAssetCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Force long-term caching for assets directory
  if (req.url.startsWith('/assets/')) {
    const cacheConfig = CACHE_CONFIGS.staticAssets;
    const cacheControlValue = buildCacheControlHeader(cacheConfig);

    res.setHeader('Cache-Control', cacheControlValue);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Add compression headers
    res.setHeader('Vary', 'Accept-Encoding');
  }

  next();
}

/**
 * Middleware for API responses (no cache)
 */
export function apiNoCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.url.startsWith('/api/')) {
    const cacheConfig = CACHE_CONFIGS.apiResponses;
    const cacheControlValue = buildCacheControlHeader(cacheConfig);

    res.setHeader('Cache-Control', cacheControlValue);
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * Create cache invalidation helper
 */
export class CDNCacheInvalidator {
  static async invalidateCloudflare(paths: string[]): Promise<boolean> {
    if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) {
      console.warn('Cloudflare credentials not configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: paths.map((path) => `${process.env.CLOUDFLARE_CDN_URL}${path}`),
          }),
        }
      );

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Cloudflare cache invalidation failed:', error);
      return false;
    }
  }

  static async invalidateCloudFront(_paths: string[]): Promise<boolean> {
    // AWS CloudFront invalidation would require AWS SDK
    // This is a placeholder for the implementation
    console.log('CloudFront invalidation not implemented yet');
    return false;
  }

  static async invalidateAll(): Promise<boolean> {
    const paths = ['/*']; // Invalidate all paths

    if (process.env.USE_CLOUDFLARE_CDN === 'true') {
      return await CDNCacheInvalidator.invalidateCloudflare(paths);
    } else if (process.env.USE_CLOUDFRONT_CDN === 'true') {
      return await CDNCacheInvalidator.invalidateCloudFront(paths);
    }

    return true; // No CDN to invalidate
  }
}

export default cdnCacheMiddleware;
