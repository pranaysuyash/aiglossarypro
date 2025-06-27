import type { Express, Request, Response } from "express";
import { enhancedStorage as storage } from "../../enhancedStorage";
import { isAuthenticated } from "../../replitAuth";
import { requireAdmin, authenticateToken } from "../../middleware/adminAuth";
import { mockIsAuthenticated, mockAuthenticateToken } from "../../middleware/dev/mockAuth";
import { features } from "../../config";
import { parseExcelFile, importToDatabase } from "../../excelParser";
import { AdvancedExcelParser, importComplexTerms } from "../../advancedExcelParser";
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
    const isValidExcelFile = 
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      // curl might send xlsx files as octet-stream, so check file extension
      (file.mimetype === "application/octet-stream" && 
       (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')));
    
    if (isValidExcelFile) {
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

      // Determine file size to choose appropriate parser
      const fileSizeMB = req.file.size / (1024 * 1024);
      console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);

      // For large files with 42-section structure, use advanced parser
      if (fileSizeMB > 0.1 || req.file.originalname.includes('row1')) { // Use advanced for row1.xlsx or larger files
        console.log('🧠 Using Advanced Excel Parser for 42-section structure...');
        
        // Initialize advanced parser
        const advancedParser = new AdvancedExcelParser();
        
        // Parse with advanced parser (extracts all 42 sections)
        const parsedTerms = await advancedParser.parseComplexExcel(req.file.buffer);
        
        if (!parsedTerms || parsedTerms.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No valid terms found in the Excel file"
          });
        }

        console.log(`✅ Advanced parser extracted ${parsedTerms.length} terms with 42 sections each`);

        // Import to enhanced database with full 42-section support
        await importComplexTerms(parsedTerms);
        
        const importResult: ImportResult = {
          success: true,
          termsImported: parsedTerms.length,
          categoriesImported: 0, // Categories are parsed inline, not counted separately
          errors: [],
          warnings: []
        };

        const response: ApiResponse<ImportResult> = {
          success: true,
          data: importResult,
          message: `Successfully imported ${importResult.termsImported} terms with complete 42-section structure and ${importResult.categoriesImported} categories`
        };

        res.json(response);
        
      } else {
        // Use basic parser for simple files
        console.log('📋 Using basic parser for simple structure...');
        
        const parsedData = await parseExcelFile(req.file.buffer);
        
        if (!parsedData || parsedData.terms.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No valid data found in the Excel file"
          });
        }

        console.log(`✅ Basic parser extracted ${parsedData.terms.length} terms`);

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
      }
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