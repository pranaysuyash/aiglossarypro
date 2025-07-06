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
import { eq, and, desc, sql, asc } from 'drizzle-orm';

export function registerLearningPathsRoutes(app: Express): void {

  /**
   * Get all learning paths with filtering and pagination
   * GET /api/learning-paths?category={id}&difficulty={level}&limit={n}&offset={n}
   */
  app.get('/api/learning-paths', async (req: Request, res: Response) => {
    try {
      const { category, difficulty, limit = 20, offset = 0 } = req.query;
      
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
      .where(eq(learningPaths.is_published, true));

      if (category) {
        query = query.where(eq(learningPaths.category_id, category as string));
      }
      
      if (difficulty) {
        query = query.where(eq(learningPaths.difficulty_level, difficulty as string));
      }

      const paths = await query
        .orderBy(desc(learningPaths.is_official), desc(learningPaths.view_count))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json({
        success: true,
        data: paths,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: paths.length
        }
      });
    } catch (error) {
      console.error('Get learning paths error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch learning paths'
      });
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
        return res.status(404).json({
          success: false,
          message: 'Learning path not found'
        });
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch learning path'
      });
    }
  });

  /**
   * Create a new learning path (admin/premium users only)
   * POST /api/learning-paths
   */
  app.post('/api/learning-paths', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user can create learning paths (admin or premium)
      if (!user.isAdmin && !user.lifetimeAccess) {
        return res.status(403).json({
          success: false,
          message: 'Premium access required to create learning paths'
        });
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
      } = req.body;

      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message: 'Name and description are required'
        });
      }

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
      res.status(500).json({
        success: false,
        message: 'Failed to create learning path'
      });
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

      // For now, return popular paths. TODO: Implement AI-based recommendations
      const recommendedPaths = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.is_published, true))
        .orderBy(desc(learningPaths.completion_count), desc(learningPaths.view_count))
        .limit(10);

      res.json({
        success: true,
        data: recommendedPaths,
        message: 'Recommended learning paths based on popularity'
      });
    } catch (error) {
      console.error('Get recommended paths error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recommended paths'
      });
    }
  });
}