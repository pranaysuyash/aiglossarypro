/**
 * Validation middleware for API endpoints
 * Provides consistent validation error handling across all routes
 */

import type { NextFunction, Request, Response } from 'express';
import { type ZodSchema, z } from 'zod';
import { fromZodError } from 'zod-validation-error';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidatedRequest<TBody = any, TQuery = any, TParams = any> extends Request {
  validatedBody?: TBody;
  validatedQuery?: TQuery;
  validatedParams?: TParams;
}

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationError.message,
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error during validation',
      });
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: validationError.message,
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error during validation',
      });
    }
  };
}

/**
 * Create validation middleware for URL parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.validatedParams = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid URL parameters',
          details: validationError.message,
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error during validation',
      });
    }
  };
}

/**
 * Validate multiple parts of the request at once
 */
export function validateRequest<TBody = any, TQuery = any, TParams = any>(options: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return [
    ...(options.params ? [validateParams(options.params)] : []),
    ...(options.query ? [validateQuery(options.query)] : []),
    ...(options.body ? [validateBody(options.body)] : []),
  ];
}

/**
 * Generic error response for validation failures
 */
export function createValidationError(message: string, errors?: ValidationError[]) {
  return {
    success: false,
    error: 'VALIDATION_ERROR',
    message,
    errors: errors || [],
  };
}

/**
 * Validate UUID parameter helper
 */
export const validateUUID = (paramName: string) => {
  return validateParams(
    z.object({
      [paramName]: z.string().uuid(`Invalid ${paramName} format`),
    })
  );
};
