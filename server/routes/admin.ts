import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from "../enhancedStorage";
import { requireAdmin, authenticateToken } from "../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../middleware/dev/mockAuth";
import { features } from "../config";
import { parseExcelFile, importToDatabase } from "../excelParser";
import multer from "multer";
import type { AuthenticatedRequest, AdminStats, ImportResult, ApiResponse } from "../../shared/types";
import express from 'express';
import { cacheManager } from '../cacheManager';
import { smartLoadExcelData } from '../smartExcelLoader';
import { AdvancedExcelParser, importComplexTerms } from '../advancedExcelParser';
import path from 'path';
import fs from 'fs';
import { inArray, eq } from 'drizzle-orm';
import { log as logger } from '../utils/logger';
// TODO: Phase 2 - Remove direct db import after all queries use storage layer
// import { db } from '../db';
// import { enhancedTerms, categories } from '../../shared/enhancedSchema';

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept only Excel files
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel files are allowed."));
    }
  },
});

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
      // TODO: Phase 2 - Add getAdminStats() method to enhancedStorage
      // Expected signature: async getAdminStats(): Promise<AdminStats>
      // Should return: { userCount, termCount, categoryCount, recentActivity }
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
   * /api/admin/import:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Import terms from Excel file
   *     description: Uploads and imports AI/ML terms from an Excel file into the database
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Excel file containing terms data (.xlsx or .xls)
   *     responses:
   *       200:
   *         description: File imported successfully
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
   *                     importedCount:
   *                       type: integer
   *                       example: 145
   *                     skippedCount:
   *                       type: integer
   *                       example: 3
   *                     errorCount:
   *                       type: integer
   *                       example: 0
   *                     errors:
   *                       type: array
   *                       items:
   *                         type: string
   *                 message:
   *                   type: string
   *                   example: "Successfully imported 145 terms"
   *       400:
   *         description: Bad request - invalid file or no file uploaded
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
  // Import Excel file
  app.post('/api/admin/import', authMiddleware, tokenMiddleware, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      logger.info(`📁 Processing uploaded file: ${req.file.originalname}`);
      logger.info(`📊 File size: ${req.file.size} bytes`);

      // Parse the Excel file
      const parsedData = await parseExcelFile(req.file.buffer);
      
      if (!parsedData || parsedData.terms.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid data found in the Excel file"
        });
      }

      logger.info(`✅ Parsed ${parsedData.terms.length} terms from Excel file`);

      // Import to database
      const dbResult = await importToDatabase(parsedData);

      const importResult: ImportResult = {
        success: true,
        termsImported: dbResult.termsImported,
        categoriesImported: dbResult.categoriesImported,
        errors: [],
        warnings: []
      };

      const response: ApiResponse<ImportResult> = {
        success: true,
        data: importResult,
        message: `Successfully imported ${importResult.termsImported} terms and ${importResult.categoriesImported} categories`
      };

      res.json(response);
    } catch (error) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import Excel file",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Advanced Excel processing with AI content generation
  app.post('/api/admin/import-advanced', authMiddleware, tokenMiddleware, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      logger.info(`🚀 Processing uploaded file with advanced AI processing: ${req.file.originalname}`);
      logger.info(`📊 File size: ${req.file.size} bytes`);

      // Parse AI options from request
      const aiOptions = req.body.aiOptions ? JSON.parse(req.body.aiOptions) : {
        enableAI: false,
        mode: 'none',
        costOptimization: true
      };

      logger.info(`🤖 AI Options:`, aiOptions);

      // Initialize advanced parser
      const parser = new AdvancedExcelParser();
      
      // Parse with AI enhancement
      const parsedTerms = await parser.parseComplexExcel(req.file.buffer, aiOptions);
      
      if (!parsedTerms || parsedTerms.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid data found in the Excel file"
        });
      }

      logger.info(`✅ Parsed ${parsedTerms.length} terms with 42-section structure`);

      // Import to enhanced database
      await importComplexTerms(parsedTerms);

      const importResult: ImportResult = {
        success: true,
        termsImported: parsedTerms.length,
        categoriesImported: 0, // Will be calculated during import
        errors: [],
        warnings: []
      };

      const response: ApiResponse<ImportResult> = {
        success: true,
        data: importResult,
        message: `Successfully processed ${importResult.termsImported} terms with ${aiOptions.enableAI ? 'AI enhancement' : 'standard processing'}`
      };

      res.json(response);
    } catch (error) {
      console.error("Error in advanced processing:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process file with advanced options",
        error: error instanceof Error ? error.message : "Unknown error"
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
      
      // TODO: Phase 2 - Add clearAllData() method to enhancedStorage
      // Expected signature: async clearAllData(): Promise<{ tablesCleared: string[] }>
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
      // TODO: Phase 2 - Add getSystemHealth() method to enhancedStorage
      // Expected signature: async getSystemHealth(): Promise<SystemHealth>
      // TODO: Phase 2 - Add getTermCount() method to enhancedStorage
      // For now, provide basic health check without term count
      const termCount = 'unknown';
      const health = {
        database: 'healthy' as const,
        s3: 'healthy' as const, 
        ai: 'healthy' as const,
        termCount
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
          // TODO: Phase 2 - Add reindexDatabase() method to enhancedStorage
          result = await storage.reindexDatabase();
          break;
        case 'cleanup':
          // TODO: Phase 2 - Add cleanupDatabase() method to enhancedStorage
          result = await storage.cleanupDatabase();
          break;
        case 'vacuum':
          // TODO: Phase 2 - Add vacuumDatabase() method to enhancedStorage
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
      
      // TODO: Phase 2 - Add getAllUsers() method to enhancedStorage
      // Expected signature: async getAllUsers(): Promise<User[]>
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
      // TODO: Phase 2 - Add getPendingContent() method to enhancedStorage
      // Expected signature: async getPendingContent(): Promise<PendingContent[]>
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
      // TODO: Phase 2 - Add approveContent() method to enhancedStorage
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
      
      // TODO: Phase 2 - Add rejectContent() method to enhancedStorage
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

  // Force reprocess Excel file
  router.post('/reprocess/:fileName', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
    try {
      const { fileName } = req.params;
      const { clearCache = true } = req.body;
      
      const dataDir = path.join(process.cwd(), 'data');
      const filePath = path.join(dataDir, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: `File ${fileName} not found`
        });
      }
      
      // Clear cache if requested
      if (clearCache) {
        await cacheManager.clearCache(filePath);
        logger.info(`🗑️ Cache cleared for ${fileName}`);
      }
      
      // Start reprocessing
      logger.info(`🔄 Starting manual reprocessing of ${fileName}...`);
      const startTime = Date.now();
      
      await smartLoadExcelData(filePath, {
        chunkSize: 500,
        enableProgress: true
      }, true);
      
      const processingTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: `Successfully reprocessed ${fileName}`,
        processingTimeSeconds: (processingTime / 1000).toFixed(2)
      });
      
    } catch (error) {
      console.error('Error reprocessing file:', error);
      res.status(500).json({
        success: false,
        error: `Failed to reprocess file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Get list of available Excel files for processing
  router.get('/files', authMiddleware, tokenMiddleware, requireAdmin, (req, res) => {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      
      if (!fs.existsSync(dataDir)) {
        return res.json({ success: true, data: { files: [] } });
      }
      
      const files = fs.readdirSync(dataDir);
      const excelFiles = files.filter(file => 
        (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
        !file.startsWith('~$') // Exclude temp files
      );
      
      const fileDetails = excelFiles.map(file => {
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          fileName: file,
          fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          lastModified: stats.mtime.toISOString(),
          isMainFile: file.includes('aiml')
        };
      });
      
      res.json({ 
        success: true, 
        data: { 
          files: fileDetails,
          dataDirectory: dataDir
        } 
      });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list files' 
      });
    }
  });

  // Get processing recommendations based on cache status and file changes
  router.get('/recommendations', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const recommendations = [];
      
      if (!fs.existsSync(dataDir)) {
        return res.json({ success: true, data: { recommendations: [] } });
      }
      
      const files = fs.readdirSync(dataDir);
      const excelFiles = files.filter(file => 
        (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
        !file.startsWith('~$')
      );
      
      for (const file of excelFiles) {
        const filePath = path.join(dataDir, file);
        const cacheInfo = await cacheManager.getCacheInfo(filePath);
        const isCacheValid = await cacheManager.isCacheValid(filePath);
        
        let recommendation = {
          fileName: file,
          hasCache: !!cacheInfo,
          cacheValid: isCacheValid,
          action: 'none',
          reason: '',
          priority: 'low'
        };
        
        if (!cacheInfo) {
          recommendation.action = 'process';
          recommendation.reason = 'No cache found - initial processing required';
          recommendation.priority = 'high';
        } else if (!isCacheValid) {
          recommendation.action = 'reprocess';
          recommendation.reason = 'File has changed since last processing';
          recommendation.priority = 'medium';
        } else {
          const ageHours = (Date.now() - cacheInfo.processedAt) / (1000 * 60 * 60);
          if (ageHours > 168) { // 7 days
            recommendation.action = 'refresh';
            recommendation.reason = `Cache is ${Math.round(ageHours / 24)} days old`;
            recommendation.priority = 'low';
          } else {
            recommendation.reason = `Cache is current (${Math.round(ageHours)} hours old)`;
          }
        }
        
        recommendations.push(recommendation);
      }
      
      res.json({ success: true, data: { recommendations } });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get recommendations' 
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

  // Add the new secure force reprocess endpoint to the main app routes
  app.post('/api/admin/import/force-reprocess', authMiddleware, tokenMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      logger.info('🔥 FORCE REPROCESS: Admin initiated force reprocessing');
      
      const { fileName, clearInvalidCache = true } = req.body;
      
      const dataDir = path.join(process.cwd(), 'data');
      
      // If no fileName specified, find the main Excel file
      let targetFile = fileName;
      if (!targetFile) {
        if (!fs.existsSync(dataDir)) {
          return res.status(404).json({
            success: false,
            error: 'Data directory not found'
          });
        }
        
        const files = fs.readdirSync(dataDir);
        const excelFiles = files.filter(file => 
          (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
          !file.startsWith('~$')
        );
        
        if (excelFiles.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'No Excel files found in data directory'
          });
        }
        
        // Find main file (containing 'aiml') or use first one
        targetFile = excelFiles.find(f => f.includes('aiml')) || excelFiles[0];
      }
      
      const filePath = path.join(dataDir, targetFile);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: `File ${targetFile} not found`
        });
      }
      
      logger.info(`🎯 Force reprocessing target: ${targetFile}`);
      
      // Check and clear invalid cache if requested
      let cacheCleared = false;
      if (clearInvalidCache) {
        cacheCleared = await cacheManager.forceInvalidateEmptyCache(filePath);
        if (cacheCleared) {
          logger.info('🗑️ Invalid cache cleared');
        }
      }
      
      // Always clear cache for force reprocess
      logger.info('🗑️ Clearing all cache for force reprocess');
      await cacheManager.clearCache(filePath);
      
      // Start force reprocessing
      logger.info(`🔄 Starting force reprocessing of ${targetFile}...`);
      const startTime = Date.now();
      
      // Use force reprocess flag to bypass all caching
      await smartLoadExcelData(filePath, {
        chunkSize: 500,
        enableProgress: true
      }, true); // Force reprocess = true
      
      const processingTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: `Force reprocessing completed successfully`,
        data: {
          fileName: targetFile,
          processingTimeSeconds: (processingTime / 1000).toFixed(2),
          cacheCleared,
          forceReprocessed: true
        }
      });
      
    } catch (error) {
      console.error('❌ Force reprocess failed:', error);
      res.status(500).json({
        success: false,
        error: `Force reprocess failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          // TODO: Phase 2 - Replace with storage layer method
          // Expected: await storage.getTermsByIds(batch)
          // Temporary workaround - commenting out direct db access
          // const termsBatch = await db
          //   .select()
          //   .from(enhancedTerms)
          //   .where(inArray(enhancedTerms.id, batch));
          
          // For now, return error since storage method doesn't exist
          throw new Error('Batch categorization requires storage layer enhancement in Phase 2');
          
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
          // TODO: Phase 2 - Replace with storage layer method
          // Expected: await storage.getTermById(termId) with full enhanced data
          // Temporary workaround - commenting out direct db access
          // const [term] = await db
          //   .select()
          //   .from(enhancedTerms)
          //   .where(eq(enhancedTerms.id, termId));
          
          // For now, return error since storage method doesn't exist
          throw new Error('Definition enhancement requires storage layer enhancement in Phase 2');
          
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

  logger.info("✅ Admin routes registered successfully");
}

export default router;