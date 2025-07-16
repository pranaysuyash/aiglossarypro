import posthog from 'posthog-js';
import { ga4Analytics } from './ga4Analytics';

// Performance tracking interfaces
interface PerformanceMetric {
  component: string;
  renderTime: number;
  renderCount: number;
  memoryUsage: number;
  timestamp: number;
  stackTrace?: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

interface PerformanceThresholds {
  renderTime: number;
  memoryUsage: number;
  renderCount: number;
}

// Helper to check if analytics should be disabled
const isAnalyticsDisabled = () => {
  // Only disable in development when VITE_DISABLE_ANALYTICS is true
  return import.meta.env.DEV && import.meta.env.VITE_DISABLE_ANALYTICS === 'true';
};

export const initAnalytics = () => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {
    console.log('📊 Analytics disabled for local development');
    return;
  }

  // Initialize PostHog
  if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      loaded: posthog => {
        if (import.meta.env.DEV) {posthog.debug();}
      },
    });
  }

  // GA4 Analytics is automatically initialized in its constructor
  // It will only initialize if consent is given and configuration is valid
};

// Custom event tracking with dual tracking (PostHog + GA4)
export const trackTermView = (termId: string, termName: string, section?: string) => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {return;}

  // PostHog tracking
  posthog.capture('term_viewed', {
    term_id: termId,
    term_name: termName,
    section: section,
    timestamp: new Date().toISOString(),
  });

  // GA4 tracking
  ga4Analytics.trackEngagement({
    event_name: 'term_view',
    engagement_type: 'section_view',
    engagement_value: 1,
    page_location: window.location.href,
    page_title: document.title,
    event_category: 'content',
    event_label: termName,
    item_id: termId,
    item_name: termName,
    item_category: section || 'glossary',
    custom_parameters: {
      term_id: termId,
      section: section || 'glossary',
    },
  });
};

export const trackSearch = (
  query: string,
  resultsCount: number,
  filters?: Record<string, unknown>
) => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {return;}

  // PostHog tracking
  posthog.capture('search_performed', {
    query,
    results_count: resultsCount,
    filters: filters || {},
    timestamp: new Date().toISOString(),
  });

  // GA4 tracking
  ga4Analytics.trackEngagement({
    event_name: 'search',
    engagement_type: 'cta_click',
    engagement_value: resultsCount,
    page_location: window.location.href,
    page_title: document.title,
    event_category: 'engagement',
    event_label: query,
    value: resultsCount,
    custom_parameters: {
      search_term: query,
      results_count: resultsCount,
      filters: JSON.stringify(filters || {}),
    },
  });
};

export const trackUserAction = (action: string, properties: Record<string, unknown> = {}) => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {return;}

  // PostHog tracking
  posthog.capture(action, {
    ...properties,
    timestamp: new Date().toISOString(),
  });

  // GA4 tracking - determine event type based on action
  if (action.includes('cta') || action.includes('click')) {
    ga4Analytics.trackCTAClick(
      String(properties.button_text) || action,
      String(properties.location) || 'unknown',
      String(properties.section) || 'general',
      Number(properties.value) || 1
    );
  } else {
    ga4Analytics.trackEngagement({
      event_name: action,
      engagement_type: 'cta_click',
      engagement_value: properties.value || 1,
      page_location: window.location.href,
      page_title: document.title,
      event_category: properties.category || 'user_action',
      event_label: action,
      custom_parameters: properties,
    });
  }
};

// Performance tracking functions
const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  renderTime: 16, // 60fps target
  memoryUsage: 50, // 50MB threshold
  renderCount: 5, // 5 renders per second threshold
};

export const trackPerformanceMetric = (metric: PerformanceMetric) => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {return;}

  // Only track in development mode
  if (!import.meta.env.DEV) {return;}

  const isSlowRender = metric.renderTime > PERFORMANCE_THRESHOLDS.renderTime;
  const isHighMemoryUsage = metric.memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage;
  const isFrequentRender = metric.renderCount > PERFORMANCE_THRESHOLDS.renderCount;

  // Track to PostHog
  posthog.capture('react_performance_metric', {
    component: metric.component,
    render_time: metric.renderTime,
    render_count: metric.renderCount,
    memory_usage: metric.memoryUsage,
    timestamp: metric.timestamp,
    is_slow_render: isSlowRender,
    is_high_memory: isHighMemoryUsage,
    is_frequent_render: isFrequentRender,
    performance_score: calculatePerformanceScore(metric),
  });

  // Track performance issues to GA4
  if (isSlowRender || isHighMemoryUsage || isFrequentRender) {
    ga4Analytics.trackEngagement({
      event_name: 'performance_issue',
      engagement_type: 'performance_alert',
      engagement_value: metric.renderTime,
      page_location: window.location.href,
      page_title: document.title,
      event_category: 'performance',
      event_label: metric.component,
      custom_parameters: {
        component: metric.component,
        render_time: metric.renderTime,
        memory_usage: metric.memoryUsage,
        issue_type: getIssueType(metric),
      },
    });
  }
};

export const trackSlowRender = (component: string, renderTime: number, stackTrace?: string) => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {return;}

  // Track to PostHog
  posthog.capture('slow_render_detected', {
    component,
    render_time: renderTime,
    stack_trace: stackTrace,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });

  // Track to GA4
  ga4Analytics.trackEngagement({
    event_name: 'slow_render',
    engagement_type: 'performance_alert',
    engagement_value: renderTime,
    page_location: window.location.href,
    page_title: document.title,
    event_category: 'performance',
    event_label: component,
    custom_parameters: {
      component,
      render_time: renderTime,
      has_stack_trace: !!stackTrace,
    },
  });
};

export const trackMemoryLeak = (component: string, memoryUsage: number, previousUsage?: number) => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {return;}

  const growthRate = previousUsage ? ((memoryUsage - previousUsage) / previousUsage) * 100 : 0;

  // Track to PostHog
  posthog.capture('memory_leak_detected', {
    component,
    memory_usage: memoryUsage,
    previous_usage: previousUsage,
    growth_rate: growthRate,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });

  // Track to GA4
  ga4Analytics.trackEngagement({
    event_name: 'memory_leak',
    engagement_type: 'performance_alert',
    engagement_value: memoryUsage,
    page_location: window.location.href,
    page_title: document.title,
    event_category: 'performance',
    event_label: component,
    custom_parameters: {
      component,
      memory_usage: memoryUsage,
      growth_rate: growthRate,
    },
  });
};

export const trackPerformanceReport = (report: {
  totalRenders: number;
  averageRenderTime: number;
  uniqueComponents: number;
  slowRenders: number;
  memoryUsage: number;
  duration: number;
}) => {
  // Check if analytics is disabled
  if (isAnalyticsDisabled()) {return;}

  // Track to PostHog
  posthog.capture('performance_report_generated', {
    total_renders: report.totalRenders,
    average_render_time: report.averageRenderTime,
    unique_components: report.uniqueComponents,
    slow_renders: report.slowRenders,
    memory_usage: report.memoryUsage,
    duration: report.duration,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });

  // Track to GA4
  ga4Analytics.trackEngagement({
    event_name: 'performance_report',
    engagement_type: 'performance_summary',
    engagement_value: report.averageRenderTime,
    page_location: window.location.href,
    page_title: document.title,
    event_category: 'performance',
    event_label: 'report_generated',
    custom_parameters: {
      total_renders: report.totalRenders,
      average_render_time: report.averageRenderTime,
      slow_renders: report.slowRenders,
      performance_score: calculateReportPerformanceScore(report),
    },
  });
};

// Helper functions
const calculatePerformanceScore = (metric: PerformanceMetric): number => {
  let score = 100;

  // Deduct points for slow renders
  if (metric.renderTime > 16) {
    score -= Math.min(50, (metric.renderTime - 16) * 2);
  }

  // Deduct points for high memory usage
  if (metric.memoryUsage > 50) {
    score -= Math.min(30, (metric.memoryUsage - 50) * 0.5);
  }

  // Deduct points for frequent renders
  if (metric.renderCount > 5) {
    score -= Math.min(20, (metric.renderCount - 5) * 2);
  }

  return Math.max(0, score);
};

const getIssueType = (metric: PerformanceMetric): string => {
  const issues = [];

  if (metric.renderTime > PERFORMANCE_THRESHOLDS.renderTime) {
    issues.push('slow_render');
  }

  if (metric.memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage) {
    issues.push('high_memory');
  }

  if (metric.renderCount > PERFORMANCE_THRESHOLDS.renderCount) {
    issues.push('frequent_render');
  }

  return issues.join(',');
};

const calculateReportPerformanceScore = (report: {
  totalRenders: number;
  averageRenderTime: number;
  slowRenders: number;
}): number => {
  let score = 100;

  // Deduct points for slow average render time
  if (report.averageRenderTime > 16) {
    score -= Math.min(40, (report.averageRenderTime - 16) * 2);
  }

  // Deduct points for high percentage of slow renders
  const slowRenderPercentage = (report.slowRenders / report.totalRenders) * 100;
  if (slowRenderPercentage > 5) {
    score -= Math.min(30, (slowRenderPercentage - 5) * 2);
  }

  return Math.max(0, score);
};

// Initialize React Scan integration in development
export const initReactScanIntegration = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    // Listen for React Scan events
    window.addEventListener('react-scan-metric', (event: CustomEvent<PerformanceMetric>) => {
      const metric = event.detail as PerformanceMetric;
      trackPerformanceMetric(metric);
    });

    window.addEventListener(
      'react-scan-slow-render',
      (event: CustomEvent<{ component: string; renderTime: number; stackTrace?: string }>) => {
        const { component, renderTime, stackTrace } = event.detail;
        trackSlowRender(component, renderTime, stackTrace);
      }
    );

    window.addEventListener(
      'react-scan-memory-leak',
      (event: CustomEvent<{ component: string; memoryUsage: number; previousUsage?: number }>) => {
        const { component, memoryUsage, previousUsage } = event.detail;
        trackMemoryLeak(component, memoryUsage, previousUsage);
      }
    );

    console.log('🔍 React Scan analytics integration initialized');
  }
};

export { posthog, isAnalyticsDisabled };
