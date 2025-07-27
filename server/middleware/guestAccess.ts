import type { Request, RequestHandler, Response } from 'express'
import type { Request, Response } from 'express';
import { log } from '../utils/logger';
import { redisService, cacheKeys, cacheTTL } from '../services/redisService';

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
  allowedPreviews: parseInt(process.env.GUEST_PREVIEW_LIMIT || '50'),
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

// Session storage using Redis with in-memory fallback
const inMemorySessions = new Map<string, GuestServerSession>();

// Helper to get cache key for guest sessions
const getGuestSessionKey = (sessionId: string) => `guest_session:${sessionId}`;

/**
 * Generate a guest session ID
 */
function generateGuestSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get guest session from Redis or in-memory fallback
 */
async function getGuestSessionFromStorage(sessionId: string): Promise<GuestServerSession | null> {
  try {
    // Try Redis first
    if (redisService.isAvailable()) {
      const cached = await redisService.get<GuestServerSession>(getGuestSessionKey(sessionId));
      if (cached) {
        return cached;
      }
    }
    
    // Fallback to in-memory
    return inMemorySessions.get(sessionId) || null;
  } catch (error) {
    log.error('Error getting guest session from storage:', error);
    return inMemorySessions.get(sessionId) || null;
  }
}

/**
 * Save guest session to Redis and in-memory
 */
async function saveGuestSessionToStorage(session: GuestServerSession): Promise<void> {
  try {
    // Save to in-memory (always)
    inMemorySessions.set(session.sessionId, session);
    
    // Save to Redis if available
    if (redisService.isAvailable()) {
      const ttl = Math.floor(DEFAULT_GUEST_CONFIG.sessionDuration / 1000); // Convert to seconds
      await redisService.set(getGuestSessionKey(session.sessionId), session, ttl);
    }
  } catch (error) {
    log.error('Error saving guest session to storage:', error);
  }
}

/**
 * Get or create guest session
 */
async function getOrCreateGuestSession(req: Request): Promise<GuestServerSession> {
  const sessionId =
    (req.headers['x-guest-session-id'] as string) ||
    req.cookies?.guest_session_id ||
    generateGuestSessionId();

  const ipAddress = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
  const userAgent = req.headers['user-agent'] || '';

  let session = await getGuestSessionFromStorage(sessionId);

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
    await saveGuestSessionToStorage(session);
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
    
    // Save updated session
    await saveGuestSessionToStorage(session);
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
export const guestAccessMiddleware: RequestHandler = async (req, res, next) => {
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
    const guestSession = await getOrCreateGuestSession(req);

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
export async function recordGuestTermView(guestSession: GuestServerSession, termId: string): Promise<boolean> {
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

  // Update session in storage
  await saveGuestSessionToStorage(guestSession);

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
export async function getGuestSessionStats(sessionId: string) {
  const session = await getGuestSessionFromStorage(sessionId);

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
export async function cleanupExpiredGuestSessions(): Promise<void> {
  const now = Date.now();
  const expiredSessions: string[] = [];

  // Clean up in-memory sessions
  for (const [sessionId, session] of inMemorySessions.entries()) {
    if (now - session.lastActivity > DEFAULT_GUEST_CONFIG.sessionDuration) {
      expiredSessions.push(sessionId);
    }
  }

  for (const sessionId of expiredSessions) {
    inMemorySessions.delete(sessionId);
    
    // Also try to delete from Redis
    if (redisService.isAvailable()) {
      try {
        await redisService.del(getGuestSessionKey(sessionId));
      } catch (error) {
        log.error('Error deleting session from Redis:', error);
      }
    }
  }

  if (expiredSessions.length > 0) {
    log.info('Cleaned up expired guest sessions', {
      count: expiredSessions.length,
      totalSessions: inMemorySessions.size,
    });
  }
}

/**
 * Get all guest session analytics (for admin use)
 */
export async function getGuestAnalytics() {
  // For analytics, we'll use in-memory sessions as it's good enough for basic stats
  // In production, you might want to implement a proper analytics aggregation in Redis
  const sessions = Array.from(inMemorySessions.values());
  const now = Date.now();

  const analytics = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => now - s.lastActivity < 30 * 60 * 1000).length, // Active in last 30 minutes
    averagePreviewsUsed:
      sessions.reduce((sum, s) => sum + s.previewsUsed, 0) / sessions.length || 0,
    conversionCandidates: sessions.filter(
      s => s.previewsUsed >= DEFAULT_GUEST_CONFIG.allowedPreviews
    ).length,
    averageTimeOnSite:
      sessions.reduce((sum, s) => sum + (now - s.firstVisit), 0) / sessions.length || 0,
    sessionsByPreviewsUsed: {
      '0': sessions.filter(s => s.previewsUsed === 0).length,
      '1-10': sessions.filter(s => s.previewsUsed >= 1 && s.previewsUsed <= 10).length,
      '11-25': sessions.filter(s => s.previewsUsed >= 11 && s.previewsUsed <= 25).length,
      '26-49': sessions.filter(s => s.previewsUsed >= 26 && s.previewsUsed <= 49).length,
      '50+': sessions.filter(s => s.previewsUsed >= 50).length,
    },
    redisEnabled: redisService.isAvailable(),
  };

  return analytics;
}

// Start cleanup interval
setInterval(cleanupExpiredGuestSessions, 60 * 60 * 1000); // Clean up every hour
