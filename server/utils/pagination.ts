/**
 * Pagination utilities to reduce duplication across routes
 * Extracted from common patterns in terms.ts and other route files
 */

export interface PaginationParams {
  page?: string | number;
  limit?: string | number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasMore: boolean;
  hasPrevious: boolean;
  startItem: number;
  endItem: number;
}

/**
 * Parse and validate pagination parameters from request query
 */
export function parsePaginationParams(params: PaginationParams): PaginationResult {
  const {
    page = 1,
    limit = params.defaultLimit || 20,
    maxLimit = 100
  } = params;

  // Parse and validate page number
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  
  // Parse and validate limit with maximum cap
  const limitNum = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit as string) || (params.defaultLimit || 20))
  );

  // Calculate offset
  const offset = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
}

/**
 * Calculate pagination metadata for response
 */
export function calculatePaginationMetadata(
  page: number,
  limit: number,
  totalItems: number
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / limit);
  const hasMore = page < totalPages;
  const hasPrevious = page > 1;
  const offset = (page - 1) * limit;

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasMore,
    hasPrevious,
    startItem: offset + 1,
    endItem: Math.min(offset + limit, totalItems)
  };
}

/**
 * Apply client-side pagination to an array of results
 * Note: This should ideally be replaced with database-level pagination
 */
export function applyClientSidePagination<T>(
  items: T[],
  page: number,
  limit: number
): {
  paginatedItems: T[];
  totalItems: number;
  metadata: PaginationMetadata;
} {
  const offset = (page - 1) * limit;
  const paginatedItems = items.slice(offset, offset + limit);
  const totalItems = items.length;
  const metadata = calculatePaginationMetadata(page, limit, totalItems);

  return {
    paginatedItems,
    totalItems,
    metadata
  };
}

/**
 * Parse a limit parameter with a default value
 */
export function parseLimit(limit: string | number | undefined, defaultLimit = 10, maxLimit = 100): number {
  return Math.min(maxLimit, Math.max(1, parseInt(limit as string) || defaultLimit));
}