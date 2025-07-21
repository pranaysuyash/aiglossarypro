/**
 * @jest-environment jsdom
 */

import {
  canGuestPreview,
  getGuestSession,
  getRemainingPreviews,
  getSessionAnalytics,
  hasReachedPreviewLimit,
  recordGuestPreview,
  resetGuestSession,
  saveGuestSession,
} from '../guestSession';

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

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/test-path',
  },
  writable: true,
});

describe('Guest Session Management', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('getGuestSession', () => {
    it('creates a new session when none exists', () => {
      const session = getGuestSession();

      expect(session).toBeDefined();
      expect(session.previewsUsed).toBe(0);
      expect(session.previewsLimit).toBe(2);
      expect(session.viewedTerms).toEqual([]);
      expect(session.sessionId).toMatch(/^guest_/);
      expect(session.conversionTracking.landingPage).toBe('/test-path');
    });

    it('retrieves existing session from localStorage', () => {
      const existingSession = {
        previewsUsed: 1,
        previewsLimit: 2,
        viewedTerms: ['term1'],
        sessionId: 'test-session',
        firstVisit: Date.now() - 1000,
        lastActivity: Date.now() - 500,
        conversionTracking: {
          landingPage: '/old-path',
          timeOnSite: 1000,
          termsViewed: 1,
          ctaClicks: 0,
        },
      };

      mockLocalStorage.setItem('aiglossary_guest_session', JSON.stringify(existingSession));

      const session = getGuestSession();
      expect(session.sessionId).toBe('test-session');
      expect(session.previewsUsed).toBe(1);
      expect(session.viewedTerms).toContain('term1');
    });

    it('creates new session if existing session is expired', () => {
      const expiredSession = {
        previewsUsed: 1,
        previewsLimit: 2,
        viewedTerms: ['term1'],
        sessionId: 'expired-session',
        firstVisit: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        lastActivity: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
        conversionTracking: {
          landingPage: '/old-path',
          timeOnSite: 1000,
          termsViewed: 1,
          ctaClicks: 0,
        },
      };

      mockLocalStorage.setItem('aiglossary_guest_session', JSON.stringify(expiredSession));

      const session = getGuestSession();
      expect(session.sessionId).not.toBe('expired-session');
      expect(session.previewsUsed).toBe(0);
      expect(session.viewedTerms).toEqual([]);
    });
  });

  describe('canGuestPreview', () => {
    it('returns true when previews are available', () => {
      const session = getGuestSession();
      expect(canGuestPreview(session)).toBe(true);
    });

    it('returns false when preview limit is reached', () => {
      const session = getGuestSession();
      session.previewsUsed = 2; // Reached limit
      expect(canGuestPreview(session)).toBe(false);
    });
  });

  describe('recordGuestPreview', () => {
    it('records new term preview correctly', () => {
      resetGuestSession();
      const updatedSession = recordGuestPreview('term1');

      expect(updatedSession.previewsUsed).toBe(1);
      expect(updatedSession.viewedTerms).toContain('term1');
      expect(updatedSession.conversionTracking.termsViewed).toBe(1);
    });

    it('does not increment count for already viewed terms', () => {
      resetGuestSession();
      recordGuestPreview('term1');
      const updatedSession = recordGuestPreview('term1'); // Same term again

      expect(updatedSession.previewsUsed).toBe(1); // Should not increment
      expect(updatedSession.viewedTerms).toEqual(['term1']);
    });

    it('records multiple different terms', () => {
      resetGuestSession();
      recordGuestPreview('term1');
      const updatedSession = recordGuestPreview('term2');

      expect(updatedSession.previewsUsed).toBe(2);
      expect(updatedSession.viewedTerms).toEqual(['term1', 'term2']);
    });
  });

  describe('getRemainingPreviews', () => {
    it('returns correct remaining previews', () => {
      resetGuestSession();
      expect(getRemainingPreviews()).toBe(2);

      recordGuestPreview('term1');
      expect(getRemainingPreviews()).toBe(1);

      recordGuestPreview('term2');
      expect(getRemainingPreviews()).toBe(0);
    });
  });

  describe('hasReachedPreviewLimit', () => {
    it('returns false when previews are available', () => {
      resetGuestSession();
      expect(hasReachedPreviewLimit()).toBe(false);

      recordGuestPreview('term1');
      expect(hasReachedPreviewLimit()).toBe(false);
    });

    it('returns true when limit is reached', () => {
      resetGuestSession();
      recordGuestPreview('term1');
      recordGuestPreview('term2');
      expect(hasReachedPreviewLimit()).toBe(true);
    });
  });

  describe('getSessionAnalytics', () => {
    it('calculates engagement score correctly', () => {
      resetGuestSession();
      recordGuestPreview('term1');
      recordGuestPreview('term2');

      const analytics = getSessionAnalytics();

      expect(analytics.previewsUsed).toBe(2);
      expect(analytics.hasReachedLimit).toBe(true);
      expect(analytics.termsViewed).toBe(2);
      expect(analytics.engagementScore).toBeGreaterThan(0);
    });

    it('tracks time on site', () => {
      const session = getGuestSession();
      // Simulate time passing
      session.lastActivity = session.firstVisit + 60000; // 1 minute later
      saveGuestSession(session);

      const analytics = getSessionAnalytics();
      expect(analytics.timeOnSite).toBeGreaterThan(0);
    });
  });

  describe('resetGuestSession', () => {
    it('clears session from localStorage', () => {
      const session = getGuestSession();
      recordGuestPreview('term1');

      resetGuestSession();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aiglossary_guest_session');
    });
  });
});

describe('Guest Session Edge Cases', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('handles corrupted localStorage data gracefully', () => {
    mockLocalStorage.setItem('aiglossary_guest_session', 'invalid-json');

    const session = getGuestSession();
    expect(session).toBeDefined();
    expect(session.previewsUsed).toBe(0);
  });

  it('handles localStorage errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const session = getGuestSession();
    expect(session).toBeDefined();

    // Should not throw when saving fails
    expect(() => saveGuestSession(session)).not.toThrow();
  });

  it('handles missing window object gracefully', () => {
    const originalWindow = global.window;

    (global as any).window = undefined;

    const session = getGuestSession();
    expect(session).toBeDefined();

    global.window = originalWindow;
  });
});
