import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replitAuth";
import { requireAdmin, authenticateToken } from "../../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../../middleware/dev/mockAuth";
import { features } from "../../config";
import { parseExcelFile, importToDatabase } from "../../excelParser";
import multer from "multer";
import type { ImportResult, ApiResponse } from "../../../shared/types";

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
 * Admin data import and export routes
 */
export function registerAdminImportRoutes(app: Express): void {
  // Choose authentication middleware based on environment
  const authMiddleware = features.replitAuthEnabled ? isAuthenticated : mockIsAuthenticated;
  const tokenMiddleware = features.replitAuthEnabled ? authenticateToken : mockAuthenticateToken;
  
  // Import Excel file
  app.post('/api/admin/import', authMiddleware, tokenMiddleware, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
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
      
      if (!parsedData || parsedData.terms.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid data found in the Excel file"
        });
      }

      console.log(`✅ Parsed ${parsedData.terms.length} terms from Excel file`);

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
} 