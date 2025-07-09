/**
 * Validation schemas for Learning Paths API endpoints
 * Using Zod for comprehensive input validation
 */

import { z } from 'zod';

// Common validation patterns
const uuidSchema = z.string().uuid('Invalid UUID format');
const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
const stepTypeSchema = z.enum(['concept', 'practice', 'assessment', 'project']);

// Learning Path creation/update validation
export const createLearningPathSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  difficulty_level: difficultySchema.optional(),
  estimated_duration: z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 minute')
    .max(10080, 'Duration cannot exceed 1 week (10080 minutes)')
    .optional(),
  category_id: uuidSchema.optional(),
  prerequisites: z
    .array(z.string().trim().min(1))
    .max(20, 'Cannot have more than 20 prerequisites')
    .optional(),
  learning_objectives: z
    .array(z.string().trim().min(1))
    .max(20, 'Cannot have more than 20 learning objectives')
    .optional(),
  is_published: z.boolean().optional(),
  steps: z
    .array(
      z.object({
        term_id: uuidSchema,
        step_order: z.number().int().min(1).optional(),
        is_optional: z.boolean().optional(),
        estimated_time: z.number().int().min(1).max(480).optional(),
        step_type: stepTypeSchema.optional(),
        content: z.record(z.any()).optional(),
      })
    )
    .max(100, 'Cannot have more than 100 steps')
    .optional(),
});

export const updateLearningPathSchema = createLearningPathSchema.partial();

// Learning Path Step validation
export const createStepSchema = z.object({
  term_id: uuidSchema,
  step_order: z.number().int().min(1).optional(),
  is_optional: z.boolean().optional(),
  estimated_time: z
    .number()
    .int('Estimated time must be an integer')
    .min(1, 'Estimated time must be at least 1 minute')
    .max(480, 'Estimated time cannot exceed 8 hours (480 minutes)')
    .optional(),
  step_type: stepTypeSchema.optional(),
  content: z.record(z.any()).optional(),
});

export const updateStepSchema = createStepSchema.partial();

export const reorderStepsSchema = z.object({
  stepOrders: z
    .array(
      z.object({
        stepId: uuidSchema,
        order: z.number().int().min(1),
      })
    )
    .min(1, 'Must provide at least one step to reorder'),
});

// Query parameter validation
export const learningPathsQuerySchema = z.object({
  category: uuidSchema.optional(),
  difficulty: difficultySchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const pathIdParamSchema = z.object({
  id: uuidSchema,
});

export const stepParamsSchema = z.object({
  pathId: uuidSchema,
  stepId: uuidSchema,
});

// Voting validation
export const voteSchema = z.object({
  vote: z.enum(['up', 'down'], {
    errorMap: () => ({ message: 'Vote must be either "up" or "down"' }),
  }),
});

// Type exports for TypeScript
export type CreateLearningPathInput = z.infer<typeof createLearningPathSchema>;
export type UpdateLearningPathInput = z.infer<typeof updateLearningPathSchema>;
export type CreateStepInput = z.infer<typeof createStepSchema>;
export type UpdateStepInput = z.infer<typeof updateStepSchema>;
export type ReorderStepsInput = z.infer<typeof reorderStepsSchema>;
export type LearningPathsQuery = z.infer<typeof learningPathsQuerySchema>;
export type PathIdParam = z.infer<typeof pathIdParamSchema>;
export type StepParams = z.infer<typeof stepParamsSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
