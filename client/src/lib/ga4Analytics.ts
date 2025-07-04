import { isCookieAllowed } from '@/components/CookieConsentBanner';
import { getValidatedAnalyticsConfig } from './analyticsConfig';

// GA4 Event interfaces
export interface GA4Event {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  item_id?: string;
  item_name?: string;
  item_category?: string;
  item_brand?: string;
  price?: number;
  quantity?: number;
  user_properties?: Record<string, any>;
  custom_parameters?: Record<string, any>;
}

export interface GA4ConversionEvent extends GA4Event {
  conversion_type: 'trial_signup' | 'premium_purchase' | 'newsletter_signup' | 'contact_form';
  funnel_stage: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface GA4EngagementEvent extends GA4Event {
  engagement_type: 'scroll_depth' | 'time_on_page' | 'section_view' | 'cta_click';
  engagement_value: number;
  page_location: string;
  page_title: string;
}

export interface GA4BusinessEvent extends GA4Event {
  business_metric: 'early_bird_signup' | 'pricing_interaction' | 'ab_test_view' | 'feature_discovery';
  variant?: string;
  test_id?: string;
  cohort?: string;
}

// GA4 Analytics Service
class GA4AnalyticsService {
  private measurementId: string;
  private apiSecret: string;
  private isEnabled: boolean;
  private isDebug: boolean;
  private userId?: string;
  private sessionId: string;
  private sessionStartTime: number;
  private pageViewId: string;

  constructor() {
    // Get validated configuration
    const { config, validation } = getValidatedAnalyticsConfig();
    
    this.measurementId = config.ga4.measurementId;
    this.apiSecret = import.meta.env.VITE_GA4_API_SECRET || '';
    this.isEnabled = config.ga4.enabled && validation.isValid;
    this.isDebug = config.ga4.debugMode;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.pageViewId = this.generatePageViewId();

    // Log configuration issues
    if (!validation.isValid) {
      console.error('GA4 Analytics disabled due to configuration errors:', validation.errors);
    }
    
    if (validation.warnings.length > 0 && this.isDebug) {
      console.warn('GA4 Analytics configuration warnings:', validation.warnings);
    }

    // Initialize GA4 if enabled and consent given
    if (this.isEnabled && this.hasAnalyticsConsent()) {
      this.initialize();
    }

    // Listen for consent changes
    if (typeof window !== 'undefined') {
      window.addEventListener('cookieConsentUpdated', this.handleConsentUpdate.bind(this));
    }
  }

  // Initialize GA4
  private initialize(): void {
    if (!this.measurementId || typeof window === 'undefined') return;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.gtag = function() {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(arguments);
    };

    window.gtag('js', new Date());

    // Get configuration for GA4 setup
    const { config } = getValidatedAnalyticsConfig();
    
    // Configure GA4 with privacy settings
    window.gtag('config', this.measurementId, {
      // Privacy and consent settings
      anonymize_ip: config.privacy.anonymizeIp,
      allow_google_signals: config.privacy.allowGoogleSignals,
      allow_ad_personalization_signals: config.privacy.allowAdPersonalization,
      
      // Enhanced measurement settings
      send_page_view: false, // We'll handle page views manually
      
      // Debug mode based on configuration
      debug_mode: config.ga4.debugMode,
      
      // Custom parameters
      custom_map: {
        'custom_user_id': 'user_id',
        'ab_test_variant': 'variant',
        'pricing_tier': 'tier',
        'user_cohort': 'cohort'
      },

      // Cookie settings from configuration
      cookie_flags: config.ga4.cookieFlags,
      cookie_expires: config.ga4.cookieExpires,
    });

    if (this.isDebug) {
      console.log('GA4 Analytics initialized with measurement ID:', this.measurementId);
    }
  }

  // Handle consent updates
  private handleConsentUpdate(): void {
    if (this.hasAnalyticsConsent() && !this.isInitialized()) {
      this.initialize();
    }
  }

  // Check if analytics consent is given
  private hasAnalyticsConsent(): boolean {
    return isCookieAllowed('analytics');
  }

  // Check if GA4 is initialized
  private isInitialized(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate page view ID
  private generatePageViewId(): string {
    return `pageview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID
  setUserId(userId: string): void {
    this.userId = userId;
    if (this.isInitialized()) {
      window.gtag('config', this.measurementId, {
        user_id: userId
      });
    }
  }

  // Track page view
  trackPageView(page_title: string, page_location?: string): void {
    if (!this.hasAnalyticsConsent() || !this.isInitialized()) return;

    this.pageViewId = this.generatePageViewId();
    
    const pageViewData = {
      page_title,
      page_location: page_location || window.location.href,
      page_referrer: document.referrer,
      session_id: this.sessionId,
      page_view_id: this.pageViewId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      
      // Enhanced ecommerce parameters for landing page
      content_group1: this.getContentGroup(page_location),
      content_group2: this.getPageType(page_location),
      
      // Technical details
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      user_agent: navigator.userAgent,
      language: navigator.language,
    };

    window.gtag('event', 'page_view', pageViewData);

    if (this.isDebug) {
      console.log('GA4 Page View:', pageViewData);
    }
  }

  // Track conversion events
  trackConversion(event: GA4ConversionEvent): void {
    if (!this.hasAnalyticsConsent() || !this.isInitialized()) return;

    const conversionData = {
      ...event,
      session_id: this.sessionId,
      page_view_id: this.pageViewId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      session_duration: this.getSessionDuration(),
      
      // Conversion funnel tracking
      funnel_stage: event.funnel_stage,
      conversion_type: event.conversion_type,
      
      // Attribution data
      source: event.source || this.getTrafficSource(),
      medium: event.medium || this.getTrafficMedium(),
      campaign: event.campaign || this.getCampaign(),
    };

    // Track as GA4 conversion event
    window.gtag('event', 'conversion', conversionData);

    // Also track specific conversion type
    window.gtag('event', event.conversion_type, {
      event_category: 'conversion',
      event_label: event.funnel_stage,
      value: event.value || 1,
      currency: event.currency || 'USD',
      ...conversionData
    });

    if (this.isDebug) {
      console.log('GA4 Conversion:', conversionData);
    }
  }

  // Track engagement events
  trackEngagement(event: GA4EngagementEvent): void {
    if (!this.hasAnalyticsConsent() || !this.isInitialized()) return;

    const engagementData = {
      ...event,
      session_id: this.sessionId,
      page_view_id: this.pageViewId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      session_duration: this.getSessionDuration(),
    };

    window.gtag('event', event.engagement_type, {
      event_category: 'engagement',
      event_label: event.engagement_type,
      value: event.engagement_value,
      ...engagementData
    });

    if (this.isDebug) {
      console.log('GA4 Engagement:', engagementData);
    }
  }

  // Track business metrics
  trackBusinessEvent(event: GA4BusinessEvent): void {
    if (!this.hasAnalyticsConsent() || !this.isInitialized()) return;

    const businessData = {
      ...event,
      session_id: this.sessionId,
      page_view_id: this.pageViewId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      session_duration: this.getSessionDuration(),
    };

    window.gtag('event', event.business_metric, {
      event_category: 'business_metrics',
      event_label: event.business_metric,
      value: event.value || 1,
      custom_map: {
        variant: event.variant,
        test_id: event.test_id,
        cohort: event.cohort
      },
      ...businessData
    });

    if (this.isDebug) {
      console.log('GA4 Business Event:', businessData);
    }
  }

  // Track CTA clicks
  trackCTAClick(cta_text: string, cta_location: string, section: string, value?: number): void {
    this.trackEngagement({
      event_name: 'cta_click',
      engagement_type: 'cta_click',
      engagement_value: value || 1,
      page_location: window.location.href,
      page_title: document.title,
      event_category: 'engagement',
      event_label: cta_text,
      item_name: cta_text,
      item_category: section,
      custom_parameters: {
        cta_location,
        section
      }
    });
  }

  // Track scroll depth
  trackScrollDepth(percentage: number): void {
    this.trackEngagement({
      event_name: 'scroll',
      engagement_type: 'scroll_depth',
      engagement_value: percentage,
      page_location: window.location.href,
      page_title: document.title,
      event_category: 'engagement',
      event_label: `${percentage}%`,
      value: percentage
    });
  }

  // Track section views
  trackSectionView(section_name: string, section_position?: number): void {
    this.trackEngagement({
      event_name: 'section_view',
      engagement_type: 'section_view',
      engagement_value: 1,
      page_location: window.location.href,
      page_title: document.title,
      event_category: 'engagement',
      event_label: section_name,
      item_name: section_name,
      custom_parameters: {
        section_position: section_position || 0,
        section_name
      }
    });
  }

  // Track form submissions
  trackFormSubmission(form_type: 'contact' | 'newsletter' | 'signup', form_location: string): void {
    this.trackConversion({
      event_name: 'form_submit',
      conversion_type: form_type === 'contact' ? 'contact_form' : 'newsletter_signup',
      funnel_stage: form_type === 'contact' ? 'contact_inquiry' : 'newsletter_subscribe',
      event_category: 'conversion',
      event_label: form_type,
      value: 1,
      custom_parameters: {
        form_type,
        form_location
      }
    });
  }

  // Track early bird signups
  trackEarlyBirdSignup(pricing_tier: string, discount_percentage: number): void {
    this.trackBusinessEvent({
      event_name: 'early_bird_signup',
      business_metric: 'early_bird_signup',
      event_category: 'business_metrics',
      event_label: pricing_tier,
      value: discount_percentage,
      custom_parameters: {
        pricing_tier,
        discount_percentage,
        offer_type: 'early_bird'
      }
    });
  }

  // Track A/B test interactions
  trackABTestView(test_id: string, variant: string, test_type: string): void {
    this.trackBusinessEvent({
      event_name: 'ab_test_view',
      business_metric: 'ab_test_view',
      variant,
      test_id,
      event_category: 'business_metrics',
      event_label: `${test_type}_${variant}`,
      value: 1,
      custom_parameters: {
        test_type,
        variant,
        test_id
      }
    });
  }

  // Enhanced ecommerce tracking for purchases
  trackPurchase(transaction_id: string, value: number, currency: string = 'USD', items: any[]): void {
    if (!this.hasAnalyticsConsent() || !this.isInitialized()) return;

    window.gtag('event', 'purchase', {
      transaction_id,
      value,
      currency,
      items,
      session_id: this.sessionId,
      user_id: this.userId,
      event_category: 'ecommerce',
      event_label: 'premium_purchase'
    });

    // Also track as conversion
    this.trackConversion({
      event_name: 'purchase',
      conversion_type: 'premium_purchase',
      funnel_stage: 'purchase_complete',
      value,
      currency,
      transaction_id,
      event_category: 'conversion',
      event_label: 'premium_purchase'
    });
  }

  // Conversion funnel tracking
  trackFunnelStep(funnelName: string, stepName: string, stepPosition: number, value?: number): void {
    if (!this.hasAnalyticsConsent() || !this.isInitialized()) return;

    const funnelData = {
      funnel_name: funnelName,
      step_name: stepName,
      step_position: stepPosition,
      session_id: this.sessionId,
      page_view_id: this.pageViewId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      session_duration: this.getSessionDuration(),
      value: value || 1
    };

    window.gtag('event', 'funnel_step', {
      event_category: 'funnel_tracking',
      event_label: `${funnelName}_step_${stepPosition}`,
      value: value || 1,
      custom_parameters: funnelData
    });

    // Store funnel progress in session storage for analysis
    this.storeFunnelProgress(funnelName, stepName, stepPosition);

    if (this.isDebug) {
      console.log('GA4 Funnel Step:', funnelData);
    }
  }

  // Track user journey progression
  trackUserJourney(journey: {
    journeyId: string;
    stage: string;
    action: string;
    metadata?: Record<string, any>;
  }): void {
    if (!this.hasAnalyticsConsent() || !this.isInitialized()) return;

    const journeyData = {
      journey_id: journey.journeyId,
      journey_stage: journey.stage,
      journey_action: journey.action,
      session_id: this.sessionId,
      page_view_id: this.pageViewId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      session_duration: this.getSessionDuration(),
      ...journey.metadata
    };

    window.gtag('event', 'user_journey', {
      event_category: 'user_journey',
      event_label: `${journey.stage}_${journey.action}`,
      value: 1,
      custom_parameters: journeyData
    });

    if (this.isDebug) {
      console.log('GA4 User Journey:', journeyData);
    }
  }

  // Predefined conversion funnels for the landing page
  trackLandingPageFunnel(step: 'page_view' | 'hero_engagement' | 'pricing_view' | 'cta_click' | 'signup_start' | 'signup_complete'): void {
    const stepMap = {
      'page_view': { name: 'Landing Page View', position: 1 },
      'hero_engagement': { name: 'Hero Section Engagement', position: 2 },
      'pricing_view': { name: 'Pricing Section View', position: 3 },
      'cta_click': { name: 'CTA Click', position: 4 },
      'signup_start': { name: 'Signup Started', position: 5 },
      'signup_complete': { name: 'Signup Completed', position: 6 }
    };

    const stepInfo = stepMap[step];
    this.trackFunnelStep('landing_page_conversion', stepInfo.name, stepInfo.position);
  }

  // Store funnel progress for analysis
  private storeFunnelProgress(funnelName: string, stepName: string, stepPosition: number): void {
    try {
      const storageKey = `ga4_funnel_${funnelName}`;
      const existingData = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      
      existingData[stepPosition] = {
        stepName,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        pageViewId: this.pageViewId
      };

      sessionStorage.setItem(storageKey, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error storing funnel progress:', error);
    }
  }

  // Get funnel progress for current session
  getFunnelProgress(funnelName: string): Record<number, any> {
    try {
      const storageKey = `ga4_funnel_${funnelName}`;
      return JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    } catch (error) {
      console.error('Error retrieving funnel progress:', error);
      return {};
    }
  }

  // Utility methods
  private getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  private getContentGroup(page_location?: string): string {
    const url = page_location || window.location.pathname;
    if (url === '/') return 'landing';
    if (url.startsWith('/app')) return 'application';
    if (url.startsWith('/admin')) return 'admin';
    return 'other';
  }

  private getPageType(page_location?: string): string {
    const url = page_location || window.location.pathname;
    if (url === '/') return 'marketing';
    if (url.includes('terms') || url.includes('privacy')) return 'legal';
    if (url.includes('about')) return 'informational';
    return 'functional';
  }

  private getTrafficSource(): string {
    const referrer = document.referrer;
    if (!referrer) return 'direct';
    
    const hostname = new URL(referrer).hostname;
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('facebook')) return 'facebook';
    if (hostname.includes('twitter')) return 'twitter';
    if (hostname.includes('linkedin')) return 'linkedin';
    
    return 'referral';
  }

  private getTrafficMedium(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_medium') || 'organic';
  }

  private getCampaign(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_campaign') || '(not set)';
  }

  // Development and testing methods
  enableDebugMode(): void {
    this.isDebug = true;
    if (this.isInitialized()) {
      window.gtag('config', this.measurementId, { debug_mode: true });
    }
  }

  disableDebugMode(): void {
    this.isDebug = false;
    if (this.isInitialized()) {
      window.gtag('config', this.measurementId, { debug_mode: false });
    }
  }

  // Get current session info for debugging
  getSessionInfo(): object {
    return {
      sessionId: this.sessionId,
      pageViewId: this.pageViewId,
      userId: this.userId,
      sessionDuration: this.getSessionDuration(),
      measurementId: this.measurementId,
      isEnabled: this.isEnabled,
      hasConsent: this.hasAnalyticsConsent(),
      isInitialized: this.isInitialized()
    };
  }
}

// Export singleton instance
export const ga4Analytics = new GA4AnalyticsService();

// Global gtag interface
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Export utility functions for React components
export const useGA4 = () => {
  return {
    trackPageView: ga4Analytics.trackPageView.bind(ga4Analytics),
    trackConversion: ga4Analytics.trackConversion.bind(ga4Analytics),
    trackEngagement: ga4Analytics.trackEngagement.bind(ga4Analytics),
    trackBusinessEvent: ga4Analytics.trackBusinessEvent.bind(ga4Analytics),
    trackCTAClick: ga4Analytics.trackCTAClick.bind(ga4Analytics),
    trackScrollDepth: ga4Analytics.trackScrollDepth.bind(ga4Analytics),
    trackSectionView: ga4Analytics.trackSectionView.bind(ga4Analytics),
    trackFormSubmission: ga4Analytics.trackFormSubmission.bind(ga4Analytics),
    trackEarlyBirdSignup: ga4Analytics.trackEarlyBirdSignup.bind(ga4Analytics),
    trackABTestView: ga4Analytics.trackABTestView.bind(ga4Analytics),
    trackPurchase: ga4Analytics.trackPurchase.bind(ga4Analytics),
    trackFunnelStep: ga4Analytics.trackFunnelStep.bind(ga4Analytics),
    trackUserJourney: ga4Analytics.trackUserJourney.bind(ga4Analytics),
    trackLandingPageFunnel: ga4Analytics.trackLandingPageFunnel.bind(ga4Analytics),
    getFunnelProgress: ga4Analytics.getFunnelProgress.bind(ga4Analytics),
    setUserId: ga4Analytics.setUserId.bind(ga4Analytics),
    getSessionInfo: ga4Analytics.getSessionInfo.bind(ga4Analytics)
  };
};

export default ga4Analytics;