import { Router } from "express";
import { SurpriseDiscoveryService } from "../services/surpriseDiscoveryService";
import { logger } from "../utils/logger";
import { z } from "zod";
import { firebaseAuth } from "../middleware/firebaseAuth";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// Validation schemas
const surpriseDiscoverySchema = z.object({
  mode: z.enum(['random_adventure', 'guided_discovery', 'challenge_mode', 'connection_quest']),
  currentTermId: z.string().uuid().optional(),
  excludeRecentlyViewed: z.boolean().optional().default(true),
  maxResults: z.number().min(1).max(10).optional().default(3)
});

const feedbackSchema = z.object({
  sessionId: z.string().min(1),
  termId: z.string().uuid(),
  surpriseRating: z.number().min(1).max(5),
  relevanceRating: z.number().min(1).max(5)
});

const preferencesSchema = z.object({
  preferred_modes: z.array(z.enum(['random_adventure', 'guided_discovery', 'challenge_mode', 'connection_quest'])).optional(),
  excluded_categories: z.array(z.string()).optional(),
  difficulty_preference: z.enum(['beginner', 'intermediate', 'advanced', 'adaptive']).optional(),
  exploration_frequency: z.enum(['conservative', 'moderate', 'adventurous']).optional(),
  feedback_enabled: z.boolean().optional(),
  surprise_tolerance: z.number().min(0).max(100).optional(),
  personalization_level: z.enum(['low', 'medium', 'high']).optional()
});

/**
 * GET /api/surprise-discovery
 * Get surprise term discoveries based on mode and user preferences
 */
router.get(
  "/",
  firebaseAuth,
  validateRequest({ query: surpriseDiscoverySchema }),
  async (req, res) => {
    try {
      const { mode, currentTermId, excludeRecentlyViewed, maxResults } = req.query as any;
      const userId = req.user?.uid;
      
      // Generate session ID for tracking
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const discoveryRequest = {
        userId,
        sessionId,
        mode,
        currentTermId,
        excludeRecentlyViewed,
        maxResults
      };

      const results = await SurpriseDiscoveryService.discoverSurprise(discoveryRequest);

      logger.info(`Surprise discovery completed for user ${userId}`, {
        mode,
        resultsCount: results.length,
        sessionId
      });

      res.json({
        success: true,
        sessionId,
        mode,
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error("Error in surprise discovery endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate surprise discoveries"
      });
    }
  }
);

/**
 * POST /api/surprise-discovery/feedback
 * Provide feedback on a discovery result
 */
router.post(
  "/feedback",
  firebaseAuth,
  validateRequest({ body: feedbackSchema }),
  async (req, res) => {
    try {
      const { sessionId, termId, surpriseRating, relevanceRating } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      await SurpriseDiscoveryService.provideFeedback(
        userId,
        sessionId,
        termId,
        surpriseRating,
        relevanceRating
      );

      logger.info(`Feedback provided for discovery`, {
        userId,
        sessionId,
        termId,
        surpriseRating,
        relevanceRating
      });

      res.json({
        success: true,
        message: "Feedback recorded successfully"
      });

    } catch (error) {
      logger.error("Error recording discovery feedback:", error);
      res.status(500).json({
        success: false,
        error: "Failed to record feedback"
      });
    }
  }
);

/**
 * GET /api/surprise-discovery/preferences
 * Get user's discovery preferences
 */
router.get(
  "/preferences",
  firebaseAuth,
  async (req, res) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      const preferences = await SurpriseDiscoveryService.getDiscoveryPreferences(userId);

      res.json({
        success: true,
        preferences
      });

    } catch (error) {
      logger.error("Error getting discovery preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get preferences"
      });
    }
  }
);

/**
 * PUT /api/surprise-discovery/preferences
 * Update user's discovery preferences
 */
router.put(
  "/preferences",
  firebaseAuth,
  validateRequest({ body: preferencesSchema }),
  async (req, res) => {
    try {
      const userId = req.user?.uid;
      const preferences = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      await SurpriseDiscoveryService.updateDiscoveryPreferences(userId, preferences);

      logger.info(`Discovery preferences updated for user ${userId}`, preferences);

      res.json({
        success: true,
        message: "Preferences updated successfully"
      });

    } catch (error) {
      logger.error("Error updating discovery preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update preferences"
      });
    }
  }
);

/**
 * GET /api/surprise-discovery/modes
 * Get available discovery modes and their descriptions
 */
router.get("/modes", (req, res) => {
  const modes = [
    {
      id: "random_adventure",
      name: "Random Adventure",
      description: "Completely random exploration - adventure awaits!",
      icon: "🎲",
      difficulty: "any",
      surpriseLevel: "high"
    },
    {
      id: "guided_discovery",
      name: "Guided Discovery",
      description: "Random terms within your interest areas",
      icon: "🧭",
      difficulty: "adaptive",
      surpriseLevel: "medium"
    },
    {
      id: "challenge_mode",
      name: "Challenge Mode",
      description: "Advanced concepts to push your boundaries",
      icon: "🎯",
      difficulty: "advanced",
      surpriseLevel: "medium"
    },
    {
      id: "connection_quest",
      name: "Connection Quest",
      description: "Discover terms related to your recent learning",
      icon: "🔗",
      difficulty: "adaptive",
      surpriseLevel: "low"
    }
  ];

  res.json({
    success: true,
    modes
  });
});

/**
 * GET /api/surprise-discovery/analytics
 * Get discovery analytics for the user (optional admin endpoint)
 */
router.get(
  "/analytics",
  firebaseAuth,
  async (req, res) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // This could be expanded to show user's discovery history, patterns, etc.
      // For now, just return basic info
      res.json({
        success: true,
        message: "Analytics endpoint - to be implemented",
        userId
      });

    } catch (error) {
      logger.error("Error getting discovery analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get analytics"
      });
    }
  }
);

export default router;