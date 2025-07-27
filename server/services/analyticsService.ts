/**
 * Advanced Analytics Service with Comprehensive Usage Monitoring
 * Tracks user behavior, search queries, performance metrics, and system health
 */

import { sql } from 'drizzle-orm';
import { db } from '../db';
import { getLastNDaysRange } from '../utils/dateHelpers';

import logger from '../utils/logger';
export interface SearchAnalytics {
  query: string;
  results_count: number;
  timestamp: Date;
  user_ip?: string;
  response_time_ms: number;
}

export interface PageViewAnalytics {
  page: string;
  term_id?: string;
  timestamp: Date;
  user_ip?: string;
  referrer?: string;
  user_agent?: string;
  session_duration_ms?: number;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  response_time_ms: number;
  status_code: number;
  timestamp: Date;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
}

export interface UserInteractionAnalytics {
  action: 'search' | 'view_term' | 'favorite' | 'share' | 'feedback' | 'suggest_term';
  term_id?: string;
  query?: string;
  timestamp: Date;
  user_ip?: string;
  session_id?: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private searchQueries: SearchAnalytics[] = [];
  private pageViews: PageViewAnalytics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private userInteractions: UserInteractionAnalytics[] = [];
  private batchSize = 50;
  private flushInterval = 60000; // 1 minute

  constructor() {
    // Auto-flush analytics data periodically
    setInterval(() => this.flushAnalytics(), this.flushInterval);
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Track search queries and their performance
  async trackSearch(
    query: string,
    resultsCount: number,
    responseTimeMs: number,
    userIp?: string
  ): Promise<void> {
    try {
      const searchEvent: SearchAnalytics = {
        query: query.toLowerCase().trim(),
        results_count: resultsCount,
        timestamp: new Date(),
        user_ip: userIp,
        response_time_ms: responseTimeMs,
      };

      this.searchQueries.push(searchEvent);

      // Also track as user interaction
      await this.trackUserInteraction('search', undefined, query, userIp);

      // Flush if batch is full
      if (this.searchQueries.length >= this.batchSize) {
        await this.flushSearchAnalytics();
      }
    } catch (error) {
      logger.error('Failed to track search:', error);
    }
  }

  // Track page views and user engagement
  async trackPageView(
    page: string,
    termId?: string,
    userIp?: string,
    referrer?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const pageViewEvent: PageViewAnalytics = {
        page,
        term_id: termId,
        timestamp: new Date(),
        user_ip: userIp,
        referrer,
        user_agent: userAgent,
      };

      this.pageViews.push(pageViewEvent);

      // Also track as user interaction if viewing a term
      if (termId) {
        await this.trackUserInteraction('view_term', termId, undefined, userIp);
      }

      // Flush if batch is full
      if (this.pageViews.length >= this.batchSize) {
        await this.flushPageViewAnalytics();
      }
    } catch (error) {
      logger.error('Failed to track page view:', error);
    }
  }

  // Track API performance and system metrics
  async trackPerformance(
    endpoint: string,
    method: string,
    responseTimeMs: number,
    statusCode: number,
    memoryUsageMb?: number,
    cpuUsagePercent?: number
  ): Promise<void> {
    try {
      const performanceEvent: PerformanceMetrics = {
        endpoint,
        method,
        response_time_ms: responseTimeMs,
        status_code: statusCode,
        timestamp: new Date(),
        memory_usage_mb: memoryUsageMb,
        cpu_usage_percent: cpuUsagePercent,
      };

      this.performanceMetrics.push(performanceEvent);

      // Flush if batch is full
      if (this.performanceMetrics.length >= this.batchSize) {
        await this.flushPerformanceAnalytics();
      }
    } catch (error) {
      logger.error('Failed to track performance:', error);
    }
  }

  // Track user interactions for behavior analysis
  async trackUserInteraction(
    action: UserInteractionAnalytics['action'],
    termId?: string,
    query?: string,
    userIp?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      const interactionEvent: UserInteractionAnalytics = {
        action,
        term_id: termId,
        query,
        timestamp: new Date(),
        user_ip: userIp,
        session_id: sessionId,
      };

      this.userInteractions.push(interactionEvent);

      // Flush if batch is full
      if (this.userInteractions.length >= this.batchSize) {
        await this.flushUserInteractionAnalytics();
      }
    } catch (error) {
      logger.error('Failed to track user interaction:', error);
    }
  }

  // Get comprehensive analytics dashboard data
  async getDashboardData(timeframe: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<unknown> {
    try {
      const timeframeDays = {
        day: 1,
        week: 7,
        month: 30,
        year: 365,
      };

      const days = timeframeDays[timeframe];
      const { startDate } = getLastNDaysRange(days);

      // Get search analytics
      const searchStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_searches,
          COUNT(DISTINCT query) as unique_queries,
          AVG(results_count) as avg_results,
          AVG(response_time_ms) as avg_response_time
        FROM search_analytics 
        WHERE timestamp >= ${startDate}
      `);

      // Get most popular search terms
      const popularSearches = await db.execute(sql`
        SELECT query, COUNT(*) as search_count
        FROM search_analytics 
        WHERE timestamp >= ${startDate}
        GROUP BY query 
        ORDER BY search_count DESC 
        LIMIT 10
      `);

      // Get page view stats
      const pageViewStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT user_ip) as unique_visitors,
          COUNT(DISTINCT term_id) as terms_viewed
        FROM page_view_analytics 
        WHERE timestamp >= ${startDate}
      `);

      // Get most viewed terms
      const popularTerms = await db.execute(sql`
        SELECT t.name, t.id, COUNT(pva.term_id) as view_count
        FROM page_view_analytics pva
        JOIN terms t ON pva.term_id = t.id
        WHERE pva.timestamp >= ${startDate} AND pva.term_id IS NOT NULL
        GROUP BY t.id, t.name
        ORDER BY view_count DESC
        LIMIT 10
      `);

      // Get performance metrics
      const performanceStats = await db.execute(sql`
        SELECT 
          AVG(response_time_ms) as avg_response_time,
          MAX(response_time_ms) as max_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
          COUNT(*) as total_requests
        FROM performance_metrics 
        WHERE timestamp >= ${startDate}
      `);

      // Get user interaction patterns
      const interactionStats = await db.execute(sql`
        SELECT 
          action,
          COUNT(*) as count
        FROM user_interaction_analytics 
        WHERE timestamp >= ${startDate}
        GROUP BY action
        ORDER BY count DESC
      `);

      // Get traffic patterns by hour
      const trafficPattern = await db.execute(sql`
        SELECT 
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as requests
        FROM page_view_analytics 
        WHERE timestamp >= ${startDate}
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
      `);

      return {
        timeframe,
        search: {
          stats: searchStats.rows[0] || {},
          popular_queries: popularSearches.rows || [],
        },
        pageViews: {
          stats: pageViewStats.rows[0] || {},
          popular_terms: popularTerms.rows || [],
        },
        performance: performanceStats.rows[0] || {},
        interactions: interactionStats.rows || [],
        traffic_pattern: trafficPattern.rows || [],
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get dashboard data:', error);
      throw error;
    }
  }

  // Get search insights and failed queries
  async getSearchInsights(): Promise<unknown> {
    try {
      // Get queries with no results (potential content gaps)
      const noResultQueries = await db.execute(sql`
        SELECT query, COUNT(*) as search_count
        FROM search_analytics 
        WHERE results_count = 0
        GROUP BY query 
        ORDER BY search_count DESC 
        LIMIT 20
      `);

      // Get slow searches (potential performance issues)
      const slowSearches = await db.execute(sql`
        SELECT query, AVG(response_time_ms) as avg_response_time, COUNT(*) as search_count
        FROM search_analytics 
        WHERE response_time_ms > 1000
        GROUP BY query 
        ORDER BY avg_response_time DESC 
        LIMIT 20
      `);

      // Get search trends over time
      const searchTrends = await db.execute(sql`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as search_count,
          COUNT(DISTINCT query) as unique_queries
        FROM search_analytics 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `);

      return {
        no_result_queries: noResultQueries || [],
        slow_searches: slowSearches || [],
        search_trends: searchTrends || [],
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get search insights:', error);
      throw error;
    }
  }

  // Flush all analytics data to the database
  private async flushAnalytics(): Promise<void> {
    await Promise.all([
      this.flushSearchAnalytics(),
      this.flushPageViewAnalytics(),
      this.flushPerformanceAnalytics(),
      this.flushUserInteractionAnalytics(),
    ]);
  }

  private async flushSearchAnalytics(): Promise<void> {
    if (this.searchQueries.length === 0) {return;}

    try {
      const queries = [...this.searchQueries];
      this.searchQueries = [];

      

      // Batch insert search analytics
      for (const query of queries) {
        const userIp = query.user_ip ?? null;

        await db.execute(sql`
          INSERT INTO search_analytics (query, results_count, response_time_ms, user_ip)
          VALUES (${query.query}, ${query.results_count}, ${query.response_time_ms}, ${userIp})
        `);
      }
    } catch (error) {
      logger.error('Failed to flush search analytics:', error);
    }
  }

  private async flushPageViewAnalytics(): Promise<void> {
    if (this.pageViews.length === 0) {return;}

    try {
      const pageViews = [...this.pageViews];
      this.pageViews = [];

      

      // Batch insert page view analytics
      for (const view of pageViews) {
        const termId = view.term_id ?? null;
        const userIp = view.user_ip ?? null;
        const referrer = view.referrer ?? null;
        const userAgent = view.user_agent ?? null;
        const sessionDuration = view.session_duration_ms ?? null;

        await db.execute(sql`
          INSERT INTO page_view_analytics (page, term_id, user_ip, referrer, user_agent, session_duration_ms)
          VALUES (${view.page}, ${termId}, ${userIp}, ${referrer}, ${userAgent}, ${sessionDuration})
        `);
      }
    } catch (error) {
      logger.error('Failed to flush page view analytics:', error);
    }
  }

  private async flushPerformanceAnalytics(): Promise<void> {
    if (this.performanceMetrics.length === 0) {return;}

    try {
      const metrics = [...this.performanceMetrics];
      this.performanceMetrics = [];

      

      // Batch insert performance metrics
      for (const metric of metrics) {
        const memoryUsage = metric.memory_usage_mb ?? null;
        const cpuUsage = metric.cpu_usage_percent ?? null;

        await db.execute(sql`
          INSERT INTO performance_metrics (endpoint, method, response_time_ms, status_code, memory_usage_mb, cpu_usage_percent)
          VALUES (${metric.endpoint}, ${metric.method}, ${metric.response_time_ms}, ${metric.status_code}, ${memoryUsage}, ${cpuUsage})
        `);
      }
    } catch (error) {
      logger.error('Failed to flush performance metrics:', error);
    }
  }

  private async flushUserInteractionAnalytics(): Promise<void> {
    if (this.userInteractions.length === 0) {return;}

    try {
      const interactions = [...this.userInteractions];
      this.userInteractions = [];

      

      // Batch insert user interactions
      for (const interaction of interactions) {
        const termId = interaction.term_id ?? null;
        const query = interaction.query ?? null;
        const userIp = interaction.user_ip ?? null;
        const sessionId = interaction.session_id ?? null;

        await db.execute(sql`
          INSERT INTO user_interaction_analytics (action, term_id, query, user_ip, session_id)
          VALUES (${interaction.action}, ${termId}, ${query}, ${userIp}, ${sessionId})
        `);
      }
    } catch (error) {
      logger.error('Failed to flush user interaction analytics:', error);
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
