import { useCallback, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './useAuth';

interface TrackingEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  context?: Record<string, any>;
}

interface EngagementData {
  timeSpent: number;
  scrollDepth: number;
  interactions: number;
  focusTime: number;
}

export const usePersonalizationTracking = () => {
  const { isAuthenticated } = useAuth();
  const sessionStartTime = useRef<number>(Date.now());
  const currentPath = useRef<string>('');
  const engagementData = useRef<EngagementData>({
    timeSpent: 0,
    scrollDepth: 0,
    interactions: 0,
    focusTime: 0,
  });
  const isVisible = useRef<boolean>(true);
  const lastScrollDepth = useRef<number>(0);
  const interactionCount = useRef<number>(0);

  // Track basic event
  const trackEvent = useCallback(
    async (event: TrackingEvent) => {
      if (!isAuthenticated) return;

      try {
        await apiRequest('POST', '/api/analytics/behavior', {
          ...event,
          timestamp: new Date().toISOString(),
          sessionDuration: Date.now() - sessionStartTime.current,
        });
      } catch (error) {
        console.error('Error tracking event:', error);
      }
    },
    [isAuthenticated]
  );

  // Track page view
  const trackPageView = useCallback(
    (path: string, additionalContext?: Record<string, any>) => {
      if (!isAuthenticated) return;

      // Update current path
      currentPath.current = path;

      // Reset engagement data for new page
      engagementData.current = {
        timeSpent: 0,
        scrollDepth: 0,
        interactions: 0,
        focusTime: 0,
      };
      lastScrollDepth.current = 0;
      interactionCount.current = 0;
      sessionStartTime.current = Date.now();

      // Determine entity type and ID from path
      const { entityType, entityId } = parsePathForTracking(path);

      trackEvent({
        eventType: 'page_view',
        entityType,
        entityId: entityId || path,
        context: {
          path,
          referrer: document.referrer,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          deviceType: getDeviceType(),
          ...additionalContext,
        },
      });
    },
    [isAuthenticated, trackEvent]
  );

  // Track term view
  const trackTermView = useCallback(
    (termId: string, termData?: any) => {
      trackEvent({
        eventType: 'view',
        entityType: 'term',
        entityId: termId,
        context: { termData },
      });
    },
    [trackEvent]
  );

  // Track search
  const trackSearch = useCallback(
    (query: string, filters?: any, results?: any[]) => {
      trackEvent({
        eventType: 'search',
        entityType: 'search',
        entityId: query,
        context: {
          query,
          filters,
          resultCount: results?.length,
          hasResults: (results?.length || 0) > 0,
        },
      });
    },
    [trackEvent]
  );

  // Track favorite action
  const trackFavorite = useCallback(
    (termId: string, action: 'add' | 'remove') => {
      trackEvent({
        eventType: 'favorite',
        entityType: 'term',
        entityId: termId,
        context: { action },
      });
    },
    [trackEvent]
  );

  // Track learning path progress
  const trackLearningProgress = useCallback(
    (pathId: string, stepId?: string, progress?: number) => {
      trackEvent({
        eventType: 'progress',
        entityType: 'learning_path',
        entityId: pathId,
        context: { stepId, progress },
      });
    },
    [trackEvent]
  );

  // Track content engagement (detailed)
  const trackContentEngagement = useCallback(
    (contentType: string, contentId: string, engagementType: string, data?: any) => {
      trackEvent({
        eventType: 'engagement',
        entityType: contentType,
        entityId: contentId,
        context: {
          engagementType,
          data,
          timeSpent: Date.now() - sessionStartTime.current,
          scrollDepth: engagementData.current.scrollDepth,
          interactions: engagementData.current.interactions,
        },
      });
    },
    [trackEvent]
  );

  // Track category exploration
  const trackCategoryView = useCallback(
    (categoryId: string, categoryData?: any) => {
      trackEvent({
        eventType: 'view',
        entityType: 'category',
        entityId: categoryId,
        context: { categoryData },
      });
    },
    [trackEvent]
  );

  // Track recommendation interaction
  const trackRecommendationInteraction = useCallback(
    (
      recommendationId: string,
      action: 'view' | 'click' | 'dismiss' | 'feedback',
      metadata?: any
    ) => {
      trackEvent({
        eventType: 'recommendation_interaction',
        entityType: 'recommendation',
        entityId: recommendationId,
        context: {
          action,
          metadata,
        },
      });
    },
    [trackEvent]
  );

  // Set up automatic tracking for scroll, time, and interactions
  useEffect(() => {
    if (!isAuthenticated) return;

    let focusStartTime = Date.now();

    // Track scroll depth
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > engagementData.current.scrollDepth) {
        engagementData.current.scrollDepth = scrollPercent;

        // Send milestone scroll events
        if (
          scrollPercent >= 25 &&
          scrollPercent % 25 === 0 &&
          scrollPercent > lastScrollDepth.current
        ) {
          lastScrollDepth.current = scrollPercent;
          trackEvent({
            eventType: 'scroll_milestone',
            entityType: 'page',
            entityId: currentPath.current,
            context: {
              scrollDepth: scrollPercent,
              timeToScroll: Date.now() - sessionStartTime.current,
            },
          });
        }
      }
    };

    // Track interactions
    const handleInteraction = (event: Event) => {
      engagementData.current.interactions++;
      interactionCount.current++;

      // Track significant interactions
      const target = event.target as HTMLElement;
      if (target.matches('button, a, input, select, textarea, [role="button"]')) {
        trackEvent({
          eventType: 'interaction',
          entityType: 'ui_element',
          entityId: target.id || target.className || target.tagName,
          context: {
            elementType: target.tagName,
            elementId: target.id,
            elementClass: target.className,
            eventType: event.type,
            text: target.textContent?.substring(0, 50),
          },
        });
      }
    };

    // Track focus/blur for engagement time
    const handleFocus = () => {
      isVisible.current = true;
      focusStartTime = Date.now();
    };

    const handleBlur = () => {
      if (isVisible.current) {
        engagementData.current.focusTime += Date.now() - focusStartTime;
        isVisible.current = false;
      }
    };

    // Track page unload for final engagement metrics
    const handleUnload = () => {
      if (isVisible.current) {
        engagementData.current.focusTime += Date.now() - focusStartTime;
      }

      engagementData.current.timeSpent = Date.now() - sessionStartTime.current;

      // Send final engagement data
      trackEvent({
        eventType: 'session_end',
        entityType: 'page',
        entityId: currentPath.current,
        context: {
          ...engagementData.current,
          interactions: interactionCount.current,
        },
      });
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleInteraction);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleUnload);

    // Check if page is currently focused
    if (document.hasFocus()) {
      handleFocus();
    }

    return () => {
      handleUnload();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isAuthenticated, trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackTermView,
    trackSearch,
    trackFavorite,
    trackLearningProgress,
    trackContentEngagement,
    trackCategoryView,
    trackRecommendationInteraction,
  };
};

// Helper functions
function parsePathForTracking(path: string): { entityType: string; entityId?: string } {
  if (path.startsWith('/term/')) {
    return { entityType: 'term', entityId: path.split('/')[2] };
  }

  if (path.startsWith('/category/')) {
    return { entityType: 'category', entityId: path.split('/')[2] };
  }

  if (path.startsWith('/learning-path/')) {
    return { entityType: 'learning_path', entityId: path.split('/')[2] };
  }

  if (path.includes('/search')) {
    return { entityType: 'search' };
  }

  if (path === '/' || path === '/home') {
    return { entityType: 'homepage' };
  }

  return { entityType: 'page' };
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Enhanced hook for specific component tracking
export const useComponentTracking = (componentName: string) => {
  const { trackEvent } = usePersonalizationTracking();
  const mountTime = useRef<number>(Date.now());

  const trackComponentEvent = useCallback(
    (action: string, data?: any) => {
      trackEvent({
        eventType: 'component_interaction',
        entityType: 'component',
        entityId: componentName,
        context: {
          action,
          data,
          componentMountDuration: Date.now() - mountTime.current,
        },
      });
    },
    [trackEvent, componentName]
  );

  const trackComponentView = useCallback(
    (data?: any) => {
      trackComponentEvent('view', data);
    },
    [trackComponentEvent]
  );

  const trackComponentInteraction = useCallback(
    (action: string, data?: any) => {
      trackComponentEvent(action, data);
    },
    [trackComponentEvent]
  );

  return {
    trackComponentView,
    trackComponentInteraction,
  };
};
