import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  GuestSession,
  canGuestPreview,
  getGuestSession,
  getRemainingPreviews,
  hasReachedPreviewLimit,
  recordCtaClick,
  recordGuestPreview,
  resetGuestSession,
  trackGuestPageView,
  getSessionAnalytics,
} from '../utils/guestSession';
import {
  trackConversionEvent,
  getConversionSession,
  getConversionFunnelAnalytics,
  getConversionSessionAnalytics,
  markConversionCompleted,
} from '../services/conversionTracking';

export interface GuestPreviewState {
  isGuest: boolean;
  canPreview: boolean;
  previewsUsed: number;
  previewsRemaining: number;
  hasReachedLimit: boolean;
  session: GuestSession | null;
  analytics: ReturnType<typeof getSessionAnalytics>;
}

export interface GuestPreviewActions {
  recordPreview: (termId: string) => boolean;
  recordCta: (ctaType: string) => void;
  trackPageView: (page: string) => void;
  resetSession: () => void;
  refreshSession: () => void;
}

/**
 * Hook for managing guest preview functionality
 */
export function useGuestPreview(): GuestPreviewState & GuestPreviewActions {
  const { isAuthenticated } = useAuth();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Initialize session
  useEffect(() => {
    if (!isAuthenticated) {
      const guestSession = getGuestSession();
      setSession(guestSession);
      setIsGuest(true);
    } else {
      setSession(null);
      setIsGuest(false);
    }
  }, [isAuthenticated]);

  // Clean up session when user authenticates
  useEffect(() => {
    if (isAuthenticated && session) {
      // User has authenticated, reset guest session
      resetGuestSession();
      setSession(null);
      setIsGuest(false);
    }
  }, [isAuthenticated, session]);

  const refreshSession = useCallback(() => {
    if (!isAuthenticated) {
      const updatedSession = getGuestSession();
      setSession(updatedSession);
    }
  }, [isAuthenticated]);

  const recordPreview = useCallback((termId: string): boolean => {
    if (isAuthenticated || !session) {
      return true; // Authenticated users can always view
    }

    if (!canGuestPreview(session)) {
      // Track that user hit the limit
      trackConversionEvent({
        eventType: 'guest_cta_click',
        termId,
        metadata: { limitReached: true, action: 'view_attempt' },
      });
      return false;
    }

    const updatedSession = recordGuestPreview(termId);
    setSession(updatedSession);

    // Track the preview event for conversion analysis
    trackConversionEvent({
      eventType: 'guest_view',
      termId,
      metadata: {
        previewNumber: updatedSession.previewsUsed,
        remainingPreviews: updatedSession.previewsLimit - updatedSession.previewsUsed,
      },
    });

    return true;
  }, [isAuthenticated, session]);

  const recordCta = useCallback((ctaType: string) => {
    recordCtaClick(ctaType);
    
    // Track conversion event
    trackConversionEvent({
      eventType: 'guest_cta_click',
      ctaType,
      metadata: {
        hasReachedLimit: hasReachedPreviewLimit(),
        previewsUsed: session?.previewsUsed || 0,
      },
    });
    
    refreshSession();
  }, [refreshSession, session]);

  const trackPageView = useCallback((page: string) => {
    if (!isAuthenticated) {
      trackGuestPageView(page);
      refreshSession();
    }
  }, [isAuthenticated, refreshSession]);

  const resetSession = useCallback(() => {
    resetGuestSession();
    setSession(null);
    if (!isAuthenticated) {
      const newSession = getGuestSession();
      setSession(newSession);
    }
  }, [isAuthenticated]);

  const canPreview = isAuthenticated || (session ? canGuestPreview(session) : false);
  const previewsUsed = session?.previewsUsed || 0;
  const previewsRemaining = isAuthenticated ? Infinity : getRemainingPreviews();
  const hasReachedLimit = !isAuthenticated && hasReachedPreviewLimit();
  const analytics = getSessionAnalytics();

  return {
    isGuest,
    canPreview,
    previewsUsed,
    previewsRemaining,
    hasReachedLimit,
    session,
    analytics,
    recordPreview,
    recordCta,
    trackPageView,
    resetSession,
    refreshSession,
  };
}

/**
 * Hook for checking if a specific term can be previewed
 */
export function useTermPreview(termId?: string) {
  const { isAuthenticated } = useAuth();
  const guestPreview = useGuestPreview();
  
  const canViewTerm = useCallback(() => {
    if (!termId) return false;
    
    if (isAuthenticated) {
      return true; // Authenticated users handled by existing access control
    }
    
    // Check if guest has already viewed this term
    if (guestPreview.session?.viewedTerms.includes(termId)) {
      return true; // Already viewed, allow access
    }
    
    return guestPreview.canPreview;
  }, [termId, isAuthenticated, guestPreview.canPreview, guestPreview.session]);

  const viewTerm = useCallback(() => {
    if (!termId || isAuthenticated) {
      return true;
    }
    
    return guestPreview.recordPreview(termId);
  }, [termId, isAuthenticated, guestPreview]);

  return {
    canViewTerm: canViewTerm(),
    viewTerm,
    isGuest: guestPreview.isGuest,
    previewsRemaining: guestPreview.previewsRemaining,
    hasReachedLimit: guestPreview.hasReachedLimit,
  };
}

/**
 * Hook for guest conversion tracking
 */
export function useGuestConversion() {
  const { isAuthenticated } = useAuth();
  const guestPreview = useGuestPreview();

  const getConversionLikelihood = useCallback(() => {
    if (isAuthenticated) return 0; // Already converted
    
    const sessionAnalytics = getConversionSessionAnalytics();
    return sessionAnalytics.conversionLikelihood;
  }, [isAuthenticated]);

  const getFunnelAnalytics = useCallback(() => {
    if (isAuthenticated) return null;
    
    return getConversionFunnelAnalytics();
  }, [isAuthenticated]);

  const getSessionAnalytics = useCallback(() => {
    if (isAuthenticated) return null;
    
    return getConversionSessionAnalytics();
  }, [isAuthenticated]);

  const isHighValueGuest = useCallback(() => {
    const sessionAnalytics = getSessionAnalytics();
    return sessionAnalytics?.segmentType === 'high_intent';
  }, [getSessionAnalytics]);

  const shouldShowAggresiveCta = useCallback(() => {
    if (isAuthenticated) return false;
    
    const sessionAnalytics = getSessionAnalytics();
    return guestPreview.hasReachedLimit || 
           sessionAnalytics?.segmentType === 'high_intent' ||
           sessionAnalytics?.conversionLikelihood >= 60;
  }, [isAuthenticated, guestPreview.hasReachedLimit, getSessionAnalytics]);

  const getRecommendedCta = useCallback(() => {
    if (isAuthenticated) return null;
    
    const funnelAnalytics = getFunnelAnalytics();
    const sessionAnalytics = getSessionAnalytics();
    
    if (guestPreview.hasReachedLimit) {
      return 'unlock_more_terms';
    }
    
    if (sessionAnalytics?.segmentType === 'high_intent') {
      return 'premium_offer';
    }
    
    if (funnelAnalytics?.currentStep === 'preview' && sessionAnalytics?.pageViews >= 2) {
      return 'engaged_user_offer';
    }
    
    if (sessionAnalytics?.sessionDuration > 5 * 60 * 1000) { // 5 minutes
      return 'time_based_offer';
    }
    
    return 'general_signup';
  }, [isAuthenticated, guestPreview, getFunnelAnalytics, getSessionAnalytics]);

  const markSignupCompleted = useCallback((userId?: string) => {
    markConversionCompleted('free_signup', 0, userId);
  }, []);

  const markPremiumPurchase = useCallback((value: number, userId?: string) => {
    markConversionCompleted('premium_purchase', value, userId);
  }, []);

  return {
    conversionLikelihood: getConversionLikelihood(),
    funnelAnalytics: getFunnelAnalytics(),
    sessionAnalytics: getSessionAnalytics(),
    isHighValueGuest: isHighValueGuest(),
    shouldShowAggresiveCta: shouldShowAggresiveCta(),
    recommendedCta: getRecommendedCta(),
    markSignupCompleted,
    markPremiumPurchase,
    analytics: guestPreview.analytics,
  };
}

/**
 * Hook to automatically track page views for guests
 */
export function useGuestPageTracking() {
  const { trackPageView } = useGuestPreview();
  
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [trackPageView]);
}