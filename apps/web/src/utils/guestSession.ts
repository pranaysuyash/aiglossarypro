/**
 * Guest session tracking utilities for managing preview limits and conversions
 */

export interface GuestSession {
  previewsUsed: number;
  previewsLimit: number;
  viewedTerms: string[];
  sessionId: string;
  firstVisit: number;
  lastActivity: number;
  conversionTracking: {
    landingPage: string | null;
    timeOnSite: number;
    termsViewed: number;
    ctaClicks: number;
  };
}

export interface GuestPreviewConfig {
  maxPreviews: number;
  sessionDuration: number; // in milliseconds
  resetInterval: number; // in milliseconds (24 hours default)
}

const DEFAULT_CONFIG: GuestPreviewConfig = {
  maxPreviews: 50,
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  resetInterval: 24 * 60 * 60 * 1000, // 24 hours
};

const STORAGE_KEY = 'aiglossary_guest_session';

/**
 * Generate a unique session ID for the guest
 */
function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the current guest session from localStorage
 */
export function getGuestSession(config: GuestPreviewConfig = DEFAULT_CONFIG): GuestSession {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createNewGuestSession(config);
    }

    const session: GuestSession = JSON.parse(stored);

    // Check if session has expired
    const now = Date.now();
    const sessionAge = now - session.firstVisit;

    if (sessionAge > config.sessionDuration) {
      return createNewGuestSession(config);
    }

    // Update last activity
    session.lastActivity = now;
    session.conversionTracking.timeOnSite = now - session.firstVisit;

    return session;
  } catch (error) {
    console.warn('Failed to parse guest session, creating new one:', error);
    return createNewGuestSession(config);
  }
}

/**
 * Create a new guest session
 */
function createNewGuestSession(config: GuestPreviewConfig): GuestSession {
  const now = Date.now();
  const session: GuestSession = {
    previewsUsed: 0,
    previewsLimit: config.maxPreviews,
    viewedTerms: [],
    sessionId: generateSessionId(),
    firstVisit: now,
    lastActivity: now,
    conversionTracking: {
      landingPage: window.location.pathname,
      timeOnSite: 0,
      termsViewed: 0,
      ctaClicks: 0,
    },
  };

  saveGuestSession(session);
  return session;
}

/**
 * Save guest session to localStorage
 */
export function saveGuestSession(session: GuestSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save guest session:', error);
  }
}

/**
 * Check if guest can view more previews
 */
export function canGuestPreview(session?: GuestSession): boolean {
  const currentSession = session || getGuestSession();
  return currentSession.previewsUsed < currentSession.previewsLimit;
}

/**
 * Record a term preview for the guest
 */
export function recordGuestPreview(termId: string): GuestSession {
  const session = getGuestSession();

  // Don't count if already viewed this term
  if (session.viewedTerms.includes(termId)) {
    return session;
  }

  session.previewsUsed += 1;
  session.viewedTerms.push(termId);
  session.conversionTracking.termsViewed += 1;
  session.lastActivity = Date.now();
  session.conversionTracking.timeOnSite = session.lastActivity - session.firstVisit;

  saveGuestSession(session);
  return session;
}

/**
 * Record a CTA click for conversion tracking
 */
export function recordCtaClick(ctaType: string): void {
  const session = getGuestSession();
  session.conversionTracking.ctaClicks += 1;
  session.lastActivity = Date.now();

  saveGuestSession(session);

  // Track the CTA click event for analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'cta_click', {
      event_category: 'guest_conversion',
      event_label: ctaType,
      session_id: session.sessionId,
      previews_used: session.previewsUsed,
      time_on_site: session.conversionTracking.timeOnSite,
    });
  }
}

/**
 * Get remaining previews for the guest
 */
export function getRemainingPreviews(): number {
  const session = getGuestSession();
  return Math.max(0, session.previewsLimit - session.previewsUsed);
}

/**
 * Check if guest has reached preview limit
 */
export function hasReachedPreviewLimit(): boolean {
  return getRemainingPreviews() === 0;
}

/**
 * Reset guest session (useful for testing or when user authenticates)
 */
export function resetGuestSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset guest session:', error);
  }
}

/**
 * Convert guest session to conversion data for analytics
 */
export function getConversionData(): GuestSession['conversionTracking'] & {
  sessionId: string;
  previewsUsed: number;
  hasReachedLimit: boolean;
} {
  const session = getGuestSession();
  return {
    ...session.conversionTracking,
    sessionId: session.sessionId,
    previewsUsed: session.previewsUsed,
    hasReachedLimit: hasReachedPreviewLimit(),
  };
}

/**
 * Track page view for guest analytics
 */
export function trackGuestPageView(page: string): void {
  const session = getGuestSession();
  session.lastActivity = Date.now();
  session.conversionTracking.timeOnSite = session.lastActivity - session.firstVisit;

  saveGuestSession(session);

  // Track page view for analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      event_category: 'guest_session',
      event_label: page,
      session_id: session.sessionId,
      previews_used: session.previewsUsed,
      time_on_site: session.conversionTracking.timeOnSite,
    });
  }
}

/**
 * Get session analytics data for conversion optimization
 */
export function getSessionAnalytics() {
  const session = getGuestSession();

  return {
    sessionId: session.sessionId,
    isNewSession: session.conversionTracking.timeOnSite < 60000, // Less than 1 minute
    previewsUsed: session.previewsUsed,
    previewsRemaining: getRemainingPreviews(),
    hasReachedLimit: hasReachedPreviewLimit(),
    timeOnSite: session.conversionTracking.timeOnSite,
    termsViewed: session.conversionTracking.termsViewed,
    ctaClicks: session.conversionTracking.ctaClicks,
    engagementScore: calculateEngagementScore(session),
  };
}

/**
 * Calculate engagement score for conversion likelihood
 */
function calculateEngagementScore(session: GuestSession): number {
  let score = 0;

  // Time on site (up to 30 points)
  const timeMinutes = session.conversionTracking.timeOnSite / (1000 * 60);
  score += Math.min(30, timeMinutes * 2);

  // Terms viewed (up to 30 points)
  score += Math.min(30, session.conversionTracking.termsViewed * 15);

  // CTA clicks (up to 40 points)
  score += Math.min(40, session.conversionTracking.ctaClicks * 20);

  return Math.round(score);
}
