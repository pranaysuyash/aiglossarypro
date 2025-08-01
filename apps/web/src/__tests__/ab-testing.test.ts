import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ACTIVE_EXPERIMENTS, activateExperiments, getExperimentResults } from '@/services/activeExperiments';
import { posthogExperiments } from '@/services/posthogExperiments';

// Mock PostHog
vi.mock('@/services/posthogExperiments', () => ({
  posthogExperiments: {
    initialize: vi.fn(),
    setExperimentContext: vi.fn(),
    trackExperimentExposure: vi.fn(),
    getExperimentVariant: vi.fn(),
  },
}));

describe('A/B Testing System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'location', {
      value: { search: '', href: 'https://aiglossarypro.com' },
      configurable: true,
    });
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
  });

  describe('Experiment Configuration', () => {
    it('should have 5 active experiments', () => {
      const activeExperiments = ACTIVE_EXPERIMENTS.filter(exp => exp.status === 'active');
      expect(activeExperiments).toHaveLength(5);
    });

    it('should have valid variant weights that sum to 100%', () => {
      ACTIVE_EXPERIMENTS.forEach(experiment => {
        const totalWeight = experiment.variants.reduce((sum, variant) => sum + variant.weight, 0);
        expect(totalWeight).toBe(100);
      });
    });

    it('should track correct metrics for each experiment', () => {
      const landingHeadlineExp = ACTIVE_EXPERIMENTS.find(exp => exp.flagKey === 'landingPageHeadline');
      expect(landingHeadlineExp?.metrics).toContain('bounce_rate');
      expect(landingHeadlineExp?.metrics).toContain('cta_clicks');

      const exitIntentExp = ACTIVE_EXPERIMENTS.find(exp => exp.flagKey === 'exitIntentVariant');
      expect(exitIntentExp?.metrics).toContain('exit_intent_conversion');
      expect(exitIntentExp?.metrics).toContain('revenue_per_visitor');
    });
  });

  describe('Experiment Activation', () => {
    it('should initialize PostHog experiments', async () => {
      await activateExperiments();
      
      expect(posthogExperiments.initialize).toHaveBeenCalled();
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({
          launch_phase: expect.any(String),
          device_type: expect.any(String),
          traffic_source: expect.any(String),
          user_segment: expect.any(String),
        })
      );
    });

    it('should detect device type correctly', async () => {
      // Test mobile
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      await activateExperiments();
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ device_type: 'mobile' })
      );

      // Test tablet
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      await activateExperiments();
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ device_type: 'tablet' })
      );

      // Test desktop
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      await activateExperiments();
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ device_type: 'desktop' })
      );
    });

    it('should detect traffic source correctly', async () => {
      // Test UTM source
      Object.defineProperty(window, 'location', {
        value: { search: '?utm_source=twitter' },
      });
      await activateExperiments();
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ traffic_source: 'twitter' })
      );

      // Test referrer
      Object.defineProperty(window, 'location', { value: { search: '' } });
      Object.defineProperty(document, 'referrer', { value: 'https://google.com' });
      await activateExperiments();
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ traffic_source: 'google' })
      );
    });
  });

  describe('Experiment Results', () => {
    it('should return active experiment variants', () => {
      // Mock variant responses
      vi.mocked(posthogExperiments.getExperimentVariant)
        .mockReturnValueOnce('benefit_focused')
        .mockReturnValueOnce('urgency')
        .mockReturnValueOnce('simple')
        .mockReturnValueOnce('above_fold')
        .mockReturnValueOnce('action');

      const results = getExperimentResults();
      
      expect(results).toEqual({
        landingPageHeadline: 'benefit_focused',
        exitIntentVariant: 'urgency',
        pricingDisplay: 'simple',
        socialProofPlacement: 'above_fold',
        landingPageCTA: 'action',
      });
    });
  });

  describe('User Segmentation', () => {
    it('should identify new visitors correctly', async () => {
      localStorage.clear();
      await activateExperiments();
      
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ user_segment: 'new_visitor' })
      );
      expect(localStorage.getItem('returning_visitor')).toBe('true');
    });

    it('should identify returning visitors correctly', async () => {
      localStorage.setItem('returning_visitor', 'true');
      localStorage.setItem('page_views', '3');
      
      await activateExperiments();
      
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ user_segment: 'returning_visitor' })
      );
    });

    it('should identify engaged visitors correctly', async () => {
      localStorage.setItem('returning_visitor', 'true');
      localStorage.setItem('page_views', '10');
      
      await activateExperiments();
      
      expect(posthogExperiments.setExperimentContext).toHaveBeenCalledWith(
        expect.objectContaining({ user_segment: 'engaged_visitor' })
      );
    });
  });
});