/**
 * Centralized pricing configuration for the AI Glossary Pro application
 * 
 * PRICING STRATEGY:
 * - Display original price: $249
 * - Launch discount via Gumroad discount code: $179
 * - Purchasing Power Parity (PPP) automatically handled by Gumroad
 * - All payments processed through Gumroad with regional pricing adjustments
 */

export const PRICING_CONFIG = {
  // Display pricing (what users see)
  ORIGINAL_PRICE: 249,           // Always show this as the base price
  LAUNCH_DISCOUNT_PRICE: 179,    // Show this as discounted price with Gumroad code
  
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
  }
} as const;

// Helper functions for pricing display
export const formatPrice = (price: number): string => `$${price}`;

export const getDiscountPercentage = (): number => {
  return Math.round(((PRICING_CONFIG.ORIGINAL_PRICE - PRICING_CONFIG.LAUNCH_DISCOUNT_PRICE) / PRICING_CONFIG.ORIGINAL_PRICE) * 100);
};

export const getSavingsAmount = (): number => {
  return PRICING_CONFIG.ORIGINAL_PRICE - PRICING_CONFIG.LAUNCH_DISCOUNT_PRICE;
};

// Marketing copy helpers
export const getPricingCopy = () => ({
  mainOffer: `Get Lifetime Access - ${PRICING_CONFIG.LAUNCH_DISCOUNT_FORMATTED}`,
  originalPrice: `Originally ${PRICING_CONFIG.ORIGINAL_PRICE_FORMATTED}`,
  savings: `Save ${formatPrice(getSavingsAmount())}`,
  discountText: `${getDiscountPercentage()}% off launch pricing`,
  freeLimit: `Free (${PRICING_CONFIG.FREE_DAILY_LIMIT}/day)`,
  oneTimePayment: `${PRICING_CONFIG.LAUNCH_DISCOUNT_FORMATTED} • One-time payment`,
  launchDiscount: `${PRICING_CONFIG.LAUNCH_DISCOUNT_MESSAGE}`,
  pppNote: `${PRICING_CONFIG.PPP_MESSAGE}`,
  comparison: `Compare to ${PRICING_CONFIG.COMPETITOR_PRICING.DATACAMP} or ${PRICING_CONFIG.COMPETITOR_PRICING.COURSERA} - you save thousands!`
});