import type { Request, RequestHandler, Response } from 'express';
import { log } from '../utils/logger';

/**
 * Guest access configuration
 */
export interface GuestAccessConfig {
  allowedPreviews: number;
  sessionDuration: number; // in milliseconds
  allowedRoutes: string[];
  blockedRoutes: string[];
}

const DEFAULT_GUEST_CONFIG: GuestAccessConfig = {
  allowedPreviews: 2,
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  allowedRoutes: [
    '/api/terms/:id/preview',
    '/api/terms/:id/basic',
    '/api/search/preview',
    '/api/categories',
    '/api/trending/preview',
  ],
  blockedRoutes: [
    '/api/user/*',
    '/api/admin/*',
    '/api/favorites/*',
    '/api/analytics/*',
    '/api/purchase/*',
  ],
};

/**
 * Guest session interface for server-side tracking
 */
export interface GuestServerSession {
  sessionId: string;
  previewsUsed: number;
  viewedTerms: string[];
  firstVisit: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

// In-memory session store (consider Redis for production)
const guestSessions = new Map<string, GuestServerSession>();

/**
 * Generate a guest session ID
 */
function generateGuestSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create guest session
 */
function getOrCreateGuestSession(req: Request): GuestServerSession {
  const sessionId = req.headers['x-guest-session-id'] as string || 
                   req.cookies?.guest_session_id ||
                   generateGuestSessionId();
  
  const ipAddress = (req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || '').split(',')[0].trim();
  const userAgent = req.headers['user-agent'] || '';
  
  let session = guestSessions.get(sessionId);
  
  if (!session) {
    session = {
      sessionId,
      previewsUsed: 0,
      viewedTerms: [],
      firstVisit: Date.now(),
      lastActivity: Date.now(),
      ipAddress,
      userAgent,
    };
    guestSessions.set(sessionId, session);
  } else {
    // Update last activity
    session.lastActivity = Date.now();
    
    // Check if session has expired
    if (Date.now() - session.firstVisit > DEFAULT_GUEST_CONFIG.sessionDuration) {
      // Reset expired session
      session.previewsUsed = 0;
      session.viewedTerms = [];
      session.firstVisit = Date.now();
    }
  }
  
  return session;
}

/**
 * Check if route is allowed for guest access
 */
function isRouteAllowedForGuests(path: string): boolean {
  const { allowedRoutes, blockedRoutes } = DEFAULT_GUEST_CONFIG;
  
  // Check blocked routes first (more restrictive)
  for (const blockedRoute of blockedRoutes) {
    const pattern = blockedRoute.replace(/\*/g, '.*').replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return false;
    }
  }
  
  // Check allowed routes
  for (const allowedRoute of allowedRoutes) {
    const pattern = allowedRoute.replace(/\*/g, '.*').replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return true;
    }
  }
  
  // Default public routes that don't require authentication
  const publicRoutes = [
    '/api/health',
    '/api/terms$', // List terms (without details)
    '/api/categories$',
    '/api/search$',
    '/api/trending$',
    '/api/auth/.*',
  ];
  
  for (const publicRoute of publicRoutes) {
    const regex = new RegExp(`^${publicRoute}`);
    if (regex.test(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Guest access middleware - allows limited access to certain endpoints
 */
export const guestAccessMiddleware: RequestHandler = (req, res, next) => {
  const isAuthenticated = req.user;
  const requestPath = req.path;
  
  // If user is authenticated, proceed normally
  if (isAuthenticated) {
    return next();
  }
  
  // Check if route is allowed for guests
  if (!isRouteAllowedForGuests(requestPath)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for this resource',
      guestPreview: false,
      authRequired: true,
    });
  }
  
  // For guest preview routes, check session limits
  if (requestPath.includes('preview') || requestPath.includes('term')) {
    const guestSession = getOrCreateGuestSession(req);
    
    // Add guest session to request for use in route handlers
    (req as any).guestSession = guestSession;
    
    // Set guest session cookie for client tracking
    res.cookie('guest_session_id', guestSession.sessionId, {
      maxAge: DEFAULT_GUEST_CONFIG.sessionDuration,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    log.info('Guest access granted', {
      sessionId: guestSession.sessionId,
      path: requestPath,
      previewsUsed: guestSession.previewsUsed,
      ipAddress: guestSession.ipAddress,
    });
  }
  
  next();
};

/**
 * Middleware to check guest preview limits
 */
export const guestPreviewLimitMiddleware: RequestHandler = (req, res, next) => {
  const guestSession = (req as any).guestSession as GuestServerSession;
  
  if (!guestSession) {
    return res.status(401).json({
      success: false,
      message: 'Guest session required',
      guestPreview: false,
    });
  }
  
  if (guestSession.previewsUsed >= DEFAULT_GUEST_CONFIG.allowedPreviews) {
    return res.status(403).json({
      success: false,
      message: 'Guest preview limit reached',
      guestPreview: true,
      previewLimitReached: true,
      previewsUsed: guestSession.previewsUsed,
      previewsLimit: DEFAULT_GUEST_CONFIG.allowedPreviews,
      authRequired: true,
    });
  }
  
  next();
};

/**
 * Record guest term view
 */
export function recordGuestTermView(guestSession: GuestServerSession, termId: string): boolean {
  if (guestSession.viewedTerms.includes(termId)) {
    // Already viewed this term, don't count it again
    return true;
  }
  
  if (guestSession.previewsUsed >= DEFAULT_GUEST_CONFIG.allowedPreviews) {
    return false;
  }
  
  guestSession.previewsUsed += 1;
  guestSession.viewedTerms.push(termId);
  guestSession.lastActivity = Date.now();
  
  // Update session in store
  guestSessions.set(guestSession.sessionId, guestSession);
  
  log.info('Guest term view recorded', {
    sessionId: guestSession.sessionId,
    termId,
    previewsUsed: guestSession.previewsUsed,
    previewsRemaining: DEFAULT_GUEST_CONFIG.allowedPreviews - guestSession.previewsUsed,
  });
  
  return true;
}

/**
 * Get guest session stats
 */
export function getGuestSessionStats(sessionId: string) {
  const session = guestSessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  return {
    sessionId: session.sessionId,
    previewsUsed: session.previewsUsed,
    previewsLimit: DEFAULT_GUEST_CONFIG.allowedPreviews,
    previewsRemaining: DEFAULT_GUEST_CONFIG.allowedPreviews - session.previewsUsed,
    viewedTerms: session.viewedTerms.length,
    timeOnSite: Date.now() - session.firstVisit,
    canViewMore: session.previewsUsed < DEFAULT_GUEST_CONFIG.allowedPreviews,
  };
}

/**
 * Cleanup expired guest sessions (call periodically)
 */
export function cleanupExpiredGuestSessions(): void {
  const now = Date.now();
  const expiredSessions: string[] = [];
  
  for (const [sessionId, session] of guestSessions.entries()) {
    if (now - session.lastActivity > DEFAULT_GUEST_CONFIG.sessionDuration) {
      expiredSessions.push(sessionId);
    }
  }
  
  for (const sessionId of expiredSessions) {
    guestSessions.delete(sessionId);
  }
  
  if (expiredSessions.length > 0) {
    log.info('Cleaned up expired guest sessions', {
      count: expiredSessions.length,
      totalSessions: guestSessions.size,
    });
  }
}

/**
 * Get all guest session analytics (for admin use)
 */
export function getGuestAnalytics() {
  const sessions = Array.from(guestSessions.values());
  const now = Date.now();
  
  const analytics = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => now - s.lastActivity < 30 * 60 * 1000).length, // Active in last 30 minutes
    averagePreviewsUsed: sessions.reduce((sum, s) => sum + s.previewsUsed, 0) / sessions.length || 0,
    conversionCandidates: sessions.filter(s => s.previewsUsed >= DEFAULT_GUEST_CONFIG.allowedPreviews).length,
    averageTimeOnSite: sessions.reduce((sum, s) => sum + (now - s.firstVisit), 0) / sessions.length || 0,
    sessionsByPreviewsUsed: {
      0: sessions.filter(s => s.previewsUsed === 0).length,
      1: sessions.filter(s => s.previewsUsed === 1).length,
      2: sessions.filter(s => s.previewsUsed >= 2).length,
    },
  };
  
  return analytics;
}

// Start cleanup interval
setInterval(cleanupExpiredGuestSessions, 60 * 60 * 1000); // Clean up every hour