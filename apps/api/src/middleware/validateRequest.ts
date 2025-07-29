import type { NextFunction, Request, Response } from 'express'
import type { Request, Response } from 'express';
import { z } from 'zod';

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = schema.parse(req.body);

      // Attach validated data to request for use in route handlers
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
}

/**
 * Middleware to validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validatedData = schema.parse(req.query);

      // Attach validated data to request
      req.query = validatedData as unknown;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Query validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during query validation',
      });
    }
  };
}

/**
 * Middleware to validate request parameters against a Zod schema
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request parameters
      const validatedData = schema.parse(req.params);

      // Attach validated data to request
      req.params = validatedData as unknown;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parameter validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during parameter validation',
      });
    }
  };
}

/**
 * Generic validation middleware that can validate different parts of the request
 */
export function validateInput(options: {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (options.body) {
        const validatedBody = options.body.parse(req.body);
        req.body = validatedBody;
      }

      // Validate query if schema provided
      if (options.query) {
        const validatedQuery = options.query.parse(req.query);
        req.query = validatedQuery as unknown;
      }

      // Validate params if schema provided
      if (options.params) {
        const validatedParams = options.params.parse(req.params);
        req.params = validatedParams as unknown;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
}
