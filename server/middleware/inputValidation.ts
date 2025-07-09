import type { NextFunction, Request, Response } from 'express';
import { DEFAULT_LIMITS } from '../constants';

/**
 * Middleware for parsing and validating numeric query parameters
 */
export interface ParsedPaginationQuery {
  page: number;
  limit: number;
  offset: number;
}

export interface ParsedIdParam {
  id: string;
}

/**
 * Parse and validate pagination parameters
 */
export function parsePagination(req: Request, res: Response, next: NextFunction): void {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMITS.PAGE_SIZE),
      DEFAULT_LIMITS.MAX_PAGE_SIZE
    );
    const offset = (page - 1) * limit;

    // Add parsed values to request
    (req as any).pagination = { page, limit, offset } as ParsedPaginationQuery;
    next();
  } catch (_error) {
    res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
    });
  }
}

/**
 * Parse and validate ID parameter
 */
export function parseId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName];

      if (!id || typeof id !== 'string' || id.trim() === '') {
        res.status(400).json({
          success: false,
          message: `Invalid ${paramName} parameter`,
        });
        return;
      }

      // Add parsed ID to request
      (req as any).parsedId = id.trim();
      next();
    } catch (_error) {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName} parameter`,
      });
    }
  };
}

/**
 * Parse and validate numeric query parameters
 */
export function parseNumericQuery(
  fieldName: string,
  defaultValue?: number,
  min?: number,
  max?: number
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const value = req.query[fieldName] as string;
      let parsed = defaultValue;

      if (value !== undefined) {
        parsed = parseInt(value);

        if (Number.isNaN(parsed)) {
          res.status(400).json({
            success: false,
            message: `Invalid ${fieldName} parameter: must be a number`,
          });
          return;
        }

        if (min !== undefined && parsed < min) {
          parsed = min;
        }

        if (max !== undefined && parsed > max) {
          parsed = max;
        }
      }

      // Add parsed value to request
      if (!req.query.parsed) {
        (req.query as any).parsed = {};
      }
      (req.query as any).parsed[fieldName] = parsed;
      next();
    } catch (_error) {
      res.status(400).json({
        success: false,
        message: `Invalid ${fieldName} parameter`,
      });
    }
  };
}

/**
 * Parse and validate sort parameters
 */
export function parseSorting(allowedFields: string[] = ['createdAt', 'updatedAt', 'name']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const sortBy = (req.query.sortBy as string) || allowedFields[0];
      const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

      if (!allowedFields.includes(sortBy)) {
        res.status(400).json({
          success: false,
          message: `Invalid sortBy field. Allowed values: ${allowedFields.join(', ')}`,
        });
        return;
      }

      // Add parsed values to request
      if (!req.query.parsed) {
        (req.query as any).parsed = {};
      }
      (req.query as any).parsed.sortBy = sortBy;
      (req.query as any).parsed.sortOrder = sortOrder as 'asc' | 'desc';
      next();
    } catch (_error) {
      res.status(400).json({
        success: false,
        message: 'Invalid sorting parameters',
      });
    }
  };
}

/**
 * Parse search query parameter
 */
export function parseSearch(req: Request, res: Response, next: NextFunction): void {
  try {
    const search = req.query.search as string;
    const trimmedSearch = search?.trim();

    // Add parsed value to request
    if (!req.query.parsed) {
      (req.query as any).parsed = {};
    }
    (req.query as any).parsed.search = trimmedSearch || undefined;
    next();
  } catch (_error) {
    res.status(400).json({
      success: false,
      message: 'Invalid search parameter',
    });
  }
}

/**
 * Middleware composition helper for common user route patterns
 */
export const userRouteValidation = [
  parsePagination,
  parseSearch,
  parseSorting(['name', 'category', 'viewCount', 'createdAt', 'updatedAt']),
];

export const adminRouteValidation = [
  parsePagination,
  parseSearch,
  parseSorting(['name', 'category', 'viewCount', 'createdAt', 'updatedAt', 'status']),
];
