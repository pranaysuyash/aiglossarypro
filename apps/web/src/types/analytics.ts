import { ga4Analytics, useGA4 } from '../lib/ga4Analytics';

// Google Analytics types
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | Record<string, unknown>,
      config?: Record<string, unknown>
    ) => void;
  }
}

export interface AnalyticsEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  item_name?: string;
  item_category?: string;
  quantity?: number;
  price?: number;
  // Enhanced user experience properties
  user_id?: string;
  session_id?: string;
  user_type?: 'guest' | 'free' | 'premium' | 'admin';
  engagement_time?: number;
  interaction_type?: 'click' | 'scroll' | 'hover' | 'swipe' | 'keyboard';
  // Performance monitoring
  page_load_time?: number;
  api_response_time?: number;
  render_time?: number;
  time_to_interactive?: number;
  // Content tracking
  content_id?: string;
  content_type?: 'term' | 'category' | 'learning-path' | 'quiz' | 'tutorial';
  content_category?: string;
  search_query?: string;
  search_results_count?: number;
  // Error tracking
  error_type?: string;
  error_message?: string;
  error_stack?: string;
  // A/B testing
  experiment_id?: string;
  variant_id?: string;
  // Device and environment
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  screen_resolution?: string;
  viewport_size?: string;
  connection_type?: string;
  // Custom dimensions for admin features
  admin_action?: string;
  bulk_action_count?: number;
  filter_criteria?: Record<string, any>;
}

// Legacy trackEvent function (now uses GA4)
export const trackEvent = (eventName: string, parameters?: AnalyticsEvent): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters as Record<string, unknown>);
  }

  // Also track with GA4 for comprehensive coverage
  ga4Analytics.trackEngagement({
    event_name: eventName,
    engagement_type: 'cta_click',
    engagement_value: parameters?.value || 1,
    page_location: window.location.href,
    page_title: document.title,
    event_category: parameters?.event_category || 'engagement',
    event_label: parameters?.event_label || eventName,
    item_name: parameters?.item_name,
    item_category: parameters?.item_category,
    value: parameters?.value,
    currency: parameters?.currency,
    custom_parameters: parameters,
  });
};

// Enhanced purchase intent tracking
export const trackPurchaseIntent = (itemName: string, value?: number): void => {
  // Legacy GA tracking
  trackEvent('purchase_intent', {
    event_category: 'engagement',
    event_label: itemName,
    value: value || 249,
    currency: 'USD',
    item_name: itemName,
    item_category: 'subscription',
  });

  // Enhanced GA4 conversion tracking
  ga4Analytics.trackConversion({
    event_name: 'purchase_intent',
    conversion_type: 'premium_purchase',
    funnel_stage: 'interest_expressed',
    value: value || 249,
    currency: 'USD',
    item_name: itemName,
    item_category: 'subscription',
    event_category: 'conversion',
    event_label: itemName,
  });
};

// Enhanced CTA click tracking with better categorization
export const trackCTAClick = (ctaLocation: string, ctaText?: string): void => {
  const eventName = `${ctaLocation}_cta_click`;

  // Legacy GA tracking
  trackEvent(eventName, {
    event_category: 'engagement',
    event_label: ctaText || 'CTA Click',
    item_name: 'AI/ML Glossary Pro',
    item_category: 'subscription',
  });

  // Enhanced GA4 CTA tracking
  ga4Analytics.trackCTAClick(ctaText || 'CTA Click', ctaLocation, 'landing_page', 1);
};

// New enhanced tracking functions using GA4
export const trackScrollDepth = (percentage: number): void => {
  ga4Analytics.trackScrollDepth(percentage);
};

export const trackSectionView = (sectionName: string, position?: number): void => {
  ga4Analytics.trackSectionView(sectionName, position);
};

export const trackFormSubmission = (
  formType: 'contact' | 'newsletter' | 'signup' | 'feedback',
  location: string
): void => {
  ga4Analytics.trackFormSubmission(formType, location);
};

export const trackEarlyBirdSignup = (pricingTier: string, discountPercentage: number): void => {
  ga4Analytics.trackEarlyBirdSignup(pricingTier, discountPercentage);
};

export const trackABTestView = (testId: string, variant: string, testType: string): void => {
  ga4Analytics.trackABTestView(testId, variant, testType);
};

export interface PurchaseItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  quantity?: number;
  price?: number;
}

export const trackPurchase = (
  transactionId: string,
  value: number,
  currency = 'USD',
  items: PurchaseItem[]
): void => {
  ga4Analytics.trackPurchase(transactionId, value, currency, items);
};

// Upgrade specific tracking
export const trackUpgradeClick = (source: string, tier = 'lifetime'): void => {
  trackEvent('upgrade_click', {
    event_category: 'upgrade',
    event_label: `${source}_to_${tier}`,
    item_name: 'AI/ML Glossary Pro',
    item_category: 'subscription',
    value: 249,
    currency: 'USD',
  });
};

export const trackUpgradePageView = (source: string): void => {
  trackEvent('upgrade_page_view', {
    event_category: 'upgrade',
    event_label: source,
    item_name: 'AI/ML Glossary Pro',
  });
};

// Page view tracking
export const trackPageView = (pageTitle: string, pageLocation?: string): void => {
  ga4Analytics.trackPageView(pageTitle, pageLocation);
};

// User identification
export const setUserId = (userId: string): void => {
  ga4Analytics.setUserId(userId);
};

// Export GA4 hook for React components
export { useGA4 };
