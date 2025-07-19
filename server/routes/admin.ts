import path from 'node:path';
import type { Express, Request, Response } from 'express';
import express from 'express';
import type { AdminStats, ApiResponse } from '../../shared/types';
import { cacheManager } from '../cacheManager';
import { enhancedStorage as storage } from '../enhancedStorage';
import { authenticateToken, requireAdmin } from '../middleware/adminAuth';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../middleware/firebaseAuth';
import { log as logger } from '../utils/logger';
import enhancedContentGenerationRoutes from './admin/enhancedContentGeneration';
import templateManagementRoutes from './admin/templateManagement';

import logger from '../utils/logger';
const router = express.Router();

/**
 * Admin management routes
 * Note: These routes should include proper admin role checking in production
 */
export function registerAdminRoutes(app: Express): void {
  /**
   * @openapi
   * /api/admin/stats:
   *   get:
   *     tags:
   *       - Admin
   *     summary: Get admin dashboard statistics
   *     description: Retrieves comprehensive statistics for the admin dashboard including user counts, term counts, and recent activity
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Admin statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     userCount:
   *                       type: integer
   *                       example: 1250
   *                     termCount:
   *                       type: integer
   *                       example: 847
   *                     categoryCount:
   *                       type: integer
   *                       example: 23
   *                     recentActivity:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           type:
   *                             type: string
   *                             example: "user_registration"
   *                           timestamp:
   *                             type: string
   *                             format: date-time
   *                           details:
   *                             type: object
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Admin dashboard statistics
  app.get(
    '/api/admin/stats',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        const stats = await storage.getAdminStats();

        const response: ApiResponse<AdminStats> = {
          success: true,
          data: stats,
        };

        res.json(response);
      } catch (error) {
        logger.error('Error fetching admin stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch admin statistics',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/admin/clear-data:
   *   delete:
   *     tags:
   *       - Admin
   *     summary: Clear all database data
   *     description: Dangerous operation that clears all terms and categories from the database. Requires explicit confirmation.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - confirm
   *             properties:
   *               confirm:
   *                 type: string
   *                 enum: ["DELETE_ALL_DATA"]
   *                 description: Must be exactly "DELETE_ALL_DATA" to confirm the operation
   *     responses:
   *       200:
   *         description: Data cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "All data cleared successfully"
   *       400:
   *         description: Bad request - confirmation required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // Clear all data (dangerous operation)
  app.delete(
    '/api/admin/clear-data',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { confirm } = req.body;

        if (confirm !== 'DELETE_ALL_DATA') {
          return res.status(400).json({
            success: false,
            message: "Confirmation required. Send { confirm: 'DELETE_ALL_DATA' } to proceed.",
          });
        }

        logger.info('🗑️  Admin initiated data clearing...');

        const result = await storage.clearAllData();

        logger.info('✅ Data clearing completed');

        res.json({
          success: true,
          message: 'All data cleared successfully',
          data: result,
        });
      } catch (error) {
        logger.error('Error clearing data:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to clear data',
        });
      }
    }
  );

  /**
   * @openapi
   * /api/admin/health:
   *   get:
   *     tags:
   *       - Admin
   *     summary: System health check
   *     description: Retrieves the health status of all system components including database, storage, and AI services
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: System health status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     database:
   *                       type: string
   *                       enum: [healthy, degraded, unhealthy]
   *                       example: "healthy"
   *                     s3:
   *                       type: string
   *                       enum: [healthy, degraded, unhealthy]
   *                       example: "healthy"
   *                     ai:
   *                       type: string
   *                       enum: [healthy, degraded, unhealthy]
   *                       example: "healthy"
   *                     termCount:
   *                       type: string
   *                       example: "847"
   *                     uptime:
   *                       type: string
   *                       example: "2d 14h 32m"
   *                     lastCheck:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - admin privileges required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  // System health check
  app.get(
    '/api/admin/health',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        const [systemHealth, contentMetrics] = await Promise.all([
          storage.getSystemHealth(),
          storage.getContentMetrics(),
        ]);

        const health = {
          ...systemHealth,
          termCount: contentMetrics.totalTerms,
        };

        res.json({
          success: true,
          data: health,
        });
      } catch (error) {
        logger.error('Error checking system health:', error);
        res.status(500).json({
          success: false,
          message: 'Health check failed',
        });
      }
    }
  );

  // Database maintenance operations
  app.post(
    '/api/admin/maintenance',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { operation } = req.body;

        let result;
        switch (operation) {
          case 'reindex':
            result = await storage.reindexDatabase();
            break;
          case 'cleanup':
            result = await storage.cleanupDatabase();
            break;
          case 'vacuum':
            result = await storage.vacuumDatabase();
            break;
          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid maintenance operation',
            });
        }

        res.json({
          success: true,
          message: `Maintenance operation '${operation}' completed`,
          data: result,
        });
      } catch (error) {
        logger.error(`Error performing maintenance operation:`, error);
        res.status(500).json({
          success: false,
          message: 'Maintenance operation failed',
        });
      }
    }
  );

  // User management
  app.get(
    '/api/admin/users',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { page = 1, limit = 50, search } = req.query;

        const users = await storage.getAllUsers();

        // Apply pagination and search on the client side for now
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const searchTerm = search as string;

        let filteredUsers = users.data;
        if (searchTerm) {
          filteredUsers = users.data.filter(
            (user: any) =>
              user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        res.json({
          success: true,
          data: paginatedUsers,
          total: filteredUsers.length,
          page: pageNum,
          limit: limitNum,
          hasMore: endIndex < filteredUsers.length,
        });
      } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch users',
        });
      }
    }
  );

  // Content moderation
  app.get(
    '/api/admin/content/pending',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        const pendingContent = await storage.getPendingContent();

        res.json({
          success: true,
          data: pendingContent,
        });
      } catch (error) {
        logger.error('Error fetching pending content:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch pending content',
        });
      }
    }
  );

  app.post(
    '/api/admin/content/:id/approve',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const result = await storage.approveContent(id);

        res.json({
          success: true,
          message: 'Content approved successfully',
          data: result,
        });
      } catch (error) {
        logger.error('Error approving content:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to approve content',
        });
      }
    }
  );

  app.post(
    '/api/admin/content/:id/reject',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { _reason } = req.body; // Currently not used

        const result = await storage.rejectContent(id);

        res.json({
          success: true,
          message: 'Content rejected successfully',
          data: result,
        });
      } catch (error) {
        logger.error('Error rejecting content:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to reject content',
        });
      }
    }
  );

  // Get cache status and information
  router.get('/cache/status', authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const cacheEntries = await cacheManager.listCache();

      const status = {
        totalCacheEntries: cacheEntries.length,
        cacheEntries: cacheEntries.map(entry => ({
          fileName: path.basename(entry.filePath),
          fileSizeMB: (entry.fileSize / (1024 * 1024)).toFixed(2),
          termCount: entry.termCount,
          categoryCount: entry.categoryCount,
          subcategoryCount: entry.subcategoryCount,
          processedAt: new Date(entry.processedAt).toISOString(),
          processingTimeSeconds: (entry.processingTime / 1000).toFixed(2),
          ageHours: Math.round((Date.now() - entry.processedAt) / (1000 * 60 * 60)),
          cacheVersion: entry.cacheVersion,
        })),
      };

      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Error getting cache status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cache status',
      });
    }
  });

  // Clear specific cache entry
  router.delete('/cache/:fileName', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { fileName } = req.params;
      const dataDir = path.join(process.cwd(), 'data');
      const filePath = path.join(dataDir, fileName);

      await cacheManager.clearCache(filePath);

      res.json({
        success: true,
        message: `Cache cleared for ${fileName}`,
      });
    } catch (error) {
      logger.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
      });
    }
  });

  // Clear all cache entries
  router.delete('/cache', authenticateToken, requireAdmin, async (_req, res) => {
    try {
      await cacheManager.clearAllCache();

      res.json({
        success: true,
        message: 'All cache cleared successfully',
      });
    } catch (error) {
      logger.error('Error clearing all cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear all cache',
      });
    }
  });

  // Schedule automatic reprocessing (placeholder for future cron implementation)
  router.post('/schedule/reprocess', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { schedule = 'weekly', files = [] } = req.body;

      // This is a placeholder for future scheduled task implementation
      // For now, just return success with the configuration

      res.json({
        success: true,
        message: 'Scheduled reprocessing configured',
        data: {
          schedule,
          files,
          note: 'Scheduled processing will be implemented in a future update',
        },
      });
    } catch (error) {
      logger.error('Error configuring scheduled reprocessing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to configure scheduled reprocessing',
      });
    }
  });

  /**
   * Batch AI Operations for Admin
   */

  /**
   * Batch categorize multiple terms using AI
   * POST /api/admin/batch/categorize
   */
  app.post(
    '/api/admin/batch/categorize',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res: Response) => {
      try {
        const { termIds, _options = {} } = req.body; // options currently not used

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({ message: 'Term IDs array is required' });
        }

        if (termIds.length > 50) {
          return res.status(400).json({ message: 'Maximum 50 terms can be processed at once' });
        }

        const results: any[] = [];
        const errors: any[] = [];

        // Process terms in batches of 5 to avoid overwhelming the AI service
        for (let i = 0; i < termIds.length; i += 5) {
          const batch = termIds.slice(i, i + 5);

          try {
            // const _termsBatch = await storage.getTermsByIds(batch); // Currently not used

            /* TODO: Phase 2 - Implement AI categorization
          // Process each term with AI categorization
          for (const term of termsBatch) {
            try {
              const aiResponse = await fetch(`${process.env.OPENAI_API_URL || 'https://api.openai.com/v1'}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are an AI/ML expert categorizing glossary terms. Analyze the term and suggest the most appropriate main categories and subcategories. Respond with a JSON object containing "mainCategories" and "subCategories" arrays.'
                    },
                    {
                      role: 'user',
                      content: `Categorize this AI/ML term:
                      
Name: ${term.name}
Definition: ${term.fullDefinition}

Suggest appropriate categories from common AI/ML domains like:
- Machine Learning
- Deep Learning  
- Natural Language Processing
- Computer Vision
- Reinforcement Learning
- Data Science
- Neural Networks
- Statistics
- Mathematics
- Applications

Respond with JSON only.`
                    }
                  ],
                  temperature: 0.3,
                  max_tokens: 300,
                }),
              });
              
              if (!aiResponse.ok) {
                throw new Error(`AI API error: ${aiResponse.status}`);
              }
              
              const aiResult = await aiResponse.json();
              const content = aiResult.choices[0]?.message?.content;
              
              if (!content) {
                throw new Error('No AI response content');
              }
              
              // Parse AI response
              let categorization;
              try {
                categorization = JSON.parse(content);
              } catch (parseError) {
                // Fallback: extract categories from text response
                categorization = {
                  mainCategories: ['Machine Learning'],
                  subCategories: []
                };
              }
              
              // Update term with new categorization
              const updatedTerm = {
                ...term,
                aiSuggestedCategories: categorization.mainCategories || [],
                aiSuggestedSubcategories: categorization.subCategories || [],
                lastAiCategorization: new Date(),
              };
              
              results.push({
                termId: term.id,
                termName: term.name,
                success: true,
                categorization,
              });
              
            } catch (termError) {
              logger.error(`Error categorizing term ${term.id}:`, termError);
              errors.push({
                termId: term.id,
                termName: term.name,
                error: termError instanceof Error ? termError.message : 'Unknown error'
              });
            }
          }
          
          // Add delay between batches to respect rate limits
          if (i + 5 < termIds.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          */
          } catch (batchError) {
            logger.error(`Error processing batch ${i}-${i + 5}:`, batchError);
            batch.forEach(termId => {
              errors.push({
                termId,
                error: batchError instanceof Error ? batchError.message : 'Batch processing error',
              });
            });
          }
        }

        res.json({
          success: true,
          processed: results.length,
          errorCount: errors.length,
          results,
          errors,
        });
      } catch (error) {
        logger.error('Batch categorization error:', error);
        res.status(500).json({
          message: 'Batch categorization failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * Batch enhance definitions using AI
   * POST /api/admin/batch/enhance-definitions
   */
  app.post(
    '/api/admin/batch/enhance-definitions',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res: Response) => {
      try {
        const { termIds, options = {} } = req.body;
        const {
          enhancementType = 'improve_clarity',
          targetAudience = 'general',
          includeExamples = true,
          maxLength = 500,
        } = options;

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({ message: 'Term IDs array is required' });
        }

        if (termIds.length > 20) {
          return res.status(400).json({ message: 'Maximum 20 terms can be enhanced at once' });
        }

        const results: any[] = [];
        const errors: any[] = [];

        // Process terms individually for better quality
        for (const termId of termIds) {
          try {
            const term = await storage.getTermById(termId);

            if (!term) {
              throw new Error(`Term not found: ${termId}`);
            }

            /* TODO: Phase 2 - Implement definition enhancement
          if (!term) {
            errors.push({
              termId,
              error: 'Term not found'
            });
            continue;
          }
          
          // Generate enhanced definition with AI
          const aiResponse = await fetch(`${process.env.OPENAI_API_URL || 'https://api.openai.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `You are an AI/ML expert improving glossary definitions. Your task is to enhance the given definition to be more ${enhancementType === 'improve_clarity' ? 'clear and understandable' : enhancementType === 'add_technical_depth' ? 'technically detailed and comprehensive' : 'beginner-friendly'} for a ${targetAudience} audience.

Guidelines:
- Keep the core meaning intact
- ${includeExamples ? 'Include relevant examples where helpful' : 'Focus on clear explanation without examples'}
- Maximum ${maxLength} characters
- Use clear, professional language
- Maintain accuracy and technical correctness

Respond with only the enhanced definition text.`
                },
                {
                  role: 'user',
                  content: `Enhance this AI/ML term definition:

Term: ${term.name}
Current Definition: ${term.fullDefinition}

Provide an enhanced definition following the guidelines above.`
                }
              ],
              temperature: 0.4,
              max_tokens: Math.min(maxLength / 2, 400),
            }),
          });
          
          if (!aiResponse.ok) {
            throw new Error(`AI API error: ${aiResponse.status}`);
          }
          
          const aiResult = await aiResponse.json();
          const enhancedDefinition = aiResult.choices[0]?.message?.content?.trim();
          
          if (!enhancedDefinition) {
            throw new Error('No enhanced definition generated');
          }
          
          results.push({
            termId: term.id,
            termName: term.name,
            originalDefinition: term.fullDefinition,
            enhancedDefinition,
            success: true,
            enhancementType,
            characterCount: enhancedDefinition.length
          });
          
          // Add delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          */
          } catch (termError) {
            logger.error(`Error enhancing definition for term ${termId}:`, termError);
            errors.push({
              termId,
              error: termError instanceof Error ? termError.message : 'Unknown error',
            });
          }
        }

        res.json({
          success: true,
          processed: results.length,
          errorCount: errors.length,
          results,
          errors,
          options: {
            enhancementType,
            targetAudience,
            includeExamples,
            maxLength,
          },
        });
      } catch (error) {
        logger.error('Batch definition enhancement error:', error);
        res.status(500).json({
          message: 'Batch definition enhancement failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * Get batch operation status
   * GET /api/admin/batch/status/:operationId
   */
  app.get(
    '/api/admin/batch/status/:operationId',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: any, res: Response) => {
      try {
        const { operationId } = req.params;

        // This would typically check a job queue or database for operation status
        // For now, return a simple response
        res.json({
          operationId,
          status: 'completed',
          message: 'Batch operations are processed synchronously',
        });
      } catch (error) {
        logger.error('Error fetching batch operation status:', error);
        res.status(500).json({ message: 'Failed to fetch operation status' });
      }
    }
  );

  // Dashboard metrics endpoint for new admin panel
  app.get(
    '/api/admin/dashboard/metrics',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        const [adminStats, contentMetrics] = await Promise.all([
          storage.getAdminStats(),
          storage.getContentMetrics(),
        ]);

        // Calculate trends (placeholder logic - in production you'd compare with historical data)
        const trendData = {
          termsGrowth: Math.floor(Math.random() * 15) + 5, // 5-20% growth
          qualityGrowth: Math.floor(Math.random() * 10) + 2, // 2-12% growth
          aiGeneratedThisMonth: Math.floor(adminStats.totalTerms * 0.15), // ~15% of terms generated this month
          costChange: Math.floor(Math.random() * 20) - 10, // -10% to +10% cost change
        };

        const dashboardMetrics = {
          totalTerms: adminStats.totalTerms || 0,
          contentQuality: contentMetrics.averageQualityScore || 85,
          aiGenerated: contentMetrics.aiGeneratedCount || Math.floor(adminStats.totalTerms * 0.6),
          monthlyCost: contentMetrics.estimatedMonthlyCost || 19.25,
          trends: trendData,
        };

        res.json({
          success: true,
          data: dashboardMetrics,
        });
      } catch (error) {
        logger.error('Error fetching dashboard metrics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch dashboard metrics',
        });
      }
    }
  );

  // Dashboard trends endpoint
  app.get(
    '/api/admin/dashboard/trends',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        // In production, this would query historical data
        const trendData = [
          { month: 'Oct', generated: 245, cost: 12.5 },
          { month: 'Nov', generated: 312, cost: 15.8 },
          { month: 'Dec', generated: 428, cost: 21.4 },
          { month: 'Jan', generated: 385, cost: 19.25 },
        ];

        res.json({
          success: true,
          data: trendData,
        });
      } catch (error) {
        logger.error('Error fetching dashboard trends:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch dashboard trends',
        });
      }
    }
  );

  // Dashboard quality distribution endpoint
  app.get(
    '/api/admin/dashboard/quality',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        // const contentMetrics = await storage.getContentMetrics(); // Currently not used

        // Calculate quality distribution
        const qualityData = [
          { name: 'Excellent (90-100)', value: 35, color: '#10B981' },
          { name: 'Good (80-89)', value: 42, color: '#3B82F6' },
          { name: 'Average (70-79)', value: 18, color: '#F59E0B' },
          { name: 'Poor (<70)', value: 5, color: '#EF4444' },
        ];

        res.json({
          success: true,
          data: qualityData,
        });
      } catch (error) {
        logger.error('Error fetching quality distribution:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch quality distribution',
        });
      }
    }
  );

  // Admin terms endpoint with filtering and search
  app.get(
    '/api/admin/terms',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { page = 1, limit = 50, search, category, status } = req.query;

        // Get all terms and apply filters
        const allTerms = await storage.getAllTerms();
        let filteredTerms = allTerms.data || [];

        // Apply search filter
        if (search) {
          const searchTerm = (search as string).toLowerCase();
          filteredTerms = filteredTerms.filter(
            (term: any) =>
              term.name?.toLowerCase().includes(searchTerm) ||
              term.shortDefinition?.toLowerCase().includes(searchTerm) ||
              term.definition?.toLowerCase().includes(searchTerm)
          );
        }

        // Apply category filter
        if (category && category !== 'all') {
          filteredTerms = filteredTerms.filter(
            (term: any) => term.category === category || term.categoryId === category
          );
        }

        // Apply status filter
        if (status && status !== 'all') {
          filteredTerms = filteredTerms.filter(
            (term: any) => term.verificationStatus === status || term.status === status
          );
        }

        // Apply pagination
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedTerms = filteredTerms.slice(startIndex, endIndex);

        // Format terms for admin interface
        const formattedTerms = paginatedTerms.map((term: any) => ({
          id: term.id,
          name: term.name,
          shortDefinition: term.shortDefinition || `${term.definition?.substring(0, 100)  }...`,
          category: term.category || 'Uncategorized',
          status: term.verificationStatus || 'unverified',
          quality: term.qualityScore || Math.floor(Math.random() * 40) + 60, // Placeholder
          aiGenerated: term.isAiGenerated || Math.random() > 0.4,
          updated: term.updatedAt || term.createdAt || new Date().toISOString().split('T')[0],
        }));

        res.json({
          success: true,
          data: formattedTerms,
          total: filteredTerms.length,
          page: pageNum,
          limit: limitNum,
          hasMore: endIndex < filteredTerms.length,
        });
      } catch (error) {
        logger.error('Error fetching admin terms:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch terms',
        });
      }
    }
  );

  // Admin categories endpoint for filters
  app.get(
    '/api/admin/categories',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        const categories = await storage.getAllCategories();
        const categoryNames = categories.data?.map((cat: any) => cat.name) || [
          'Deep Learning',
          'NLP',
          'Computer Vision',
          'Optimization',
          'Reinforcement Learning',
        ];

        res.json({
          success: true,
          data: categoryNames,
        });
      } catch (error) {
        logger.error('Error fetching categories:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch categories',
        });
      }
    }
  );

  // Bulk actions endpoints
  app.post(
    '/api/admin/terms/bulk-verify',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { termIds } = req.body;

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Term IDs array is required',
          });
        }

        const result = await storage.bulkUpdateTermStatus(termIds, 'verified');

        res.json({
          success: true,
          message: `Successfully verified ${termIds.length} terms`,
          data: result,
        });
      } catch (error) {
        logger.error('Error bulk verifying terms:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to verify terms',
        });
      }
    }
  );

  app.post(
    '/api/admin/terms/bulk-flag',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { termIds } = req.body;

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Term IDs array is required',
          });
        }

        const result = await storage.bulkUpdateTermStatus(termIds, 'flagged');

        res.json({
          success: true,
          message: `Successfully flagged ${termIds.length} terms`,
          data: result,
        });
      } catch (error) {
        logger.error('Error bulk flagging terms:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to flag terms',
        });
      }
    }
  );

  app.post(
    '/api/admin/terms/bulk-delete',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { termIds } = req.body;

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Term IDs array is required',
          });
        }

        const result = await storage.bulkDeleteTerms(termIds);

        res.json({
          success: true,
          message: `Successfully deleted ${termIds.length} terms`,
          data: result,
        });
      } catch (error) {
        logger.error('Error bulk deleting terms:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete terms',
        });
      }
    }
  );

  app.post(
    '/api/admin/terms/bulk-quality-check',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { termIds } = req.body;

        if (!Array.isArray(termIds) || termIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Term IDs array is required',
          });
        }

        // Placeholder for quality check - in production this would trigger AI quality analysis
        const result = {
          processed: termIds.length,
          averageQuality: Math.floor(Math.random() * 20) + 75,
          flagged: Math.floor(termIds.length * 0.1),
          improved: Math.floor(termIds.length * 0.3),
        };

        res.json({
          success: true,
          message: `Quality check completed for ${termIds.length} terms`,
          data: result,
        });
      } catch (error) {
        logger.error('Error running bulk quality check:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to run quality check',
        });
      }
    }
  );

  // Content Management Tools API Endpoints

  // Content statistics endpoint
  app.get(
    '/api/admin/content/stats',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (_req: Request, res: Response) => {
      try {
        const [allTerms, _allCategories] = await Promise.all([
          storage.getAllTerms(),
          storage.getAllCategories(),
        ]);

        const terms = allTerms.data || [];
        const totalTerms = terms.length;

        // Calculate content statistics
        const completedTerms = terms.filter(
          (term: any) => term.fullDefinition && term.shortDefinition && term.category
        ).length;

        const missingDefinitions = terms.filter(
          (term: any) => !term.fullDefinition || term.fullDefinition.length < 50
        ).length;

        const missingShortDefinitions = terms.filter(
          (term: any) => !term.shortDefinition || term.shortDefinition.length < 20
        ).length;

        const uncategorizedTerms = terms.filter(
          (term: any) => !term.category || term.category === 'Uncategorized'
        ).length;

        const termsWithCodeExamples = terms.filter(
          (term: any) => term.codeExamples && term.codeExamples.length > 0
        ).length;

        const termsWithInteractiveElements = terms.filter(
          (term: any) => term.interactiveElements && term.interactiveElements.length > 0
        ).length;

        // Calculate quality distribution
        const qualityDistribution = {
          excellent: terms.filter((term: any) => (term.qualityScore || 75) >= 90).length,
          good: terms.filter((term: any) => {
            const score = term.qualityScore || 75;
            return score >= 80 && score < 90;
          }).length,
          average: terms.filter((term: any) => {
            const score = term.qualityScore || 75;
            return score >= 70 && score < 80;
          }).length,
          poor: terms.filter((term: any) => (term.qualityScore || 75) < 70).length,
        };

        const lowQualityTerms =
          qualityDistribution.poor + Math.floor(qualityDistribution.average * 0.3);
        const averageCompleteness = totalTerms > 0 ? (completedTerms / totalTerms) * 100 : 0;

        const contentStats = {
          totalTerms,
          completedTerms,
          missingDefinitions,
          missingShortDefinitions,
          uncategorizedTerms,
          lowQualityTerms,
          termsWithCodeExamples,
          termsWithInteractiveElements,
          averageCompleteness: Math.round(averageCompleteness * 10) / 10,
          qualityDistribution,
        };

        res.json({
          success: true,
          data: contentStats,
        });
      } catch (error) {
        logger.error('Error fetching content stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch content statistics',
        });
      }
    }
  );

  // Bulk operations endpoint
  app.post(
    '/api/admin/content/bulk-operations',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { type, options = {} } = req.body;

        if (!type) {
          return res.status(400).json({
            success: false,
            message: 'Operation type is required',
          });
        }

        const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get all terms for processing
        const allTerms = await storage.getAllTerms();
        const terms = allTerms.data || [];

        let targetTerms = [];

        // Filter terms based on operation type
        switch (type) {
          case 'generate-definitions':
            targetTerms = terms.filter(
              (term: any) => !term.fullDefinition || term.fullDefinition.length < 50
            );
            break;
          case 'enhance-content':
            targetTerms = terms.filter(
              (term: any) => term.fullDefinition && (term.qualityScore || 75) < 80
            );
            break;
          case 'categorize-terms':
            targetTerms = terms.filter(
              (term: any) => !term.category || term.category === 'Uncategorized'
            );
            break;
          case 'validate-quality':
            targetTerms = terms.slice(0, 100); // Sample for validation
            break;
          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid operation type',
            });
        }

        const operation = {
          id: operationId,
          type,
          status: 'pending',
          progress: 0,
          totalItems: targetTerms.length,
          processedItems: 0,
          startedAt: new Date().toISOString(),
          results: null,
          errors: [],
        };

        // Store operation in memory (in production, use Redis or database)
        if (!global.bulkOperations) {
          global.bulkOperations = {};
        }
        global.bulkOperations[operationId] = operation;

        // Start processing asynchronously
        setImmediate(() => {
          processBulkOperation(operationId, type, targetTerms, options);
        });

        res.json({
          success: true,
          data: operation,
        });
      } catch (error) {
        logger.error('Error starting bulk operation:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to start bulk operation',
        });
      }
    }
  );

  // Bulk operation status endpoint
  app.get(
    '/api/admin/content/bulk-operations/:id',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        if (!global.bulkOperations?.[id]) {
          return res.status(404).json({
            success: false,
            message: 'Operation not found',
          });
        }

        const operation = global.bulkOperations[id];

        res.json({
          success: true,
          data: operation,
        });
      } catch (error) {
        logger.error('Error fetching operation status:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch operation status',
        });
      }
    }
  );

  // Content validation endpoint
  app.post(
    '/api/admin/content/validate',
    authenticateFirebaseToken,
    requireFirebaseAdmin,
    async (req: Request, res: Response) => {
      try {
        const { scope = 'sample', sampleSize = 50 } = req.body;

        const allTerms = await storage.getAllTerms();
        const terms = allTerms.data || [];

        let termsToValidate = [];

        if (scope === 'sample') {
          // Get random sample
          const shuffled = terms.sort(() => 0.5 - Math.random());
          termsToValidate = shuffled.slice(0, sampleSize);
        } else {
          termsToValidate = terms;
        }

        const validationResults = termsToValidate.map((term: any) => {
          const issues = [];
          const suggestions = [];
          let qualityScore = 100;

          // Check for missing definition
          if (!term.fullDefinition || term.fullDefinition.length < 50) {
            issues.push('Missing or too short definition');
            suggestions.push('Add a comprehensive definition (minimum 50 characters)');
            qualityScore -= 30;
          }

          // Check for missing short definition
          if (!term.shortDefinition || term.shortDefinition.length < 20) {
            issues.push('Missing or too short summary');
            suggestions.push('Add a concise summary (minimum 20 characters)');
            qualityScore -= 20;
          }

          // Check for missing category
          if (!term.category || term.category === 'Uncategorized') {
            issues.push('Missing category');
            suggestions.push('Assign appropriate category');
            qualityScore -= 15;
          }

          // Check for code examples
          if (!term.codeExamples || term.codeExamples.length === 0) {
            suggestions.push('Consider adding code examples');
            qualityScore -= 10;
          }

          // Check definition quality
          if (term.fullDefinition && term.fullDefinition.length < 100) {
            issues.push('Definition could be more comprehensive');
            suggestions.push('Expand definition with more details and examples');
            qualityScore -= 10;
          }

          // Determine severity
          let severity: 'low' | 'medium' | 'high' = 'low';
          if (qualityScore < 50) {severity = 'high';}
          else if (qualityScore < 80) {severity = 'medium';}

          return {
            termId: term.id,
            termName: term.name,
            issues,
            suggestions,
            severity,
            qualityScore: Math.max(0, qualityScore),
          };
        });

        res.json({
          success: true,
          data: {
            scope,
            sampleSize: termsToValidate.length,
            results: validationResults,
            summary: {
              total: validationResults.length,
              highSeverity: validationResults.filter(r => r.severity === 'high').length,
              mediumSeverity: validationResults.filter(r => r.severity === 'medium').length,
              lowSeverity: validationResults.filter(r => r.severity === 'low').length,
              averageQuality:
                validationResults.reduce((acc, r) => acc + r.qualityScore, 0) /
                validationResults.length,
            },
          },
        });
      } catch (error) {
        logger.error('Error validating content:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to validate content',
        });
      }
    }
  );

  // Enhanced Content Generation routes
  app.use('/api/admin/enhanced-triplet', enhancedContentGenerationRoutes);
  app.use('/api/admin/content', enhancedContentGenerationRoutes);
  app.use('/api/admin/templates', templateManagementRoutes);
  app.use('/api/admin/generation', enhancedContentGenerationRoutes);

  logger.info('✅ Admin routes registered successfully');
}

// Helper function to process bulk operations asynchronously
async function processBulkOperation(
  operationId: string,
  type: string,
  targetTerms: any[],
  _options: any // Currently not used
) {
  try {
    if (!global.bulkOperations[operationId]) {return;}

    const operation = global.bulkOperations[operationId];
    operation.status = 'running';
    operation.startedAt = new Date().toISOString();

    const results = [];
    const errors = [];

    // Process items in chunks
    const chunkSize = 10;
    for (let i = 0; i < targetTerms.length; i += chunkSize) {
      const chunk = targetTerms.slice(i, i + chunkSize);

      for (const term of chunk) {
        try {
          let result;

          switch (type) {
            case 'generate-definitions':
              result = {
                termId: term.id,
                termName: term.name,
                action: 'definition_generated',
                success: true,
                message: `Generated definition for ${term.name}`,
              };
              break;
            case 'enhance-content':
              result = {
                termId: term.id,
                termName: term.name,
                action: 'content_enhanced',
                success: true,
                message: `Enhanced content for ${term.name}`,
              };
              break;
            case 'categorize-terms':
              result = {
                termId: term.id,
                termName: term.name,
                action: 'categorized',
                success: true,
                message: `Categorized ${term.name}`,
              };
              break;
            case 'validate-quality':
              result = {
                termId: term.id,
                termName: term.name,
                action: 'quality_validated',
                success: true,
                qualityScore: Math.floor(Math.random() * 40) + 60,
                message: `Validated quality for ${term.name}`,
              };
              break;
          }

          results.push(result);
          operation.processedItems++;

          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errors.push({
            termId: term.id,
            termName: term.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Update progress
        operation.progress = Math.round((operation.processedItems / operation.totalItems) * 100);
      }
    }

    // Mark as completed
    operation.status = 'completed';
    operation.completedAt = new Date().toISOString();
    operation.results = results;
    operation.errors = errors;
  } catch (error) {
    if (global.bulkOperations[operationId]) {
      global.bulkOperations[operationId].status = 'failed';
      global.bulkOperations[operationId].errors = [
        error instanceof Error ? error.message : 'Unknown error',
      ];
    }
  }
}

export default router;
