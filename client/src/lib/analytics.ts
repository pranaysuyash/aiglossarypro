import posthog from 'posthog-js'
import { ga4Analytics } from './ga4Analytics'

export const initAnalytics = () => {
  // Initialize PostHog
  if (typeof window !== 'undefined' && process.env.VITE_POSTHOG_KEY) {
    posthog.init(process.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      }
    })
  }

  // GA4 Analytics is automatically initialized in its constructor
  // It will only initialize if consent is given and configuration is valid
}

// Custom event tracking with dual tracking (PostHog + GA4)
export const trackTermView = (termId: string, termName: string, section?: string) => {
  // PostHog tracking
  posthog.capture('term_viewed', {
    term_id: termId,
    term_name: termName,
    section: section,
    timestamp: new Date().toISOString()
  })

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
      section: section || 'glossary'
    }
  })
}

export const trackSearch = (query: string, resultsCount: number, filters?: any) => {
  // PostHog tracking
  posthog.capture('search_performed', {
    query,
    results_count: resultsCount,
    filters: filters || {},
    timestamp: new Date().toISOString()
  })

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
      filters: JSON.stringify(filters || {})
    }
  })
}

export const trackUserAction = (action: string, properties: any = {}) => {
  // PostHog tracking
  posthog.capture(action, {
    ...properties,
    timestamp: new Date().toISOString()
  })

  // GA4 tracking - determine event type based on action
  if (action.includes('cta') || action.includes('click')) {
    ga4Analytics.trackCTAClick(
      properties.button_text || action,
      properties.location || 'unknown',
      properties.section || 'general',
      properties.value || 1
    )
  } else {
    ga4Analytics.trackEngagement({
      event_name: action,
      engagement_type: 'cta_click',
      engagement_value: properties.value || 1,
      page_location: window.location.href,
      page_title: document.title,
      event_category: properties.category || 'user_action',
      event_label: action,
      custom_parameters: properties
    })
  }
}

export { posthog }
