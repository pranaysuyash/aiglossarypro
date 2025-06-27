// Google Analytics types
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | Record<string, any>,
      config?: Record<string, any>
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
}

export const trackEvent = (eventName: string, parameters?: AnalyticsEvent): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

export const trackPurchaseIntent = (itemName: string, value?: number): void => {
  trackEvent('purchase_intent', {
    event_category: 'engagement',
    event_label: itemName,
    value: value || 249,
    currency: 'USD',
    item_name: itemName,
    item_category: 'subscription'
  });
};

export const trackCTAClick = (ctaLocation: string, ctaText?: string): void => {
  trackEvent(`${ctaLocation}_cta_click`, {
    event_category: 'engagement',
    event_label: ctaText || 'CTA Click',
    item_name: 'AI/ML Glossary Pro',
    item_category: 'subscription'
  });
};

export {};