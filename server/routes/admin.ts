import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { parseExcelFile, importToDatabase } from "../excelParser";
import { processAndImportFromS3, importProcessedData } from "../pythonProcessor";
import multer from "multer";
import type { AuthenticatedRequest, AdminStats, ImportResult, ApiResponse } from "../../shared/types";

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
}