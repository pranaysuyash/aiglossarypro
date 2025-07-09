import { useCallback, useEffect } from 'react';
import { useToast } from './use-toast';

interface DiscoveryEvent {
  eventType:
    | 'view'
    | 'filter_change'
    | 'node_click'
    | 'relationship_explore'
    | 'search'
    | 'layout_change';
  eventData: Record<string, any>;
  timestamp?: Date;
}

interface DiscoverySession {
  sessionId: string;
  startTime: Date;
  events: DiscoveryEvent[];
  currentFilters?: any;
  exploredNodes: Set<string>;
  exploredRelationships: Set<string>;
}

export function useDiscoveryAnalytics(userId?: string) {
  const { toast } = useToast();
  const sessionId = `discovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Track discovery event
  const trackEvent = useCallback(
    async (event: DiscoveryEvent) => {
      try {
        // Add timestamp if not provided
        if (!event.timestamp) {
          event.timestamp = new Date();
        }

        // Send to analytics endpoint
        await fetch('/api/analytics/discovery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            userId,
            event,
          }),
        });

        // Store in local session for pattern analysis
        const sessionData = localStorage.getItem('discoverySession');
        const session: DiscoverySession = sessionData
          ? JSON.parse(sessionData)
          : {
              sessionId,
              startTime: new Date(),
              events: [],
              exploredNodes: new Set(),
              exploredRelationships: new Set(),
            };

        session.events.push(event);

        // Track explored entities
        if (event.eventType === 'node_click' && event.eventData.nodeId) {
          session.exploredNodes.add(event.eventData.nodeId);
        }
        if (event.eventType === 'relationship_explore' && event.eventData.relationshipId) {
          session.exploredRelationships.add(event.eventData.relationshipId);
        }

        localStorage.setItem(
          'discoverySession',
          JSON.stringify({
            ...session,
            exploredNodes: Array.from(session.exploredNodes),
            exploredRelationships: Array.from(session.exploredRelationships),
          })
        );
      } catch (error) {
        console.error('Failed to track discovery event:', error);
      }
    },
    [sessionId, userId]
  );

  // Track filter changes
  const trackFilterChange = useCallback(
    (filters: any, previousFilters: any) => {
      const changes: Record<string, any> = {};

      // Detect which filters changed
      Object.keys(filters).forEach((key) => {
        if (JSON.stringify(filters[key]) !== JSON.stringify(previousFilters[key])) {
          changes[key] = {
            from: previousFilters[key],
            to: filters[key],
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        trackEvent({
          eventType: 'filter_change',
          eventData: {
            changes,
            currentFilters: filters,
          },
        });
      }
    },
    [trackEvent]
  );

  // Track node interactions
  const trackNodeInteraction = useCallback(
    (nodeId: string, nodeType: string, interactionType: 'click' | 'hover' | 'expand') => {
      trackEvent({
        eventType: 'node_click',
        eventData: {
          nodeId,
          nodeType,
          interactionType,
        },
      });
    },
    [trackEvent]
  );

  // Track relationship exploration
  const trackRelationshipExploration = useCallback(
    (fromNodeId: string, toNodeId: string, relationshipType: string, depth: number) => {
      trackEvent({
        eventType: 'relationship_explore',
        eventData: {
          fromNodeId,
          toNodeId,
          relationshipType,
          depth,
          relationshipId: `${fromNodeId}-${relationshipType}-${toNodeId}`,
        },
      });
    },
    [trackEvent]
  );

  // Track search queries
  const trackSearch = useCallback(
    (query: string, resultCount: number, searchType: 'semantic' | 'standard') => {
      trackEvent({
        eventType: 'search',
        eventData: {
          query,
          resultCount,
          searchType,
        },
      });
    },
    [trackEvent]
  );

  // Track layout changes
  const trackLayoutChange = useCallback(
    (layoutType: string, previousLayout: string) => {
      trackEvent({
        eventType: 'layout_change',
        eventData: {
          from: previousLayout,
          to: layoutType,
        },
      });
    },
    [trackEvent]
  );

  // Get discovery insights
  const getDiscoveryInsights = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics/discovery/insights?sessionId=${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch discovery insights');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get discovery insights:', error);
      return null;
    }
  }, [sessionId]);

  // Get personalized recommendations based on discovery patterns
  const getRecommendations = useCallback(
    async (currentNodeId?: string) => {
      try {
        const sessionData = localStorage.getItem('discoverySession');
        const session = sessionData ? JSON.parse(sessionData) : null;

        const response = await fetch('/api/personalization/discovery-recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            currentNodeId,
            sessionData: session,
            recentEvents: session?.events.slice(-10), // Last 10 events
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('Failed to get recommendations:', error);
        return null;
      }
    },
    [userId]
  );

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      // Send session end event
      trackEvent({
        eventType: 'view',
        eventData: {
          action: 'session_end',
          duration: Date.now() - parseInt(sessionId.split('-')[1]),
        },
      });
    };
  }, [sessionId, trackEvent]);

  return {
    trackEvent,
    trackFilterChange,
    trackNodeInteraction,
    trackRelationshipExploration,
    trackSearch,
    trackLayoutChange,
    getDiscoveryInsights,
    getRecommendations,
    sessionId,
  };
}
