import posthog from 'posthog-js'

export const initAnalytics = () => {
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
}

// Custom event tracking
export const trackTermView = (termId: string, termName: string, section?: string) => {
  posthog.capture('term_viewed', {
    term_id: termId,
    term_name: termName,
    section: section,
    timestamp: new Date().toISOString()
  })
}

export const trackSearch = (query: string, resultsCount: number, filters?: any) => {
  posthog.capture('search_performed', {
    query,
    results_count: resultsCount,
    filters: filters || {},
    timestamp: new Date().toISOString()
  })
}

export const trackUserAction = (action: string, properties: any = {}) => {
  posthog.capture(action, {
    ...properties,
    timestamp: new Date().toISOString()
  })
}

export { posthog }
