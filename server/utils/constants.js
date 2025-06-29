"use strict";
// =============================================================================
// CENTRALIZED CONSTANTS - DO NOT USE MAGIC STRINGS/NUMBERS IN CODE
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENVIRONMENT_CONSTANTS = exports.VALIDATION_PATTERNS = exports.DATABASE_CONSTANTS = exports.ORDER_CONSTANTS = exports.FILE_CONSTANTS = exports.ANALYTICS_CONSTANTS = exports.HTTP_STATUS = exports.PAGINATION_CONSTANTS = exports.CSV_CONSTANTS = exports.PRICING_CONSTANTS = exports.TIME_CONSTANTS = void 0;
// Time periods and date calculations
exports.TIME_CONSTANTS = {
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
};
// Currency and pricing constants
exports.PRICING_CONSTANTS = {
    // Currency values in cents
    LIFETIME_PRICE_CENTS: 24900, // $249.00
    BASIC_PRICE_CENTS: 12900, // $129.00
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
};
// CSV export constants
exports.CSV_CONSTANTS = {
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
};
// Pagination constants
exports.PAGINATION_CONSTANTS = {
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
};
// HTTP status codes (commonly used ones)
exports.HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
// Analytics and validation constants
exports.ANALYTICS_CONSTANTS = {
    // Valid timeframes for analytics
    VALID_TIMEFRAMES: ['24h', '7d', '30d'],
    // Valid granularities
    VALID_GRANULARITIES: ['hourly', 'daily', 'weekly'],
    // Valid sort options
    VALID_SORT_OPTIONS: ['views', 'name', 'recent', 'lastViewed'],
    // Valid export formats
    VALID_EXPORT_FORMATS: ['json', 'csv'],
    // Valid export types
    VALID_EXPORT_TYPES: ['summary', 'detailed', 'categories', 'users'],
    // Default values
    DEFAULT_TIMEFRAME: '30d',
    DEFAULT_GRANULARITY: 'daily',
    DEFAULT_SORT: 'views',
    DEFAULT_EXPORT_FORMAT: 'json',
    DEFAULT_EXPORT_TYPE: 'summary',
    // Real-time analytics
    REALTIME_CATEGORY_LIMIT: 20
};
// File and media constants
exports.FILE_CONSTANTS = {
    // File size limits (in bytes)
    MAX_FILE_SIZE_MB: 10,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    // Allowed file types
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
    // File extensions
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt']
};
// Order and purchase constants
exports.ORDER_CONSTANTS = {
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
};
// Database and query constants
exports.DATABASE_CONSTANTS = {
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
};
// Regular expressions and validation patterns
exports.VALIDATION_PATTERNS = {
    // Email validation
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // ID patterns
    UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    // Timeframe patterns
    TIMEFRAME_REGEX: /^(\d+)(h|d|y)$/
};
// Environment and feature flags
exports.ENVIRONMENT_CONSTANTS = {
    NODE_ENV_DEVELOPMENT: 'development',
    NODE_ENV_PRODUCTION: 'production',
    NODE_ENV_TEST: 'test'
};
