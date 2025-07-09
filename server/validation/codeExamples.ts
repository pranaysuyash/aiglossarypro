/**
 * Validation schemas for Code Examples API endpoints
 * Using Zod for comprehensive input validation
 */

import { z } from 'zod';

// Common validation patterns
const uuidSchema = z.string().uuid('Invalid UUID format');
const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
const languageSchema = z.enum([
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'r',
  'matlab',
  'sql',
  'html',
  'css',
]);
const exampleTypeSchema = z.enum([
  'implementation',
  'tutorial',
  'snippet',
  'project',
  'visualization',
  'algorithm',
  'demo',
  'exercise',
]);

// Code Example creation/update validation
export const createCodeExampleSchema = z.object({
  term_id: uuidSchema,
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be 1000 characters or less')
    .trim(),
  language: languageSchema,
  code: z.string().min(1, 'Code is required').max(50000, 'Code must be 50,000 characters or less'),
  expected_output: z
    .string()
    .max(10000, 'Expected output must be 10,000 characters or less')
    .optional(),
  explanation: z.string().max(5000, 'Explanation must be 5,000 characters or less').optional(),
  libraries: z
    .array(z.string().trim().min(1))
    .max(20, 'Cannot have more than 20 libraries')
    .optional(),
  difficulty_level: difficultySchema,
  example_type: exampleTypeSchema,
  is_runnable: z.boolean().optional(),
  external_url: z
    .string()
    .url('Must be a valid URL')
    .max(500, 'URL must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  tags: z.array(z.string().trim().min(1)).max(10, 'Cannot have more than 10 tags').optional(),
});

export const updateCodeExampleSchema = createCodeExampleSchema.partial().omit({
  term_id: true, // Cannot change term association
});

// Query parameter validation
export const codeExamplesQuerySchema = z.object({
  language: languageSchema.optional(),
  difficulty: difficultySchema.optional(),
  type: exampleTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const codeExamplesByTermQuerySchema = z.object({
  language: languageSchema.optional(),
  difficulty: difficultySchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// Parameter validation
export const codeExampleIdParamSchema = z.object({
  id: uuidSchema,
});

export const termIdParamSchema = z.object({
  termId: uuidSchema,
});

// Voting validation
export const voteSchema = z.object({
  vote: z.enum(['up', 'down'], {
    errorMap: () => ({ message: 'Vote must be either "up" or "down"' }),
  }),
});

// Code execution validation
export const runCodeSchema = z.object({
  input_data: z.string().max(10000, 'Input data must be 10,000 characters or less').optional(),
  environment: z.string().max(100, 'Environment must be 100 characters or less').optional(),
});

// Rating validation
export const ratingSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(500, 'Comment must be 500 characters or less').optional(),
});

// Type exports for TypeScript
export type CreateCodeExampleInput = z.infer<typeof createCodeExampleSchema>;
export type UpdateCodeExampleInput = z.infer<typeof updateCodeExampleSchema>;
export type CodeExamplesQuery = z.infer<typeof codeExamplesQuerySchema>;
export type CodeExamplesByTermQuery = z.infer<typeof codeExamplesByTermQuerySchema>;
export type CodeExampleIdParam = z.infer<typeof codeExampleIdParamSchema>;
export type TermIdParam = z.infer<typeof termIdParamSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
