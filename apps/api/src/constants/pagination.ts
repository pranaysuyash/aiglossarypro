/**
 * Pagination and Limit Constants
 * Centralized constants to avoid magic numbers throughout the API
 */

export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  DEFAULT_OFFSET: 0,
} as const;

export const LEARNING_PATHS_LIMITS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  RECOMMENDED_LIMIT: 10,
} as const;

export const CODE_EXAMPLES_LIMITS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
  BY_TERM_DEFAULT_LIMIT: 10,
} as const;
