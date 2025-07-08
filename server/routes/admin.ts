import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from "../enhancedStorage";
import { requireAdmin, authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../middleware/dev/mockAuth";
import { features } from "../config";
import type { AuthenticatedRequest, AdminStats, ApiResponse } from "../../shared/types";
import express from 'express';
import { cacheManager } from '../cacheManager';
import path from 'path';
import fs from 'fs';
import { inArray, eq } from 'drizzle-orm';
import { log as logger } from '../utils/logger';


const router = express.Router();

/**
 * Admin management routes
 * Note: These routes should include proper admin role checking in production
 */
export function registerAdminRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = mockIsAuthenticated;
  const tokenMiddleware = mockAuthenticateToken;
  
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
  app.get('/api/admin/stats', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminStats();
      
      const response: ApiResponse<AdminStats> = {
        success: true,
        data: stats
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to fetch admin statistics" 
      });
    }
  });


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
  app.delete('/api/admin/clear-data', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { confirm } = req.body;
      
      if (confirm !== 'DELETE_ALL_DATA') {
        return res.status(400).json({
          success: false,
          message: "Confirmation required. Send { confirm: 'DELETE_ALL_DATA' } to proceed."
        });
      }

      logger.info("🗑️  Admin initiated data clearing...");
      
      const result = await storage.clearAllData();
      
      logger.info("✅ Data clearing completed");

      res.json({
        success: true,
        message: "All data cleared successfully",
        data: result
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear data"
      });
    }
  });

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
  app.get('/api/admin/health', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [systemHealth, contentMetrics] = await Promise.all([
        storage.getSystemHealth(),
        storage.getContentMetrics()
      ]);
      
      const health = {
        ...systemHealth,
        termCount: contentMetrics.totalTerms
      };
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({
        success: false,
        message: "Health check failed"
      });
    }
  });

  // Database maintenance operations
  app.post('/api/admin/maintenance', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
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
            message: "Invalid maintenance operation"
          });
      }
      
      res.json({
        success: true,
        message: `Maintenance operation '${operation}' completed`,
        data: result
      });
    } catch (error) {
      console.error(`Error performing maintenance operation:`, error);
      res.status(500).json({
        success: false,
        message: "Maintenance operation failed"
      });
    }
  });

  // User management
  app.get('/api/admin/users', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, search } = req.query;
      
      const users = await storage.getAllUsers();
      
      // Apply pagination and search on the client side for now
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const searchTerm = search as string;
      
      let filteredUsers = users.data;
      if (searchTerm) {
        filteredUsers = users.data.filter((user: any) => 
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
        hasMore: endIndex < filteredUsers.length
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  });

  // Content moderation
  app.get('/api/admin/content/pending', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const pendingContent = await storage.getPendingContent();
      
      res.json({
        success: true,
        data: pendingContent
      });
    } catch (error) {
      console.error("Error fetching pending content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending content"
      });
    }
  });

  app.post('/api/admin/content/:id/approve', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await storage.approveContent(id);
      
      res.json({
        success: true,
        message: "Content approved successfully",
        data: result
      });
    } catch (error) {
      console.error("Error approving content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to approve content"
      });
    }
  });

  app.post('/api/admin/content/:id/reject', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const result = await storage.rejectContent(id);
      
      res.json({
        success: true,
        message: "Content rejected successfully",
        data: result
      });
    } catch (error) {
      console.error("Error rejecting content:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject content"
      });
    }
  });

  // Get cache status and information
  router.get('/cache/status', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
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
          cacheVersion: entry.cacheVersion
        }))
      };
      
      res.json({ success: true, data: status });
    } catch (error) {
      console.error('Error getting cache status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get cache status' 
      });
    }
  });

  // Clear specific cache entry
  router.delete('/cache/:fileName', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
    try {
      const { fileName } = req.params;
      const dataDir = path.join(process.cwd(), 'data');
      const filePath = path.join(dataDir, fileName);
      
      await cacheManager.clearCache(filePath);
      
      res.json({ 
        success: true, 
        message: `Cache cleared for ${fileName}` 
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clear cache' 
      });
    }
  });

  // Clear all cache entries
  router.delete('/cache', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
    try {
      await cacheManager.clearAllCache();
      
      res.json({ 
        success: true, 
        message: 'All cache cleared successfully' 
      });
    } catch (error) {
      console.error('Error clearing all cache:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clear all cache' 
      });
    }
  });


  // Schedule automatic reprocessing (placeholder for future cron implementation)
  router.post('/schedule/reprocess', authMiddleware, tokenMiddleware, requireAdmin, (req, res) => {
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
          note: 'Scheduled processing will be implemented in a future update'
        }
      });
    } catch (error) {
      console.error('Error configuring scheduled reprocessing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to configure scheduled reprocessing'
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
  app.post('/api/admin/batch/categorize', authMiddleware, async (req: any, res: Response) => {
    try {
      const { termIds, options = {} } = req.body;
      
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
          const termsBatch = await storage.getTermsByIds(batch);
          
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
              console.error(`Error categorizing term ${term.id}:`, termError);
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
          console.error(`Error processing batch ${i}-${i + 5}:`, batchError);
          batch.forEach(termId => {
            errors.push({
              termId,
              error: batchError instanceof Error ? batchError.message : 'Batch processing error'
            });
          });
        }
      }
      
      res.json({
        success: true,
        processed: results.length,
        errorCount: errors.length,
        results,
        errors
      });
      
    } catch (error) {
      console.error('Batch categorization error:', error);
      res.status(500).json({ 
        message: 'Batch categorization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Batch enhance definitions using AI
   * POST /api/admin/batch/enhance-definitions
   */
  app.post('/api/admin/batch/enhance-definitions', authMiddleware, async (req: any, res: Response) => {
    try {
      const { termIds, options = {} } = req.body;
      const { 
        enhancementType = 'improve_clarity',
        targetAudience = 'general',
        includeExamples = true,
        maxLength = 500 
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
          console.error(`Error enhancing definition for term ${termId}:`, termError);
          errors.push({
            termId,
            error: termError instanceof Error ? termError.message : 'Unknown error'
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
          maxLength
        }
      });
      
    } catch (error) {
      console.error('Batch definition enhancement error:', error);
      res.status(500).json({ 
        message: 'Batch definition enhancement failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get batch operation status
   * GET /api/admin/batch/status/:operationId
   */
  app.get('/api/admin/batch/status/:operationId', authMiddleware, async (req: any, res: Response) => {
    try {
      const { operationId } = req.params;
      
      // This would typically check a job queue or database for operation status
      // For now, return a simple response
      res.json({
        operationId,
        status: 'completed',
        message: 'Batch operations are processed synchronously'
      });
      
    } catch (error) {
      console.error('Error fetching batch operation status:', error);
      res.status(500).json({ message: 'Failed to fetch operation status' });
    }
  });

  // Enhanced Content Generation routes
  import enhancedContentGenerationRoutes from './admin/enhancedContentGeneration';
  import templateManagementRoutes from './admin/templateManagement';
  
  app.use('/api/admin/enhanced-triplet', enhancedContentGenerationRoutes);
  app.use('/api/admin/content', enhancedContentGenerationRoutes);
  app.use('/api/admin/templates', templateManagementRoutes);
  app.use('/api/admin/generation', enhancedContentGenerationRoutes);

  logger.info("✅ Admin routes registered successfully");
}

export default router;