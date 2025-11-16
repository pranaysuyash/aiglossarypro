/**
 * Centralized AI Cost Calculator
 *
 * Purpose: Single source of truth for AI cost calculations across all content generation systems
 * Fixes: Inconsistent cost formulas in aiContentGenerationService, enhanced295AIService
 *
 * CRITICAL: All systems must use this calculator - no local implementations!
 */

export interface ModelPricing {
  input: number;  // Cost per 1K input tokens (USD)
  output: number; // Cost per 1K output tokens (USD)
}

/**
 * Model Pricing Configuration
 * Source: OpenAI pricing page (https://openai.com/pricing)
 * Last Updated: November 2025
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT-4 Family
  'gpt-4.1': {
    input: 0.025,
    output: 0.1,
  },
  'gpt-4.1-mini': {
    input: 0.0002,
    output: 0.0008,
  },
  'gpt-4.1-nano': {
    input: 0.00005,
    output: 0.0002,
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06,
  },
  'gpt-4-turbo': {
    input: 0.01,
    output: 0.03,
  },

  // GPT-4o Family (Multimodal)
  'gpt-4o': {
    input: 0.005,
    output: 0.015,
  },
  'gpt-4o-mini': {
    input: 0.00015,
    output: 0.0006,
  },

  // Reasoning Models
  'o1-mini': {
    input: 0.003,
    output: 0.012,
  },
  'o1-preview': {
    input: 0.015,
    output: 0.06,
  },

  // Legacy Models
  'gpt-3.5-turbo': {
    input: 0.0005,
    output: 0.0015,
  },
  'gpt-3.5-turbo-16k': {
    input: 0.003,
    output: 0.004,
  },
};

export interface CostCalculationResult {
  cost: number;           // Total cost in USD
  inputCost: number;      // Cost for input tokens
  outputCost: number;     // Cost for output tokens
  inputTokens: number;    // Number of input tokens
  outputTokens: number;   // Number of output tokens
  model: string;          // Model used
  costPerToken: number;   // Average cost per token
}

/**
 * Calculate the cost of an AI operation
 *
 * @param model - The model used (e.g., 'gpt-4.1-mini')
 * @param inputTokens - Number of input/prompt tokens
 * @param outputTokens - Number of output/completion tokens
 * @returns Detailed cost breakdown
 *
 * @example
 * ```typescript
 * const result = calculateAICost('gpt-4.1-mini', 1000, 500);
 * console.log(`Total cost: $${result.cost.toFixed(6)}`);
 * // Output: Total cost: $0.000600
 * ```
 */
export function calculateAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): CostCalculationResult {
  // Get pricing for model (fallback to gpt-4.1-mini if unknown)
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4.1-mini'];

  // Calculate costs (pricing is per 1K tokens, so divide by 1000)
  const inputCost = (inputTokens * pricing.input) / 1000;
  const outputCost = (outputTokens * pricing.output) / 1000;
  const totalCost = inputCost + outputCost;

  // Calculate average cost per token for analytics
  const totalTokens = inputTokens + outputTokens;
  const costPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;

  return {
    cost: totalCost,
    inputCost,
    outputCost,
    inputTokens,
    outputTokens,
    model,
    costPerToken,
  };
}

/**
 * Estimate cost before making API call
 *
 * @param model - The model to use
 * @param estimatedInputTokens - Estimated input tokens (~4 chars = 1 token)
 * @param estimatedOutputTokens - Estimated output tokens
 * @returns Estimated cost in USD
 *
 * @example
 * ```typescript
 * const estimate = estimateCost('gpt-4.1-nano', 500, 200);
 * console.log(`Estimated cost: $${estimate.toFixed(6)}`);
 * ```
 */
export function estimateCost(
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  const result = calculateAICost(model, estimatedInputTokens, estimatedOutputTokens);
  return result.cost;
}

/**
 * Calculate total cost for batch operations
 *
 * @param operations - Array of completed operations with token counts
 * @returns Total cost and breakdown
 *
 * @example
 * ```typescript
 * const operations = [
 *   { model: 'gpt-4.1-mini', inputTokens: 1000, outputTokens: 500 },
 *   { model: 'gpt-4.1-nano', inputTokens: 800, outputTokens: 300 },
 * ];
 * const total = calculateBatchCost(operations);
 * console.log(`Total batch cost: $${total.totalCost.toFixed(4)}`);
 * ```
 */
export function calculateBatchCost(
  operations: Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
  }>
): {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  operationCount: number;
  averageCostPerOperation: number;
  breakdown: CostCalculationResult[];
} {
  const breakdown = operations.map((op) =>
    calculateAICost(op.model, op.inputTokens, op.outputTokens)
  );

  const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
  const totalInputTokens = breakdown.reduce((sum, item) => sum + item.inputTokens, 0);
  const totalOutputTokens = breakdown.reduce((sum, item) => sum + item.outputTokens, 0);

  return {
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    operationCount: operations.length,
    averageCostPerOperation: operations.length > 0 ? totalCost / operations.length : 0,
    breakdown,
  };
}

/**
 * Get recommended model based on budget constraints
 *
 * @param estimatedTokens - Total tokens (input + output)
 * @param maxBudget - Maximum budget in USD
 * @param requireQuality - If true, prefer quality over cost
 * @returns Recommended model
 *
 * @example
 * ```typescript
 * const model = getRecommendedModel(2000, 0.01, false);
 * // Returns 'gpt-4.1-nano' for cost optimization
 * ```
 */
export function getRecommendedModel(
  estimatedTokens: number,
  maxBudget: number,
  requireQuality: boolean = false
): string {
  const inputTokens = Math.floor(estimatedTokens * 0.6); // Typical 60/40 split
  const outputTokens = Math.floor(estimatedTokens * 0.4);

  if (requireQuality) {
    // Try quality models within budget
    const qualityModels = ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1-nano'];
    for (const model of qualityModels) {
      const cost = estimateCost(model, inputTokens, outputTokens);
      if (cost <= maxBudget) return model;
    }
  }

  // Try cost-optimized models
  const costModels = ['gpt-4.1-nano', 'gpt-4o-mini', 'gpt-3.5-turbo'];
  for (const model of costModels) {
    const cost = estimateCost(model, inputTokens, outputTokens);
    if (cost <= maxBudget) return model;
  }

  // If nothing fits budget, return cheapest
  return 'gpt-4.1-nano';
}

/**
 * Format cost for display
 *
 * @param cost - Cost in USD
 * @returns Formatted string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Validate that model exists in pricing table
 */
export function isSupportedModel(model: string): boolean {
  return model in MODEL_PRICING;
}

/**
 * Get all supported models
 */
export function getSupportedModels(): string[] {
  return Object.keys(MODEL_PRICING);
}

/**
 * Compare costs between different models for same operation
 *
 * @param inputTokens - Input tokens
 * @param outputTokens - Output tokens
 * @param models - Models to compare (default: all)
 * @returns Comparison sorted by cost (cheapest first)
 */
export function compareModelCosts(
  inputTokens: number,
  outputTokens: number,
  models: string[] = getSupportedModels()
): Array<{
  model: string;
  cost: number;
  costFormatted: string;
  savings: number;
  savingsPercent: number;
}> {
  const results = models.map((model) => {
    const result = calculateAICost(model, inputTokens, outputTokens);
    return {
      model,
      cost: result.cost,
      costFormatted: formatCost(result.cost),
    };
  });

  // Sort by cost (cheapest first)
  results.sort((a, b) => a.cost - b.cost);

  // Calculate savings compared to most expensive
  const mostExpensive = results[results.length - 1].cost;

  return results.map((result) => ({
    ...result,
    savings: mostExpensive - result.cost,
    savingsPercent: mostExpensive > 0 ? ((mostExpensive - result.cost) / mostExpensive) * 100 : 0,
  }));
}
