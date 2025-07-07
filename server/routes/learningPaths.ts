/**
 * Learning Paths API Routes
 * Handles CRUD operations for learning paths and user progress tracking
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db';
import { 
  learningPaths, 
  learningPathSteps, 
  userLearningProgress, 
  stepCompletions,
  type LearningPath,
  type InsertLearningPath,
  type LearningPathStep,
  type InsertLearningPathStep,
  type UserLearningProgress,
  type InsertUserLearningProgress,
  type StepCompletion,
  type InsertStepCompletion
} from '../../shared/schema';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { eq, and, desc, sql, asc, isNull } from 'drizzle-orm';
import { LEARNING_PATHS_LIMITS } from '../constants/pagination';
import { 
  validateBody, 
  validateQuery, 
  validateParams, 
  ValidatedRequest 
} from '../middleware/validation';
import {
  createLearningPathSchema,
  updateLearningPathSchema,
  learningPathsQuerySchema,
  pathIdParamSchema,
  CreateLearningPathInput,
  UpdateLearningPathInput,
  LearningPathsQuery,
  PathIdParam
} from '../validation/learningPaths';
import { 
  sendErrorResponse, 
  handleDatabaseError, 
  CommonErrors, 
  ErrorCode 
} from '../utils/errorHandler';
import { aiRecommendationService } from '../services/aiRecommendationService';

export function registerLearningPathsRoutes(app: Express): void {

  /**
   * Get all learning paths with filtering and pagination
   * GET /api/learning-paths?category={id}&difficulty={level}&limit={n}&offset={n}
   */
  app.get('/api/learning-paths', 
    validateQuery(learningPathsQuerySchema),
    async (req: ValidatedRequest<any, LearningPathsQuery>, res: Response) => {
    try {
      const { category, difficulty, limit = LEARNING_PATHS_LIMITS.DEFAULT_LIMIT, offset = 0 } = req.validatedQuery || {};
      
      const parsedLimit = Math.min(Number(limit), LEARNING_PATHS_LIMITS.MAX_LIMIT);
      const parsedOffset = Math.max(Number(offset), 0);
      
      // Build conditions for both count and data queries
      let conditions = [eq(learningPaths.is_published, true)];
      
      if (category) {
        conditions.push(eq(learningPaths.category_id, category as string));
      }
      
      if (difficulty) {
        conditions.push(eq(learningPaths.difficulty_level, difficulty as string));
      }

      const whereClause = and(...conditions);

      // Get total count for pagination
      const countQuery = db.select({ count: sql<number>`count(*)` })
        .from(learningPaths)
        .where(whereClause);
      
      let query = db.select({
        id: learningPaths.id,
        name: learningPaths.name,
        description: learningPaths.description,
        difficulty_level: learningPaths.difficulty_level,
        estimated_duration: learningPaths.estimated_duration,
        category_id: learningPaths.category_id,
        prerequisites: learningPaths.prerequisites,
        learning_objectives: learningPaths.learning_objectives,
        is_official: learningPaths.is_official,
        view_count: learningPaths.view_count,
        completion_count: learningPaths.completion_count,
        rating: learningPaths.rating,
        created_at: learningPaths.created_at,
        updated_at: learningPaths.updated_at,
      }).from(learningPaths)
      .where(whereClause);
      
      const totalCountResult = await countQuery;
      const totalCount = totalCountResult[0]?.count || 0;

      const paths = await query
        .orderBy(desc(learningPaths.is_official), desc(learningPaths.view_count))
        .limit(parsedLimit)
        .offset(parsedOffset);

      const hasMore = parsedOffset + parsedLimit < totalCount;
      const nextOffset = hasMore ? parsedOffset + parsedLimit : null;

      res.json({
        success: true,
        data: paths,
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore,
          nextOffset
        }
      });
    } catch (error) {
      console.error('Get learning paths error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Get a specific learning path with its steps
   * GET /api/learning-paths/{id}
   */
  app.get('/api/learning-paths/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get the learning path
      const path = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, id))
        .limit(1);

      if (!path || path.length === 0) {
        return sendErrorResponse(res, ErrorCode.RESOURCE_NOT_FOUND, 'Learning path not found');
      }

      // Get the steps with term information
      const steps = await db.select({
        id: learningPathSteps.id,
        step_order: learningPathSteps.step_order,
        is_optional: learningPathSteps.is_optional,
        estimated_time: learningPathSteps.estimated_time,
        step_type: learningPathSteps.step_type,
        content: learningPathSteps.content,
        term: {
          id: sql`terms.id`,
          name: sql`terms.name`,
          shortDefinition: sql`terms.short_definition`,
        }
      })
      .from(learningPathSteps)
      .leftJoin(sql`terms`, eq(learningPathSteps.term_id, sql`terms.id`))
      .where(eq(learningPathSteps.learning_path_id, id))
      .orderBy(asc(learningPathSteps.step_order));

      res.json({
        success: true,
        data: {
          ...path[0],
          steps
        }
      });
    } catch (error) {
      console.error('Get learning path error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Create a new learning path (admin/premium users only)
   * POST /api/learning-paths
   */
  app.post('/api/learning-paths', 
    multiAuthMiddleware,
    validateBody(createLearningPathSchema),
    async (req: ValidatedRequest<CreateLearningPathInput>, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 'Authentication required');
      }

      // Check if user can create learning paths (admin or premium)
      if (!user.isAdmin && !user.lifetimeAccess) {
        return sendErrorResponse(
          res, 
          ErrorCode.INSUFFICIENT_PERMISSIONS, 
          'Premium access required to create learning paths',
          'Only admin users or users with lifetime access can create learning paths'
        );
      }

      const {
        name,
        description,
        difficulty_level,
        estimated_duration,
        category_id,
        prerequisites,
        learning_objectives,
        steps
      } = req.validatedBody!;

      // Validation is now handled by Zod middleware, no need for manual checks

      // Create the learning path
      const pathData: InsertLearningPath = {
        name,
        description,
        difficulty_level: difficulty_level || 'beginner',
        estimated_duration,
        category_id,
        prerequisites: prerequisites || [],
        learning_objectives: learning_objectives || [],
        created_by: user.id,
        is_official: user.isAdmin || false,
        is_published: true
      };

      const [createdPath] = await db.insert(learningPaths)
        .values(pathData)
        .returning();

      // Create steps if provided
      if (steps && Array.isArray(steps)) {
        const stepData: InsertLearningPathStep[] = steps.map((step: any, index: number) => ({
          learning_path_id: createdPath.id,
          term_id: step.term_id,
          step_order: step.step_order || index + 1,
          is_optional: step.is_optional || false,
          estimated_time: step.estimated_time,
          step_type: step.step_type || 'concept',
          content: step.content || {}
        }));

        await db.insert(learningPathSteps)
          .values(stepData);
      }

      res.status(201).json({
        success: true,
        data: createdPath,
        message: 'Learning path created successfully'
      });
    } catch (error) {
      console.error('Create learning path error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Start a learning path (creates user progress entry)
   * POST /api/learning-paths/{id}/start
   */
  app.post('/api/learning-paths/:id/start', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if path exists
      const path = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, id))
        .limit(1);

      if (!path || path.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
      }

      // Check if user already started this path
      const existingProgress = await db.select()
        .from(userLearningProgress)
        .where(and(
          eq(userLearningProgress.user_id, user.id),
          eq(userLearningProgress.learning_path_id, id)
        ))
        .limit(1);

      if (existingProgress && existingProgress.length > 0) {
        return res.json({
          success: true,
          data: existingProgress[0],
          message: 'Learning path already started'
        });
      }

      // Get first step
      const firstStep = await db.select()
        .from(learningPathSteps)
        .where(eq(learningPathSteps.learning_path_id, id))
        .orderBy(asc(learningPathSteps.step_order))
        .limit(1);

      // Create progress entry
      const progressData: InsertUserLearningProgress = {
        user_id: user.id,
        learning_path_id: id,
        current_step_id: firstStep[0]?.id || null,
        completion_percentage: 0,
        time_spent: 0
      };

      const [progress] = await db.insert(userLearningProgress)
        .values(progressData)
        .returning();

      // Increment view count
      await db.update(learningPaths)
        .set({ 
          view_count: sql`${learningPaths.view_count} + 1`,
          updated_at: new Date()
        })
        .where(eq(learningPaths.id, id));

      res.json({
        success: true,
        data: progress,
        message: 'Learning path started successfully'
      });
    } catch (error) {
      console.error('Start learning path error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start learning path'
      });
    }
  });

  /**
   * Complete a step in a learning path
   * POST /api/learning-paths/{pathId}/steps/{stepId}/complete
   */
  app.post('/api/learning-paths/:pathId/steps/:stepId/complete', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { pathId, stepId } = req.params;
      const { time_spent, notes } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Record step completion
      const completionData: InsertStepCompletion = {
        user_id: user.id,
        step_id: stepId,
        time_spent: time_spent || 0,
        notes: notes || null
      };

      await db.insert(stepCompletions)
        .values(completionData)
        .onConflictDoUpdate({
          target: [stepCompletions.user_id, stepCompletions.step_id],
          set: {
            completed_at: new Date(),
            time_spent: time_spent || 0,
            notes: notes || null
          }
        });

      // Update user progress
      const totalSteps = await db.select({ count: sql`count(*)` })
        .from(learningPathSteps)
        .where(eq(learningPathSteps.learning_path_id, pathId));

      const completedSteps = await db.select({ count: sql`count(*)` })
        .from(stepCompletions)
        .leftJoin(learningPathSteps, eq(stepCompletions.step_id, learningPathSteps.id))
        .where(and(
          eq(stepCompletions.user_id, user.id),
          eq(learningPathSteps.learning_path_id, pathId)
        ));

      const completionPercentage = Math.round(
        (Number(completedSteps[0].count) / Number(totalSteps[0].count)) * 100
      );

      // Update progress
      await db.update(userLearningProgress)
        .set({
          completion_percentage: completionPercentage,
          last_accessed_at: new Date(),
          time_spent: sql`${userLearningProgress.time_spent} + ${time_spent || 0}`,
          completed_at: completionPercentage === 100 ? new Date() : null
        })
        .where(and(
          eq(userLearningProgress.user_id, user.id),
          eq(userLearningProgress.learning_path_id, pathId)
        ));

      // If path is completed, increment completion count
      if (completionPercentage === 100) {
        await db.update(learningPaths)
          .set({
            completion_count: sql`${learningPaths.completion_count} + 1`,
            updated_at: new Date()
          })
          .where(eq(learningPaths.id, pathId));
      }

      res.json({
        success: true,
        data: {
          completed: true,
          completion_percentage: completionPercentage,
          path_completed: completionPercentage === 100
        },
        message: 'Step completed successfully'
      });
    } catch (error) {
      console.error('Complete step error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete step'
      });
    }
  });

  /**
   * Get user's learning progress
   * GET /api/learning-paths/progress
   */
  app.get('/api/learning-paths/progress', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const progress = await db.select({
        id: userLearningProgress.id,
        learning_path_id: userLearningProgress.learning_path_id,
        current_step_id: userLearningProgress.current_step_id,
        started_at: userLearningProgress.started_at,
        completed_at: userLearningProgress.completed_at,
        completion_percentage: userLearningProgress.completion_percentage,
        last_accessed_at: userLearningProgress.last_accessed_at,
        time_spent: userLearningProgress.time_spent,
        path: {
          name: learningPaths.name,
          description: learningPaths.description,
          difficulty_level: learningPaths.difficulty_level,
          estimated_duration: learningPaths.estimated_duration
        }
      })
      .from(userLearningProgress)
      .leftJoin(learningPaths, eq(userLearningProgress.learning_path_id, learningPaths.id))
      .where(eq(userLearningProgress.user_id, user.id))
      .orderBy(desc(userLearningProgress.last_accessed_at));

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Get user progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user progress'
      });
    }
  });

  /**
   * Get recommended learning paths for user
   * GET /api/learning-paths/recommended
   */
  app.get('/api/learning-paths/recommended', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { limit = LEARNING_PATHS_LIMITS.RECOMMENDED_LIMIT } = req.query;
      
      const recommendationLimit = Math.min(Number(limit), LEARNING_PATHS_LIMITS.MAX_LIMIT);

      if (!user) {
        // For anonymous users, return popular paths
        const popularPaths = await db.select()
          .from(learningPaths)
          .where(eq(learningPaths.is_published, true))
          .orderBy(desc(learningPaths.completion_count), desc(learningPaths.view_count))
          .limit(recommendationLimit);

        return res.json({
          success: true,
          data: popularPaths,
          message: 'Popular learning paths'
        });
      }

      // Use AI-based recommendations for authenticated users
      const recommendedPaths = await aiRecommendationService.getPersonalizedRecommendations(
        user.id, 
        recommendationLimit
      );

      res.json({
        success: true,
        data: recommendedPaths,
        message: 'AI-powered personalized recommendations',
        metadata: {
          personalized: true,
          totalRecommendations: recommendedPaths.length,
          avgScore: recommendedPaths.length > 0 
            ? Math.round(recommendedPaths.reduce((sum, p) => sum + p.recommendationScore, 0) / recommendedPaths.length)
            : 0
        }
      });
    } catch (error) {
      console.error('Get recommended paths error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Get trending learning paths
   * GET /api/learning-paths/trending
   */
  app.get('/api/learning-paths/trending', async (req: Request, res: Response) => {
    try {
      const { limit = 5 } = req.query;
      const trendingLimit = Math.min(Number(limit), 20);

      const trendingPaths = await aiRecommendationService.getTrendingPaths(trendingLimit);

      res.json({
        success: true,
        data: trendingPaths,
        message: 'Trending learning paths from the last 30 days'
      });
    } catch (error) {
      console.error('Get trending paths error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Update a learning path
   * PUT /api/learning-paths/:id
   */
  app.put('/api/learning-paths/:id', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const {
        name,
        description,
        difficulty_level,
        estimated_duration,
        category_id,
        prerequisites,
        learning_objectives,
        is_published
      } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if learning path exists and user has permission to update it
      const existingPath = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, id))
        .limit(1);

      if (existingPath.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
      }

      // Only the creator or admin can update
      if (existingPath[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Only the creator or admin can update this learning path.'
        });
      }

      // Prepare update data (only include fields that are provided)
      const updateData: Partial<InsertLearningPath> = {
        updated_at: new Date()
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
      if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration;
      if (category_id !== undefined) updateData.category_id = category_id;
      if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
      if (learning_objectives !== undefined) updateData.learning_objectives = learning_objectives;
      if (is_published !== undefined) updateData.is_published = is_published;

      const [updatedPath] = await db.update(learningPaths)
        .set(updateData)
        .where(eq(learningPaths.id, id))
        .returning();

      res.json({
        success: true,
        data: updatedPath,
        message: 'Learning path updated successfully'
      });
    } catch (error) {
      console.error('Update learning path error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update learning path'
      });
    }
  });

  /**
   * Delete a learning path
   * DELETE /api/learning-paths/:id
   */
  app.delete('/api/learning-paths/:id', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if learning path exists and user has permission to delete it
      const existingPath = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, id))
        .limit(1);

      if (existingPath.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
      }

      // Only the creator or admin can delete
      if (existingPath[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Only the creator or admin can delete this learning path.'
        });
      }

      // Check if there are users currently enrolled in this path
      const activeUsers = await db.select()
        .from(userLearningProgress)
        .where(and(
          eq(userLearningProgress.learning_path_id, id),
          isNull(userLearningProgress.completed_at)
        ))
        .limit(1);

      if (activeUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete learning path. Users are currently enrolled in this path.'
        });
      }

      // Delete the learning path (cascade will handle related records)
      await db.delete(learningPaths)
        .where(eq(learningPaths.id, id));

      res.json({
        success: true,
        message: 'Learning path deleted successfully'
      });
    } catch (error) {
      console.error('Delete learning path error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete learning path'
      });
    }
  });

  /**
   * Add a step to a learning path
   * POST /api/learning-paths/:pathId/steps
   */
  app.post('/api/learning-paths/:pathId/steps', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { pathId } = req.params;
      const {
        term_id,
        step_order,
        is_optional,
        estimated_time,
        step_type,
        content
      } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if learning path exists and user has permission to modify it
      const existingPath = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, pathId))
        .limit(1);

      if (existingPath.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
      }

      // Only the creator or admin can add steps
      if (existingPath[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Only the creator or admin can add steps to this learning path.'
        });
      }

      // If step_order is not provided, get the next order number
      let finalStepOrder = step_order;
      if (!finalStepOrder) {
        const maxOrderResult = await db.select({ maxOrder: sql<number>`MAX(${learningPathSteps.step_order})` })
          .from(learningPathSteps)
          .where(eq(learningPathSteps.learning_path_id, pathId));
        
        finalStepOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
      }

      const stepData: InsertLearningPathStep = {
        learning_path_id: pathId,
        term_id,
        step_order: finalStepOrder,
        is_optional: is_optional || false,
        estimated_time,
        step_type: step_type || 'concept',
        content: content || {}
      };

      const [createdStep] = await db.insert(learningPathSteps)
        .values(stepData)
        .returning();

      res.status(201).json({
        success: true,
        data: createdStep,
        message: 'Step added successfully'
      });
    } catch (error) {
      console.error('Add step error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add step'
      });
    }
  });

  /**
   * Update a learning path step
   * PUT /api/learning-paths/:pathId/steps/:stepId
   */
  app.put('/api/learning-paths/:pathId/steps/:stepId', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { pathId, stepId } = req.params;
      const {
        term_id,
        step_order,
        is_optional,
        estimated_time,
        step_type,
        content
      } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if learning path exists and user has permission to modify it
      const existingPath = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, pathId))
        .limit(1);

      if (existingPath.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
      }

      // Only the creator or admin can update steps
      if (existingPath[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Only the creator or admin can update steps in this learning path.'
        });
      }

      // Check if step exists
      const existingStep = await db.select()
        .from(learningPathSteps)
        .where(and(
          eq(learningPathSteps.id, stepId),
          eq(learningPathSteps.learning_path_id, pathId)
        ))
        .limit(1);

      if (existingStep.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Step not found'
        });
      }

      // Prepare update data
      const updateData: Partial<InsertLearningPathStep> = {};
      if (term_id !== undefined) updateData.term_id = term_id;
      if (step_order !== undefined) updateData.step_order = step_order;
      if (is_optional !== undefined) updateData.is_optional = is_optional;
      if (estimated_time !== undefined) updateData.estimated_time = estimated_time;
      if (step_type !== undefined) updateData.step_type = step_type;
      if (content !== undefined) updateData.content = content;

      const [updatedStep] = await db.update(learningPathSteps)
        .set(updateData)
        .where(eq(learningPathSteps.id, stepId))
        .returning();

      res.json({
        success: true,
        data: updatedStep,
        message: 'Step updated successfully'
      });
    } catch (error) {
      console.error('Update step error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update step'
      });
    }
  });

  /**
   * Delete a learning path step
   * DELETE /api/learning-paths/:pathId/steps/:stepId
   */
  app.delete('/api/learning-paths/:pathId/steps/:stepId', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { pathId, stepId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if learning path exists and user has permission to modify it
      const existingPath = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, pathId))
        .limit(1);

      if (existingPath.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
      }

      // Only the creator or admin can delete steps
      if (existingPath[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Only the creator or admin can delete steps from this learning path.'
        });
      }

      // Check if step exists
      const existingStep = await db.select()
        .from(learningPathSteps)
        .where(and(
          eq(learningPathSteps.id, stepId),
          eq(learningPathSteps.learning_path_id, pathId)
        ))
        .limit(1);

      if (existingStep.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Step not found'
        });
      }

      // Delete the step
      await db.delete(learningPathSteps)
        .where(eq(learningPathSteps.id, stepId));

      res.json({
        success: true,
        message: 'Step deleted successfully'
      });
    } catch (error) {
      console.error('Delete step error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete step'
      });
    }
  });

  /**
   * Reorder learning path steps
   * PATCH /api/learning-paths/:pathId/steps/reorder
   */
  app.patch('/api/learning-paths/:pathId/steps/reorder', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { pathId } = req.params;
      const { stepOrders } = req.body; // Array of { stepId, order }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!Array.isArray(stepOrders)) {
        return res.status(400).json({
          success: false,
          message: 'stepOrders must be an array'
        });
      }

      // Check if learning path exists and user has permission to modify it
      const existingPath = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.id, pathId))
        .limit(1);

      if (existingPath.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
      }

      // Only the creator or admin can reorder steps
      if (existingPath[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied. Only the creator or admin can reorder steps in this learning path.'
        });
      }

      // Update each step's order
      for (const { stepId, order } of stepOrders) {
        await db.update(learningPathSteps)
          .set({ step_order: order })
          .where(and(
            eq(learningPathSteps.id, stepId),
            eq(learningPathSteps.learning_path_id, pathId)
          ));
      }

      res.json({
        success: true,
        message: 'Steps reordered successfully'
      });
    } catch (error) {
      console.error('Reorder steps error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reorder steps'
      });
    }
  });
}