/**
 * @jest-environment jsdom
 */

import {
  clearConversionSession,
  getConversionFunnelAnalytics,
  getConversionSession,
  getConversionSessionAnalytics,
  markConversionCompleted,
  trackConversionEvent,
} from '../conversionTracking';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as any;

// Mock analytics functions
const mockGtag = vi.fn();
const mockFbq = vi.fn();
const mockMixpanel = { track: vi.fn() };

Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

Object.defineProperty(window, 'fbq', {
  value: mockFbq,
  writable: true,
});

Object.defineProperty(window, 'mixpanel', {
  value: mockMixpanel,
  writable: true,
});

// Mock window.location for URLSearchParams
Object.defineProperty(window, 'location', {
  value: {
    search: '?utm_source=google&utm_medium=cpc&utm_campaign=ai_terms',
    href: 'https://test.com/',
  },
  writable: true,
});

// Mock document.referrer
Object.defineProperty(document, 'referrer', {
  value: 'https://google.com',
  writable: true,
});

describe('Conversion Tracking', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe('getConversionSession', () => {
    it('creates a new conversion session when none exists', () => {
      const session = getConversionSession();

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^conv_/);
      expect(session.isConverted).toBe(false);
      expect(session.funnelSteps).toHaveLength(1);
      expect(session.funnelSteps[0].step).toBe('landing');
      expect(session.source).toBe('google');
      expect(session.medium).toBe('cpc');
      expect(session.campaign).toBe('ai_terms');
    });

    it('retrieves and updates existing session', () => {
      const existingSession = {
        sessionId: 'existing-session',
        isConverted: false,
        funnelSteps: [{ step: 'landing', timestamp: Date.now() - 1000 }],
        totalEvents: 1,
        firstTouch: Date.now() - 1000,
        lastTouch: Date.now() - 500,
        source: 'direct',
        medium: 'organic',
      };

      mockLocalStorage.setItem('conversion_session', JSON.stringify(existingSession));

      const session = getConversionSession();
      expect(session.sessionId).toBe('existing-session');
      expect(session.lastTouch).toBeGreaterThan(existingSession.lastTouch);
    });
  });

  describe('trackConversionEvent', () => {
    it('tracks guest view event and updates funnel', () => {
      clearConversionSession();

      trackConversionEvent({
        eventType: 'guest_view',
        termId: 'test-term',
        metadata: { previewNumber: 1 },
      });

      const session = getConversionSession();
      expect(session.totalEvents).toBe(1);
      expect(session.funnelSteps).toHaveLength(2);
      expect(session.funnelSteps[1].step).toBe('preview');
      expect(session.funnelSteps[1].metadata?.termId).toBe('test-term');
    });

    it('tracks CTA clicks', () => {
      clearConversionSession();

      trackConversionEvent({
        eventType: 'guest_cta_click',
        ctaType: 'signup_button',
        metadata: { limitReached: true },
      });

      const session = getConversionSession();
      expect(session.totalEvents).toBe(1);
      expect(session.funnelSteps).toHaveLength(2);
      expect(session.funnelSteps[1].step).toBe('limit_reached');
    });

    it('marks conversion on successful signup', () => {
      clearConversionSession();

      trackConversionEvent({
        eventType: 'guest_signup_success',
        metadata: { userId: 'user123' },
      });

      const session = getConversionSession();
      expect(session.isConverted).toBe(true);
      expect(session.conversionType).toBe('free_signup');
      expect(session.userId).toBe('user123');
      expect(session.conversionTime).toBeDefined();
    });

    it('tracks premium conversion with value', () => {
      clearConversionSession();

      trackConversionEvent({
        eventType: 'guest_to_premium',
        conversionValue: 249,
        metadata: { userId: 'user123' },
      });

      const session = getConversionSession();
      expect(session.isConverted).toBe(true);
      expect(session.conversionType).toBe('premium_purchase');
      expect(session.conversionValue).toBe(249);
    });

    it('sends events to Google Analytics', () => {
      trackConversionEvent({
        eventType: 'guest_view',
        termId: 'test-term',
        metadata: {},
      });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'guest_view',
        expect.objectContaining({
          event_category: 'conversion',
          event_label: 'test-term',
        })
      );
    });

    it('sends conversion events to Facebook Pixel', () => {
      trackConversionEvent({
        eventType: 'guest_signup_success',
        metadata: {},
      });

      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'CompleteRegistration',
        expect.objectContaining({
          content_name: 'AI Glossary Free Signup',
          value: 0,
          currency: 'USD',
        })
      );
    });

    it('sends data to server', () => {
      trackConversionEvent({
        eventType: 'guest_view',
        termId: 'test-term',
        metadata: {},
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/analytics/conversion',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('guest_view'),
        })
      );
    });
  });

  describe('getConversionFunnelAnalytics', () => {
    it('returns current funnel state', () => {
      clearConversionSession();

      trackConversionEvent({
        eventType: 'guest_view',
        termId: 'term1',
        metadata: {},
      });

      const analytics = getConversionFunnelAnalytics();

      expect(analytics.currentStep).toBe('preview');
      expect(analytics.completedSteps).toContain('landing');
      expect(analytics.completedSteps).toContain('preview');
      expect(analytics.timeInFunnel).toBeGreaterThan(0);
      expect(analytics.nextBestAction).toBeDefined();
    });

    it('calculates dropoff risk correctly', () => {
      clearConversionSession();

      // Simulate old session with low engagement
      const session = getConversionSession();
      session.firstTouch = Date.now() - 35 * 60 * 1000; // 35 minutes ago
      session.totalEvents = 1;
      mockLocalStorage.setItem('conversion_session', JSON.stringify(session));

      const analytics = getConversionFunnelAnalytics();
      expect(analytics.dropoffRisk).toBe('high');
    });
  });

  describe('getConversionSessionAnalytics', () => {
    it('calculates session metrics correctly', () => {
      clearConversionSession();

      // Track some events
      trackConversionEvent({ eventType: 'guest_view', termId: 'term1', metadata: {} });
      trackConversionEvent({ eventType: 'guest_view', termId: 'term2', metadata: {} });
      trackConversionEvent({ eventType: 'guest_cta_click', ctaType: 'signup', metadata: {} });

      const analytics = getConversionSessionAnalytics();

      expect(analytics.pageViews).toBe(2);
      expect(analytics.ctaClicks).toBe(3); // Total events
      expect(analytics.conversionLikelihood).toBeGreaterThan(0);
      expect(analytics.segmentType).toBeDefined();
    });

    it('segments users correctly', () => {
      clearConversionSession();

      // Create high-intent user behavior
      const session = getConversionSession();
      session.firstTouch = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      session.totalEvents = 5;
      session.funnelSteps.push(
        { step: 'preview', timestamp: Date.now() - 8 * 60 * 1000 },
        { step: 'preview', timestamp: Date.now() - 6 * 60 * 1000 }
      );
      mockLocalStorage.setItem('conversion_session', JSON.stringify(session));

      const analytics = getConversionSessionAnalytics();
      expect(analytics.segmentType).toBe('high_intent');
      expect(analytics.conversionLikelihood).toBeGreaterThan(60);
    });
  });

  describe('markConversionCompleted', () => {
    it('marks free signup conversion', () => {
      clearConversionSession();

      markConversionCompleted('free_signup', 0, 'user123');

      const session = getConversionSession();
      expect(session.isConverted).toBe(true);
      expect(session.conversionType).toBe('free_signup');
      expect(session.userId).toBe('user123');
    });

    it('marks premium conversion with value', () => {
      clearConversionSession();

      markConversionCompleted('premium_purchase', 249, 'user123');

      const session = getConversionSession();
      expect(session.isConverted).toBe(true);
      expect(session.conversionType).toBe('premium_purchase');
      expect(session.conversionValue).toBe(249);
    });
  });

  describe('clearConversionSession', () => {
    it('removes session data from localStorage', () => {
      getConversionSession(); // Create session

      clearConversionSession();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conversion_session');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('conversion_funnel');
    });
  });
});

describe('Conversion Tracking Edge Cases', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  it('handles localStorage errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    expect(() => {
      trackConversionEvent({
        eventType: 'guest_view',
        termId: 'test',
        metadata: {},
      });
    }).not.toThrow();
  });

  it('handles missing analytics objects gracefully', () => {
    (window as any).gtag = undefined;
    (window as any).fbq = undefined;
    (window as any).mixpanel = undefined;

    expect(() => {
      trackConversionEvent({
        eventType: 'guest_view',
        termId: 'test',
        metadata: {},
      });
    }).not.toThrow();
  });

  it('handles network errors when sending to server', () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    expect(() => {
      trackConversionEvent({
        eventType: 'guest_view',
        termId: 'test',
        metadata: {},
      });
    }).not.toThrow();
  });
});
