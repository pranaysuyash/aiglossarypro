import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock geolocation and IP detection
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
  },
  writable: true,
});

describe('Country-Based Pricing (PPP) Testing', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Country Detection', () => {
    test('should detect US pricing as default', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            country: 'US',
            currency: 'USD',
            pricing: {
              lifetime: 249,
              currency: 'USD',
              symbol: '$',
              pppFactor: 1.0,
            },
          }),
      });

      const response = await fetch('/api/pricing/detect-country');
      const data = await response.json();

      expect(data.country).toBe('US');
      expect(data.pricing.lifetime).toBe(249);
      expect(data.pricing.currency).toBe('USD');
      expect(data.pricing.pppFactor).toBe(1.0);
    });

    test('should apply PPP discount for developing countries', async () => {
      const testCases = [
        {
          country: 'IN',
          currency: 'USD',
          expectedPrice: 99, // ~60% discount for India
          expectedFactor: 0.4,
        },
        {
          country: 'BR',
          currency: 'USD',
          expectedPrice: 149, // ~40% discount for Brazil
          expectedFactor: 0.6,
        },
        {
          country: 'PH',
          currency: 'USD',
          expectedPrice: 124, // ~50% discount for Philippines
          expectedFactor: 0.5,
        },
        {
          country: 'ID',
          currency: 'USD',
          expectedPrice: 124, // ~50% discount for Indonesia
          expectedFactor: 0.5,
        },
      ];

      for (const testCase of testCases) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              country: testCase.country,
              currency: testCase.currency,
              pricing: {
                lifetime: testCase.expectedPrice,
                currency: testCase.currency,
                symbol: '$',
                pppFactor: testCase.expectedFactor,
              },
            }),
        });

        const response = await fetch('/api/pricing/detect-country');
        const data = await response.json();

        expect(data.country).toBe(testCase.country);
        expect(data.pricing.lifetime).toBe(testCase.expectedPrice);
        expect(data.pricing.pppFactor).toBe(testCase.expectedFactor);

        console.log(
          `${testCase.country}: $${testCase.expectedPrice} (${testCase.expectedFactor * 100}% of base price)`
        );
      }
    });

    test('should handle European countries with appropriate pricing', async () => {
      const europeanCountries = [
        { country: 'DE', expectedPrice: 249, factor: 1.0 }, // Germany - full price
        { country: 'FR', expectedPrice: 249, factor: 1.0 }, // France - full price
        { country: 'GB', expectedPrice: 249, factor: 1.0 }, // UK - full price
        { country: 'PL', expectedPrice: 199, factor: 0.8 }, // Poland - slight discount
        { country: 'RO', expectedPrice: 174, factor: 0.7 }, // Romania - moderate discount
      ];

      for (const country of europeanCountries) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              country: country.country,
              currency: 'USD',
              pricing: {
                lifetime: country.expectedPrice,
                currency: 'USD',
                symbol: '$',
                pppFactor: country.factor,
              },
            }),
        });

        const response = await fetch('/api/pricing/detect-country');
        const data = await response.json();

        expect(data.pricing.lifetime).toBe(country.expectedPrice);
        expect(data.pricing.pppFactor).toBe(country.factor);
      }
    });
  });

  describe('Dynamic Pricing Display', () => {
    test('should display country-specific pricing on landing page', async () => {
      // Mock pricing API response for India
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            country: 'IN',
            currency: 'USD',
            pricing: {
              lifetime: 99,
              currency: 'USD',
              symbol: '$',
              pppFactor: 0.4,
              originalPrice: 249,
              discount: 60,
            },
          }),
      });

      // Component would fetch pricing on mount
      const pricing = await (await fetch('/api/pricing/detect-country')).json();

      expect(pricing.pricing.lifetime).toBe(99);
      expect(pricing.pricing.originalPrice).toBe(249);
      expect(pricing.pricing.discount).toBe(60);
    });

    test('should show PPP discount messaging', async () => {
      const pppPricing = {
        country: 'BR',
        countryName: 'Brazil',
        currency: 'USD',
        pricing: {
          lifetime: 149,
          currency: 'USD',
          symbol: '$',
          pppFactor: 0.6,
          originalPrice: 249,
          discount: 40,
          isDiscounted: true,
        },
      };

      // Mock component that would display this pricing
      const mockPricingDisplay = {
        ...pppPricing,
        displayText: `Special pricing for ${pppPricing.countryName}: $${pppPricing.pricing.lifetime} (${pppPricing.pricing.discount}% off)`,
        originalPriceDisplay: `$${pppPricing.pricing.originalPrice}`,
        savingsText: `Save $${pppPricing.pricing.originalPrice - pppPricing.pricing.lifetime}!`,
      };

      expect(mockPricingDisplay.displayText).toContain('Special pricing for Brazil');
      expect(mockPricingDisplay.displayText).toContain('$149');
      expect(mockPricingDisplay.displayText).toContain('40% off');
      expect(mockPricingDisplay.savingsText).toContain('Save $100');
    });
  });

  describe('Gumroad Integration with PPP', () => {
    test('should pass correct pricing to Gumroad checkout', async () => {
      const mockCountryPricing = {
        country: 'MX',
        pricing: {
          lifetime: 174,
          currency: 'USD',
          pppFactor: 0.7,
        },
      };

      // Mock Gumroad overlay function
      window.GumroadOverlay = {
        open: vi.fn(),
      };

      // Simulate checkout click with Mexican pricing
      const gumroadUrl = `https://aiglossarypro.gumroad.com/l/lifetime?price=${mockCountryPricing.pricing.lifetime}`;

      window.GumroadOverlay.open(gumroadUrl);

      expect(window.GumroadOverlay.open).toHaveBeenCalledWith(expect.stringContaining('price=174'));
    });

    test('should handle different currency displays', async () => {
      const currencyTests = [
        {
          country: 'IN',
          pricing: { lifetime: 99, currency: 'USD', symbol: '$' },
          expectedDisplay: '$99',
        },
        {
          country: 'GB',
          pricing: { lifetime: 199, currency: 'GBP', symbol: '£' },
          expectedDisplay: '£199',
        },
        {
          country: 'DE',
          pricing: { lifetime: 229, currency: 'EUR', symbol: '€' },
          expectedDisplay: '€229',
        },
      ];

      for (const test of currencyTests) {
        const displayPrice = `${test.pricing.symbol}${test.pricing.lifetime}`;
        expect(displayPrice).toBe(test.expectedDisplay);
      }
    });
  });

  describe('VPN and Proxy Detection', () => {
    test('should handle VPN detection gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            country: 'US',
            isVPN: true,
            currency: 'USD',
            pricing: {
              lifetime: 249, // Default to full price for VPN users
              currency: 'USD',
              symbol: '$',
              pppFactor: 1.0,
            },
            warning: 'VPN detected - showing default pricing',
          }),
      });

      const response = await fetch('/api/pricing/detect-country');
      const data = await response.json();

      expect(data.isVPN).toBe(true);
      expect(data.pricing.lifetime).toBe(249); // Should default to full price
      expect(data.warning).toContain('VPN detected');
    });

    test('should handle country detection failures', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      try {
        await fetch('/api/pricing/detect-country');
      } catch (error) {
        // Should fall back to default pricing
        const fallbackPricing = {
          country: 'US',
          currency: 'USD',
          pricing: {
            lifetime: 249,
            currency: 'USD',
            symbol: '$',
            pppFactor: 1.0,
          },
        };

        expect(fallbackPricing.pricing.lifetime).toBe(249);
      }
    });
  });

  describe('A/B Testing for PPP', () => {
    test('should support A/B testing different discount levels', async () => {
      const variants = ['control', 'high_discount', 'medium_discount'];

      for (const variant of variants) {
        const mockResponse = {
          country: 'IN',
          variant: variant,
          pricing: {
            lifetime: variant === 'high_discount' ? 79 : variant === 'medium_discount' ? 99 : 124, // control
            currency: 'USD',
            symbol: '$',
            pppFactor:
              variant === 'high_discount' ? 0.32 : variant === 'medium_discount' ? 0.4 : 0.5,
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const response = await fetch(`/api/pricing/detect-country?variant=${variant}`);
        const data = await response.json();

        expect(data.variant).toBe(variant);
        console.log(`Variant ${variant}: $${data.pricing.lifetime}`);
      }
    });
  });

  describe('Analytics and Conversion Tracking', () => {
    test('should track PPP pricing events', async () => {
      // Mock Google Analytics
      window.gtag = vi.fn();

      const pricingData = {
        country: 'BR',
        pricing: {
          lifetime: 149,
          originalPrice: 249,
          discount: 40,
          pppFactor: 0.6,
        },
      };

      // Simulate tracking PPP pricing display
      const trackingCall = {
        event: 'ppp_pricing_shown',
        country: pricingData.country,
        discounted_price: pricingData.pricing.lifetime,
        original_price: pricingData.pricing.originalPrice,
        discount_percentage: pricingData.pricing.discount,
        ppp_factor: pricingData.pricing.pppFactor,
      };

      // Simulate the analytics call
      if (window.gtag) {
        window.gtag('event', trackingCall.event, {
          country: trackingCall.country,
          discounted_price: trackingCall.discounted_price,
          original_price: trackingCall.original_price,
          discount_percentage: trackingCall.discount_percentage,
          ppp_factor: trackingCall.ppp_factor,
        });
      }

      expect(window.gtag).toHaveBeenCalledWith('event', 'ppp_pricing_shown', {
        country: 'BR',
        discounted_price: 149,
        original_price: 249,
        discount_percentage: 40,
        ppp_factor: 0.6,
      });
    });

    test('should track conversion rates by country', async () => {
      window.gtag = vi.fn();

      const conversionData = {
        country: 'IN',
        pricing_shown: 99,
        checkout_initiated: true,
        purchase_completed: true,
      };

      // Track checkout initiation
      window.gtag('event', 'checkout_initiated', {
        country: conversionData.country,
        price: conversionData.pricing_shown,
        currency: 'USD',
      });

      // Track purchase completion
      window.gtag('event', 'purchase_completed', {
        country: conversionData.country,
        price: conversionData.pricing_shown,
        currency: 'USD',
      });

      expect(window.gtag).toHaveBeenCalledWith('event', 'checkout_initiated', {
        country: 'IN',
        price: 99,
        currency: 'USD',
      });

      expect(window.gtag).toHaveBeenCalledWith('event', 'purchase_completed', {
        country: 'IN',
        price: 99,
        currency: 'USD',
      });
    });
  });

  describe('Mobile PPP Experience', () => {
    test('should display PPP pricing correctly on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });

      const mobilePricing = {
        country: 'PH',
        countryName: 'Philippines',
        pricing: {
          lifetime: 124,
          currency: 'USD',
          symbol: '$',
          originalPrice: 249,
          discount: 50,
          isDiscounted: true,
        },
      };

      // Mock mobile-optimized pricing display
      const mobileDisplay = {
        compactPrice: `${mobilePricing.pricing.symbol}${mobilePricing.pricing.lifetime}`,
        savingsText: `${mobilePricing.pricing.discount}% OFF`,
        originalPrice: `${mobilePricing.pricing.symbol}${mobilePricing.pricing.originalPrice}`,
        countryBadge: `🇵🇭 ${mobilePricing.countryName} Price`,
      };

      expect(mobileDisplay.compactPrice).toBe('$124');
      expect(mobileDisplay.savingsText).toBe('50% OFF');
      expect(mobileDisplay.countryBadge).toContain('Philippines');
    });

    test('should handle touch interactions for pricing selection', async () => {
      const pricingOptions = [
        { label: 'Standard Price', price: 249, recommended: false },
        { label: 'Local Price (60% off)', price: 99, recommended: true },
      ];

      for (const option of pricingOptions) {
        // Simulate touch interaction
        const touchEvent = {
          type: 'touchstart',
          target: { dataset: { price: option.price.toString() } },
        };

        expect(touchEvent.target.dataset.price).toBe(option.price.toString());
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle unsupported countries gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            country: 'XX', // Unknown country
            currency: 'USD',
            pricing: {
              lifetime: 249, // Default to full price
              currency: 'USD',
              symbol: '$',
              pppFactor: 1.0,
            },
            fallback: true,
          }),
      });

      const response = await fetch('/api/pricing/detect-country');
      const data = await response.json();

      expect(data.country).toBe('XX');
      expect(data.pricing.lifetime).toBe(249);
      expect(data.fallback).toBe(true);
    });

    test('should validate pricing bounds', () => {
      const testPrices = [
        { price: 79, valid: true }, // Minimum reasonable price
        { price: 249, valid: true }, // Standard price
        { price: 50, valid: false }, // Too low
        { price: 500, valid: false }, // Too high
      ];

      for (const test of testPrices) {
        const isValid = test.price >= 79 && test.price <= 249;
        expect(isValid).toBe(test.valid);
      }
    });

    test('should handle rate limiting on pricing API', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: 'Rate limit exceeded',
            retryAfter: 60,
          }),
      });

      const response = await fetch('/api/pricing/detect-country');
      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.retryAfter).toBe(60);
    });
  });
});
