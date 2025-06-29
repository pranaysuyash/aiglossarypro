// =============================================================================
// CENTRALIZED CONSTANTS - DO NOT USE MAGIC STRINGS/NUMBERS IN CODE
// =============================================================================

// Time periods and date calculations
export const TIME_CONSTANTS = {
  // Standard time periods
  TWENTY_FOUR_HOURS: '24h',
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
  NINETY_DAYS: '90d',
  ONE_YEAR: '365d',
  
  // Time calculations (in milliseconds)
  MILLISECONDS_IN_SECOND: 1000,
  SECONDS_IN_MINUTE: 60,
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  MILLISECONDS_IN_HOUR: 60 * 60 * 1000,
  MILLISECONDS_IN_DAY: 24 * 60 * 60 * 1000,
  
  // Relative time thresholds (in seconds)
  SECONDS_IN_HOUR: 3600,
  SECONDS_IN_DAY: 86400,
  SECONDS_IN_MONTH: 2592000,
  SECONDS_IN_YEAR: 31536000,
  
  // Date format patterns
  DATE_FORMATS: {
    SHORT: 'short',
    LONG: 'long',
    ISO: 'iso'
  }
} as const;

// Currency and pricing constants
export const PRICING_CONSTANTS = {
  // Currency values in cents
  LIFETIME_PRICE_CENTS: 24900, // $249.00
  BASIC_PRICE_CENTS: 12900,    // $129.00
  
  // Currency codes
  CURRENCY_USD: 'USD',
  
  // Pricing display
  LIFETIME_PRICE_DISPLAY: '$249.00',
  BASIC_PRICE_DISPLAY: '$129.00',
  
  // Subscription tiers
  SUBSCRIPTION_TIERS: {
    FREE: 'free',
    BASIC: 'basic', 
    LIFETIME: 'lifetime'
  }
} as const;

// CSV export constants
export const CSV_CONSTANTS = {
  // File formats
  FORMAT_CSV: 'csv',
  FORMAT_JSON: 'json',
  
  // Content types
  CONTENT_TYPE_CSV: 'text/csv',
  CONTENT_TYPE_JSON: 'application/json',
  
  // Default CSV columns for different data types
  ANALYTICS_COLUMNS: [
    { key: 'termName', header: 'Term Name' },
    { key: 'categories', header: 'Categories' },
    { key: 'totalViews', header: 'Total Views' },
    { key: 'recentViews', header: 'Recent Views' },
    { key: 'lastViewed', header: 'Last Viewed' }
  ],
  
  USER_COLUMNS: [
    { key: 'id', header: 'User ID' },
    { key: 'email', header: 'Email' },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'role', header: 'Role' },
    { key: 'isActive', header: 'Active' },
    { key: 'createdAt', header: 'Created Date' },
    { key: 'lastLoginAt', header: 'Last Login' }
  ],
  
  PURCHASE_COLUMNS: [
    { key: 'createdAt', header: 'Date' },
    { key: 'gumroadOrderId', header: 'Order ID' },
    { key: 'userId', header: 'User ID' },
    { key: 'userEmail', header: 'Email' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'status', header: 'Status' },
    { key: 'country', header: 'Country' },
    { key: 'paymentMethod', header: 'Payment Method' }
  ]
} as const;

// Pagination constants
export const PAGINATION_CONSTANTS = {
  // Default limits
  DEFAULT_LIMIT: 20,
  TERMS_DEFAULT_LIMIT: 12,
  FEATURED_TERMS_LIMIT: 10,
  SEARCH_DEFAULT_LIMIT: 10,
  ADMIN_DEFAULT_LIMIT: 25,
  
  // Maximum limits
  MAX_LIMIT_TERMS: 50,
  MAX_LIMIT_CATEGORIES: 100,
  MAX_LIMIT_SEARCH: 30,
  MAX_LIMIT_ADMIN: 100,
  MAX_LIMIT_GENERAL: 1000,
  
  // Page limits
  MAX_PAGE_NUMBER: 10000,
  
  // Cache headers
  CACHE_CONTROL_TERMS: 'public, max-age=180', // 3 minutes
  CACHE_CONTROL_CATEGORIES: 'public, max-age=300', // 5 minutes
  CACHE_CONTROL_SEARCH: 'public, max-age=120' // 2 minutes
} as const;

// HTTP status codes (commonly used ones)
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Analytics and validation constants
export const ANALYTICS_CONSTANTS = {
  // Valid timeframes for analytics
  VALID_TIMEFRAMES: ['24h', '7d', '30d'] as const,
  
  // Valid granularities
  VALID_GRANULARITIES: ['hourly', 'daily', 'weekly'] as const,
  
  // Valid sort options
  VALID_SORT_OPTIONS: ['views', 'name', 'recent', 'lastViewed'] as const,
  
  // Valid export formats
  VALID_EXPORT_FORMATS: ['json', 'csv'] as const,
  
  // Valid export types
  VALID_EXPORT_TYPES: ['summary', 'detailed', 'categories', 'users'] as const,
  
  // Default values
  DEFAULT_TIMEFRAME: '30d',
  DEFAULT_GRANULARITY: 'daily',
  DEFAULT_SORT: 'views',
  DEFAULT_EXPORT_FORMAT: 'json',
  DEFAULT_EXPORT_TYPE: 'summary',
  
  // Real-time analytics
  REALTIME_CATEGORY_LIMIT: 20
} as const;

// File and media constants
export const FILE_CONSTANTS = {
  // File size limits (in bytes)
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  
  // Allowed file types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  
  // File extensions
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt']
} as const;

// Order and purchase constants
export const ORDER_CONSTANTS = {
  // Order status
  STATUS_PENDING: 'pending',
  STATUS_COMPLETED: 'completed',
  STATUS_FAILED: 'failed',
  STATUS_REFUNDED: 'refunded',
  
  // Test order prefix
  TEST_ORDER_PREFIX: 'TEST-',
  
  // Purchase types
  PURCHASE_TYPE_NORMAL: 'purchase',
  PURCHASE_TYPE_TEST: 'test_purchase',
  PURCHASE_TYPE_MANUAL: 'manual_grant',
  
  // Environment indicators
  ENVIRONMENT_DEVELOPMENT: 'development',
  ENVIRONMENT_PRODUCTION: 'production'
} as const;

// Database and query constants
export const DATABASE_CONSTANTS = {
  // Sort orders
  SORT_ASC: 'asc',
  SORT_DESC: 'desc',
  
  // Field selections (common patterns)
  BASIC_TERM_FIELDS: 'id,name,shortDefinition,viewCount,categoryId',
  BASIC_CATEGORY_FIELDS: 'id,name,description,termCount',
  SEARCH_RESULT_FIELDS: 'id,name,shortDefinition,viewCount',
  
  // Common query defaults
  DEFAULT_SORT_BY: 'name',
  DEFAULT_SORT_ORDER: 'asc'
} as const;

// Regular expressions and validation patterns
export const VALIDATION_PATTERNS = {
  // Email validation
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // ID patterns
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  // Timeframe patterns
  TIMEFRAME_REGEX: /^(\d+)(h|d|y)$/
} as const;

// Environment and feature flags
export const ENVIRONMENT_CONSTANTS = {
  NODE_ENV_DEVELOPMENT: 'development',
  NODE_ENV_PRODUCTION: 'production',
  NODE_ENV_TEST: 'test'
} as const;

// Type exports for better type safety
export type TimeConstant = typeof TIME_CONSTANTS[keyof typeof TIME_CONSTANTS];
export type PricingConstant = typeof PRICING_CONSTANTS[keyof typeof PRICING_CONSTANTS];
export type CSVConstant = typeof CSV_CONSTANTS[keyof typeof CSV_CONSTANTS];
export type PaginationConstant = typeof PAGINATION_CONSTANTS[keyof typeof PAGINATION_CONSTANTS];
export type HTTPStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export type AnalyticsConstant = typeof ANALYTICS_CONSTANTS[keyof typeof ANALYTICS_CONSTANTS];
export type FileConstant = typeof FILE_CONSTANTS[keyof typeof FILE_CONSTANTS];
export type OrderConstant = typeof ORDER_CONSTANTS[keyof typeof ORDER_CONSTANTS];
export type DatabaseConstant = typeof DATABASE_CONSTANTS[keyof typeof DATABASE_CONSTANTS];
export type ValidationPattern = typeof VALIDATION_PATTERNS[keyof typeof VALIDATION_PATTERNS];
export type EnvironmentConstant = typeof ENVIRONMENT_CONSTANTS[keyof typeof ENVIRONMENT_CONSTANTS];