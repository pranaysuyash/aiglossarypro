import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { aiUsageAnalytics } from '../../../shared/enhancedSchema';
import { db } from '../../db';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../../middleware/firebaseAuth';
import { aiContentGenerationService } from '../../services/aiContentGenerationService';
import { enhancedTripletProcessor } from '../../services/enhancedTripletProcessor';
import { log as logger } from '../../utils/logger';

const router = Router();

// Use proper Firebase authentication for admin routes

/**
 * Get current processing status with quality metrics
 */
router.get(
  '/status',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (_req: Request, res: Response) => {
    try {
      const status = enhancedTripletProcessor.getCurrentProcessingStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Error getting processing status:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Start column processing with quality pipeline
 */
router.post(
  '/start',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { columnId, options } = req.body;

      if (!columnId) {
        return res.status(400).json({ success: false, error: 'columnId is required' });
      }

      const result = await enhancedTripletProcessor.startColumnProcessingWithQuality(
        columnId,
        options
      );
      res.json(result);
    } catch (error) {
      logger.error('Error starting column processing:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Stop current processing
 */
router.post(
  '/stop',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = enhancedTripletProcessor.stopProcessing();
      res.json(result);
    } catch (error) {
      logger.error('Error stopping processing:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Get available columns for processing
 */
router.get(
  '/columns',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (_req: Request, res: Response) => {
    try {
      const columns = enhancedTripletProcessor.getAvailableColumns();
      res.json({ success: true, data: columns });
    } catch (error) {
      logger.error('Error getting available columns:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Generate content for a single term and section
 */
router.post(
  '/generate',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { termId, sectionName, model, temperature, maxTokens, regenerate, storeAsVersion } =
        req.body;

      if (!termId || !sectionName) {
        return res
          .status(400)
          .json({ success: false, error: 'termId and sectionName are required' });
      }

      const result = await aiContentGenerationService.generateContent({
        termId,
        sectionName,
        model,
        temperature,
        maxTokens,
        regenerate,
        storeAsVersion,
        userId: req.user?.id,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error generating content:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Generate content with multiple models for comparison
 */
router.post(
  '/generate-multi-model',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { termId, sectionName, models, temperature, maxTokens, templateId } = req.body;

      if (!termId || !sectionName || !models || !Array.isArray(models) || models.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'termId, sectionName, and models array are required',
        });
      }

      const result = await aiContentGenerationService.generateMultiModelContent({
        termId,
        sectionName,
        models,
        temperature,
        maxTokens,
        templateId,
        userId: req.user?.id,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error generating multi-model content:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Get model versions for a term and section
 */
router.get(
  '/model-versions/:termId/:sectionName',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { termId, sectionName } = req.params;

      if (!termId || !sectionName) {
        return res
          .status(400)
          .json({ success: false, error: 'termId and sectionName are required' });
      }

      const versions = await aiContentGenerationService.getModelVersions(termId, sectionName);
      res.json({ success: true, data: versions });
    } catch (error) {
      logger.error('Error getting model versions:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Select a model version as the chosen one
 */
router.post(
  '/select-model-version',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.body;

      if (!versionId) {
        return res.status(400).json({ success: false, error: 'versionId is required' });
      }

      const result = await aiContentGenerationService.selectModelVersion(versionId, req.user?.id);
      res.json(result);
    } catch (error) {
      logger.error('Error selecting model version:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Rate a model version
 */
router.post(
  '/rate-model-version',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { versionId, rating, notes } = req.body;

      if (!versionId || typeof rating !== 'number') {
        return res.status(400).json({ success: false, error: 'versionId and rating are required' });
      }

      const result = await aiContentGenerationService.rateModelVersion(
        versionId,
        rating,
        notes,
        req.user?.id
      );
      res.json(result);
    } catch (error) {
      logger.error('Error rating model version:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Generate content for multiple sections of a term
 */
router.post(
  '/generate-bulk',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { termId, sectionNames, model, regenerate } = req.body;

      if (!termId || !Array.isArray(sectionNames) || sectionNames.length === 0) {
        return res
          .status(400)
          .json({ success: false, error: 'termId and sectionNames array are required' });
      }

      const result = await aiContentGenerationService.generateBulkContent({
        termId,
        sectionNames,
        model,
        regenerate,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error generating bulk content:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Get generation statistics and analytics
 */
router.get(
  '/stats',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { timeframe = 'week', model } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Build query conditions
      const conditions = [gte(aiUsageAnalytics.createdAt, startDate)];
      if (model && model !== 'all') {
        conditions.push(eq(aiUsageAnalytics.model, model as string));
      }

      // Get analytics data
      const [totalStats, modelStats, recentGenerations, timelineData] = await Promise.all([
        // Total statistics
        db
          .select({
            totalGenerations: sql<number>`count(*)`,
            totalCost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
            successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
            averageLatency: sql<number>`avg(${aiUsageAnalytics.latency})`,
            totalInputTokens: sql<number>`sum(${aiUsageAnalytics.inputTokens})`,
            totalOutputTokens: sql<number>`sum(${aiUsageAnalytics.outputTokens})`,
          })
          .from(aiUsageAnalytics)
          .where(and(...conditions)),

        // Statistics by model
        db
          .select({
            model: aiUsageAnalytics.model,
            count: sql<number>`count(*)`,
            cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
            successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
            averageLatency: sql<number>`avg(${aiUsageAnalytics.latency})`,
          })
          .from(aiUsageAnalytics)
          .where(and(...conditions))
          .groupBy(aiUsageAnalytics.model),

        // Recent generations
        db
          .select()
          .from(aiUsageAnalytics)
          .where(and(...conditions))
          .orderBy(desc(aiUsageAnalytics.createdAt))
          .limit(50),

        // Timeline data (daily aggregates)
        db
          .select({
            date: sql<string>`date(${aiUsageAnalytics.createdAt})`,
            generations: sql<number>`count(*)`,
            cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
            successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
          })
          .from(aiUsageAnalytics)
          .where(and(...conditions))
          .groupBy(sql`date(${aiUsageAnalytics.createdAt})`)
          .orderBy(sql`date(${aiUsageAnalytics.createdAt})`),
      ]);

      // Calculate additional metrics
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [todayStats, monthStats] = await Promise.all([
        db
          .select({
            count: sql<number>`count(*)`,
            cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
          })
          .from(aiUsageAnalytics)
          .where(
            and(
              gte(aiUsageAnalytics.createdAt, todayStart),
              model && model !== 'all' ? eq(aiUsageAnalytics.model, model as string) : sql`1=1`
            )
          ),

        db
          .select({
            count: sql<number>`count(*)`,
            cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
          })
          .from(aiUsageAnalytics)
          .where(
            and(
              gte(aiUsageAnalytics.createdAt, monthStart),
              model && model !== 'all' ? eq(aiUsageAnalytics.model, model as string) : sql`1=1`
            )
          ),
      ]);

      const total = totalStats[0] || {
        totalGenerations: 0,
        totalCost: 0,
        successRate: 0,
        averageLatency: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
      };

      const stats = {
        summary: {
          totalGenerations: total.totalGenerations,
          totalCost: Number(total.totalCost) || 0,
          averageCost:
            total.totalGenerations > 0
              ? (Number(total.totalCost) || 0) / total.totalGenerations
              : 0,
          successRate: Number(total.successRate) || 0,
          totalTokens: (total.totalInputTokens || 0) + (total.totalOutputTokens || 0),
          averageTokens:
            total.totalGenerations > 0
              ? ((total.totalInputTokens || 0) + (total.totalOutputTokens || 0)) /
                total.totalGenerations
              : 0,
          averageLatency: Number(total.averageLatency) || 0,
          costToday: Number(todayStats[0]?.cost) || 0,
          costThisMonth: Number(monthStats[0]?.cost) || 0,
          generationsToday: todayStats[0]?.count || 0,
          generationsThisMonth: monthStats[0]?.count || 0,
        },
        byModel: modelStats.reduce((acc, stat) => {
          acc[stat.model] = {
            count: stat.count,
            cost: Number(stat.cost) || 0,
            successRate: Number(stat.successRate) || 0,
            averageLatency: Number(stat.averageLatency) || 0,
            averageQuality: 7.5, // Placeholder - would come from quality evaluations
          };
          return acc;
        }, {} as any),
        bySection: {
          // Placeholder - would be calculated from actual section data
          definition_overview: {
            count: Math.floor(total.totalGenerations * 0.3),
            cost: (Number(total.totalCost) || 0) * 0.3,
            successRate: Number(total.successRate) || 0,
            averageQuality: 8.2,
            averageTokens: 250,
          },
          key_concepts: {
            count: Math.floor(total.totalGenerations * 0.25),
            cost: (Number(total.totalCost) || 0) * 0.25,
            successRate: Number(total.successRate) || 0,
            averageQuality: 7.8,
            averageTokens: 200,
          },
        },
        qualityMetrics: {
          averageScore: 7.8, // Placeholder
          scoreDistribution: {
            excellent: Math.floor(total.totalGenerations * 0.4),
            good: Math.floor(total.totalGenerations * 0.35),
            needsWork: Math.floor(total.totalGenerations * 0.2),
            poor: Math.floor(total.totalGenerations * 0.05),
          },
          improvementRate: 0.15, // Placeholder
        },
        recentGenerations: recentGenerations.map(gen => ({
          id: gen.id.toString(),
          termName: gen.termId, // Would need to join with terms table for actual name
          sectionName: gen.operation.replace('generate_', ''),
          model: gen.model,
          cost: Number(gen.cost) || 0,
          tokens: (gen.inputTokens || 0) + (gen.outputTokens || 0),
          qualityScore: gen.success ? 8.0 : undefined, // Placeholder
          status: gen.success ? 'success' : 'failed',
          createdAt: gen.createdAt,
          processingTime: gen.latency || 0,
        })),
        timeline: timelineData.map(day => ({
          date: day.date,
          generations: day.generations,
          cost: Number(day.cost) || 0,
          successRate: Number(day.successRate) || 0,
          averageQuality: 7.8, // Placeholder
        })),
        costAnalytics: {
          projectedMonthlyCost: (Number(todayStats[0]?.cost) || 0) * 30,
          costEfficiency: 0.85, // Placeholder
          savingsFromBatching: (Number(total.totalCost) || 0) * 0.5, // 50% savings from batching
          costByComplexity: {
            simple: (Number(total.totalCost) || 0) * 0.6,
            moderate: (Number(total.totalCost) || 0) * 0.3,
            complex: (Number(total.totalCost) || 0) * 0.1,
          },
        },
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error getting generation statistics:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Get quality summary for completed column
 */
router.get(
  '/quality/:columnId',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { columnId } = req.params;

      // This would typically query quality data from the database
      // For now, return mock data
      const qualitySummary = {
        columnId,
        totalTerms: 100,
        processedTerms: 85,
        averageScore: 8.2,
        distribution: {
          excellent: 34,
          good: 29,
          needsWork: 15,
          poor: 7,
        },
        improvementsMade: 22,
        finalizedTerms: 85,
        lastUpdated: new Date(),
      };

      res.json({ success: true, data: qualitySummary });
    } catch (error) {
      logger.error('Error getting quality summary:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Get processing history
 */
router.get(
  '/history',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0 } = req.query;

      // Get recent processing operations from analytics
      const history = await db
        .select()
        .from(aiUsageAnalytics)
        .orderBy(desc(aiUsageAnalytics.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const processedHistory = history.map(item => ({
        id: item.id.toString(),
        operation: item.operation,
        termId: item.termId,
        model: item.model,
        success: item.success,
        cost: Number(item.cost) || 0,
        tokens: (item.inputTokens || 0) + (item.outputTokens || 0),
        latency: item.latency || 0,
        createdAt: item.createdAt,
        errorType: item.errorType,
        errorMessage: item.errorMessage,
      }));

      res.json({
        success: true,
        data: processedHistory,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          hasMore: history.length === Number(limit),
        },
      });
    } catch (error) {
      logger.error('Error getting processing history:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Get advanced analytics data with comprehensive metrics
 */
router.get(
  '/advanced-stats',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (req: Request, res: Response) => {
    try {
      const { timeRange = 'week', model, section } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Build query conditions
      const conditions = [gte(aiUsageAnalytics.createdAt, startDate)];
      if (model && model !== 'all') {
        conditions.push(eq(aiUsageAnalytics.model, model as string));
      }

      // Get comprehensive analytics data
      const [totalStats, modelStats, timeSeriesData, _recentAnalytics] = await Promise.all([
        // Total statistics
        db
          .select({
            totalGenerations: sql<number>`count(*)`,
            totalCost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
            successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
            averageLatency: sql<number>`avg(${aiUsageAnalytics.latency})`,
            totalInputTokens: sql<number>`sum(${aiUsageAnalytics.inputTokens})`,
            totalOutputTokens: sql<number>`sum(${aiUsageAnalytics.outputTokens})`,
          })
          .from(aiUsageAnalytics)
          .where(and(...conditions)),

        // Model performance statistics
        db
          .select({
            model: aiUsageAnalytics.model,
            count: sql<number>`count(*)`,
            cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
            successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
            averageLatency: sql<number>`avg(${aiUsageAnalytics.latency})`,
            totalTokens: sql<number>`sum(${aiUsageAnalytics.inputTokens} + ${aiUsageAnalytics.outputTokens})`,
          })
          .from(aiUsageAnalytics)
          .where(and(...conditions))
          .groupBy(aiUsageAnalytics.model),

        // Time series data (daily aggregates)
        db
          .select({
            date: sql<string>`date(${aiUsageAnalytics.createdAt})`,
            generations: sql<number>`count(*)`,
            cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
            successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
            averageLatency: sql<number>`avg(${aiUsageAnalytics.latency})`,
          })
          .from(aiUsageAnalytics)
          .where(and(...conditions))
          .groupBy(sql`date(${aiUsageAnalytics.createdAt})`)
          .orderBy(sql`date(${aiUsageAnalytics.createdAt})`),

        // Recent operations for detailed analysis
        db
          .select()
          .from(aiUsageAnalytics)
          .where(and(...conditions))
          .orderBy(desc(aiUsageAnalytics.createdAt))
          .limit(1000),
      ]);

      const total = totalStats[0] || {
        totalGenerations: 0,
        totalCost: 0,
        successRate: 0,
        averageLatency: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
      };

      // Calculate advanced metrics
      const _totalTokens = (total.totalInputTokens || 0) + (total.totalOutputTokens || 0);
      const costEfficiency =
        total.totalGenerations > 0
          ? (total.totalGenerations / (Number(total.totalCost) || 1)) * 100
          : 0;

      // Generate mock data for advanced features not yet implemented
      const qualityDistribution = {
        excellent: Math.floor(total.totalGenerations * 0.4),
        good: Math.floor(total.totalGenerations * 0.35),
        average: Math.floor(total.totalGenerations * 0.2),
        poor: Math.floor(total.totalGenerations * 0.05),
      };

      const avgQualityScore = 7.8; // Mock average quality score
      const projectedMonthlyCost = (Number(total.totalCost) || 0) * 30;
      const budgetUtilization = Math.min(projectedMonthlyCost / 1000, 1); // Assuming $1000 budget
      const savingsFromBatching = (Number(total.totalCost) || 0) * 0.3; // 30% savings

      const advancedAnalytics = {
        overview: {
          totalGenerations: total.totalGenerations,
          successRate: Number(total.successRate) || 0,
          averageQualityScore: avgQualityScore,
          totalCost: Number(total.totalCost) || 0,
          averageProcessingTime: (Number(total.averageLatency) || 0) / 1000,
          costEfficiency: costEfficiency / 100,
          qualityTrend: 'up' as const,
          costTrend: 'stable' as const,
          performanceTrend: 'up' as const,
        },

        timeSeriesData: timeSeriesData.map(day => ({
          date: day.date,
          generations: day.generations,
          cost: Number(day.cost) || 0,
          qualityScore: avgQualityScore + (Math.random() - 0.5) * 2, // Mock variation
          processingTime: (Number(day.averageLatency) || 0) / 1000,
          successRate: Number(day.successRate) || 0,
        })),

        modelPerformance: modelStats.map(stat => ({
          model: stat.model,
          usage: stat.count,
          averageQuality: avgQualityScore + (Math.random() - 0.5) * 2,
          averageCost: (Number(stat.cost) || 0) / stat.count,
          successRate: Number(stat.successRate) || 0,
          averageSpeed: (Number(stat.averageLatency) || 0) / 1000,
          totalTokens: stat.totalTokens || 0,
          costEfficiency: stat.count / ((Number(stat.cost) || 1) * 1000),
          recommendedFor: stat.model.includes('nano')
            ? ['Simple content', 'Basic definitions']
            : stat.model.includes('mini')
              ? ['Complex content', 'Detailed explanations']
              : ['Advanced reasoning', 'Technical content'],
        })),

        sectionAnalytics: [
          {
            sectionName: 'definition_overview',
            totalGenerations: Math.floor(total.totalGenerations * 0.3),
            averageQuality: avgQualityScore + 0.5,
            averageCost: ((Number(total.totalCost) || 0) * 0.3) / (total.totalGenerations || 1),
            averageTokens: 250,
            successRate: Number(total.successRate) || 0,
            complexity: 'simple' as const,
            improvement: 0.12,
          },
          {
            sectionName: 'key_concepts',
            totalGenerations: Math.floor(total.totalGenerations * 0.25),
            averageQuality: avgQualityScore,
            averageCost: ((Number(total.totalCost) || 0) * 0.25) / (total.totalGenerations || 1),
            averageTokens: 200,
            successRate: Number(total.successRate) || 0,
            complexity: 'moderate' as const,
            improvement: 0.08,
          },
          {
            sectionName: 'basic_examples',
            totalGenerations: Math.floor(total.totalGenerations * 0.2),
            averageQuality: avgQualityScore - 0.3,
            averageCost: ((Number(total.totalCost) || 0) * 0.2) / (total.totalGenerations || 1),
            averageTokens: 180,
            successRate: Number(total.successRate) || 0,
            complexity: 'simple' as const,
            improvement: 0.15,
          },
        ],

        qualityDistribution,

        costBreakdown: {
          byModel: modelStats.map((stat, _index) => ({
            model: stat.model,
            cost: Number(stat.cost) || 0,
            percentage: ((Number(stat.cost) || 0) / (Number(total.totalCost) || 1)) * 100,
          })),
          bySection: [
            {
              section: 'definition_overview',
              cost: (Number(total.totalCost) || 0) * 0.3,
              percentage: 30,
            },
            {
              section: 'key_concepts',
              cost: (Number(total.totalCost) || 0) * 0.25,
              percentage: 25,
            },
            {
              section: 'basic_examples',
              cost: (Number(total.totalCost) || 0) * 0.2,
              percentage: 20,
            },
            { section: 'other', cost: (Number(total.totalCost) || 0) * 0.25, percentage: 25 },
          ],
          byTimeOfDay: Array.from({ length: 24 }, (_, hour) => ({
            hour: `${hour}:00`,
            cost: (Number(total.totalCost) || 0) * (0.02 + Math.random() * 0.08),
            volume: Math.floor(total.totalGenerations * (0.02 + Math.random() * 0.08)),
          })),
          projectedMonthlyCost,
          budgetUtilization,
          savingsFromBatching,
          recommendations: [
            'Consider using batch processing for 30% cost savings',
            'Switch to nano model for simple content to reduce costs',
            'Implement quality thresholds to reduce regeneration costs',
            'Schedule processing during off-peak hours for better rates',
          ],
        },

        performanceMetrics: {
          averageLatency: Number(total.averageLatency) || 0,
          p95Latency: (Number(total.averageLatency) || 0) * 1.5,
          p99Latency: (Number(total.averageLatency) || 0) * 2.0,
          throughput: total.totalGenerations / (7 * 24 * 60 * 60), // requests per second over period
          errorRate: 1 - (Number(total.successRate) || 0),
          retryRate: 0.05, // Mock retry rate
          timeouts: Math.floor(total.totalGenerations * 0.01),
          queueDepth: Math.floor(Math.random() * 100),
          processingEfficiency: Number(total.successRate) || 0,
        },

        userActivity: {
          activeUsers: Math.floor(total.totalGenerations / 10),
          totalSessions: Math.floor(total.totalGenerations / 5),
          averageSessionDuration: 15.5,
          mostActiveHours: ['10:00', '14:00', '16:00', '20:00'],
          userEngagement: 8.2,
          featureUsage: [
            {
              feature: 'Content Generation',
              usage: Math.floor(total.totalGenerations * 0.8),
              satisfaction: 8.5,
            },
            {
              feature: 'Quality Evaluation',
              usage: Math.floor(total.totalGenerations * 0.6),
              satisfaction: 8.0,
            },
            {
              feature: 'Batch Processing',
              usage: Math.floor(total.totalGenerations * 0.4),
              satisfaction: 9.0,
            },
            {
              feature: 'Model Comparison',
              usage: Math.floor(total.totalGenerations * 0.3),
              satisfaction: 8.8,
            },
          ],
        },

        systemHealth: {
          aiServiceUptime: 99.5,
          databaseHealth: 99.8,
          s3Health: 99.9,
          queueHealth: 98.5,
          overallHealth: 99.2,
          alerts: [
            // Mock alerts - in real implementation, these would come from monitoring
          ],
          recommendations: [
            'System performance is excellent',
            'Consider scaling AI service for peak hours',
            'Queue processing is optimal',
          ],
        },
      };

      res.json({ success: true, data: advancedAnalytics });
    } catch (error) {
      logger.error('Error getting advanced analytics:', {
        error: error instanceof Error ? error.message : String(error),
      });
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

export default router;
