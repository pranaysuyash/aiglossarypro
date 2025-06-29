import { z } from 'zod';

// Common validation schemas
export const idSchema = z.string().min(1, 'ID is required');
export const numericIdSchema = z.coerce.number().int().positive('ID must be a positive integer');
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const sectionParamsSchema = z.object({
  sectionId: numericIdSchema
});

export const progressParamsSchema = z.object({
  termId: numericIdSchema,
  sectionId: numericIdSchema
});

export const queryParamsSchema = z.object({
  q: z.string().optional(),
  contentType: z.string().optional(),
  sectionName: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const quizQuerySchema = z.object({
  termId: z.coerce.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional()
});

// Validation middleware helper
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: any) => {
    return schema.parse(req.params);
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any) => {
    return schema.parse(req.query);
  };
}

// Safe integer parsing utility
export function safeParseInt(value: string | unknown, fallback: number = 0): number {
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof value === 'number') {
    return Math.floor(value);
  }
  return fallback;
}