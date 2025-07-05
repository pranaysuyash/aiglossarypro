import { posthog } from '@/lib/analytics';
import { ga4Analytics } from '@/lib/ga4Analytics';

export interface ABTestEvent {
  eventName: string;
  variant: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

export interface ConversionMetrics {
  variant: string;
  pageViews: number;
  seeWhatsInsideClicks: number;
  ctaClicks: number;
  trialSignups: number;
  newsletterSignups: number;
  conversionRate: number;
  bounceRate: number;
  avgTimeOnPage: number;
}

export interface ABTestResult {
  testId: string;
  startDate: Date;
  endDate?: Date;
  variants: string[];
  metrics: ConversionMetrics[];
  winner?: string;
  confidence?: number;
  sampleSize: number;
}

class ABTestingService {
  private testId: string;
  private startTime: Date;
  private conversionGoals: string[] = [
    'hero_cta_click',
    'see_whats_inside_click',
    'trial_signup',
    'newsletter_signup',
    'pricing_cta_click',
    'final_cta_click'
  ];

  constructor() {
    this.testId = `landing_bg_test_${Date.now()}`;
    this.startTime = new Date();
  }

  // Track page view with variant
  trackPageView(variant: string, properties: Record<string, any> = {}) {
    const eventData = {
      test_id: this.testId,
      variant,
      page: 'landing',
      device_type: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      referrer: document.referrer,
      utm_source: this.getUTMParam('utm_source'),
      utm_medium: this.getUTMParam('utm_medium'),
      utm_campaign: this.getUTMParam('utm_campaign'),
      ...properties
    };

    // Track with PostHog
    posthog.capture('ab_test_page_view', eventData);

    // Track with Google Analytics (legacy)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        event_category: 'ab_test',
        event_label: variant,
        custom_map: {
          test_id: this.testId,
          background_variant: variant
        }
      });
    }

    // Track with GA4
    ga4Analytics.trackABTestView(this.testId, variant, 'background_test');
    ga4Analytics.trackPageView(
      `Landing Page - ${variant}`,
      window.location.href
    );

    // Store session data
    this.storeSessionData(variant);
  }

  // Track conversion events
  trackConversion(eventName: string, variant: string, properties: Record<string, any> = {}) {
    const conversionData = {
      test_id: this.testId,
      variant,
      event_name: eventName,
      conversion_type: this.getConversionType(eventName),
      time_to_conversion: this.getTimeToConversion(),
      session_duration: this.getSessionDuration(),
      device_type: this.getDeviceType(),
      ...properties
    };

    // Track with PostHog
    posthog.capture('ab_test_conversion', conversionData);

    // Track with Google Analytics (legacy)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        event_category: 'ab_test_conversion',
        event_label: variant,
        value: properties.value || 1,
        custom_map: {
          test_id: this.testId,
          background_variant: variant,
          conversion_type: this.getConversionType(eventName)
        }
      });
    }

    // Track with GA4
    const conversionType = this.getConversionType(eventName);
    if (conversionType === 'trial_conversion' || conversionType === 'primary_cta') {
      ga4Analytics.trackConversion({
        event_name: eventName,
        conversion_type: conversionType === 'trial_conversion' ? 'trial_signup' : 'premium_purchase',
        funnel_stage: eventName,
        value: properties.value || 1,
        currency: properties.currency || 'USD',
        event_category: 'ab_test_conversion',
        event_label: variant,
        custom_parameters: {
          variant,
          test_id: this.testId,
          background_variant: variant,
          time_to_conversion: this.getTimeToConversion()
        }
      });
    } else {
      ga4Analytics.trackCTAClick(eventName, properties.location || 'landing', variant, properties.value || 1);
    }

    // Update session conversion data
    this.updateConversionData(eventName, variant);
  }

  // Track micro-conversions (scroll depth, time on page, etc.)
  trackEngagement(variant: string, engagementType: string, value: number) {
    const engagementData = {
      test_id: this.testId,
      variant,
      engagement_type: engagementType,
      value,
      session_duration: this.getSessionDuration()
    };

    // Track with PostHog
    posthog.capture('ab_test_engagement', engagementData);

    // Track with GA4
    if (engagementType === 'scroll_depth') {
      ga4Analytics.trackScrollDepth(value);
    } else {
      ga4Analytics.trackEngagement({
        event_name: `ab_test_${engagementType}`,
        engagement_type: engagementType as any,
        engagement_value: value,
        page_location: window.location.href,
        page_title: document.title,
        event_category: 'ab_test_engagement',
        event_label: variant,
        custom_parameters: {
          variant,
          test_id: this.testId,
          background_variant: variant,
          session_duration: this.getSessionDuration()
        }
      });
    }
  }

  // Get conversion funnel data
  getConversionFunnel(variant: string): Record<string, number> {
    const sessionData = this.getSessionData();
    const variantData = sessionData.variants[variant] || {};
    
    return {
      pageViews: variantData.pageViews || 0,
      seeWhatsInsideClicks: variantData.seeWhatsInsideClicks || 0,
      ctaClicks: variantData.ctaClicks || 0,
      trialSignups: variantData.trialSignups || 0,
      newsletterSignups: variantData.newsletterSignups || 0
    };
  }

  // Calculate conversion rate for a specific goal
  calculateConversionRate(variant: string, goal: string): number {
    const funnel = this.getConversionFunnel(variant);
    const views = funnel.pageViews || 1; // Avoid division by zero
    const conversions = funnel[goal] || 0;
    
    return (conversions / views) * 100;
  }

  // Get device type
  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Get browser info
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Other';
  }

  // Get UTM parameters
  private getUTMParam(param: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Get conversion type from event name
  private getConversionType(eventName: string): string {
    const conversionMap: Record<string, string> = {
      'hero_cta_click': 'primary_cta',
      'see_whats_inside_click': 'secondary_cta',
      'trial_signup': 'trial_conversion',
      'newsletter_signup': 'newsletter_conversion',
      'pricing_cta_click': 'pricing_interaction',
      'final_cta_click': 'final_conversion'
    };
    
    return conversionMap[eventName] || 'other';
  }

  // Calculate time to conversion
  private getTimeToConversion(): number {
    const sessionStart = parseInt(sessionStorage.getItem('ab_test_start_time') || '0');
    if (!sessionStart) return 0;
    
    return Math.floor((Date.now() - sessionStart) / 1000); // Return in seconds
  }

  // Get session duration
  private getSessionDuration(): number {
    const sessionStart = parseInt(sessionStorage.getItem('session_start_time') || '0');
    if (!sessionStart) return 0;
    
    return Math.floor((Date.now() - sessionStart) / 1000); // Return in seconds
  }

  // Store session data
  private storeSessionData(variant: string) {
    const existingData = this.getSessionData();
    
    if (!existingData.startTime) {
      existingData.startTime = Date.now();
      sessionStorage.setItem('ab_test_start_time', existingData.startTime.toString());
      sessionStorage.setItem('session_start_time', existingData.startTime.toString());
    }
    
    if (!existingData.variants[variant]) {
      existingData.variants[variant] = {
        pageViews: 0,
        seeWhatsInsideClicks: 0,
        ctaClicks: 0,
        trialSignups: 0,
        newsletterSignups: 0
      };
    }
    
    existingData.variants[variant].pageViews++;
    
    sessionStorage.setItem('ab_test_data', JSON.stringify(existingData));
  }

  // Update conversion data
  private updateConversionData(eventName: string, variant: string) {
    const data = this.getSessionData();
    
    if (!data.variants[variant]) {
      data.variants[variant] = {
        pageViews: 0,
        seeWhatsInsideClicks: 0,
        ctaClicks: 0,
        trialSignups: 0,
        newsletterSignups: 0
      };
    }
    
    switch (eventName) {
      case 'see_whats_inside_click':
        data.variants[variant].seeWhatsInsideClicks++;
        break;
      case 'hero_cta_click':
      case 'pricing_cta_click':
      case 'final_cta_click':
        data.variants[variant].ctaClicks++;
        break;
      case 'trial_signup':
        data.variants[variant].trialSignups++;
        break;
      case 'newsletter_signup':
        data.variants[variant].newsletterSignups++;
        break;
    }
    
    sessionStorage.setItem('ab_test_data', JSON.stringify(data));
  }

  // Get session data
  private getSessionData(): any {
    const stored = sessionStorage.getItem('ab_test_data');
    return stored ? JSON.parse(stored) : { variants: {} };
  }

  // Send data to server for persistent storage
  async syncWithServer(variant: string) {
    const sessionData = this.getSessionData();
    const variantData = sessionData.variants[variant];
    
    if (!variantData) return;
    
    try {
      const response = await fetch('/api/ab-tests/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId: this.testId,
          variant,
          metrics: variantData,
          sessionDuration: this.getSessionDuration(),
          deviceType: this.getDeviceType(),
          browser: this.getBrowserInfo(),
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.error('Failed to sync A/B test data');
      }
    } catch (error) {
      console.error('Error syncing A/B test data:', error);
    }
  }
}

// Export singleton instance
export const abTestingService = new ABTestingService();

// Export hooks for React components
export function useABTestTracking(variant: string) {
  return {
    trackPageView: (properties?: Record<string, any>) => 
      abTestingService.trackPageView(variant, properties),
    trackConversion: (eventName: string, properties?: Record<string, any>) => 
      abTestingService.trackConversion(eventName, variant, properties),
    trackEngagement: (type: string, value: number) => 
      abTestingService.trackEngagement(variant, type, value),
    getConversionFunnel: () => 
      abTestingService.getConversionFunnel(variant),
    syncWithServer: () => 
      abTestingService.syncWithServer(variant)
  };
}