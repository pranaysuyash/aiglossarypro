import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { parseExcelFile, importToDatabase } from "../excelParser";
import { processAndImportFromS3, importProcessedData } from "../pythonProcessor";
import multer from "multer";
import type { AuthenticatedRequest, AdminStats, ImportResult, ApiResponse } from "../../shared/types";
import express from 'express';
import { cacheManager } from '../cacheManager';
import { smartLoadExcelData } from '../smartExcelLoader';
import path from 'path';
import fs from 'fs';

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
  
  // Admin dashboard statistics
  app.get('/api/admin/stats', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification
      // if (!req.user.roles?.includes('admin')) {
      //   return res.status(403).json({ success: false, message: "Admin access required" });
      // }
      
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

  // Import Excel file
  app.post('/api/admin/import', isAuthenticated, upload.single('file'), async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      console.log(`📁 Processing uploaded file: ${req.file.originalname}`);
      console.log(`📊 File size: ${req.file.size} bytes`);

      // Parse the Excel file
      const parsedData = await parseExcelFile(req.file.buffer);
      
      if (!parsedData || parsedData.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid data found in the Excel file"
        });
      }

      console.log(`✅ Parsed ${parsedData.length} terms from Excel file`);

      // Import to database
      const importResult = await importToDatabase(parsedData);

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

  // Clear all data (dangerous operation)
  app.delete('/api/admin/clear-data', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification and additional confirmation
      
      const { confirm } = req.body;
      
      if (confirm !== 'DELETE_ALL_DATA') {
        return res.status(400).json({
          success: false,
          message: "Confirmation required. Send { confirm: 'DELETE_ALL_DATA' } to proceed."
        });
      }

      console.log("🗑️  Admin initiated data clearing...");
      
      const result = await storage.clearAllData();
      
      console.log("✅ Data clearing completed");

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

  // System health check
  app.get('/api/admin/health', async (req: Request, res: Response) => {
    try {
      const health = await storage.getSystemHealth();
      
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
  app.post('/api/admin/maintenance', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification
      
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
  app.get('/api/admin/users', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification
      
      const { page = 1, limit = 50, search } = req.query;
      
      const users = await storage.getAllUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string
      });
      
      res.json({
        success: true,
        data: users.items,
        total: users.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hasMore: users.hasMore
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
  app.get('/api/admin/content/pending', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification
      
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

  app.post('/api/admin/content/:id/approve', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification
      
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

  app.post('/api/admin/content/:id/reject', isAuthenticated, async (req: Request & AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role verification
      
      const { id } = req.params;
      const { reason } = req.body;
      
      const result = await storage.rejectContent(id, reason);
      
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
  router.get('/cache/status', async (req, res) => {
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
  router.delete('/cache/:fileName', async (req, res) => {
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
  router.delete('/cache', async (req, res) => {
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
  router.post('/reprocess/:fileName', async (req, res) => {
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
        console.log(`🗑️ Cache cleared for ${fileName}`);
      }
      
      // Start reprocessing
      console.log(`🔄 Starting manual reprocessing of ${fileName}...`);
      const startTime = Date.now();
      
      await smartLoadExcelData(filePath, {
        chunkSize: 500,
        enableProgress: true
      }, true); // Force reprocess = true
      
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
        error: `Failed to reprocess file: ${error.message}`
      });
    }
  });

  // Get list of available Excel files for processing
  router.get('/files', (req, res) => {
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
  router.get('/recommendations', async (req, res) => {
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
  router.post('/schedule/reprocess', (req, res) => {
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
}

export default router;