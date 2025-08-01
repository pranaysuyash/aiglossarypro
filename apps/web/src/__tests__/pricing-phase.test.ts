import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCurrentPhase, getCurrentPhaseConfig, getExitIntentPricing, PRICING_PHASES } from '@/config/pricing';
import { pricingPhaseService } from '@/services/pricingPhaseService';

// Mock environment variable
vi.mock('@/config/pricing', async () => {
  const actual = await vi.importActual('@/config/pricing');
  return {
    ...actual,
    getCurrentPhase: vi.fn(() => 'early'),
  };
});

describe('Pricing Phase System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phase Configuration', () => {
    it('should have all required phases', () => {
      expect(PRICING_PHASES).toHaveProperty('beta');
      expect(PRICING_PHASES).toHaveProperty('early');
      expect(PRICING_PHASES).toHaveProperty('launch');
      expect(PRICING_PHASES).toHaveProperty('regular');
    });

    it('should have correct pricing progression', () => {
      expect(PRICING_PHASES.beta.price).toBe(124);
      expect(PRICING_PHASES.early.price).toBe(162);
      expect(PRICING_PHASES.launch.price).toBe(199);
      expect(PRICING_PHASES.regular.price).toBe(249);
    });

    it('should have decreasing discount percentages', () => {
      expect(PRICING_PHASES.beta.discountPercentage).toBe(50);
      expect(PRICING_PHASES.early.discountPercentage).toBe(35);
      expect(PRICING_PHASES.launch.discountPercentage).toBe(20);
      expect(PRICING_PHASES.regular.discountPercentage).toBe(0);
    });
  });

  describe('Exit Intent Pricing', () => {
    it('should calculate correct exit-intent pricing for early phase', () => {
      const exitPricing = getExitIntentPricing();
      
      // Early phase: $162 with 15% extra discount
      const expectedPrice = Math.round(162 * (1 - 15 / 100));
      expect(exitPricing.price).toBe(expectedPrice);
      expect(exitPricing.extraDiscount).toBe(15);
      expect(exitPricing.discountCode).toBe('EXITEARLY35');
    });

    it('should generate proper discount codes', () => {
      const phases: Array<keyof typeof PRICING_PHASES> = ['beta', 'early', 'launch', 'regular'];
      
      phases.forEach(phase => {
        vi.mocked(getCurrentPhase).mockReturnValue(phase);
        const exitPricing = getExitIntentPricing();
        
        if (phase === 'regular') {
          expect(exitPricing.discountCode).toBe('EXIT');
        } else {
          expect(exitPricing.discountCode).toContain('EXIT');
          expect(exitPricing.discountCode).toContain(PRICING_PHASES[phase].discountCode);
        }
      });
    });
  });

  describe('Phase Transitions', () => {
    it('should track phase order correctly', () => {
      const phaseOrder = pricingPhaseService.getPhaseOrder();
      expect(phaseOrder).toEqual(['beta', 'early', 'launch', 'regular']);
    });

    it('should identify next phase correctly', () => {
      const service = pricingPhaseService;
      
      // Mock current phase as 'beta'
      service['currentPhase'] = 'beta';
      expect(service.getNextPhase()).toBe('early');
      
      // Mock current phase as 'regular'
      service['currentPhase'] = 'regular';
      expect(service.getNextPhase()).toBeNull();
    });
  });

  describe('Phase Progress Tracking', () => {
    it('should calculate phase progress correctly', () => {
      const service = pricingPhaseService;
      service['currentPhase'] = 'early';
      service['salesCount'] = 50;
      
      const progress = service.getPhaseProgress();
      
      expect(progress.phase).toBe('early');
      expect(progress.soldCount).toBe(50);
      expect(progress.totalSlots).toBe(200);
      expect(progress.percentage).toBe(25);
    });

    it('should handle infinite slots for regular phase', () => {
      const service = pricingPhaseService;
      service['currentPhase'] = 'regular';
      service['salesCount'] = 1000;
      
      const progress = service.getPhaseProgress();
      
      expect(progress.totalSlots).toBe(Infinity);
      expect(progress.percentage).toBe(0);
    });
  });
});

describe('Gumroad Integration', () => {
  it('should generate correct Gumroad URLs with discount codes', () => {
    const { getGumroadUrlWithDiscount, PRICING_CONFIG } = require('@/config/pricing');
    
    // Test with phase discount code
    const urlWithDiscount = getGumroadUrlWithDiscount('EARLY35');
    expect(urlWithDiscount).toBe(`${PRICING_CONFIG.GUMROAD_URL}/EARLY35`);
    
    // Test without discount code
    const urlWithoutDiscount = getGumroadUrlWithDiscount();
    expect(urlWithoutDiscount).toBe(PRICING_CONFIG.GUMROAD_URL);
  });
});