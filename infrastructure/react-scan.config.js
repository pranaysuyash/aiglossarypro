// React Scan Configuration for AIGlossaryPro
export default {
  // Enable React Scan only in development mode
  enabled: process.env.NODE_ENV === 'development',

  // Performance monitoring options
  monitoring: {
    // Track render performance
    renderTime: true,
    // Track component lifecycle
    lifecycle: true,
    // Track state changes
    stateChanges: true,
    // Track prop changes
    propChanges: true,
    // Track context changes
    contextChanges: true,
  },

  // Reporting configuration
  reporting: {
    // Generate reports automatically
    autoReport: true,
    // Report interval in milliseconds (every 30 seconds)
    interval: 30000,
    // Console output for real-time monitoring
    console: true,
    // Save reports to file
    saveToFile: true,
    // Report file path
    reportPath: './performance-reports',
    // Report format (json, html, csv)
    format: ['json', 'html'],
    // Include stack traces for slow renders
    includeStackTraces: true,
  },

  // Performance thresholds
  thresholds: {
    // Render time threshold in milliseconds
    renderTime: 16, // 60fps target
    // Component render count threshold
    renderCount: 10,
    // Memory usage threshold in MB
    memoryUsage: 50,
    // Bundle size threshold in MB
    bundleSize: 5,
  },

  // Component filtering
  filters: {
    // Include only these components (empty array means all)
    include: [],
    // Exclude these components
    exclude: [
      // Exclude third-party library components
      'RadixUI*',
      'Framer*',
      'Recharts*',
      'ReactWindow*',
      // Exclude dev tools
      'DevTools*',
      'HotReload*',
    ],
    // Include components with these patterns
    includePatterns: [
      // Focus on our custom components
      'src/components/**',
      'src/pages/**',
      'src/features/**',
    ],
  },

  // Integration with existing tools
  integrations: {
    // PostHog integration for analytics
    posthog: {
      enabled: true,
      apiKey: process.env.VITE_POSTHOG_API_KEY,
      // Send performance metrics to PostHog
      sendMetrics: true,
      // Custom event names
      events: {
        slowRender: 'react_scan_slow_render',
        memoryLeak: 'react_scan_memory_leak',
        performanceReport: 'react_scan_performance_report',
      },
    },

    // Sentry integration for error tracking
    sentry: {
      enabled: true,
      // Send performance issues to Sentry
      sendPerformanceIssues: true,
      // Performance issue threshold
      performanceThreshold: 100, // milliseconds
    },

    // Chrome DevTools integration
    devTools: {
      enabled: true,
      // Show performance timeline
      timeline: true,
      // Show memory usage
      memory: true,
      // Show component tree
      componentTree: true,
    },
  },

  // Advanced options
  advanced: {
    // Sample rate for performance monitoring (0.1 = 10%)
    sampleRate: 1.0, // 100% in development
    // Buffer size for performance data
    bufferSize: 1000,
    // Debounce interval for frequent updates
    debounceInterval: 100,
    // Enable experimental features
    experimental: {
      // Track async components
      asyncComponents: true,
      // Track concurrent features
      concurrent: true,
      // Track Suspense boundaries
      suspense: true,
    },
  },

  // Alert configuration
  alerts: {
    // Enable performance alerts
    enabled: true,
    // Alert thresholds
    thresholds: {
      // Alert when render time exceeds 50ms
      renderTime: 50,
      // Alert when component renders more than 20 times
      renderCount: 20,
      // Alert when memory usage exceeds 100MB
      memoryUsage: 100,
    },
    // Alert channels
    channels: {
      // Console alerts
      console: true,
      // Desktop notifications
      desktop: true,
      // Custom webhook (for Slack, Discord, etc.)
      webhook: process.env.REACT_SCAN_WEBHOOK_URL,
    },
  },

  // Custom metrics
  customMetrics: {
    // Track custom performance metrics
    enabled: true,
    // Custom metric definitions
    metrics: [
      {
        name: 'glossary_search_time',
        description: 'Time to search glossary terms',
        type: 'timing',
        threshold: 200, // milliseconds
      },
      {
        name: 'term_details_load_time',
        description: 'Time to load term details',
        type: 'timing',
        threshold: 500, // milliseconds
      },
      {
        name: 'user_interaction_lag',
        description: 'Lag between user interaction and response',
        type: 'timing',
        threshold: 100, // milliseconds
      },
    ],
  },
};
