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
      // Only allow admin
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.email !== "admin@example.com") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
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
