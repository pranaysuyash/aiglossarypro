import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import { parseExcelFile, importToDatabase } from "./excelParser";
import { 
  listExcelFiles, 
  processExcelFromS3, 
  initS3Client
} from "./s3Service";
import { importFromS3 } from "./manualImport";
import { processAndImportFromS3, importProcessedData } from "./pythonProcessor";
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import s3Routes from './s3Routes';

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);
  
  // Initialize S3 client if credentials are present
  initS3Client();
  
  // Mount S3 routes
  app.use('/api/s3', s3Routes);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:id', async (req, res) => {
    try {
      const category = await storage.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error(`Error fetching category ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Term routes
  app.get('/api/terms/featured', async (req, res) => {
    try {
      const featuredTerms = await storage.getFeaturedTerms();
      res.json(featuredTerms);
    } catch (error) {
      console.error("Error fetching featured terms:", error);
      res.status(500).json({ message: "Failed to fetch featured terms" });
    }
  });

  app.get('/api/terms/recently-viewed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recentlyViewed = await storage.getRecentlyViewedTerms(userId);
      res.json(recentlyViewed);
    } catch (error) {
      console.error("Error fetching recently viewed terms:", error);
      res.status(500).json({ message: "Failed to fetch recently viewed terms" });
    }
  });

  app.get('/api/terms/:id', async (req, res) => {
    try {
      const term = await storage.getTermById(req.params.id);
      if (!term) {
        return res.status(404).json({ message: "Term not found" });
      }
      res.json(term);
    } catch (error) {
      console.error(`Error fetching term ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch term" });
    }
  });

  app.post('/api/terms/:id/view', async (req: any, res) => {
    try {
      const termId = req.params.id;
      const userId = req.isAuthenticated() ? req.user.claims.sub : null;
      
      await storage.recordTermView(termId, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Error recording term view for ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to record term view" });
    }
  });

  app.get('/api/terms/:id/recommended', async (req, res) => {
    try {
      const termId = req.params.id;
      const userId = req.isAuthenticated() ? req.user.claims.sub : null;
      
      const recommendedTerms = await storage.getRecommendedTermsForTerm(termId, userId);
      res.json(recommendedTerms);
    } catch (error) {
      console.error(`Error fetching recommended terms for ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch recommended terms" });
    }
  });

  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const results = await storage.searchTerms(query);
      res.json(results);
    } catch (error) {
      console.error(`Error searching terms:`, error);
      res.status(500).json({ message: "Failed to search terms" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get('/api/favorites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      const isFavorite = await storage.isTermFavorite(userId, termId);
      if (isFavorite) {
        res.json({ isFavorite: true });
      } else {
        res.status(404).json({ isFavorite: false });
      }
    } catch (error) {
      console.error(`Error checking if term ${req.params.id} is favorite:`, error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  app.post('/api/favorites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      await storage.addFavorite(userId, termId);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(`Error adding favorite for term ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      await storage.removeFavorite(userId, termId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Error removing favorite for term ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Progress routes
  app.get('/api/user/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  app.get('/api/progress/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      const isLearned = await storage.isTermLearned(userId, termId);
      if (isLearned) {
        res.json({ isLearned: true });
      } else {
        res.status(404).json({ isLearned: false });
      }
    } catch (error) {
      console.error(`Error checking if term ${req.params.id} is learned:`, error);
      res.status(500).json({ message: "Failed to check learned status" });
    }
  });

  app.post('/api/progress/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      await storage.markTermAsLearned(userId, termId);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(`Error marking term ${req.params.id} as learned:`, error);
      res.status(500).json({ message: "Failed to mark term as learned" });
    }
  });

  app.delete('/api/progress/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const termId = req.params.id;
      
      await storage.unmarkTermAsLearned(userId, termId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error(`Error unmarking term ${req.params.id} as learned:`, error);
      res.status(500).json({ message: "Failed to unmark term as learned" });
    }
  });

  // User activity routes
  app.get('/api/user/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activity = await storage.getUserActivity(userId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.get('/api/user/streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      res.json(streak);
    } catch (error) {
      console.error("Error fetching user streak:", error);
      res.status(500).json({ message: "Failed to fetch user streak" });
    }
  });

  // Recommendations
  app.get('/api/terms/recommended', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendations = await storage.getRecommendedTerms(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommended terms:", error);
      res.status(500).json({ message: "Failed to fetch recommended terms" });
    }
  });

  // Settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { preferences } = req.body;
      
      await storage.updateUserSettings(userId, { preferences });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // User data export/delete
  app.get('/api/user/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userData = await storage.exportUserData(userId);
      
      res.setHeader('Content-Disposition', 'attachment; filename=ai-ml-glossary-data.json');
      res.setHeader('Content-Type', 'application/json');
      res.json(userData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.delete('/api/user/data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUserData(userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      // During development, allow all authenticated users to access admin features
      // In production, we would check for admin status
      
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.post('/api/admin/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      // Only allow admin
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.email !== "admin@example.com") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          errors: ["No file uploaded"] 
        });
      }
      
      // Parse the Excel file
      const parsedData = await parseExcelFile(req.file.buffer);
      
      // Import to database
      const result = await importToDatabase(parsedData);
      
      res.json({
        success: true,
        termsImported: result.termsImported,
        categoriesImported: result.categoriesImported
      });
    } catch (error) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({ 
        success: false, 
        errors: [error instanceof Error ? error.message : "Unknown error"] 
      });
    }
  });

  app.delete('/api/admin/clear-data', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow admin
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.email !== "admin@example.com") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.clearAllData();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({ message: "Failed to clear data" });
    }
  });
  
  // S3 Integration Routes
  
  // Simple manual import endpoint
  app.get('/api/s3/manual-import', async (req, res) => {
    try {
      const result = await importFromS3();
      return res.json(result);
    } catch (error) {
      console.error('Error in manual import:', error);
      return res.status(500).json({
        success: false,
        message: 'Error during manual import',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Python-based Excel processing
  app.get('/api/s3/python-import', async (req, res) => {
    try {
      const bucketName = process.env.S3_BUCKET_NAME;
      const fileKey = req.query.fileKey as string | undefined;
      const maxChunks = req.query.maxChunks ? parseInt(req.query.maxChunks as string) : undefined;
      
      if (!bucketName) {
        return res.status(400).json({
          success: false,
          message: 'S3 bucket name not configured'
        });
      }
      
      const result = await processAndImportFromS3(bucketName, fileKey, 'ap-south-1', maxChunks);
      return res.json(result);
    } catch (error) {
      console.error('Error in Python Excel processing:', error);
      return res.status(500).json({
        success: false,
        message: 'Error during Python Excel processing',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Process local file (for testing during development)
  app.post('/api/process/local-file', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          errors: ["No file uploaded"] 
        });
      }
      
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Save uploaded file to temp directory
      const fileExt = req.file.originalname.split('.').pop() || 'xlsx';
      const tempFilePath = path.join(tempDir, `uploaded_${Date.now()}.${fileExt}`);
      fs.writeFileSync(tempFilePath, req.file.buffer);
      
      // Determine max chunks from query parameter
      const maxChunks = req.query.maxChunks ? parseInt(req.query.maxChunks as string) : undefined;
      
      // Determine if CSV or Excel
      const isCSV = tempFilePath.toLowerCase().endsWith('.csv');
      const scriptPath = isCSV ? 'server/python/csv_processor.py' : 'server/python/excel_processor.py';
      
      // Process with Python script
      const outputPath = path.join(tempDir, `processed_${Date.now()}.json`);
      let command = `python ${scriptPath} --input "${tempFilePath}" --output "${outputPath}"`;
      
      if (maxChunks) {
        command += ` --max-chunks ${maxChunks}`;
      }
      
      console.log(`Executing command: ${command}`);
      
      // Execute the Python script
      exec(command, async (error, stdout, stderr) => {
        // Clean up the uploaded file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (e) {
          console.warn(`Error removing temp file: ${e}`);
        }
        
        if (error) {
          console.error(`Error executing Python script: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          return res.status(500).json({
            success: false,
            error: error.message
          });
        }
        
        try {
          const result = JSON.parse(stdout);
          
          if (!result.success) {
            return res.status(500).json({
              success: false,
              error: result.error || 'Unknown error'
            });
          }
          
          // Check if output file exists
          if (!fs.existsSync(outputPath)) {
            return res.status(500).json({
              success: false,
              error: 'Output file not created'
            });
          }
          
          // Read output data
          const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
          
          // Clean up output file
          try {
            fs.unlinkSync(outputPath);
          } catch (e) {
            console.warn(`Error removing output file: ${e}`);
          }
          
          // Import to database if requested
          if (req.query.import === 'true') {
            const importResult = await importProcessedData(outputData);
            return res.json({
              success: true,
              processing: result,
              import: importResult,
              categories: outputData.categories.length,
              subcategories: outputData.subcategories.length,
              terms: outputData.terms.length
            });
          } else {
            // Return just a summary of the processed data
            return res.json({
              success: true,
              categories: outputData.categories.length,
              subcategories: outputData.subcategories.length,
              terms: outputData.terms.length,
              sample: {
                categories: outputData.categories.slice(0, 3),
                subcategories: outputData.subcategories.slice(0, 3),
                terms: outputData.terms.slice(0, 3)
              }
            });
          }
        } catch (parseError) {
          console.error(`Error parsing Python output: ${parseError}`);
          console.log('Raw output:', stdout);
          return res.status(500).json({
            success: false,
            error: parseError instanceof Error ? parseError.message : String(parseError),
            stdout: stdout
          });
        }
      });
    } catch (error) {
      console.error('Error processing local file:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing local file',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Temporary setup route for initial data import (will be removed in production)
  app.get('/api/s3/setup', async (req, res) => {
    try {
      const bucketName = process.env.S3_BUCKET_NAME;
      if (!bucketName) {
        return res.status(400).json({ message: "S3 bucket name not configured" });
      }
      
      // Attempt to list files to check connectivity
      const files = await listExcelFiles(bucketName, '');
      
      if (files && files.length > 0) {
        // Process the first Excel file if it exists
        const firstExcelFile = files.find(file => 
          file.key?.toLowerCase().endsWith('.xlsx') || 
          file.key?.toLowerCase().endsWith('.xls')
        );
        
        if (firstExcelFile && firstExcelFile.key) {
          console.log(`Processing file: ${firstExcelFile.key}`);
          const result = await processExcelFromS3(bucketName, firstExcelFile.key, true);
          return res.json({ 
            success: true, 
            message: "Excel file processed successfully", 
            file: firstExcelFile.key,
            result
          });
        } else {
          return res.json({ 
            success: false, 
            message: "No Excel files found in bucket", 
            files 
          });
        }
      } else {
        return res.json({ 
          success: false, 
          message: "No files found in bucket", 
          files 
        });
      }
    } catch (error) {
      console.error("Error in S3 setup:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error processing S3 data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // List Excel files in S3 bucket
  app.get('/api/s3/files', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow admin or authorized users
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.email !== "admin@example.com") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const bucketName = process.env.S3_BUCKET_NAME;
      if (!bucketName) {
        return res.status(400).json({ message: "S3 bucket name not configured" });
      }
      
      const prefix = req.query.prefix || '';
      const files = await listExcelFiles(bucketName, prefix as string);
      res.json(files);
    } catch (error) {
      console.error("Error listing S3 files:", error);
      res.status(500).json({ message: "Failed to list files from S3" });
    }
  });
  
  // Process Excel file from S3
  app.post('/api/s3/process', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow admin or authorized users
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.email !== "admin@example.com") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { key, useStreaming = false } = req.body;
      
      if (!key) {
        return res.status(400).json({ message: "File key is required" });
      }
      
      const bucketName = process.env.S3_BUCKET_NAME;
      if (!bucketName) {
        return res.status(400).json({ message: "S3 bucket name not configured" });
      }
      
      // Process the file from S3
      const result = await processExcelFromS3(bucketName, key, useStreaming);
      res.json(result);
    } catch (error) {
      console.error("Error processing S3 file:", error);
      res.status(500).json({ 
        message: "Failed to process file from S3",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
