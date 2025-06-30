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
import { log as logger } from "../../utils/logger";

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

      logger.info(`📁 Processing uploaded file: ${req.file.originalname}`);
      logger.info(`📊 File size: ${req.file.size} bytes`);

      // Determine file size to choose appropriate parser
      const fileSizeMB = req.file.size / (1024 * 1024);
      logger.info(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);

      // For large files with 42-section structure, use advanced parser
      if (fileSizeMB > 0.1 || req.file.originalname.includes('row1')) { // Use advanced for row1.xlsx or larger files
        logger.info('🧠 Using Advanced Excel Parser for 42-section structure...');
        
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

        logger.info(`✅ Advanced parser extracted ${parsedTerms.length} terms with 42 sections each`);

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
        logger.info('📋 Using basic parser for simple structure...');
        
        const parsedData = await parseExcelFile(req.file.buffer);
        
        if (!parsedData || parsedData.terms.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No valid data found in the Excel file"
          });
        }

        logger.info(`✅ Basic parser extracted ${parsedData.terms.length} terms`);

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
      logger.error("Error importing Excel file:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import Excel file",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Force reprocess endpoint - clears cache and forces fresh processing
  app.post('/api/admin/import/force-reprocess', authMiddleware, tokenMiddleware, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded for force reprocessing"
        });
      }

      logger.info(`🔄 Force reprocessing file: ${req.file.originalname}`);
      logger.info(`📊 File size: ${req.file.size} bytes`);

      // Clear cache first to ensure fresh processing
      await storage.clearCache();
      logger.info("🗑️  Cache cleared for force reprocessing");

      // Determine file size to choose appropriate parser
      const fileSizeMB = req.file.size / (1024 * 1024);
      logger.info(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);

      // For large files with 42-section structure, use advanced parser
      if (fileSizeMB > 0.1 || req.file.originalname.includes('row1')) {
        logger.info('🧠 Force processing with Advanced Excel Parser...');
        
        // Initialize advanced parser with force flag
        const advancedParser = new AdvancedExcelParser();
        
        // Parse with advanced parser (extracts all 42 sections) - bypassing cache
        const parsedTerms = await advancedParser.parseComplexExcel(req.file.buffer);
        
        if (!parsedTerms || parsedTerms.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No valid terms found in the Excel file during force reprocessing"
          });
        }

        logger.info(`✅ Force reprocessing completed: ${parsedTerms.length} terms with 42 sections each`);

        // Import to enhanced database with full 42-section support
        await importComplexTerms(parsedTerms);
        
        const importResult: ImportResult = {
          success: true,
          termsImported: parsedTerms.length,
          categoriesImported: 0,
          errors: [],
          warnings: []
        };

        const response: ApiResponse<ImportResult> = {
          success: true,
          data: importResult,
          message: `Force reprocessing completed: ${importResult.termsImported} terms with complete 42-section structure`
        };

        res.json(response);
        
      } else {
        // Use basic parser for simple files
        logger.info('📋 Force processing with basic parser...');
        
        const parsedData = await parseExcelFile(req.file.buffer);
        
        if (!parsedData || parsedData.terms.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No valid data found in the Excel file during force reprocessing"
          });
        }

        logger.info(`✅ Force reprocessing completed: ${parsedData.terms.length} terms`);

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
          message: `Force reprocessing completed: ${importResult.termsImported} terms and ${importResult.categoriesImported} categories`
        };

        res.json(response);
      }
    } catch (error) {
      logger.error("Error during force reprocessing:", error);
      res.status(500).json({
        success: false,
        message: "Failed to force reprocess file",
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
      
      // Parse with AI enhancement and checkpoint support
      const parsedTerms = await parser.parseComplexExcel(req.file.buffer, aiOptions, req.file.originalname);
      
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
        warnings: [],
        metadata: {
          processingMode: aiOptions.enableAI ? aiOptions.mode : 'no-ai',
          sectionsProcessed: 42,
          aiGenerated: aiOptions.enableAI ? parsedTerms.filter(t => t.sections.size > 7).length : 0
        }
      };

      const response: ApiResponse<ImportResult> = {
        success: true,
        data: importResult,
        message: `Successfully processed ${importResult.termsImported} terms with ${aiOptions.enableAI ? 'AI enhancement' : 'standard processing'}`
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in advanced processing:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process file with advanced options",
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

      logger.info("🗑️  Admin initiated data clearing...");
      
      const result = await storage.clearAllData();
      
      logger.info("✅ Data clearing completed");

      res.json({
        success: true,
        message: "All data cleared successfully",
        data: result
      });
    } catch (error) {
      logger.error("Error clearing data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear data"
      });
    }
  });
} 