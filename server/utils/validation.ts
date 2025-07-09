import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { BULK_LIMITS } from '../constants';

// Common validation schemas
export const idSchema = z.string().min(1, 'ID is required');
export const numericIdSchema = z.coerce.number().int().positive('ID must be a positive integer');
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sectionParamsSchema = z.object({
  sectionId: numericIdSchema,
});

export const progressParamsSchema = z.object({
  termId: numericIdSchema,
  sectionId: numericIdSchema,
});

export const queryParamsSchema = z.object({
  q: z.string().optional(),
  contentType: z.string().optional(),
  sectionName: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const quizQuerySchema = z.object({
  termId: z.coerce.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

// Cross-reference validation schemas
export const processTextSchema = z.object({
  text: z.string().min(1, 'Text content is required'),
  excludeTermId: z.string().optional(),
});

export const bulkProcessSchema = z.object({
  termIds: z
    .array(z.string().min(1))
    .min(1, 'At least one term ID is required')
    .max(
      BULK_LIMITS.CROSS_REFERENCE_TERMS,
      `Maximum ${BULK_LIMITS.CROSS_REFERENCE_TERMS} terms can be processed at once`
    ),
});

export const termIdParamSchema = z.object({
  termId: z.string().min(1, 'Term ID is required'),
});

// Validation middleware helper
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request) => {
    return schema.parse(req.params);
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request) => {
    return schema.parse(req.query);
  };
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      (req as any).body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
      });
    }
  };
}

export function validateParamsMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      (req as any).params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: error.errors,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
      });
    }
  };
}

// Safe integer parsing utility
export function safeParseInt(value: string | unknown, fallback: number = 0): number {
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  if (typeof value === 'number') {
    return Math.floor(value);
  }
  return fallback;
}
