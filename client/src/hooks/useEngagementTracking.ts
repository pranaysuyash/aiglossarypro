/**
 * Engagement Tracking Hook
 * Client-side engagement tracking with automatic metrics collection
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useDeviceDetection } from './useDeviceDetection';

interface EngagementSession {
  sessionId: string;
  startTime: Date;
  currentTermId?: string;
  interactions: number;
  scrollEvents: number;
  readingTime: number;
}

interface ReadingMetrics {
  startTime: Date;
  scrollDepth: number;
  timeOnPage: number;
  wordsRead: number;
  readingVelocity: number;
  isReading: boolean;
}

interface EngagementHookOptions {
  trackingEnabled?: boolean;
  autoTrackScroll?: boolean;
  autoTrackReading?: boolean;
  readingVelocityThreshold?: number; // words per minute threshold for active reading
  heartbeatInterval?: number; // ms between progress updates
  scrollThreshold?: number; // minimum scroll distance to trigger tracking
}

const DEFAULT_OPTIONS: Required<EngagementHookOptions> = {
  trackingEnabled: true,
  autoTrackScroll: true,
  autoTrackReading: true,
  readingVelocityThreshold: 100, // 100 WPM minimum for active reading
  heartbeatInterval: 10000, // 10 seconds
  scrollThreshold: 50, // 50px minimum scroll
};

export const useEngagementTracking = (termId?: string, options: EngagementHookOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [location] = useLocation();
  const device = useDeviceDetection();

  const [session, setSession] = useState<EngagementSession | null>(null);
  const [readingMetrics, setReadingMetrics] = useState<ReadingMetrics | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const scrollPositionRef = useRef(0);
  const totalHeightRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const readingStartTimeRef = useRef<Date | null>(null);
  const wordsReadRef = useRef(0);

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize session
  const initializeSession = useCallback(() => {
    if (!config.trackingEnabled) return;

    const newSession: EngagementSession = {
      sessionId: generateSessionId(),
      startTime: new Date(),
      currentTermId: termId,
      interactions: 0,
      scrollEvents: 0,
      readingTime: 0,
    };

    setSession(newSession);
    setIsTracking(true);

    // Track initial page view
    trackInteraction('view', {
      sessionId: newSession.sessionId,
      termId,
      metadata: {
        entryPoint: location,
        deviceType: device.isMobile ? 'mobile' : device.isTablet ? 'tablet' : 'desktop',
        screenSize: device.screenSize,
        userAgent: navigator.userAgent,
      },
    });
  }, [
    config.trackingEnabled,
    termId,
    location,
    device,
    generateSessionId, // Track initial page view
     
  ]);

  // Track interaction
  const trackInteraction = useCallback(
    async (
      interactionType: string,
      data?: {
        sessionId?: string;
        termId?: string;
        duration?: number;
        metadata?: any;
        contentInfo?: {
          scrollDepth: number;
          readingProgress: number;
          timeOnContent: number;
          wordsRead: number;
        };
      }
    ) => {
      if (!config.trackingEnabled || !session) return;

      try {
        const payload = {
          sessionId: data?.sessionId || session.sessionId,
          termId: data?.termId || termId,
          interactionType,
          duration: data?.duration,
          metadata: data?.metadata,
          deviceInfo: {
            type: device.isMobile
              ? ('mobile' as const)
              : device.isTablet
                ? ('tablet' as const)
                : ('desktop' as const),
            userAgent: navigator.userAgent,
            screenResolution: `${device.viewportWidth}x${device.viewportHeight}`,
          },
          contentInfo: data?.contentInfo,
        };

        await fetch('/api/engagement/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Update session interaction count
        setSession((prev) =>
          prev
            ? {
                ...prev,
                interactions: prev.interactions + 1,
                ...(interactionType === 'scroll' && { scrollEvents: prev.scrollEvents + 1 }),
              }
            : null
        );
      } catch (error) {
        console.warn('Failed to track interaction:', error);
      }
    },
    [config.trackingEnabled, session, termId, device]
  );

  // Track reading progress
  const trackReadingProgress = useCallback(async () => {
    if (!config.trackingEnabled || !session || !readingMetrics || !termId) return;

    try {
      const currentTime = new Date();
      const timeSpent = (currentTime.getTime() - readingMetrics.startTime.getTime()) / 1000;

      await fetch('/api/engagement/reading-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          termId,
          scrollPosition: scrollPositionRef.current,
          totalHeight: totalHeightRef.current,
          timeSpent,
          wordsRead: wordsReadRef.current,
          readingVelocity: readingMetrics.readingVelocity,
        }),
      });
    } catch (error) {
      console.warn('Failed to track reading progress:', error);
    }
  }, [config.trackingEnabled, session, readingMetrics, termId]);

  // Calculate words read based on scroll position
  const calculateWordsRead = useCallback((scrollDepth: number) => {
    // Estimate based on average words per page and scroll depth
    const estimatedWordsPerPage = 500; // Typical AI/ML term explanation
    return Math.floor((scrollDepth / 100) * estimatedWordsPerPage);
  }, []);

  // Calculate reading velocity
  const calculateReadingVelocity = useCallback((wordsRead: number, timeSpent: number) => {
    if (timeSpent === 0) return 0;
    return (wordsRead / timeSpent) * 60; // words per minute
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!config.autoTrackScroll || !session) return;

    const currentTime = Date.now();
    const currentScrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Throttle scroll events
    if (currentTime - lastScrollTimeRef.current < 100) return;

    const scrollDelta = Math.abs(currentScrollY - scrollPositionRef.current);
    if (scrollDelta < config.scrollThreshold) return;

    scrollPositionRef.current = currentScrollY;
    totalHeightRef.current = documentHeight;
    lastScrollTimeRef.current = currentTime;

    const scrollDepth = documentHeight > 0 ? (currentScrollY / documentHeight) * 100 : 0;
    const wordsRead = calculateWordsRead(scrollDepth);
    wordsReadRef.current = wordsRead;

    // Update reading metrics
    if (readingMetrics) {
      const timeSpent = (currentTime - readingMetrics.startTime.getTime()) / 1000;
      const readingVelocity = calculateReadingVelocity(wordsRead, timeSpent);

      setReadingMetrics((prev) =>
        prev
          ? {
              ...prev,
              scrollDepth,
              timeOnPage: timeSpent,
              wordsRead,
              readingVelocity,
              isReading: readingVelocity >= config.readingVelocityThreshold,
            }
          : null
      );

      // Track significant scroll milestones
      if (scrollDepth > 25 && scrollDepth % 25 === 0) {
        trackInteraction('scroll', {
          contentInfo: {
            scrollDepth,
            readingProgress: scrollDepth,
            timeOnContent: timeSpent,
            wordsRead,
          },
          metadata: {
            scrollMilestone: scrollDepth,
            readingVelocity,
          },
        });
      }
    }
  }, [
    config.autoTrackScroll,
    config.scrollThreshold,
    config.readingVelocityThreshold,
    session,
    readingMetrics,
    calculateWordsRead,
    calculateReadingVelocity,
    trackInteraction,
  ]);

  // Initialize reading metrics
  const startReadingTracking = useCallback(() => {
    if (!config.autoTrackReading || !termId) return;

    const metrics: ReadingMetrics = {
      startTime: new Date(),
      scrollDepth: 0,
      timeOnPage: 0,
      wordsRead: 0,
      readingVelocity: 0,
      isReading: false,
    };

    setReadingMetrics(metrics);
    readingStartTimeRef.current = new Date();
  }, [config.autoTrackReading, termId]);

  // Set up heartbeat for progress tracking
  useEffect(() => {
    if (!config.trackingEnabled || !session) return;

    heartbeatIntervalRef.current = setInterval(() => {
      if (readingMetrics && termId) {
        trackReadingProgress();
      }
    }, config.heartbeatInterval);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [
    config.trackingEnabled,
    config.heartbeatInterval,
    session,
    readingMetrics,
    termId,
    trackReadingProgress,
  ]);

  // Set up scroll listener
  useEffect(() => {
    if (!config.autoTrackScroll) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [config.autoTrackScroll, handleScroll]);

  // Initialize session on mount or term change
  useEffect(() => {
    initializeSession();
    startReadingTracking();

    return () => {
      // Track session end
      if (session) {
        trackInteraction('session_end', {
          duration: (Date.now() - session.startTime.getTime()) / 1000,
          metadata: {
            totalInteractions: session.interactions,
            scrollEvents: session.scrollEvents,
            finalScrollDepth: readingMetrics?.scrollDepth || 0,
          },
        });
      }
    };
  }, [
    initializeSession,
    readingMetrics?.scrollDepth,
    session,
    startReadingTracking,
    trackInteraction,
  ]); // Re-initialize when term or location changes

  // Public interface
  const trackCustomInteraction = useCallback(
    (interactionType: string, metadata?: any) => {
      trackInteraction(interactionType, { metadata });
    },
    [trackInteraction]
  );

  const trackFavorite = useCallback(() => {
    trackCustomInteraction('favorite');
  }, [trackCustomInteraction]);

  const trackShare = useCallback(() => {
    trackCustomInteraction('share');
  }, [trackCustomInteraction]);

  const trackSearch = useCallback(
    (query: string) => {
      trackCustomInteraction('search', { searchQuery: query });
    },
    [trackCustomInteraction]
  );

  const trackCopy = useCallback(
    (content: string) => {
      trackCustomInteraction('copy', {
        contentType: 'text',
        contentLength: content.length,
      });
    },
    [trackCustomInteraction]
  );

  const getEngagementSummary = useCallback(() => {
    if (!session || !readingMetrics) return null;

    const currentTime = new Date();
    const totalSessionTime = (currentTime.getTime() - session.startTime.getTime()) / 1000;

    return {
      sessionDuration: totalSessionTime,
      interactions: session.interactions,
      scrollEvents: session.scrollEvents,
      scrollDepth: readingMetrics.scrollDepth,
      wordsRead: readingMetrics.wordsRead,
      readingVelocity: readingMetrics.readingVelocity,
      isActivelyReading: readingMetrics.isReading,
      engagementLevel: calculateEngagementLevel(
        totalSessionTime,
        session.interactions,
        readingMetrics.scrollDepth,
        readingMetrics.readingVelocity
      ),
    };
     
  }, [session, readingMetrics]);

  // Calculate engagement level
  const calculateEngagementLevel = (
    sessionTime: number,
    interactions: number,
    scrollDepth: number,
    readingVelocity: number
  ): 'low' | 'medium' | 'high' => {
    const timeScore = Math.min(sessionTime / 120, 1); // 2 minutes = max time score
    const interactionScore = Math.min(interactions / 10, 1); // 10 interactions = max
    const scrollScore = scrollDepth / 100;
    const velocityScore = Math.min(readingVelocity / 200, 1); // 200 WPM = max

    const overallScore = (timeScore + interactionScore + scrollScore + velocityScore) / 4;

    if (overallScore >= 0.7) return 'high';
    if (overallScore >= 0.4) return 'medium';
    return 'low';
  };

  return {
    isTracking,
    session,
    readingMetrics,
    trackCustomInteraction,
    trackFavorite,
    trackShare,
    trackSearch,
    trackCopy,
    getEngagementSummary,
  };
};
