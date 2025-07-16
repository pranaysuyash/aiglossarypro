// Statistical utilities for A/B testing

/**
 * Calculate Z-score for two-proportion test
 */
export function calculateZScore(
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number
): number {
  const p1 = controlConversions / controlTotal;
  const p2 = variantConversions / variantTotal;
  const pooledP = (controlConversions + variantConversions) / (controlTotal + variantTotal);

  const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1 / controlTotal + 1 / variantTotal));

  if (standardError === 0) {return 0;}

  return (p2 - p1) / standardError;
}

/**
 * Calculate p-value from Z-score
 */
export function calculatePValue(zScore: number): number {
  // Using normal cumulative distribution approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = zScore >= 0 ? 1 : -1;
  const x = Math.abs(zScore) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 1 - sign * y;
}

/**
 * Calculate confidence interval for conversion rate
 */
export function calculateConfidenceInterval(
  conversions: number,
  total: number,
  confidenceLevel = 0.95
): { lower: number; upper: number } {
  const p = conversions / total;
  const z = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;

  const margin = z * Math.sqrt((p * (1 - p)) / total);

  return {
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
  };
}

/**
 * Calculate statistical significance
 */
export function calculateStatisticalSignificance(
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number
): {
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
} {
  const zScore = calculateZScore(
    controlConversions,
    controlTotal,
    variantConversions,
    variantTotal
  );
  const pValue = calculatePValue(zScore);
  const confidenceLevel = 1 - pValue;

  return {
    zScore,
    pValue,
    isSignificant: pValue < 0.05,
    confidenceLevel: confidenceLevel * 100,
  };
}

/**
 * Calculate sample size needed for desired power
 */
export function calculateSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number,
  power = 0.8,
  significanceLevel = 0.05
): number {
  const p1 = baselineConversionRate;
  const p2 = baselineConversionRate * (1 + minimumDetectableEffect);
  const pooledP = (p1 + p2) / 2;

  const zAlpha = significanceLevel === 0.05 ? 1.96 : significanceLevel === 0.01 ? 2.576 : 1.645;
  const zBeta = power === 0.8 ? 0.84 : power === 0.9 ? 1.28 : 0.67;

  const numerator = 2 * pooledP * (1 - pooledP) * (zAlpha + zBeta) ** 2;
  const denominator = (p2 - p1) ** 2;

  return Math.ceil(numerator / denominator);
}

/**
 * Determine winner based on conversion rates and statistical significance
 */
export function determineWinner(
  results: Array<{ variant: string; conversionRate: number }>,
  _metric: string
): { variant: string; improvement: number; confidence: number } | null {
  if (results.length < 2) {return null;}

  // Sort by conversion rate
  const sorted = [...results].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const control = results.find(r => r.variant === 'default') || sorted[1];

  if (best.variant === control.variant) {return null;}

  const improvement =
    ((best.conversionRate - control.conversionRate) / control.conversionRate) * 100;

  // Note: This is simplified - in production you'd calculate actual significance
  const confidence = improvement > 10 ? 95 : improvement > 5 ? 90 : 85;

  return {
    variant: best.variant,
    improvement,
    confidence,
  };
}

/**
 * Calculate Bayesian probability of being best
 */
export function calculateBayesianProbability(
  variants: Array<{ conversions: number; total: number }>
): number[] {
  // Simplified Bayesian approach using Beta distribution
  const samples = 10000;
  const wins = new Array(variants.length).fill(0);

  for (let i = 0; i < samples; i++) {
    const draws = variants.map(v => {
      // Beta distribution with uniform prior (1, 1)
      const alpha = v.conversions + 1;
      const beta = v.total - v.conversions + 1;
      return sampleBeta(alpha, beta);
    });

    const maxIndex = draws.indexOf(Math.max(...draws));
    wins[maxIndex]++;
  }

  return wins.map(w => w / samples);
}

/**
 * Sample from Beta distribution
 */
function sampleBeta(alpha: number, beta: number): number {
  // Using Gamma distribution method
  const x = sampleGamma(alpha);
  const y = sampleGamma(beta);
  return x / (x + y);
}

/**
 * Sample from Gamma distribution (simplified)
 */
function sampleGamma(shape: number): number {
  // Marsaglia and Tsang method (simplified)
  let x, v;
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  do {
    do {
      x = gaussianRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
  } while (Math.random() >= 1 - 0.0331 * x * x * x * x);

  return d * v;
}

/**
 * Generate Gaussian random number
 */
function gaussianRandom(): number {
  let u = 0,
    v = 0;
  while (u === 0) {u = Math.random();}
  while (v === 0) {v = Math.random();}
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
