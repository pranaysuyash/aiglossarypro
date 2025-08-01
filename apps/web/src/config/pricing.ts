/**
 * Centralized pricing configuration for the AI Glossary Pro application
 *
 * PRICING STRATEGY:
 * - Display original price: $249
 * - Launch discount via Gumroad discount code: $179
 * - Purchasing Power Parity (PPP) automatically handled by Gumroad
 * - All payments processed through Gumroad with regional pricing adjustments
 * - Staggered discount phases: Beta → Early → Launch → Regular
 */

export type PricingPhase = 'beta' | 'early' | 'launch' | 'regular';

export interface PhaseConfig {
  name: string;
  price: number;
  originalPrice: number;
  discountCode: string;
  discountPercentage: number;
  slots: number;
  message: string;
  urgencyMessage: string;
  exitIntentExtraDiscount: number; // Additional discount for exit-intent
}

// Staggered pricing phases configuration
export const PRICING_PHASES: Record<PricingPhase, PhaseConfig> = {
  beta: {
    name: 'Beta Launch',
    price: 124,
    originalPrice: 249,
    discountCode: 'BETA50',
    discountPercentage: 50,
    slots: 100,
    message: 'Beta launch special - Limited to first 100 customers',
    urgencyMessage: 'Only for the first 100 beta users!',
    exitIntentExtraDiscount: 10, // Extra 10% off = ~60% total off
  },
  early: {
    name: 'Early Bird',
    price: 162,
    originalPrice: 249,
    discountCode: 'EARLY35',
    discountPercentage: 35,
    slots: 200,
    message: 'Early bird discount - Limited to first 300 customers',
    urgencyMessage: 'Early bird pricing ending soon!',
    exitIntentExtraDiscount: 15, // Extra 15% off = ~50% total off
  },
  launch: {
    name: 'Launch Special',
    price: 199,
    originalPrice: 249,
    discountCode: 'LAUNCH20',
    discountPercentage: 20,
    slots: 200,
    message: 'Launch week special - Save $50',
    urgencyMessage: 'Launch pricing expires this week!',
    exitIntentExtraDiscount: 20, // Extra 20% off = ~40% total off
  },
  regular: {
    name: 'Regular Price',
    price: 249,
    originalPrice: 249,
    discountCode: '',
    discountPercentage: 0,
    slots: Infinity,
    message: 'Full access to AI/ML Glossary Pro',
    urgencyMessage: '',
    exitIntentExtraDiscount: 25, // 25% off regular price
  },
};

// Get current phase from environment or default
export const getCurrentPhase = (): PricingPhase => {
  const phase = process.env.NEXT_PUBLIC_PRICING_PHASE as PricingPhase;
  return phase && phase in PRICING_PHASES ? phase : 'early'; // Default to early phase
};

// Helper to get current phase config
export const getCurrentPhaseConfig = (): PhaseConfig => {
  return PRICING_PHASES[getCurrentPhase()];
};

export const PRICING_CONFIG = {
  // Display pricing (what users see)
  ORIGINAL_PRICE: 249, // Always show this as the base price
  LAUNCH_DISCOUNT_PRICE: 179, // Show this as discounted price with Gumroad code

  // Formatted strings for display
  ORIGINAL_PRICE_FORMATTED: '$249',
  LAUNCH_DISCOUNT_FORMATTED: '$179',

  // Discount information
  DISCOUNT_AMOUNT: 70, // $249 - $179
  DISCOUNT_PERCENTAGE: 28, // 28% off

  // Features
  FREE_DAILY_LIMIT: 50,
  TOTAL_TERMS: '10,000+',

  // Payment gateway configuration
  GUMROAD_PRODUCT_ID: 'aiml-glossary-pro',
  GUMROAD_URL: 'https://gumroad.com/l/aiml-glossary-pro',

  // Launch discount messaging
  LAUNCH_DISCOUNT_MESSAGE: 'Launch discount - Use code at checkout',
  LAUNCH_DISCOUNT_CODE: 'LAUNCH30', // Example discount code
  PPP_MESSAGE: 'Regional pricing automatically applied at checkout',

  // Comparison pricing for marketing
  COMPETITOR_PRICING: {
    DATACAMP: '$300+/year',
    COURSERA: '$400+/year',
  },
} as const;

// Helper functions for pricing display
export const formatPrice = (price: number): string => `$${price}`;

export const getDiscountPercentage = (): number => {
  return Math.round(
    ((PRICING_CONFIG.ORIGINAL_PRICE - PRICING_CONFIG.LAUNCH_DISCOUNT_PRICE) /
      PRICING_CONFIG.ORIGINAL_PRICE) *
      100
  );
};

export const getSavingsAmount = (): number => {
  return PRICING_CONFIG.ORIGINAL_PRICE - PRICING_CONFIG.LAUNCH_DISCOUNT_PRICE;
};

// Get current phase savings
export const getCurrentPhaseSavings = (): number => {
  const phase = getCurrentPhaseConfig();
  return phase.originalPrice - phase.price;
};

// Get Gumroad URL with current phase discount code
export const getGumroadUrlWithDiscount = (extraDiscountCode?: string): string => {
  const phase = getCurrentPhaseConfig();
  const discountCode = extraDiscountCode || phase.discountCode;
  
  if (!discountCode) {
    return PRICING_CONFIG.GUMROAD_URL;
  }
  
  return `${PRICING_CONFIG.GUMROAD_URL}/${discountCode}`;
};

// Get exit-intent specific pricing
export const getExitIntentPricing = () => {
  const phase = getCurrentPhaseConfig();
  const exitIntentPrice = Math.round(phase.price * (1 - phase.exitIntentExtraDiscount / 100));
  const totalDiscount = Math.round(((phase.originalPrice - exitIntentPrice) / phase.originalPrice) * 100);
  
  return {
    price: exitIntentPrice,
    originalPrice: phase.originalPrice,
    phasePrice: phase.price,
    extraDiscount: phase.exitIntentExtraDiscount,
    totalDiscount,
    discountCode: `EXIT${phase.discountCode}`, // Special exit-intent code
    message: `Special one-time offer: Extra ${phase.exitIntentExtraDiscount}% off!`,
  };
};

// Marketing copy helpers
export const getPricingCopy = () => {
  const phase = getCurrentPhaseConfig();
  
  return {
    mainOffer: `Get Lifetime Access - ${formatPrice(phase.price)}`,
    originalPrice: `Originally ${formatPrice(phase.originalPrice)}`,
    savings: `Save ${formatPrice(getCurrentPhaseSavings())}`,
    discountText: `${phase.discountPercentage}% off ${phase.name.toLowerCase()}`,
    freeLimit: `Free (${PRICING_CONFIG.FREE_DAILY_LIMIT}/day)`,
    oneTimePayment: `${formatPrice(phase.price)} • One-time payment`,
    launchDiscount: phase.message,
    pppNote: PRICING_CONFIG.PPP_MESSAGE,
    comparison: `Compare to ${PRICING_CONFIG.COMPETITOR_PRICING.DATACAMP} or ${PRICING_CONFIG.COMPETITOR_PRICING.COURSERA} - you save thousands!`,
    urgency: phase.urgencyMessage,
  };
};
