/**
 * Conversion tracking service for guest to registered user flow
 */

export interface ConversionEvent {
  eventType:
    | 'guest_view'
    | 'guest_cta_click'
    | 'guest_signup_attempt'
    | 'guest_signup_success'
    | 'guest_to_premium';
  termId?: string;
  ctaType?: string;
  conversionValue?: number;
  sessionId: string;
  timestamp: number;
  userAgent: string;
  referrer: string;
  metadata: Record<string, any>;
}

export interface ConversionFunnelStep {
  step:
    | 'landing'
    | 'preview'
    | 'limit_reached'
    | 'signup_initiated'
    | 'signup_completed'
    | 'premium_purchase';
  timestamp: number;
  duration?: number; // Time spent in this step
  metadata?: Record<string, any>;
}

export interface ConversionSession {
  sessionId: string;
  userId?: string;
  isConverted: boolean;
  conversionType?: 'free_signup' | 'premium_purchase';
  conversionValue?: number;
  funnelSteps: ConversionFunnelStep[];
  totalEvents: number;
  firstTouch: number;
  lastTouch: number;
  conversionTime?: number;
  source: string;
  medium: string;
  campaign?: string;
}

const CONVERSION_STORAGE_KEY = 'conversion_session';
const FUNNEL_STORAGE_KEY = 'conversion_funnel';

/**
 * Get or create conversion session
 */
export function getConversionSession(): ConversionSession {
  try {
    const stored = localStorage.getItem(CONVERSION_STORAGE_KEY);
    if (stored) {
      const session: ConversionSession = JSON.parse(stored);
      // Update last touch
      session.lastTouch = Date.now();
      saveConversionSession(session);
      return session;
    }
  } catch (error) {
    console.warn('Failed to parse conversion session:', error);
  }

  // Create new session
  return createNewConversionSession();
}

/**
 * Create a new conversion session
 */
function createNewConversionSession(): ConversionSession {
  const sessionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  // Extract UTM parameters and referrer info
  const urlParams = new URLSearchParams(window.location.search);
  const source = urlParams.get('utm_source') || document.referrer || 'direct';
  const medium = urlParams.get('utm_medium') || 'organic';
  const campaign = urlParams.get('utm_campaign') || undefined;

  const session: ConversionSession = {
    sessionId,
    isConverted: false,
    funnelSteps: [
      {
        step: 'landing',
        timestamp: now,
      },
    ],
    totalEvents: 0,
    firstTouch: now,
    lastTouch: now,
    source,
    medium,
    campaign,
  };

  saveConversionSession(session);
  return session;
}

/**
 * Save conversion session to localStorage
 */
export function saveConversionSession(session: ConversionSession): void {
  try {
    localStorage.setItem(CONVERSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save conversion session:', error);
  }
}

/**
 * Track conversion event
 */
export function trackConversionEvent(
  event: Omit<ConversionEvent, 'sessionId' | 'timestamp' | 'userAgent' | 'referrer'>
): void {
  const session = getConversionSession();

  const conversionEvent: ConversionEvent = {
    ...event,
    sessionId: session.sessionId,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    referrer: document.referrer,
  };

  // Update session
  session.totalEvents += 1;
  session.lastTouch = conversionEvent.timestamp;

  // Track funnel progression
  if (event.eventType === 'guest_view' && !session.funnelSteps.some(s => s.step === 'preview')) {
    session.funnelSteps.push({
      step: 'preview',
      timestamp: conversionEvent.timestamp,
      metadata: { termId: event.termId },
    });
  } else if (event.eventType === 'guest_cta_click') {
    const lastStep = session.funnelSteps[session.funnelSteps.length - 1];
    if (lastStep && event.metadata?.limitReached) {
      session.funnelSteps.push({
        step: 'limit_reached',
        timestamp: conversionEvent.timestamp,
        metadata: { ctaType: event.ctaType },
      });
    }
  } else if (event.eventType === 'guest_signup_attempt') {
    session.funnelSteps.push({
      step: 'signup_initiated',
      timestamp: conversionEvent.timestamp,
    });
  } else if (event.eventType === 'guest_signup_success') {
    session.funnelSteps.push({
      step: 'signup_completed',
      timestamp: conversionEvent.timestamp,
    });
    session.isConverted = true;
    session.conversionType = 'free_signup';
    session.conversionTime = conversionEvent.timestamp;
    session.userId = event.metadata?.userId;
  } else if (event.eventType === 'guest_to_premium') {
    session.funnelSteps.push({
      step: 'premium_purchase',
      timestamp: conversionEvent.timestamp,
    });
    session.isConverted = true;
    session.conversionType = 'premium_purchase';
    session.conversionValue = event.conversionValue || 249;
    session.conversionTime = conversionEvent.timestamp;
  }

  saveConversionSession(session);

  // Send to analytics (Google Analytics, Mixpanel, etc.)
  sendToAnalytics(conversionEvent, session);

  // Send to server for aggregation
  sendToServer(conversionEvent, session);
}

/**
 * Send conversion data to analytics platforms
 */
function sendToAnalytics(event: ConversionEvent, session: ConversionSession): void {
  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event.eventType, {
      event_category: 'conversion',
      event_label: event.ctaType || event.termId || 'unknown',
      session_id: event.sessionId,
      conversion_value: event.conversionValue || 0,
      source: session.source,
      medium: session.medium,
      campaign: session.campaign,
      custom_parameters: {
        funnel_step: session.funnelSteps.length,
        time_to_event: event.timestamp - session.firstTouch,
        total_events: session.totalEvents,
      },
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    if (event.eventType === 'guest_signup_success') {
      (window as any).fbq('track', 'CompleteRegistration', {
        content_name: 'AI Glossary Free Signup',
        value: 0,
        currency: 'USD',
      });
    } else if (event.eventType === 'guest_to_premium') {
      (window as any).fbq('track', 'Purchase', {
        content_name: 'AI Glossary Premium',
        value: event.conversionValue || 249,
        currency: 'USD',
      });
    }
  }

  // Mixpanel
  if (typeof window !== 'undefined' && (window as any).mixpanel) {
    (window as any).mixpanel.track(event.eventType, {
      session_id: event.sessionId,
      conversion_value: event.conversionValue,
      source: session.source,
      medium: session.medium,
      campaign: session.campaign,
      funnel_position: session.funnelSteps.length,
      time_to_event: event.timestamp - session.firstTouch,
      ...event.metadata,
    });
  }
}

/**
 * Send conversion data to server for aggregation and analysis
 */
async function sendToServer(event: ConversionEvent, session: ConversionSession): Promise<void> {
  try {
    await fetch('/api/analytics/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        session: {
          ...session,
          // Remove PII and large objects for server storage
          funnelSteps: session.funnelSteps.map(step => ({
            step: step.step,
            timestamp: step.timestamp,
            duration: step.duration,
          })),
        },
      }),
    });
  } catch (error) {
    console.warn('Failed to send conversion data to server:', error);
  }
}

/**
 * Get conversion funnel analytics
 */
export function getConversionFunnelAnalytics(): {
  currentStep: ConversionFunnelStep['step'];
  completedSteps: ConversionFunnelStep['step'][];
  timeInFunnel: number;
  dropoffRisk: 'low' | 'medium' | 'high';
  nextBestAction: string;
} {
  const session = getConversionSession();
  const currentStep = session.funnelSteps[session.funnelSteps.length - 1]?.step || 'landing';
  const completedSteps = session.funnelSteps.map(s => s.step);
  const timeInFunnel = Date.now() - session.firstTouch;

  // Calculate dropoff risk based on time and behavior
  let dropoffRisk: 'low' | 'medium' | 'high' = 'low';

  if (timeInFunnel > 30 * 60 * 1000) {
    // 30 minutes
    dropoffRisk = 'high';
  } else if (timeInFunnel > 10 * 60 * 1000 && session.totalEvents < 3) {
    // 10 minutes with low engagement
    dropoffRisk = 'medium';
  }

  // Determine next best action
  let nextBestAction = 'Continue exploring';

  if (currentStep === 'preview' && !completedSteps.includes('limit_reached')) {
    nextBestAction = 'View more terms to see full value';
  } else if (currentStep === 'limit_reached') {
    nextBestAction = 'Show free signup offer';
  } else if (currentStep === 'signup_initiated') {
    nextBestAction = 'Complete signup process';
  } else if (currentStep === 'signup_completed') {
    nextBestAction = 'Encourage premium upgrade';
  }

  return {
    currentStep,
    completedSteps,
    timeInFunnel,
    dropoffRisk,
    nextBestAction,
  };
}

/**
 * Mark conversion as completed
 */
export function markConversionCompleted(
  type: 'free_signup' | 'premium_purchase',
  value?: number,
  userId?: string
): void {
  const eventType = type === 'free_signup' ? 'guest_signup_success' : 'guest_to_premium';

  trackConversionEvent({
    eventType,
    conversionValue: value,
    metadata: { userId },
  });
}

/**
 * Get conversion session analytics for A/B testing
 */
export function getConversionSessionAnalytics(): {
  sessionDuration: number;
  pageViews: number;
  ctaClicks: number;
  conversionLikelihood: number;
  segmentType: 'high_intent' | 'medium_intent' | 'low_intent' | 'browser';
} {
  const session = getConversionSession();
  const sessionDuration = Date.now() - session.firstTouch;
  const pageViews = session.funnelSteps.filter(s => s.step === 'preview').length;
  const ctaClicks = session.totalEvents;

  // Calculate conversion likelihood score (0-100)
  let score = 0;

  // Time-based scoring
  if (sessionDuration > 2 * 60 * 1000) {score += 20;} // 2+ minutes
  if (sessionDuration > 5 * 60 * 1000) {score += 20;} // 5+ minutes

  // Engagement-based scoring
  if (pageViews >= 1) {score += 20;}
  if (pageViews >= 2) {score += 20;}
  if (ctaClicks >= 1) {score += 10;}
  if (ctaClicks >= 3) {score += 10;}

  const conversionLikelihood = Math.min(100, score);

  // Segment users based on behavior
  let segmentType: 'high_intent' | 'medium_intent' | 'low_intent' | 'browser' = 'browser';

  if (conversionLikelihood >= 70) {
    segmentType = 'high_intent';
  } else if (conversionLikelihood >= 40) {
    segmentType = 'medium_intent';
  } else if (conversionLikelihood >= 20) {
    segmentType = 'low_intent';
  }

  return {
    sessionDuration,
    pageViews,
    ctaClicks,
    conversionLikelihood,
    segmentType,
  };
}

/**
 * Clear conversion session (e.g., when user completes conversion or session expires)
 */
export function clearConversionSession(): void {
  try {
    localStorage.removeItem(CONVERSION_STORAGE_KEY);
    localStorage.removeItem(FUNNEL_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear conversion session:', error);
  }
}
