import type { Express, Response } from 'express';
import { z } from 'zod';
import {
  type BehaviorTrackingRequest,
  behaviorTrackingMiddleware,
  trackUserAction,
} from '../middleware/behaviorTrackingMiddleware';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { personalizationService } from '../services/personalizationService';
import { log as logger } from '../utils/logger';

// Validation schemas
const PersonalizedHomepageSchema = z.object({
  context: z
    .object({
      timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
      dayOfWeek: z.string().optional(),
      sessionLength: z.number().optional(),
      deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
      currentPath: z.string().optional(),
      referrer: z.string().optional(),
    })
    .optional(),
  limit: z.number().min(1).max(50).default(20),
  sections: z.array(z.string()).optional(),
});

const BehaviorEventSchema = z.object({
  eventType: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  context: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
});

const RecommendationFeedbackSchema = z.object({
  recommendationId: z.string(),
  feedback: z.enum(['positive', 'negative', 'neutral']),
  reason: z.string().optional(),
});

type AuthenticatedRequest = BehaviorTrackingRequest & {
  user: {
    claims: {
      sub: string;
    };
  };
};

/**
 * Personalization routes for AI-powered homepage
 */
export function registerPersonalizationRoutes(app: Express): void {
  const authMiddleware = multiAuthMiddleware;

  // Get personalized homepage data
  app.get(
    '/api/personalization/homepage',
    authMiddleware as any,
    behaviorTrackingMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.claims.sub;

        // Parse and validate query parameters
        const validation = PersonalizedHomepageSchema.safeParse({
          context: {
            timeOfDay: determineTimeOfDay(),
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
            deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
            currentPath: req.path,
            referrer: req.headers.referer,
          },
          limit: parseInt(req.query.limit as string) || 20,
          sections: req.query.sections ? (req.query.sections as string).split(',') : undefined,
        });

        if (!validation.success) {
          return res.status(400).json({
            success: false,
            message: 'Invalid request parameters',
            errors: validation.error.issues,
          });
        }

        const { context, limit, sections } = validation.data;

        // Get personalized recommendations
        const recommendations = await personalizationService.getPersonalizedRecommendations({
          userId,
          context: context!,
          recommendationType: 'homepage',
          limit,
          excludeIds: [],
        });

        // Get user's learning profile for additional context
        const userProfile = await personalizationService.getUserPersonalizationProfile(userId);

        // Build personalized homepage sections
        const personalizedHomepage = await buildPersonalizedHomepage({
          userId,
          recommendations,
          userProfile,
          requestedSections: sections,
          context: context!,
        });

        // Track homepage view
        await trackUserAction(req, 'view', 'homepage', 'personalized', {
          sectionsRequested: sections?.length || 0,
          recommendationsCount: recommendations.length,
          userExperienceLevel: userProfile.preferredComplexity,
        });

        res.json({
          success: true,
          data: personalizedHomepage,
          metadata: {
            generatedAt: new Date().toISOString(),
            algorithmVersion: 'v1.2.0',
            personalizationLevel: calculatePersonalizationLevel(
              userProfile,
              recommendations.length
            ),
            cacheExpiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          },
        });
      } catch (error) {
        logger.error('Error generating personalized homepage', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: req.user?.claims?.sub,
        });

        res.status(500).json({
          success: false,
          message: 'Failed to generate personalized homepage',
        });
      }
    }
  );

  // Get personalized recommendations for a specific context
  app.get(
    '/api/personalization/recommendations/:type',
    authMiddleware as any,
    behaviorTrackingMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const recommendationType = req.params.type;
        const limit = parseInt(req.query.limit as string) || 10;
        const excludeIds = req.query.exclude ? (req.query.exclude as string).split(',') : [];

        if (
          !['homepage', 'term_detail', 'category_page', 'search_results'].includes(
            recommendationType
          )
        ) {
          return res.status(400).json({
            success: false,
            message: 'Invalid recommendation type',
          });
        }

        const context = {
          timeOfDay: determineTimeOfDay(),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          sessionLength: 0,
          deviceType: req.headers['user-agent']?.includes('Mobile')
            ? ('mobile' as const)
            : ('desktop' as const),
          currentPath: req.path,
          referrer: req.headers.referer,
        };

        const recommendations = await personalizationService.getPersonalizedRecommendations({
          userId,
          context,
          recommendationType: recommendationType as any,
          limit,
          excludeIds,
        });

        // Track recommendation request
        await trackUserAction(
          req,
          'recommendation_request',
          'recommendations',
          recommendationType,
          {
            limit,
            excludeCount: excludeIds.length,
            resultCount: recommendations.length,
          }
        );

        res.json({
          success: true,
          data: recommendations,
          metadata: {
            type: recommendationType,
            generatedAt: new Date().toISOString(),
            count: recommendations.length,
          },
        });
      } catch (error) {
        logger.error('Error getting personalized recommendations', {
          error: error instanceof Error ? error.message : String(error),
          type: req.params.type,
          userId: req.user?.claims?.sub,
        });

        res.status(500).json({
          success: false,
          message: 'Failed to get recommendations',
        });
      }
    }
  );

  // Track user behavior event
  app.post(
    '/api/personalization/track',
    authMiddleware as any,
    behaviorTrackingMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const _userId = req.user.claims.sub;

        const validation = BehaviorEventSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            success: false,
            message: 'Invalid event data',
            errors: validation.error.issues,
          });
        }

        const { eventType, entityType, entityId, context } = validation.data;

        await trackUserAction(req, eventType, entityType, entityId, context);

        res.json({
          success: true,
          message: 'Event tracked successfully',
        });
      } catch (error) {
        logger.error('Error tracking behavior event', {
          error: error instanceof Error ? error.message : String(error),
          body: req.body,
          userId: req.user?.claims?.sub,
        });

        res.status(500).json({
          success: false,
          message: 'Failed to track event',
        });
      }
    }
  );

  // Provide feedback on recommendations
  app.post(
    '/api/personalization/feedback',
    authMiddleware as any,
    behaviorTrackingMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.claims.sub;

        const validation = RecommendationFeedbackSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            success: false,
            message: 'Invalid feedback data',
            errors: validation.error.issues,
          });
        }

        const { recommendationId, feedback, reason } = validation.data;

        // Track recommendation feedback
        await trackUserAction(req, 'recommendation_feedback', 'recommendation', recommendationId, {
          feedback,
          reason,
          timestamp: new Date().toISOString(),
        });

        // Store feedback for improving recommendations
        await personalizationService.trackBehaviorEvent({
          user_id: userId,
          event_type: 'recommendation_feedback',
          entity_type: 'recommendation',
          entity_id: recommendationId,
          context: { feedback, reason },
          session_id: req.trackingContext?.sessionId || '',
          user_agent: req.headers['user-agent'] || '',
          ip_address: req.trackingContext?.ipAddress || '',
        });

        res.json({
          success: true,
          message: 'Feedback recorded successfully',
        });
      } catch (error) {
        logger.error('Error recording recommendation feedback', {
          error: error instanceof Error ? error.message : String(error),
          body: req.body,
          userId: req.user?.claims?.sub,
        });

        res.status(500).json({
          success: false,
          message: 'Failed to record feedback',
        });
      }
    }
  );

  // Get user's personalization profile
  app.get(
    '/api/personalization/profile',
    authMiddleware as any,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.claims.sub;

        const profile = await personalizationService.getUserPersonalizationProfile(userId);

        res.json({
          success: true,
          data: profile,
        });
      } catch (error) {
        logger.error('Error getting user profile', {
          error: error instanceof Error ? error.message : String(error),
          userId: req.user?.claims?.sub,
        });

        res.status(500).json({
          success: false,
          message: 'Failed to get user profile',
        });
      }
    }
  );

  // Analytics endpoints for behavior tracking
  app.post(
    '/api/analytics/scroll-depth',
    authMiddleware as any,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const _userId = req.user.claims.sub;
        const { depth, timestamp } = req.body;

        await trackUserAction(req, 'scroll_depth', 'page', req.path, {
          scrollDepth: depth,
          timeToScroll: timestamp,
        });

        res.json({ success: true });
      } catch (error) {
        logger.error('Error tracking scroll depth', { error, body: req.body });
        res.status(200).json({ success: false }); // Don't fail the page for analytics
      }
    }
  );

  app.post(
    '/api/analytics/interaction',
    authMiddleware as any,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const _userId = req.user.claims.sub;
        const interactionData = req.body;

        await trackUserAction(
          req,
          'ui_interaction',
          'element',
          interactionData.element || 'unknown',
          interactionData
        );

        res.json({ success: true });
      } catch (error) {
        logger.error('Error tracking interaction', { error, body: req.body });
        res.status(200).json({ success: false });
      }
    }
  );

  app.post(
    '/api/analytics/time-spent',
    authMiddleware as any,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const _userId = req.user.claims.sub;
        const { timeSpent, maxScrollDepth, interactions, url } = req.body;

        await trackUserAction(req, 'session_summary', 'page', url || req.path, {
          timeSpent,
          maxScrollDepth,
          interactions,
          sessionEnd: true,
        });

        res.json({ success: true });
      } catch (error) {
        logger.error('Error tracking time spent', { error, body: req.body });
        res.status(200).json({ success: false });
      }
    }
  );

  logger.info('Personalization routes registered successfully');
}

// Helper functions
function determineTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {return 'morning';}
  if (hour >= 12 && hour < 17) {return 'afternoon';}
  if (hour >= 17 && hour < 21) {return 'evening';}
  return 'night';
}

async function buildPersonalizedHomepage(params: {
  userId: string;
  recommendations: any[];
  userProfile: any;
  requestedSections?: string[];
  context: any;
}) {
  const { userId, recommendations, userProfile, requestedSections, context } = params;

  // Default sections
  const defaultSections = [
    'welcome_banner',
    'recommended_for_you',
    'continue_learning',
    'trending_topics',
    'explore_categories',
    'learning_paths',
    'recent_activity',
  ];

  const sections = requestedSections || defaultSections;
  const homepage: any = {};

  for (const section of sections) {
    switch (section) {
      case 'welcome_banner':
        homepage.welcomeBanner = buildWelcomeBanner(userProfile, context);
        break;

      case 'recommended_for_you':
        homepage.recommendedForYou = recommendations
          .filter(r => r.type === 'term')
          .slice(0, 6)
          .map(r => ({
            ...r,
            displayPriority: 'high',
          }));
        break;

      case 'continue_learning':
        homepage.continueLearning = recommendations
          .filter(r => r.metadata.algorithm === 'content_based')
          .slice(0, 3);
        break;

      case 'trending_topics':
        homepage.trendingTopics = recommendations
          .filter(r => r.metadata.popularity > 100)
          .slice(0, 4);
        break;

      case 'explore_categories':
        homepage.exploreCategories = recommendations.filter(r => r.type === 'category').slice(0, 6);
        break;

      case 'learning_paths':
        homepage.learningPaths = recommendations
          .filter(r => r.type === 'learning_path')
          .slice(0, 3);
        break;

      case 'recent_activity':
        // This would come from user's recent behavior
        homepage.recentActivity = [];
        break;
    }
  }

  return homepage;
}

function buildWelcomeBanner(userProfile: any, context: any) {
  const timeOfDay = context.timeOfDay;
  const complexity = userProfile.preferredComplexity;

  let greeting = 'Welcome back!';
  let suggestion = '';

  switch (timeOfDay) {
    case 'morning':
      greeting = 'Good morning!';
      suggestion = `Start your day with some ${complexity}-level AI concepts`;
      break;
    case 'afternoon':
      greeting = 'Good afternoon!';
      suggestion = `Perfect time to dive into practical AI applications`;
      break;
    case 'evening':
      greeting = 'Good evening!';
      suggestion = `Wind down with some interesting AI theory`;
      break;
    case 'night':
      greeting = 'Working late?';
      suggestion = `Here are some quick AI insights for you`;
      break;
  }

  return {
    greeting,
    suggestion,
    userLevel: complexity,
    timeOfDay,
    personalizedMessage: true,
  };
}

function calculatePersonalizationLevel(
  userProfile: any,
  recommendationCount: number
): 'low' | 'medium' | 'high' {
  // Calculate how personalized the experience is based on available data
  let score = 0;

  if (userProfile.interestCategories.length > 0) {score += 20;}
  if (userProfile.engagementPatterns && Object.keys(userProfile.engagementPatterns).length > 0)
    {score += 20;}
  if (userProfile.skillLevel && Object.keys(userProfile.skillLevel).length > 0) {score += 20;}
  if (userProfile.activeGoals.length > 0) {score += 20;}
  if (recommendationCount > 10) {score += 20;}

  if (score >= 80) {return 'high';}
  if (score >= 50) {return 'medium';}
  return 'low';
}
