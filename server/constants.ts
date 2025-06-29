// Section Names
export const SECTION_NAMES = {
  APPLICATIONS: 'Applications',
  ETHICS: 'Ethics and Responsible AI',
  TUTORIALS: 'Hands-on Tutorials'
} as const;

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
} as const;

// Sort Orders
export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

// Health Status
export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  WARNING: 'warning'
} as const;

// Bulk Operation Actions
export const BULK_ACTIONS = {
  DELETE: 'delete',
  UPDATE_CATEGORY: 'updateCategory',
  UPDATE_STATUS: 'updateStatus',
  APPROVE: 'approve',
  REJECT: 'reject'
} as const;

// Time Periods
export const TIME_PERIODS = {
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
  NINETY_DAYS: '90d',
  ONE_YEAR: '1y'
} as const;

// Default Pagination Limits
export const DEFAULT_LIMITS = {
  TERMS: 10,
  CONTENT: 12,
  SEARCH: 20,
  ADMIN: 25,
  FEATURED_TERMS: 10,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

// Bulk Operation Limits
export const BULK_LIMITS = {
  CROSS_REFERENCE_TERMS: 100,
  DELETE_TERMS: 50,
  UPDATE_TERMS: 100
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_ID: 'Invalid ID provided',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  ANALYTICS_FETCH_FAILED: 'Failed to fetch analytics data',
  USER_ANALYTICS_FETCH_FAILED: 'Failed to fetch user analytics',
  CONTENT_ANALYTICS_FETCH_FAILED: 'Failed to fetch content analytics',
  CATEGORY_ANALYTICS_FETCH_FAILED: 'Failed to fetch category analytics',
  REALTIME_ANALYTICS_FETCH_FAILED: 'Failed to fetch realtime analytics',
  ANALYTICS_EXPORT_FAILED: 'Failed to export analytics data'
} as const;

export type SectionName = typeof SECTION_NAMES[keyof typeof SECTION_NAMES];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];
export type SortOrder = typeof SORT_ORDERS[keyof typeof SORT_ORDERS];
export type HealthStatus = typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS];
export type BulkAction = typeof BULK_ACTIONS[keyof typeof BULK_ACTIONS];
export type TimePeriod = typeof TIME_PERIODS[keyof typeof TIME_PERIODS];
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
export type BulkLimit = typeof BULK_LIMITS[keyof typeof BULK_LIMITS];