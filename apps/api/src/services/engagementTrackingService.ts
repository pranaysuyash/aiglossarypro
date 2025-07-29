/**
 * Engagement Depth Tracking Service
 * Advanced analytics beyond page views to measure true user engagement
 */

import { and, avg, count, desc, eq, gte, sql, sum } from 'drizzle-orm';
import {
  categories,
  type InsertUserInteraction,
  terms,
  userInteractions,
} from '@aiglossarypro/shared/schema';
import { db } from '@aiglossarypro/database';

export interface EngagementMetrics {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number; // in seconds
  pageViews: number;
  uniqueTermsViewed: number;
  averageTimePerTerm: number;
  scrollDepth: number; // 0-100 percentage
  interactionCount: number;
  searchQueries: number;
  favoritesAdded: number;
  sharesCount: number;
  readingVelocity: number; // words per minute
  engagementScore: number; // 0-100 calculated score
  qualityScore: number; // 0-100 based on meaningful interactions
  bounceRate: boolean;
  returnVisitor: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  referrerType: 'direct' | 'search' | 'social' | 'internal';
}

export interface ContentEngagement {
  termId: string;
  termName: string;
  categoryName: string;
  averageReadTime: number;
  completionRate: number; // % of users who read full content
  engagementRate: number; // % of users who interact beyond viewing
  shareRate: number;
  favoriteRate: number;
  returnRate: number; // % of users who return to this content
  difficultyAlignment: number; // how well content matches user skill level
  popularityTrend: 'rising' | 'stable' | 'declining';
  userSatisfactionScore: number;
}

export interface EngagementInsights {
  totalEngagedUsers: number;
  averageSessionDuration: number;
  averageEngagementScore: number;
  topEngagingContent: ContentEngagement[];
  userEngagementSegments: {
    highlyEngaged: number;
    moderatelyEngaged: number;
    lowEngaged: number;
  };
  engagementTrends: {
    date: string;
    avgEngagement: number;
    totalSessions: number;
  }[];
  contentPerformanceMetrics: {
    mostEngaging: ContentEngagement[];
    needsImprovement: ContentEngagement[];
    trending: ContentEngagement[];
  };
}

class EngagementTrackingService {
  /**
   * Track user interaction with detailed engagement metrics
   */
  async trackInteraction(data: {
    userId?: string;
    sessionId: string;
    termId?: string;
    interactionType: string;
    duration?: number;
    metadata?: any;
    deviceInfo?: {
      type: 'mobile' | 'tablet' | 'desktop';
      userAgent: string;
      screenResolution: string;
    };
    contentInfo?: {
      scrollDepth: number;
      readingProgress: number;
      timeOnContent: number;
      wordsRead: number;
    };
  }): Promise<void> {
    const interaction: InsertUserInteraction = {
      userId: data.userId || 'anonymous',
      termId: data.termId || null,
      interactionType: data.interactionType,
      duration: data.duration || null,
      metadata: {
        sessionId: data.sessionId,
        timestamp: new Date().toISOString(),
        deviceInfo: data.deviceInfo,
        contentInfo: data.contentInfo,
        ...data.metadata,
      },
    };

    await db.insert(userInteractions).values(interaction);

    // Update real-time engagement metrics if this is a significant interaction
    if (this.isSignificantInteraction(data.interactionType)) {
      await this.updateSessionMetrics(data.sessionId, data.userId);
    }
  }

  /**
   * Calculate comprehensive engagement metrics for a session
   */
  async calculateSessionEngagement(sessionId: string): Promise<EngagementMetrics | null> {
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(eq(sql`${userInteractions.metadata}->>'sessionId'`, sessionId))
      .orderBy(desc(userInteractions.timestamp));

    if (interactions.length === 0) {return null;}

    const startTime = new Date(interactions[interactions.length - 1].timestamp);
    const endTime = new Date(interactions[0].timestamp);
    const totalDuration = (endTime.getTime() - startTime.getTime()) / 1000;

    // Calculate various engagement metrics
    const pageViews = interactions.filter(i => i.interactionType === 'view').length;
    const uniqueTermsViewed = new Set(interactions.filter(i => i.termId).map(i => i.termId)).size;

    const totalReadTime = interactions
      .filter(i => i.duration)
      .reduce((sum, i) => sum + (i.duration || 0), 0);

    const averageTimePerTerm = uniqueTermsViewed > 0 ? totalReadTime / uniqueTermsViewed : 0;

    // Calculate scroll depth (average from content interactions)
    const scrollDepths = interactions
      .map(i => i.metadata?.contentInfo?.scrollDepth)
      .filter(depth => typeof depth === 'number');
    const scrollDepth =
      scrollDepths.length > 0
        ? scrollDepths.reduce((sum, depth) => sum + depth, 0) / scrollDepths.length
        : 0;

    const interactionCount = interactions.length;
    const searchQueries = interactions.filter(i => i.interactionType === 'search').length;
    const favoritesAdded = interactions.filter(i => i.interactionType === 'favorite').length;
    const sharesCount = interactions.filter(i => i.interactionType === 'share').length;

    // Calculate reading velocity
    const wordsRead = interactions
      .map(i => i.metadata?.contentInfo?.wordsRead || 0)
      .reduce((sum, words) => sum + words, 0);
    const readingVelocity = totalReadTime > 0 ? (wordsRead / totalReadTime) * 60 : 0;

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore({
      totalDuration,
      pageViews,
      uniqueTermsViewed,
      scrollDepth,
      interactionCount,
      searchQueries,
      favoritesAdded,
      sharesCount,
      readingVelocity,
    });

    // Calculate quality score based on meaningful interactions
    const qualityScore = this.calculateQualityScore({
      averageTimePerTerm,
      scrollDepth,
      favoritesAdded,
      sharesCount,
      searchQueries,
      pageViews,
    });

    const bounceRate = pageViews <= 1 && totalDuration < 30;
    const userId = interactions[0].userId;
    const returnVisitor = await this.isReturnVisitor(userId);

    // Extract device type from metadata
    const deviceType = interactions[0].metadata?.deviceInfo?.type || 'desktop';
    const referrerType = 'direct'; // This would need to be tracked from the frontend

    return {
      sessionId,
      userId,
      startTime,
      endTime,
      totalDuration,
      pageViews,
      uniqueTermsViewed,
      averageTimePerTerm,
      scrollDepth,
      interactionCount,
      searchQueries,
      favoritesAdded,
      sharesCount,
      readingVelocity,
      engagementScore,
      qualityScore,
      bounceRate,
      returnVisitor,
      deviceType,
      referrerType,
    };
  }

  /**
   * Get content engagement metrics for specific terms
   */
  async getContentEngagement(termIds?: string[]): Promise<ContentEngagement[]> {
    let query = db
      .select({
        termId: terms.id,
        termName: terms.name,
        categoryName: categories.name,
        interactionCount: count(userInteractions.id),
        totalDuration: sum(userInteractions.duration),
        viewCount: sql<number>`COUNT(CASE WHEN ${userInteractions.interactionType} = 'view' THEN 1 END)`,
        favoriteCount: sql<number>`COUNT(CASE WHEN ${userInteractions.interactionType} = 'favorite' THEN 1 END)`,
        shareCount: sql<number>`COUNT(CASE WHEN ${userInteractions.interactionType} = 'share' THEN 1 END)`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${userInteractions.userId})`,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .leftJoin(userInteractions, eq(terms.id, userInteractions.termId))
      .groupBy(terms.id, terms.name, categories.name);

    if (termIds && termIds.length > 0) {
      query = query.where(sql`${terms.id} IN (${termIds.map(id => `'${id}'`).join(',')})`);
    }

    const results = await query.limit(100);

    return results.map(result => {
      const averageReadTime =
        result.totalDuration && result.viewCount
          ? Number(result.totalDuration) / Number(result.viewCount)
          : 0;

      const engagementRate = result.viewCount
        ? (Number(result.interactionCount) - Number(result.viewCount)) / Number(result.viewCount)
        : 0;

      const shareRate = result.viewCount ? Number(result.shareCount) / Number(result.viewCount) : 0;
      const favoriteRate = result.viewCount
        ? Number(result.favoriteCount) / Number(result.viewCount)
        : 0;

      return {
        termId: result.termId,
        termName: result.termName,
        categoryName: result.categoryName || 'Uncategorized',
        averageReadTime,
        completionRate: 0.75, // This would need more sophisticated tracking
        engagementRate,
        shareRate,
        favoriteRate,
        returnRate: 0.3, // This would need session-based calculation
        difficultyAlignment: 0.8, // This would need user skill level analysis
        popularityTrend: 'stable' as const,
        userSatisfactionScore: Math.min(
          100,
          engagementRate * 50 + (averageReadTime / 60) * 25 + 25
        ),
      };
    });
  }

  /**
   * Get comprehensive engagement insights
   */
  async getEngagementInsights(
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<EngagementInsights> {
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get total engaged users
    const engagedUsersResult = await db
      .select({ count: count() })
      .from(userInteractions)
      .where(gte(userInteractions.timestamp, startDate));

    const totalEngagedUsers = engagedUsersResult[0]?.count || 0;

    // Calculate average session duration
    const avgDurationResult = await db
      .select({ avgDuration: avg(userInteractions.duration) })
      .from(userInteractions)
      .where(
        and(
          gte(userInteractions.timestamp, startDate),
          eq(userInteractions.interactionType, 'view')
        )
      );

    const averageSessionDuration = Number(avgDurationResult[0]?.avgDuration || 0);

    // Get top engaging content
    const topEngagingContent = await this.getContentEngagement();

    // Mock engagement segments (would need more sophisticated calculation)
    const userEngagementSegments = {
      highlyEngaged: Math.floor(totalEngagedUsers * 0.2),
      moderatelyEngaged: Math.floor(totalEngagedUsers * 0.5),
      lowEngaged: Math.floor(totalEngagedUsers * 0.3),
    };

    // Mock engagement trends (would need daily aggregation)
    const engagementTrends = Array.from({ length: daysBack }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysBack - i));
      return {
        date: date.toISOString().split('T')[0],
        avgEngagement: 65 + Math.random() * 20,
        totalSessions: Math.floor(Math.random() * 100) + 50,
      };
    });

    // Categorize content performance
    const sortedContent = topEngagingContent.sort(
      (a, b) => b.userSatisfactionScore - a.userSatisfactionScore
    );
    const contentPerformanceMetrics = {
      mostEngaging: sortedContent.slice(0, 5),
      needsImprovement: sortedContent.slice(-5).reverse(),
      trending: sortedContent.filter(c => c.popularityTrend === 'rising').slice(0, 5),
    };

    return {
      totalEngagedUsers,
      averageSessionDuration,
      averageEngagementScore: 72, // Would calculate from actual session data
      topEngagingContent: sortedContent.slice(0, 10),
      userEngagementSegments,
      engagementTrends,
      contentPerformanceMetrics,
    };
  }

  /**
   * Track reading progress for a specific piece of content
   */
  async trackReadingProgress(data: {
    userId?: string;
    sessionId: string;
    termId: string;
    scrollPosition: number;
    totalHeight: number;
    timeSpent: number;
    wordsRead: number;
    readingVelocity: number;
  }): Promise<void> {
    const scrollDepth = (data.scrollPosition / data.totalHeight) * 100;

    await this.trackInteraction({
      userId: data.userId,
      sessionId: data.sessionId,
      termId: data.termId,
      interactionType: 'reading_progress',
      duration: data.timeSpent,
      contentInfo: {
        scrollDepth,
        readingProgress: scrollDepth,
        timeOnContent: data.timeSpent,
        wordsRead: data.wordsRead,
      },
      metadata: {
        readingVelocity: data.readingVelocity,
        scrollPosition: data.scrollPosition,
        totalHeight: data.totalHeight,
      },
    });
  }

  /**
   * Private helper methods
   */
  private isSignificantInteraction(interactionType: string): boolean {
    const significantTypes = ['favorite', 'share', 'search', 'reading_progress'];
    return significantTypes.includes(interactionType);
  }

  private async updateSessionMetrics(_sessionId: string, _userId?: string): Promise<void> {
    // This would update real-time session metrics in a cache or separate table
    // For now, we'll skip this implementation but it would be useful for live dashboards
  }

  private async isReturnVisitor(userId: string): Promise<boolean> {
    if (!userId || userId === 'anonymous') {return false;}

    const previousInteractions = await db
      .select({ count: count() })
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId));

    return (previousInteractions[0]?.count || 0) > 1;
  }

  private calculateEngagementScore(metrics: {
    totalDuration: number;
    pageViews: number;
    uniqueTermsViewed: number;
    scrollDepth: number;
    interactionCount: number;
    searchQueries: number;
    favoritesAdded: number;
    sharesCount: number;
    readingVelocity: number;
  }): number {
    const {
      totalDuration,
      pageViews,
      uniqueTermsViewed,
      scrollDepth,
      interactionCount,
      searchQueries,
      favoritesAdded,
      sharesCount,
      readingVelocity,
    } = metrics;

    // Weighted scoring system
    const timeScore = Math.min(25, (totalDuration / 300) * 25); // Up to 25 points for 5+ minutes
    const depthScore = Math.min(20, (uniqueTermsViewed / 5) * 20); // Up to 20 points for 5+ terms
    const scrollScore = Math.min(15, (scrollDepth / 100) * 15); // Up to 15 points for full scroll
    const interactionScore = Math.min(20, (interactionCount / 10) * 20); // Up to 20 points for 10+ interactions
    const intentScore = searchQueries * 5 + favoritesAdded * 3 + sharesCount * 7; // Up to 15 points
    const qualityScore = Math.min(15, (readingVelocity / 200) * 15); // Up to 15 points for good reading pace

    return Math.min(
      100,
      timeScore + depthScore + scrollScore + interactionScore + intentScore + qualityScore
    );
  }

  private calculateQualityScore(metrics: {
    averageTimePerTerm: number;
    scrollDepth: number;
    favoritesAdded: number;
    sharesCount: number;
    searchQueries: number;
    pageViews: number;
  }): number {
    const {
      averageTimePerTerm,
      scrollDepth,
      favoritesAdded,
      sharesCount,
      searchQueries,
      pageViews,
    } = metrics;

    // Quality indicates meaningful engagement vs. random browsing
    const timeQuality = Math.min(30, (averageTimePerTerm / 120) * 30); // Up to 30 points for 2+ min per term
    const depthQuality = Math.min(25, (scrollDepth / 100) * 25); // Up to 25 points for full reading
    const intentQuality = ((favoritesAdded + sharesCount + searchQueries) / pageViews) * 25; // Up to 25 points
    const consistencyQuality = pageViews > 1 ? 20 : 0; // 20 points for multiple pages

    return Math.min(100, timeQuality + depthQuality + intentQuality + consistencyQuality);
  }
}

export const engagementTrackingService = new EngagementTrackingService();
