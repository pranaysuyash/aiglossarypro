/**
 * Code Examples API Routes
 * Handles CRUD operations for code examples and execution tracking
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db';
import { 
  codeExamples,
  codeExampleRuns,
  codeExampleVotes,
  type CodeExample,
  type InsertCodeExample,
  type CodeExampleRun,
  type InsertCodeExampleRun,
  type CodeExampleVote,
  type InsertCodeExampleVote
} from '../../shared/schema';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { CODE_EXAMPLES_LIMITS } from '../constants/pagination';

export function registerCodeExamplesRoutes(app: Express): void {

  /**
   * Get code examples for a specific term
   * GET /api/terms/{termId}/code-examples?language={lang}&difficulty={level}
   */
  app.get('/api/terms/:termId/code-examples', async (req: Request, res: Response) => {
    try {
      const { termId } = req.params;
      const { 
        language, 
        difficulty, 
        limit = CODE_EXAMPLES_LIMITS.BY_TERM_DEFAULT_LIMIT, 
        offset = 0 
      } = req.query;

      const parsedLimit = Math.min(Number(limit), CODE_EXAMPLES_LIMITS.MAX_LIMIT);
      const parsedOffset = Math.max(Number(offset), 0);

      let baseWhere = eq(codeExamples.term_id, termId);
      let conditions = [baseWhere];

      if (language) {
        conditions.push(eq(codeExamples.language, language as string));
      }

      if (difficulty) {
        conditions.push(eq(codeExamples.difficulty_level, difficulty as string));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : baseWhere;

      // Get total count for pagination
      const totalCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(codeExamples)
        .where(whereClause);
      
      const totalCount = totalCountResult[0]?.count || 0;

      // Get examples with pagination
      const examples = await db.select({
        id: codeExamples.id,
        title: codeExamples.title,
        description: codeExamples.description,
        language: codeExamples.language,
        code: codeExamples.code,
        expected_output: codeExamples.expected_output,
        libraries: codeExamples.libraries,
        difficulty_level: codeExamples.difficulty_level,
        example_type: codeExamples.example_type,
        is_runnable: codeExamples.is_runnable,
        external_url: codeExamples.external_url,
        is_verified: codeExamples.is_verified,
        upvotes: codeExamples.upvotes,
        downvotes: codeExamples.downvotes,
        created_at: codeExamples.created_at,
        updated_at: codeExamples.updated_at
      }).from(codeExamples)
      .where(whereClause)
      .orderBy(desc(codeExamples.is_verified), desc(codeExamples.upvotes))
      .limit(parsedLimit)
      .offset(parsedOffset);

      const hasMore = parsedOffset + parsedLimit < totalCount;
      const nextOffset = hasMore ? parsedOffset + parsedLimit : null;

      res.json({
        success: true,
        data: examples,
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore,
          nextOffset
        }
      });
    } catch (error) {
      console.error('Get code examples error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch code examples'
      });
    }
  });

  /**
   * Get all code examples with filtering
   * GET /api/code-examples?language={lang}&difficulty={level}&type={type}
   */
  app.get('/api/code-examples', async (req: Request, res: Response) => {
    try {
      const { language, difficulty, type, limit = CODE_EXAMPLES_LIMITS.DEFAULT_LIMIT, offset = 0 } = req.query;

      const parsedLimit = Math.min(Number(limit), CODE_EXAMPLES_LIMITS.MAX_LIMIT);
      const parsedOffset = Math.max(Number(offset), 0);

      let query = db.select({
        id: codeExamples.id,
        term_id: codeExamples.term_id,
        title: codeExamples.title,
        description: codeExamples.description,
        language: codeExamples.language,
        difficulty_level: codeExamples.difficulty_level,
        example_type: codeExamples.example_type,
        is_runnable: codeExamples.is_runnable,
        external_url: codeExamples.external_url,
        is_verified: codeExamples.is_verified,
        upvotes: codeExamples.upvotes,
        downvotes: codeExamples.downvotes,
        created_at: codeExamples.created_at,
        term: {
          name: sql`terms.name`,
          shortDefinition: sql`terms.short_definition`
        }
      }).from(codeExamples)
      .leftJoin(sql`terms`, eq(codeExamples.term_id, sql`terms.id`));

      if (language) {
        query = query.where(eq(codeExamples.language, language as string));
      }

      if (difficulty) {
        query = query.where(eq(codeExamples.difficulty_level, difficulty as string));
      }

      if (type) {
        query = query.where(eq(codeExamples.example_type, type as string));
      }

      // Get total count for pagination
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(codeExamples);
      let conditions = [];

      if (language) {
        conditions.push(eq(codeExamples.language, language as string));
      }
      
      if (difficulty) {
        conditions.push(eq(codeExamples.difficulty_level, difficulty as string));
      }
      
      if (type) {
        conditions.push(eq(codeExamples.example_type, type as string));
      }

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }

      const totalCountResult = await countQuery;
      const totalCount = totalCountResult[0]?.count || 0;

      const examples = await query
        .orderBy(desc(codeExamples.is_verified), desc(codeExamples.upvotes))
        .limit(parsedLimit)
        .offset(parsedOffset);

      const hasMore = parsedOffset + parsedLimit < totalCount;
      const nextOffset = hasMore ? parsedOffset + parsedLimit : null;

      res.json({
        success: true,
        data: examples,
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore,
          nextOffset
        }
      });
    } catch (error) {
      console.error('Get all code examples error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch code examples'
      });
    }
  });

  /**
   * Get a specific code example
   * GET /api/code-examples/{id}
   */
  app.get('/api/code-examples/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const example = await db.select()
        .from(codeExamples)
        .where(eq(codeExamples.id, id))
        .limit(1);

      if (!example || example.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Code example not found'
        });
      }

      res.json({
        success: true,
        data: example[0]
      });
    } catch (error) {
      console.error('Get code example error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch code example'
      });
    }
  });

  /**
   * Create a new code example
   * POST /api/code-examples
   */
  app.post('/api/code-examples', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const {
        term_id,
        title,
        description,
        language,
        code,
        expected_output,
        libraries,
        difficulty_level,
        example_type,
        is_runnable,
        external_url
      } = req.body;

      if (!title || !language || !code) {
        return res.status(400).json({
          success: false,
          message: 'Title, language, and code are required'
        });
      }

      const exampleData: InsertCodeExample = {
        term_id,
        title,
        description,
        language,
        code,
        expected_output,
        libraries: libraries || {},
        difficulty_level: difficulty_level || 'beginner',
        example_type: example_type || 'implementation',
        is_runnable: is_runnable || false,
        external_url,
        created_by: user.id,
        is_verified: user.isAdmin || false, // Auto-verify admin examples
        upvotes: 0,
        downvotes: 0
      };

      const [createdExample] = await db.insert(codeExamples)
        .values(exampleData)
        .returning();

      res.status(201).json({
        success: true,
        data: createdExample,
        message: 'Code example created successfully'
      });
    } catch (error) {
      console.error('Create code example error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create code example'
      });
    }
  });

  /**
   * Update a code example
   * PUT /api/code-examples/{id}
   */
  app.put('/api/code-examples/:id', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if example exists and user owns it or is admin
      const existing = await db.select()
        .from(codeExamples)
        .where(eq(codeExamples.id, id))
        .limit(1);

      if (!existing || existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Code example not found'
        });
      }

      if (existing[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this code example'
        });
      }

      const updateData = {
        ...req.body,
        updated_at: new Date()
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.created_by;
      delete updateData.created_at;
      delete updateData.upvotes;
      delete updateData.downvotes;

      const [updatedExample] = await db.update(codeExamples)
        .set(updateData)
        .where(eq(codeExamples.id, id))
        .returning();

      res.json({
        success: true,
        data: updatedExample,
        message: 'Code example updated successfully'
      });
    } catch (error) {
      console.error('Update code example error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update code example'
      });
    }
  });

  /**
   * Vote on a code example
   * POST /api/code-examples/{id}/vote
   */
  app.post('/api/code-examples/:id/vote', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { vote } = req.body; // 'up' or 'down'

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!vote || !['up', 'down'].includes(vote)) {
        return res.status(400).json({
          success: false,
          message: 'Vote must be "up" or "down"'
        });
      }

      // Check if example exists
      const example = await db.select()
        .from(codeExamples)
        .where(eq(codeExamples.id, id))
        .limit(1);

      if (!example || example.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Code example not found'
        });
      }

      // Check if user has already voted on this example
      const existingVote = await db.select()
        .from(codeExampleVotes)
        .where(and(
          eq(codeExampleVotes.user_id, user.id),
          eq(codeExampleVotes.code_example_id, id)
        ))
        .limit(1);

      let voteChange = { upvotes: 0, downvotes: 0 };
      
      if (existingVote.length > 0) {
        const currentVote = existingVote[0];
        
        if (currentVote.vote_type === vote) {
          // User is clicking the same vote again - remove the vote
          await db.delete(codeExampleVotes)
            .where(eq(codeExampleVotes.id, currentVote.id));
          
          voteChange = vote === 'up' ? { upvotes: -1, downvotes: 0 } : { upvotes: 0, downvotes: -1 };
        } else {
          // User is changing their vote
          await db.update(codeExampleVotes)
            .set({ 
              vote_type: vote,
              updated_at: new Date()
            })
            .where(eq(codeExampleVotes.id, currentVote.id));
          
          voteChange = vote === 'up' ? { upvotes: 1, downvotes: -1 } : { upvotes: -1, downvotes: 1 };
        }
      } else {
        // New vote
        await db.insert(codeExampleVotes)
          .values({
            user_id: user.id,
            code_example_id: id,
            vote_type: vote
          });
        
        voteChange = vote === 'up' ? { upvotes: 1, downvotes: 0 } : { upvotes: 0, downvotes: 1 };
      }

      // Update vote counts in the code example
      const [updatedExample] = await db.update(codeExamples)
        .set({
          upvotes: sql`${codeExamples.upvotes} + ${voteChange.upvotes}`,
          downvotes: sql`${codeExamples.downvotes} + ${voteChange.downvotes}`,
          updated_at: new Date()
        })
        .where(eq(codeExamples.id, id))
        .returning();

      res.json({
        success: true,
        data: {
          upvotes: updatedExample.upvotes,
          downvotes: updatedExample.downvotes,
          userVote: voteChange.upvotes === 0 && voteChange.downvotes === 0 ? null : vote
        },
        message: voteChange.upvotes === 0 && voteChange.downvotes === 0 ? 
          'Vote removed successfully' : 
          `Vote ${vote} recorded successfully`
      });
    } catch (error) {
      console.error('Vote code example error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record vote'
      });
    }
  });

  /**
   * Record code execution
   * POST /api/code-examples/{id}/run
   */
  app.post('/api/code-examples/:id/run', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { execution_time, success, output, error_message } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if example exists and is runnable
      const example = await db.select()
        .from(codeExamples)
        .where(eq(codeExamples.id, id))
        .limit(1);

      if (!example || example.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Code example not found'
        });
      }

      if (!example[0].is_runnable) {
        return res.status(400).json({
          success: false,
          message: 'This code example is not runnable'
        });
      }

      // Record execution
      const runData: InsertCodeExampleRun = {
        example_id: id,
        user_id: user.id,
        execution_time: execution_time || null,
        success: success || false,
        output: output || null,
        error_message: error_message || null
      };

      const [run] = await db.insert(codeExampleRuns)
        .values(runData)
        .returning();

      res.json({
        success: true,
        data: run,
        message: 'Code execution recorded successfully'
      });
    } catch (error) {
      console.error('Record code run error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record code execution'
      });
    }
  });

  /**
   * Get execution history for a code example
   * GET /api/code-examples/{id}/runs
   */
  app.get('/api/code-examples/:id/runs', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { limit = CODE_EXAMPLES_LIMITS.BY_TERM_DEFAULT_LIMIT } = req.query;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user's runs for this example
      const runs = await db.select({
        id: codeExampleRuns.id,
        execution_time: codeExampleRuns.execution_time,
        success: codeExampleRuns.success,
        output: codeExampleRuns.output,
        error_message: codeExampleRuns.error_message,
        timestamp: codeExampleRuns.timestamp
      })
      .from(codeExampleRuns)
      .where(and(
        eq(codeExampleRuns.example_id, id),
        eq(codeExampleRuns.user_id, user.id)
      ))
      .orderBy(desc(codeExampleRuns.timestamp))
      .limit(Number(limit));

      res.json({
        success: true,
        data: runs
      });
    } catch (error) {
      console.error('Get code runs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch execution history'
      });
    }
  });

  /**
   * Delete a code example
   * DELETE /api/code-examples/{id}
   */
  app.delete('/api/code-examples/:id', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if example exists and user owns it or is admin
      const existing = await db.select()
        .from(codeExamples)
        .where(eq(codeExamples.id, id))
        .limit(1);

      if (!existing || existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Code example not found'
        });
      }

      if (existing[0].created_by !== user.id && !user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this code example'
        });
      }

      await db.delete(codeExamples)
        .where(eq(codeExamples.id, id));

      res.json({
        success: true,
        message: 'Code example deleted successfully'
      });
    } catch (error) {
      console.error('Delete code example error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete code example'
      });
    }
  });
}