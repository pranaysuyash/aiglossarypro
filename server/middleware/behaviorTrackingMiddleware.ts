import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { personalizationService } from '../services/personalizationService';
import { log as logger } from '../utils/logger';

interface TrackingContext {
  userId?: string;
  sessionId: string;
  userAgent: string;
  ipAddress: string;
  path: string;
  method: string;
  referrer?: string;
  timestamp: Date;
}

export interface BehaviorTrackingRequest extends Request {
  trackingContext?: TrackingContext;
  startTime?: number;
}

/**
 * Middleware to track user behavior for personalization
 */
export const behaviorTrackingMiddleware = (
  req: BehaviorTrackingRequest,
  res: Response,
  next: NextFunction
) => {
  req.startTime = Date.now();

  // Generate or get session ID
  const sessionId =
    req.session?.id || (req.headers['x-session-id'] as string) || generateSessionId();

  // Hash IP address for privacy
  const ipAddress = hashIP(req.ip || req.connection.remoteAddress || '');

  // Extract user ID if authenticated
  const userId = (req as any).user?.claims?.sub;

  // Build tracking context
  req.trackingContext = {
    userId,
    sessionId,
    userAgent: req.headers['user-agent'] || '',
    ipAddress,
    path: req.path,
    method: req.method,
    referrer: req.headers.referer,
    timestamp: new Date(),
  };

  // Track page view for GET requests
  if (req.method === 'GET' && userId && shouldTrackPath(req.path)) {
    trackPageView(req.trackingContext, req.path, req.query);
  }

  // Override res.json to track API responses
  const originalJson = res.json;
  res.json = function (data: any) {
    if (userId && req.startTime) {
      const responseTime = Date.now() - req.startTime;
      trackAPIInteraction(req.trackingContext!, req.path, req.method, res.statusCode, responseTime);
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Track specific user actions
 */
export const trackUserAction = async (
  req: BehaviorTrackingRequest,
  actionType: string,
  entityType: string,
  entityId: string,
  additionalContext?: Record<string, any>
) => {
  if (!req.trackingContext?.userId) return;

  try {
    await personalizationService.trackBehaviorEvent({
      user_id: req.trackingContext.userId,
      event_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      context: {
        ...additionalContext,
        path: req.path,
        userAgent: req.trackingContext.userAgent,
        referrer: req.trackingContext.referrer,
        sessionDuration: req.startTime ? Date.now() - req.startTime : 0,
      },
      session_id: req.trackingContext.sessionId,
      user_agent: req.trackingContext.userAgent,
      ip_address: req.trackingContext.ipAddress,
    });
  } catch (error) {
    logger.error('Error tracking user action', { error, actionType, entityType, entityId });
  }
};

/**
 * Enhanced tracking middleware for specific routes
 */
export const enhancedBehaviorTracking = (options: {
  trackScrollDepth?: boolean;
  trackTimeSpent?: boolean;
  trackInteractions?: boolean;
}) => {
  return (_req: BehaviorTrackingRequest, res: Response, next: NextFunction) => {
    // Add client-side tracking script injection for enhanced tracking
    if (options.trackScrollDepth || options.trackTimeSpent || options.trackInteractions) {
      const originalSend = res.send;
      res.send = function (data: any) {
        if (typeof data === 'string' && data.includes('</body>')) {
          const trackingScript = generateTrackingScript(options);
          data = data.replace('</body>', `${trackingScript}</body>`);
        }
        return originalSend.call(this, data);
      };
    }
    next();
  };
};

/**
 * Track page views
 */
async function trackPageView(context: TrackingContext, path: string, query: any) {
  if (!context.userId) return;

  try {
    // Determine entity type and ID from path
    const { entityType, entityId } = parsePathForEntity(path);

    await personalizationService.trackBehaviorEvent({
      user_id: context.userId,
      event_type: 'page_view',
      entity_type: entityType,
      entity_id: entityId || path,
      context: {
        path,
        query,
        referrer: context.referrer,
        timestamp: context.timestamp.toISOString(),
      },
      session_id: context.sessionId,
      user_agent: context.userAgent,
      ip_address: context.ipAddress,
    });
  } catch (error) {
    logger.error('Error tracking page view', { error, path });
  }
}

/**
 * Track API interactions
 */
async function trackAPIInteraction(
  context: TrackingContext,
  path: string,
  method: string,
  statusCode: number,
  responseTime: number
) {
  if (!context.userId) return;

  try {
    const { entityType, entityId } = parsePathForEntity(path);

    await personalizationService.trackBehaviorEvent({
      user_id: context.userId,
      event_type: 'api_interaction',
      entity_type: entityType,
      entity_id: entityId || path,
      context: {
        method,
        statusCode,
        responseTime,
        path,
        timestamp: new Date().toISOString(),
      },
      session_id: context.sessionId,
      user_agent: context.userAgent,
      ip_address: context.ipAddress,
    });
  } catch (error) {
    logger.error('Error tracking API interaction', { error, path });
  }
}

/**
 * Parse URL path to extract entity information
 */
function parsePathForEntity(path: string): { entityType: string; entityId?: string } {
  // Term detail page: /term/:id
  if (path.startsWith('/term/')) {
    return { entityType: 'term', entityId: path.split('/')[2] };
  }

  // Category page: /category/:id
  if (path.startsWith('/category/')) {
    return { entityType: 'category', entityId: path.split('/')[2] };
  }

  // Learning path: /learning-path/:id
  if (path.startsWith('/learning-path/')) {
    return { entityType: 'learning_path', entityId: path.split('/')[2] };
  }

  // API endpoints
  if (path.startsWith('/api/terms/')) {
    return { entityType: 'term', entityId: path.split('/')[3] };
  }

  if (path.startsWith('/api/categories/')) {
    return { entityType: 'category', entityId: path.split('/')[3] };
  }

  // Search
  if (path.includes('/search')) {
    return { entityType: 'search' };
  }

  // Home page
  if (path === '/' || path === '/home') {
    return { entityType: 'homepage' };
  }

  // Default
  return { entityType: 'page' };
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash IP address for privacy
 */
function hashIP(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + process.env.IP_SALT || 'default_salt')
    .digest('hex')
    .substring(0, 16);
}

/**
 * Determine if path should be tracked
 */
function shouldTrackPath(path: string): boolean {
  // Don't track static assets, health checks, etc.
  const excludePaths = [
    '/health',
    '/ping',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '.css',
    '.js',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ];

  return !excludePaths.some((exclude) => path.includes(exclude));
}

/**
 * Generate client-side tracking script
 */
function generateTrackingScript(options: {
  trackScrollDepth?: boolean;
  trackTimeSpent?: boolean;
  trackInteractions?: boolean;
}): string {
  return `
    <script>
      (function() {
        let startTime = Date.now();
        let maxScrollDepth = 0;
        let interactions = 0;
        
        ${
          options.trackScrollDepth
            ? `
        // Track scroll depth
        function trackScrollDepth() {
          const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
          );
          if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;
            if (scrollPercent >= 25 && scrollPercent % 25 === 0) {
              fetch('/api/analytics/scroll-depth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  depth: scrollPercent,
                  timestamp: Date.now() - startTime
                })
              }).catch(() => {});
            }
          }
        }
        window.addEventListener('scroll', trackScrollDepth);
        `
            : ''
        }
        
        ${
          options.trackInteractions
            ? `
        // Track interactions
        function trackInteraction(event) {
          interactions++;
          const element = event.target;
          const interaction = {
            type: event.type,
            element: element.tagName,
            id: element.id,
            className: element.className,
            text: element.textContent?.substring(0, 50),
            timestamp: Date.now() - startTime
          };
          
          fetch('/api/analytics/interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interaction)
          }).catch(() => {});
        }
        
        ['click', 'focus', 'input'].forEach(eventType => {
          document.addEventListener(eventType, trackInteraction);
        });
        `
            : ''
        }
        
        ${
          options.trackTimeSpent
            ? `
        // Track time spent before leaving
        function trackTimeSpent() {
          const timeSpent = Date.now() - startTime;
          fetch('/api/analytics/time-spent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              timeSpent,
              maxScrollDepth,
              interactions,
              url: window.location.pathname
            })
          }).catch(() => {});
        }
        
        window.addEventListener('beforeunload', trackTimeSpent);
        window.addEventListener('pagehide', trackTimeSpent);
        `
            : ''
        }
        
      })();
    </script>
  `;
}

/**
 * Route-specific tracking helpers
 */
export const trackTermView = (req: BehaviorTrackingRequest, termId: string, termData?: any) => {
  return trackUserAction(req, 'view', 'term', termId, { termData });
};

export const trackTermFavorite = (
  req: BehaviorTrackingRequest,
  termId: string,
  action: 'add' | 'remove'
) => {
  return trackUserAction(req, 'favorite', 'term', termId, { action });
};

export const trackSearch = (req: BehaviorTrackingRequest, query: string, results?: any[]) => {
  return trackUserAction(req, 'search', 'search', query, {
    query,
    resultCount: results?.length,
    hasResults: (results?.length || 0) > 0,
  });
};

export const trackLearningPathProgress = (
  req: BehaviorTrackingRequest,
  pathId: string,
  stepId: string,
  progress: number
) => {
  return trackUserAction(req, 'progress', 'learning_path', pathId, { stepId, progress });
};

export const trackContentEngagement = (
  req: BehaviorTrackingRequest,
  contentType: string,
  contentId: string,
  engagementData: any
) => {
  return trackUserAction(req, 'engagement', contentType, contentId, engagementData);
};
