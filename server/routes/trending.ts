/**
 * Trending Terms API Routes
 * Provides comprehensive trending analysis and content discovery
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db';
import { 
  terms, 
  termAnalytics, 
  categories,
  userInteractions,
  type Term
} from '../../shared/schema';
import { sql, desc, asc, eq, and, gte, lt, count, avg } from 'drizzle-orm';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { 
  sendErrorResponse, 
  handleDatabaseError, 
  ErrorCode 
} from '../utils/errorHandler';

interface TrendingTerm {
  id: string;
  name: string;
  definition: string;
  shortDefinition: string;
  categoryId: string;
  categoryName: string;
  viewCount: number;
  recentViews: number;
  velocityScore: number;
  engagementScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  percentageChange: number;
  averageTimeSpent: number;
  shareCount: number;
  bookmarkCount: number;
}

interface TrendingFilters {
  timeRange: 'hour' | 'day' | 'week' | 'month';
  category?: string;
  trendType: 'velocity' | 'engagement' | 'emerging' | 'popular';
  limit: number;
  offset: number;
}

interface TrendingAnalytics {
  totalTrendingTerms: number;
  averageVelocityScore: number;
  topCategories: Array<{ categoryId: string; name: string; trendingCount: number }>;
  trendingChangeFromPrevious: number;
}

/**
 * Calculate trending score based on multiple factors
 */
function calculateTrendingScore(
  recentViews: number, 
  totalViews: number, 
  timeSpentAvg: number, 
  shareCount: number,
  bookmarkCount: number,
  velocityMultiplier: number = 1
): number {
  const viewsWeight = 0.3;
  const velocityWeight = 0.3;
  const engagementWeight = 0.25;
  const socialWeight = 0.15;

  const viewsScore = Math.min(recentViews / 100, 1) * viewsWeight;
  const velocityScore = Math.min((recentViews / Math.max(totalViews, 1)) * velocityMultiplier, 1) * velocityWeight;
  const engagementScore = Math.min(timeSpentAvg / 300, 1) * engagementWeight; // 300 seconds = 5 minutes
  const socialScore = Math.min((shareCount + bookmarkCount) / 10, 1) * socialWeight;

  return (viewsScore + velocityScore + engagementScore + socialScore) * 100;
}

/**
 * Get trending terms with advanced analytics
 */
async function getTrendingTerms(filters: TrendingFilters): Promise<TrendingTerm[]> {
  const { timeRange, category, trendType, limit, offset } = filters;
  
  // Calculate time boundaries
  const now = new Date();
  const timeRangeHours = {
    hour: 1,
    day: 24,
    week: 168,
    month: 720
  }[timeRange];
  
  const startTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);
  const previousStartTime = new Date(startTime.getTime() - timeRangeHours * 60 * 60 * 1000);

  // Build base query with analytics data
  let query = db
    .select({
      id: terms.id,
      name: terms.name,
      definition: terms.definition,
      shortDefinition: terms.shortDefinition,
      categoryId: terms.categoryId,
      categoryName: categories.name,
      viewCount: sql<number>`COALESCE(${termAnalytics.viewCount}, 0)`,
      recentViews: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${userInteractions} 
           WHERE ${userInteractions.termId} = ${terms.id} 
           AND ${userInteractions.interactionType} = 'view'
           AND ${userInteractions.timestamp} >= ${startTime.toISOString()}), 
          0
        )`,
      previousViews: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${userInteractions} 
           WHERE ${userInteractions.termId} = ${terms.id} 
           AND ${userInteractions.interactionType} = 'view'
           AND ${userInteractions.timestamp} >= ${previousStartTime.toISOString()}
           AND ${userInteractions.timestamp} < ${startTime.toISOString()}), 
          0
        )`,
      averageTimeSpent: sql<number>`
        COALESCE(
          (SELECT AVG(${userInteractions.duration}) FROM ${userInteractions} 
           WHERE ${userInteractions.termId} = ${terms.id} 
           AND ${userInteractions.interactionType} = 'view'
           AND ${userInteractions.timestamp} >= ${startTime.toISOString()}), 
          0
        )`,
      shareCount: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${userInteractions} 
           WHERE ${userInteractions.termId} = ${terms.id} 
           AND ${userInteractions.interactionType} = 'share'
           AND ${userInteractions.timestamp} >= ${startTime.toISOString()}), 
          0
        )`,
      bookmarkCount: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${userInteractions} 
           WHERE ${userInteractions.termId} = ${terms.id} 
           AND ${userInteractions.interactionType} = 'bookmark'
           AND ${userInteractions.timestamp} >= ${startTime.toISOString()}), 
          0
        )`
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .leftJoin(termAnalytics, eq(terms.id, termAnalytics.termId));

  // Add category filter if specified
  if (category) {
    query = query.where(eq(terms.categoryId, category));
  }

  const results = await query.limit(limit * 2).offset(offset); // Get more to filter by trend type

  // Calculate trending metrics for each term
  const trendingTerms: TrendingTerm[] = results.map(term => {
    const recentViews = Number(term.recentViews);
    const previousViews = Number(term.previousViews);
    const totalViews = Number(term.viewCount);
    const timeSpent = Number(term.averageTimeSpent);
    const shares = Number(term.shareCount);
    const bookmarks = Number(term.bookmarkCount);

    // Calculate velocity (change in views)
    const velocityScore = recentViews > 0 ? 
      ((recentViews - previousViews) / Math.max(previousViews, 1)) * 100 : 0;
    
    // Calculate engagement score
    const engagementScore = calculateTrendingScore(
      recentViews, totalViews, timeSpent, shares, bookmarks
    );

    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    const percentageChange = previousViews > 0 ? 
      ((recentViews - previousViews) / previousViews) * 100 : 
      (recentViews > 0 ? 100 : 0);

    if (percentageChange > 10) trendDirection = 'up';
    else if (percentageChange < -10) trendDirection = 'down';

    return {
      id: term.id,
      name: term.name,
      definition: term.definition,
      shortDefinition: term.shortDefinition,
      categoryId: term.categoryId,
      categoryName: term.categoryName || 'Uncategorized',
      viewCount: totalViews,
      recentViews,
      velocityScore,
      engagementScore,
      trendDirection,
      percentageChange,
      averageTimeSpent: timeSpent,
      shareCount: shares,
      bookmarkCount: bookmarks
    };
  });

  // Filter and sort by trend type
  let filteredTerms = trendingTerms;
  
  switch (trendType) {
    case 'velocity':
      filteredTerms = trendingTerms
        .filter(term => term.velocityScore > 0)
        .sort((a, b) => b.velocityScore - a.velocityScore);
      break;
    
    case 'engagement':
      filteredTerms = trendingTerms
        .filter(term => term.engagementScore > 10)
        .sort((a, b) => b.engagementScore - a.engagementScore);
      break;
    
    case 'emerging':
      filteredTerms = trendingTerms
        .filter(term => term.viewCount < 100 && term.recentViews > 5)
        .sort((a, b) => b.percentageChange - a.percentageChange);
      break;
    
    case 'popular':
      filteredTerms = trendingTerms
        .sort((a, b) => b.recentViews - a.recentViews);
      break;
  }

  return filteredTerms.slice(0, limit);
}

/**
 * Get trending analytics summary
 */
async function getTrendingAnalytics(timeRange: string): Promise<TrendingAnalytics> {
  const now = new Date();
  const timeRangeHours = {
    hour: 1,
    day: 24,
    week: 168,
    month: 720
  }[timeRange as keyof typeof timeRangeHours] || 24;
  
  const startTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);

  // Get total trending terms (terms with recent activity)
  const totalTrendingResult = await db
    .select({ count: count() })
    .from(userInteractions)
    .where(
      and(
        eq(userInteractions.interactionType, 'view'),
        gte(userInteractions.timestamp, startTime)
      )
    );

  // Get top trending categories
  const topCategoriesResult = await db
    .select({
      categoryId: terms.categoryId,
      categoryName: categories.name,
      trendingCount: count()
    })
    .from(userInteractions)
    .leftJoin(terms, eq(userInteractions.termId, terms.id))
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(
      and(
        eq(userInteractions.interactionType, 'view'),
        gte(userInteractions.timestamp, startTime)
      )
    )
    .groupBy(terms.categoryId, categories.name)
    .orderBy(desc(count()))
    .limit(5);

  return {
    totalTrendingTerms: totalTrendingResult[0]?.count || 0,
    averageVelocityScore: 0, // Calculate if needed
    topCategories: topCategoriesResult.map(cat => ({
      categoryId: cat.categoryId || '',
      name: cat.categoryName || 'Uncategorized',
      trendingCount: cat.trendingCount
    })),
    trendingChangeFromPrevious: 0 // Calculate if needed
  };
}

export function registerTrendingRoutes(app: Express): void {

  /**
   * Get trending terms
   * GET /api/trending/terms?timeRange=day&category=&trendType=velocity&limit=20&offset=0
   */
  app.get('/api/trending/terms', async (req: Request, res: Response) => {
    try {
      const {
        timeRange = 'day',
        category,
        trendType = 'popular',
        limit = '20',
        offset = '0'
      } = req.query;

      const filters: TrendingFilters = {
        timeRange: timeRange as TrendingFilters['timeRange'],
        category: category as string,
        trendType: trendType as TrendingFilters['trendType'],
        limit: Math.min(parseInt(limit as string), 100),
        offset: parseInt(offset as string)
      };

      const trendingTerms = await getTrendingTerms(filters);
      
      res.json({
        success: true,
        data: trendingTerms,
        filters,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: trendingTerms.length
        }
      });

    } catch (error) {
      console.error('Get trending terms error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Get trending analytics
   * GET /api/trending/analytics?timeRange=day
   */
  app.get('/api/trending/analytics', async (req: Request, res: Response) => {
    try {
      const { timeRange = 'day' } = req.query;
      
      const analytics = await getTrendingAnalytics(timeRange as string);
      
      res.json({
        success: true,
        data: analytics,
        timeRange
      });

    } catch (error) {
      console.error('Get trending analytics error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Get trending categories
   * GET /api/trending/categories?timeRange=day&limit=10
   */
  app.get('/api/trending/categories', async (req: Request, res: Response) => {
    try {
      const { timeRange = 'day', limit = '10' } = req.query;
      
      const timeRangeHours = {
        hour: 1,
        day: 24,
        week: 168,
        month: 720
      }[timeRange as keyof typeof timeRangeHours] || 24;
      
      const now = new Date();
      const startTime = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);

      const trendingCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          viewCount: count(userInteractions.id),
          uniqueTermsViewed: sql<number>`COUNT(DISTINCT ${userInteractions.termId})`,
          averageEngagement: avg(userInteractions.duration)
        })
        .from(categories)
        .leftJoin(terms, eq(categories.id, terms.categoryId))
        .leftJoin(userInteractions, 
          and(
            eq(terms.id, userInteractions.termId),
            eq(userInteractions.interactionType, 'view'),
            gte(userInteractions.timestamp, startTime)
          )
        )
        .groupBy(categories.id, categories.name, categories.description)
        .having(sql`COUNT(${userInteractions.id}) > 0`)
        .orderBy(desc(count(userInteractions.id)))
        .limit(parseInt(limit as string));

      res.json({
        success: true,
        data: trendingCategories,
        timeRange
      });

    } catch (error) {
      console.error('Get trending categories error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });

  /**
   * Record trending interaction (for analytics)
   * POST /api/trending/interaction
   */
  app.post('/api/trending/interaction', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { termId, interactionType, duration, metadata } = req.body;

      if (!termId || !interactionType) {
        return sendErrorResponse(res, ErrorCode.VALIDATION_ERROR, 'Term ID and interaction type are required');
      }

      // Record the interaction
      await db.insert(userInteractions).values({
        userId: user?.id || 'anonymous',
        termId,
        interactionType,
        duration: duration || null,
        metadata: metadata || {},
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Interaction recorded successfully'
      });

    } catch (error) {
      console.error('Record trending interaction error:', error);
      const dbError = handleDatabaseError(error);
      sendErrorResponse(res, dbError.code, dbError.message, dbError.details);
    }
  });
}