/**
 * Centralized pricing configuration for the AI Glossary Pro application
 * This ensures consistent pricing across all components and pages
 */

export const PRICING_CONFIG = {
  // Current pricing
  LIFETIME_PRICE: 179,
  ORIGINAL_PRICE: 249,
  
  // Formatted strings
  LIFETIME_PRICE_FORMATTED: '$179',
  ORIGINAL_PRICE_FORMATTED: '$249',
  
  // Discount information
  DISCOUNT_AMOUNT: 70, // $249 - $179
  DISCOUNT_PERCENTAGE: 28, // Approximately 28% off
  
  // Features
  FREE_DAILY_LIMIT: 50,
  TOTAL_TERMS: '10,000+',
  
  // Payment gateway configuration
  GUMROAD_PRODUCT_ID: 'aiml-glossary-pro',
  
  // Early bird messaging
  EARLY_BIRD_MESSAGE: 'Early bird pricing - Limited time offer!',
  SAVINGS_MESSAGE: 'Save $70 with lifetime access',
  
  // Comparison pricing for marketing
  COMPETITOR_PRICING: {
    DATACAMP: '$300+/year',
    COURSERA: '$400+/year',
  }
} as const;

// Helper functions for pricing display
export const formatPrice = (price: number): string => `$${price}`;

export const getDiscountPercentage = (): number => {
  return Math.round(((PRICING_CONFIG.ORIGINAL_PRICE - PRICING_CONFIG.LIFETIME_PRICE) / PRICING_CONFIG.ORIGINAL_PRICE) * 100);
};

export const getSavingsAmount = (): number => {
  return PRICING_CONFIG.ORIGINAL_PRICE - PRICING_CONFIG.LIFETIME_PRICE;
};

// Marketing copy helpers
export const getPricingCopy = () => ({
  mainOffer: `Get Lifetime Access - ${PRICING_CONFIG.LIFETIME_PRICE_FORMATTED}`,
  originalPrice: `Originally ${PRICING_CONFIG.ORIGINAL_PRICE_FORMATTED}`,
  savings: `Save ${formatPrice(getSavingsAmount())}`,
  discountText: `${getDiscountPercentage()}% off early bird pricing`,
  freeLimit: `Free (${PRICING_CONFIG.FREE_DAILY_LIMIT}/day)`,
  oneTimePayment: `${PRICING_CONFIG.LIFETIME_PRICE_FORMATTED} • One-time payment`,
  comparison: `Compare to ${PRICING_CONFIG.COMPETITOR_PRICING.DATACAMP} or ${PRICING_CONFIG.COMPETITOR_PRICING.COURSERA} - you save thousands!`
});