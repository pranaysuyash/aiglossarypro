import { useCallback } from 'react';
import { useAuth } from './useAuth';

interface SurpriseDiscoveryEvent {
  userId?: string;
  sessionId: string;
  mode: string;
  termId: string;
  surpriseReason: string;
  confidenceScore: number;
  actionType: 'discovery' | 'click' | 'share' | 'feedback';
  metadata?: Record<string, unknown>;
}

interface FeedbackData {
  surpriseRating: number;
  relevanceRating: number;
  additionalFeedback?: string;
}

export function useSurpriseAnalytics() {
  const { user } = useAuth();

  const trackDiscoveryEvent = useCallback(
    async (event: SurpriseDiscoveryEvent) => {
      try {
        // Track in our analytics system
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            eventType: 'surprise_discovery',
            eventData: {
              ...event,
              userId: user?.id || event.userId,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              referrer: document.referrer,
              url: window.location.href,
            },
          }),
        });

        // Also track in external analytics if available (GA4, etc.)
        if (typeof (window as any).gtag !== 'undefined') {
          (window as any).gtag('event', 'surprise_discovery', {
            custom_parameter_1: event.mode,
            custom_parameter_2: event.actionType,
            custom_parameter_3: event.confidenceScore,
            user_id: user?.id,
          });
        }

        // Track in user behavior events for personalization
        await fetch('/api/user/behavior', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            eventType: 'surprise_discovery',
            entityType: 'term',
            entityId: event.termId,
            context: {
              discoveryMode: event.mode,
              surpriseReason: event.surpriseReason,
              confidenceScore: event.confidenceScore,
              actionType: event.actionType,
              sessionId: event.sessionId,
              ...event.metadata,
            },
          }),
        });
      } catch (error) {
        console.error('Error tracking surprise discovery event:', error);
        // Don't throw - analytics failures shouldn't break the user experience
      }
    },
    [user?.id]
  );

  const trackDiscovery = useCallback(
    (
      sessionId: string,
      mode: string,
      termId: string,
      surpriseReason: string,
      confidenceScore: number,
      metadata?: Record<string, unknown>
    ) => {
      return trackDiscoveryEvent({
        sessionId,
        mode,
        termId,
        surpriseReason,
        confidenceScore,
        actionType: 'discovery',
        metadata,
      });
    },
    [trackDiscoveryEvent]
  );

  const trackTermClick = useCallback(
    (
      sessionId: string,
      mode: string,
      termId: string,
      surpriseReason: string,
      confidenceScore: number,
      metadata?: Record<string, unknown>
    ) => {
      return trackDiscoveryEvent({
        sessionId,
        mode,
        termId,
        surpriseReason,
        confidenceScore,
        actionType: 'click',
        metadata: {
          ...metadata,
          clickTimestamp: new Date().toISOString(),
        },
      });
    },
    [trackDiscoveryEvent]
  );

  const trackShare = useCallback(
    (
      sessionId: string,
      mode: string,
      termId: string,
      surpriseReason: string,
      confidenceScore: number,
      shareMethod: 'native' | 'clipboard' | 'social',
      metadata?: Record<string, unknown>
    ) => {
      return trackDiscoveryEvent({
        sessionId,
        mode,
        termId,
        surpriseReason,
        confidenceScore,
        actionType: 'share',
        metadata: {
          ...metadata,
          shareMethod,
          shareTimestamp: new Date().toISOString(),
        },
      });
    },
    [trackDiscoveryEvent]
  );

  const trackFeedback = useCallback(
    async (
      sessionId: string,
      mode: string,
      termId: string,
      surpriseReason: string,
      confidenceScore: number,
      feedback: FeedbackData,
      metadata?: Record<string, unknown>
    ) => {
      // Track the feedback event
      await trackDiscoveryEvent({
        sessionId,
        mode,
        termId,
        surpriseReason,
        confidenceScore,
        actionType: 'feedback',
        metadata: {
          ...metadata,
          ...feedback,
          feedbackTimestamp: new Date().toISOString(),
        },
      });

      // Submit feedback to the surprise discovery service
      try {
        await fetch('/api/surprise-discovery/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            sessionId,
            termId,
            surpriseRating: feedback.surpriseRating,
            relevanceRating: feedback.relevanceRating,
          }),
        });
      } catch (error) {
        console.error('Error submitting surprise discovery feedback:', error);
      }
    },
    [trackDiscoveryEvent]
  );

  const trackModePreference = useCallback(
    async (mode: string, reason?: string) => {
      try {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            eventType: 'surprise_mode_preference',
            eventData: {
              userId: user?.uid,
              mode,
              reason,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (error) {
        console.error('Error tracking mode preference:', error);
      }
    },
    [user?.uid]
  );

  const trackSessionPattern = useCallback(
    async (
      sessionId: string,
      pattern: {
        totalDiscoveries: number;
        modesUsed: string[];
        averageEngagementTime: number;
        clickThroughRate: number;
        shareRate: number;
        feedbackRate: number;
      }
    ) => {
      try {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            eventType: 'surprise_session_pattern',
            eventData: {
              userId: user?.uid,
              sessionId,
              ...pattern,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (error) {
        console.error('Error tracking session pattern:', error);
      }
    },
    [user?.uid]
  );

  return {
    trackDiscovery,
    trackTermClick,
    trackShare,
    trackFeedback,
    trackModePreference,
    trackSessionPattern,
  };
}
