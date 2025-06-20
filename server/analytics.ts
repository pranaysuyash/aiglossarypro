import { PostHog } from 'posthog-node'

let client: PostHog | null = null

export const initServerAnalytics = () => {
  if (process.env.POSTHOG_API_KEY && !client) {
    client = new PostHog(process.env.POSTHOG_API_KEY, {
      host: 'https://app.posthog.com'
    })
  }
  return client
}

export const trackServerEvent = (event: string, properties: any, userId?: string) => {
  if (!client) {
    client = initServerAnalytics()
  }
  
  if (client) {
    client.capture({
      distinctId: userId || 'anonymous',
      event,
      properties: {
        ...properties,
        server_timestamp: new Date().toISOString(),
        source: 'server'
      }
    })
  }
}

// Specific server event trackers
export const trackTermAccess = (termId: string, userId?: string) => {
  trackServerEvent('term_accessed_server', { term_id: termId }, userId)
}

export const trackSearchPerformed = (query: string, resultCount: number, userId?: string) => {
  trackServerEvent('search_performed_server', { 
    query, 
    result_count: resultCount,
    query_length: query.length 
  }, userId)
}

export const trackApiCall = (endpoint: string, method: string, responseTime: number, userId?: string) => {
  trackServerEvent('api_call', {
    endpoint,
    method,
    response_time: responseTime
  }, userId)
}

export const trackUserRegistration = (userId: string, method: string) => {
  trackServerEvent('user_registered', {
    registration_method: method
  }, userId)
}

export const closeAnalytics = () => {
  if (client) {
    client.shutdown()
  }
}
