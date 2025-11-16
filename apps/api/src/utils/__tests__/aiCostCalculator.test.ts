/**
 * Tests for AI Cost Calculator
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAICost,
  estimateCost,
  calculateBatchCost,
  getRecommendedModel,
  formatCost,
  compareModelCosts,
  MODEL_PRICING,
} from '../aiCostCalculator';

describe('aiCostCalculator', () => {
  describe('calculateAICost', () => {
    it('should calculate cost correctly for gpt-4.1-mini', () => {
      const result = calculateAICost('gpt-4.1-mini', 1000, 500);

      expect(result.inputTokens).toBe(1000);
      expect(result.outputTokens).toBe(500);
      expect(result.inputCost).toBe(0.0002); // (1000 * 0.0002) / 1000
      expect(result.outputCost).toBe(0.0004); // (500 * 0.0008) / 1000
      expect(result.cost).toBe(0.0006); // 0.0002 + 0.0004
    });

    it('should calculate cost correctly for gpt-4.1-nano', () => {
      const result = calculateAICost('gpt-4.1-nano', 2000, 1000);

      expect(result.inputCost).toBe(0.0001); // (2000 * 0.00005) / 1000
      expect(result.outputCost).toBe(0.0002); // (1000 * 0.0002) / 1000
      expect(result.cost).toBe(0.0003);
    });

    it('should handle zero tokens', () => {
      const result = calculateAICost('gpt-4.1-mini', 0, 0);

      expect(result.cost).toBe(0);
      expect(result.costPerToken).toBe(0);
    });

    it('should fallback to gpt-4.1-mini for unknown models', () => {
      const result = calculateAICost('unknown-model', 1000, 500);

      // Should use gpt-4.1-mini pricing
      expect(result.cost).toBe(0.0006);
      expect(result.model).toBe('unknown-model'); // But keep original model name
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost correctly', () => {
      const cost = estimateCost('gpt-4.1-nano', 500, 200);

      expect(cost).toBe(0.00006); // (500 * 0.00005 + 200 * 0.0002) / 1000
    });
  });

  describe('calculateBatchCost', () => {
    it('should calculate total cost for batch operations', () => {
      const operations = [
        { model: 'gpt-4.1-mini', inputTokens: 1000, outputTokens: 500 },
        { model: 'gpt-4.1-nano', inputTokens: 800, outputTokens: 300 },
      ];

      const result = calculateBatchCost(operations);

      expect(result.operationCount).toBe(2);
      expect(result.totalInputTokens).toBe(1800);
      expect(result.totalOutputTokens).toBe(800);
      expect(result.totalCost).toBeCloseTo(0.000686, 6);
      expect(result.averageCostPerOperation).toBeCloseTo(0.000343, 6);
    });

    it('should handle empty operations array', () => {
      const result = calculateBatchCost([]);

      expect(result.totalCost).toBe(0);
      expect(result.operationCount).toBe(0);
      expect(result.averageCostPerOperation).toBe(0);
    });
  });

  describe('getRecommendedModel', () => {
    it('should recommend cheapest model when quality not required', () => {
      const model = getRecommendedModel(2000, 1.0, false);

      expect(model).toBe('gpt-4.1-nano');
    });

    it('should recommend quality model when required and within budget', () => {
      const model = getRecommendedModel(2000, 1.0, true);

      expect(['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1-nano']).toContain(model);
    });

    it('should fallback to cheapest when over budget', () => {
      const model = getRecommendedModel(1000000, 0.001, true);

      expect(model).toBe('gpt-4.1-nano');
    });
  });

  describe('formatCost', () => {
    it('should format very small costs with 6 decimals', () => {
      expect(formatCost(0.000123)).toBe('$0.000123');
    });

    it('should format small costs with 4 decimals', () => {
      expect(formatCost(0.0543)).toBe('$0.0543');
    });

    it('should format large costs with 2 decimals', () => {
      expect(formatCost(12.345)).toBe('$12.35');
    });
  });

  describe('compareModelCosts', () => {
    it('should compare costs across models', () => {
      const comparison = compareModelCosts(1000, 500, [
        'gpt-4.1-nano',
        'gpt-4.1-mini',
        'gpt-4.1',
      ]);

      // Should be sorted cheapest first
      expect(comparison[0].model).toBe('gpt-4.1-nano');
      expect(comparison[comparison.length - 1].model).toBe('gpt-4.1');

      // Cheapest should have 0 savings
      expect(comparison[0].savings).toBe(0);
      expect(comparison[0].savingsPercent).toBe(0);

      // Most expensive should have 100% savings compared to itself
      const mostExpensive = comparison[comparison.length - 1];
      expect(mostExpensive.savings).toBeGreaterThan(0);
      expect(mostExpensive.savingsPercent).toBeCloseTo(100, 1);
    });
  });

  describe('MODEL_PRICING', () => {
    it('should have pricing for all common models', () => {
      expect(MODEL_PRICING).toHaveProperty('gpt-4.1-mini');
      expect(MODEL_PRICING).toHaveProperty('gpt-4.1-nano');
      expect(MODEL_PRICING).toHaveProperty('gpt-4o-mini');
      expect(MODEL_PRICING).toHaveProperty('o1-mini');
    });

    it('should have input and output costs for each model', () => {
      Object.entries(MODEL_PRICING).forEach(([model, pricing]) => {
        expect(pricing.input).toBeGreaterThan(0);
        expect(pricing.output).toBeGreaterThan(0);
        expect(typeof pricing.input).toBe('number');
        expect(typeof pricing.output).toBe('number');
      });
    });

    it('should have output cost >= input cost for all models', () => {
      Object.entries(MODEL_PRICING).forEach(([model, pricing]) => {
        expect(pricing.output).toBeGreaterThanOrEqual(pricing.input);
      });
    });
  });

  describe('cost consistency validation', () => {
    it('should match documented formula: (tokens * price) / 1000', () => {
      const inputTokens = 1500;
      const outputTokens = 750;
      const model = 'gpt-4.1-mini';
      const pricing = MODEL_PRICING[model];

      const result = calculateAICost(model, inputTokens, outputTokens);

      const expectedInputCost = (inputTokens * pricing.input) / 1000;
      const expectedOutputCost = (outputTokens * pricing.output) / 1000;
      const expectedTotal = expectedInputCost + expectedOutputCost;

      expect(result.inputCost).toBeCloseTo(expectedInputCost, 10);
      expect(result.outputCost).toBeCloseTo(expectedOutputCost, 10);
      expect(result.cost).toBeCloseTo(expectedTotal, 10);
    });

    it('should NOT use /1000000 formula (regression test for bug)', () => {
      const result = calculateAICost('gpt-4.1-mini', 1000, 500);

      // This should be 0.0006, NOT 0.0000006
      expect(result.cost).toBeCloseTo(0.0006, 10);
      expect(result.cost).not.toBeCloseTo(0.0000006, 10);
    });
  });
});
