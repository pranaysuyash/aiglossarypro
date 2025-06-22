import type { Express } from "express";
import { db } from "../../db";
import { sql } from "drizzle-orm";

export function registerUserProgressRoutes(app: Express): void {
  // Get user progress statistics
  app.get("/api/user/progress/stats", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Mock data for now since the actual analytics might not be fully populated
      const mockStats = {
        totalTermsViewed: Math.floor(Math.random() * 100) + 20,
        totalSectionsCompleted: Math.floor(Math.random() * 50) + 10,
        totalTimeSpent: Math.floor(Math.random() * 300) + 60, // minutes
        streakDays: Math.floor(Math.random() * 15) + 1,
        completedTerms: Math.floor(Math.random() * 25) + 5,
        favoriteTerms: Math.floor(Math.random() * 20) + 3,
        difficultyBreakdown: {
          beginner: Math.floor(Math.random() * 15) + 5,
          intermediate: Math.floor(Math.random() * 20) + 10,
          advanced: Math.floor(Math.random() * 10) + 3,
          expert: Math.floor(Math.random() * 5) + 1
        },
        categoryProgress: [
          { category: "Machine Learning", completed: 12, total: 25, percentage: 48 },
          { category: "Deep Learning", completed: 8, total: 20, percentage: 40 },
          { category: "Neural Networks", completed: 15, total: 18, percentage: 83 },
          { category: "Computer Vision", completed: 6, total: 15, percentage: 40 },
          { category: "Natural Language Processing", completed: 9, total: 22, percentage: 41 }
        ],
        recentActivity: [
          {
            termId: "sample-1",
            termName: "Transformer Architecture",
            action: "viewed" as const,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            sectionName: "Introduction"
          },
          {
            termId: "sample-2", 
            termName: "Gradient Descent",
            action: "completed" as const,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            sectionName: "Implementation"
          },
          {
            termId: "sample-3",
            termName: "Convolutional Neural Networks",
            action: "favorited" as const,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        learningStreak: {
          currentStreak: Math.floor(Math.random() * 10) + 1,
          longestStreak: Math.floor(Math.random() * 20) + 5,
          lastActive: new Date().toISOString()
        },
        achievements: [
          {
            id: "first-term",
            name: "First Steps",
            description: "Viewed your first term",
            unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            icon: "🎯"
          },
          {
            id: "week-streak",
            name: "Week Warrior",
            description: "Maintained a 7-day learning streak",
            unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            icon: "🔥"
          }
        ]
      };

      res.json(mockStats);
    } catch (error) {
      console.error("Error fetching user progress stats:", error);
      res.status(500).json({ error: "Failed to fetch progress statistics" });
    }
  });

  // Get detailed section progress
  app.get("/api/user/progress/sections", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Mock section progress data
      const mockSectionProgress = [
        {
          termId: "sample-1",
          termName: "Transformer Architecture",
          sectionName: "Introduction",
          status: "completed" as const,
          completionPercentage: 100,
          timeSpent: 15,
          lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          termId: "sample-1",
          termName: "Transformer Architecture", 
          sectionName: "Implementation",
          status: "in_progress" as const,
          completionPercentage: 65,
          timeSpent: 25,
          lastAccessed: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          termId: "sample-2",
          termName: "Gradient Descent",
          sectionName: "Theoretical Concepts",
          status: "completed" as const,
          completionPercentage: 100,
          timeSpent: 20,
          lastAccessed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          termId: "sample-3",
          termName: "Convolutional Neural Networks",
          sectionName: "Applications",
          status: "not_started" as const,
          completionPercentage: 0,
          timeSpent: 0,
          lastAccessed: new Date().toISOString()
        }
      ];

      res.json(mockSectionProgress);
    } catch (error) {
      console.error("Error fetching section progress:", error);
      res.status(500).json({ error: "Failed to fetch section progress" });
    }
  });

  // Get user recommendations
  app.get("/api/user/recommendations", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Mock recommendations
      const mockRecommendations = [
        {
          id: "rec-1",
          termName: "Attention Mechanism",
          reason: "Based on your interest in Transformer Architecture",
          difficulty: "intermediate",
          estimatedTime: "20 minutes"
        },
        {
          id: "rec-2", 
          termName: "Backpropagation",
          reason: "Complements your study of Gradient Descent",
          difficulty: "beginner",
          estimatedTime: "15 minutes"
        }
      ];

      res.json(mockRecommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  console.log("📊 User progress routes registered");
} 