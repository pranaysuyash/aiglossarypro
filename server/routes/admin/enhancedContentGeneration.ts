import { Router } from 'express';
import { enhancedTripletProcessor } from '../../services/enhancedTripletProcessor';
import { aiContentGenerationService } from '../../services/aiContentGenerationService';
import { requireAdmin, authenticateToken } from '../../middleware/adminAuth';
import { mockIsAuthenticated, mockAuthenticateToken } from '../../middleware/dev/mockAuth';
import { log as logger } from '../../utils/logger';
import { db } from '../../db';
import { aiUsageAnalytics } from '../../../shared/enhancedSchema';
import { desc, eq, and, gte, sql } from 'drizzle-orm';

const router = Router();

// Use development auth for now
const authMiddleware = mockIsAuthenticated;
const tokenMiddleware = mockAuthenticateToken;

/**
 * Get current processing status with quality metrics
 */
router.get('/status', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const status = enhancedTripletProcessor.getCurrentProcessingStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error getting processing status:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Start column processing with quality pipeline
 */
router.post('/start', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { columnId, options } = req.body;
    
    if (!columnId) {
      return res.status(400).json({ success: false, error: 'columnId is required' });
    }

    const result = await enhancedTripletProcessor.startColumnProcessingWithQuality(columnId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error starting column processing:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Stop current processing
 */
router.post('/stop', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const result = enhancedTripletProcessor.stopProcessing();
    res.json(result);
  } catch (error) {
    logger.error('Error stopping processing:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get available columns for processing
 */
router.get('/columns', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const columns = enhancedTripletProcessor.getAvailableColumns();
    res.json({ success: true, data: columns });
  } catch (error) {
    logger.error('Error getting available columns:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Generate content for a single term and section
 */
router.post('/generate', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { termId, sectionName, model, temperature, maxTokens, regenerate, storeAsVersion } = req.body;
    
    if (!termId || !sectionName) {
      return res.status(400).json({ success: false, error: 'termId and sectionName are required' });
    }

    const result = await aiContentGenerationService.generateContent({
      termId,
      sectionName,
      model,
      temperature,
      maxTokens,
      regenerate,
      storeAsVersion,
      userId: req.user?.id
    });

    res.json(result);
  } catch (error) {
    logger.error('Error generating content:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Generate content with multiple models for comparison
 */
router.post('/generate-multi-model', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { termId, sectionName, models, temperature, maxTokens, templateId } = req.body;
    
    if (!termId || !sectionName || !models || !Array.isArray(models) || models.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'termId, sectionName, and models array are required' 
      });
    }

    const result = await aiContentGenerationService.generateMultiModelContent({
      termId,
      sectionName,
      models,
      temperature,
      maxTokens,
      templateId,
      userId: req.user?.id
    });

    res.json(result);
  } catch (error) {
    logger.error('Error generating multi-model content:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get model versions for a term and section
 */
router.get('/model-versions/:termId/:sectionName', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { termId, sectionName } = req.params;
    
    if (!termId || !sectionName) {
      return res.status(400).json({ success: false, error: 'termId and sectionName are required' });
    }

    const versions = await aiContentGenerationService.getModelVersions(termId, sectionName);
    res.json({ success: true, data: versions });
  } catch (error) {
    logger.error('Error getting model versions:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Select a model version as the chosen one
 */
router.post('/select-model-version', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { versionId } = req.body;
    
    if (!versionId) {
      return res.status(400).json({ success: false, error: 'versionId is required' });
    }

    const result = await aiContentGenerationService.selectModelVersion(versionId, req.user?.id);
    res.json(result);
  } catch (error) {
    logger.error('Error selecting model version:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Rate a model version
 */
router.post('/rate-model-version', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { versionId, rating, notes } = req.body;
    
    if (!versionId || typeof rating !== 'number') {
      return res.status(400).json({ success: false, error: 'versionId and rating are required' });
    }

    const result = await aiContentGenerationService.rateModelVersion(versionId, rating, notes, req.user?.id);
    res.json(result);
  } catch (error) {
    logger.error('Error rating model version:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Generate content for multiple sections of a term
 */
router.post('/generate-bulk', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { termId, sectionNames, model, regenerate } = req.body;
    
    if (!termId || !Array.isArray(sectionNames) || sectionNames.length === 0) {
      return res.status(400).json({ success: false, error: 'termId and sectionNames array are required' });
    }

    const result = await aiContentGenerationService.generateBulkContent({
      termId,
      sectionNames,
      model,
      regenerate
    });

    res.json(result);
  } catch (error) {
    logger.error('Error generating bulk content:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get generation statistics and analytics
 */
router.get('/stats', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
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
    const [
      totalStats,
      modelStats,
      recentGenerations,
      timelineData
    ] = await Promise.all([
      // Total statistics
      db.select({
        totalGenerations: sql<number>`count(*)`,
        totalCost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
        successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
        averageLatency: sql<number>`avg(${aiUsageAnalytics.latency})`,
        totalInputTokens: sql<number>`sum(${aiUsageAnalytics.inputTokens})`,
        totalOutputTokens: sql<number>`sum(${aiUsageAnalytics.outputTokens})`
      })
      .from(aiUsageAnalytics)
      .where(and(...conditions)),

      // Statistics by model
      db.select({
        model: aiUsageAnalytics.model,
        count: sql<number>`count(*)`,
        cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
        successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`,
        averageLatency: sql<number>`avg(${aiUsageAnalytics.latency})`
      })
      .from(aiUsageAnalytics)
      .where(and(...conditions))
      .groupBy(aiUsageAnalytics.model),

      // Recent generations
      db.select()
      .from(aiUsageAnalytics)
      .where(and(...conditions))
      .orderBy(desc(aiUsageAnalytics.createdAt))
      .limit(50),

      // Timeline data (daily aggregates)
      db.select({
        date: sql<string>`date(${aiUsageAnalytics.createdAt})`,
        generations: sql<number>`count(*)`,
        cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`,
        successRate: sql<number>`avg(case when ${aiUsageAnalytics.success} then 1.0 else 0.0 end)`
      })
      .from(aiUsageAnalytics)
      .where(and(...conditions))
      .groupBy(sql`date(${aiUsageAnalytics.createdAt})`)
      .orderBy(sql`date(${aiUsageAnalytics.createdAt})`)
    ]);

    // Calculate additional metrics
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayStats, monthStats] = await Promise.all([
      db.select({
        count: sql<number>`count(*)`,
        cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`
      })
      .from(aiUsageAnalytics)
      .where(and(
        gte(aiUsageAnalytics.createdAt, todayStart),
        model && model !== 'all' ? eq(aiUsageAnalytics.model, model as string) : sql`1=1`
      )),

      db.select({
        count: sql<number>`count(*)`,
        cost: sql<number>`sum(cast(${aiUsageAnalytics.cost} as decimal))`
      })
      .from(aiUsageAnalytics)
      .where(and(
        gte(aiUsageAnalytics.createdAt, monthStart),
        model && model !== 'all' ? eq(aiUsageAnalytics.model, model as string) : sql`1=1`
      ))
    ]);

    const total = totalStats[0] || {
      totalGenerations: 0,
      totalCost: 0,
      successRate: 0,
      averageLatency: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0
    };

    const stats = {
      summary: {
        totalGenerations: total.totalGenerations,
        totalCost: Number(total.totalCost) || 0,
        averageCost: total.totalGenerations > 0 ? (Number(total.totalCost) || 0) / total.totalGenerations : 0,
        successRate: Number(total.successRate) || 0,
        totalTokens: (total.totalInputTokens || 0) + (total.totalOutputTokens || 0),
        averageTokens: total.totalGenerations > 0 ? 
          ((total.totalInputTokens || 0) + (total.totalOutputTokens || 0)) / total.totalGenerations : 0,
        averageLatency: Number(total.averageLatency) || 0,
        costToday: Number(todayStats[0]?.cost) || 0,
        costThisMonth: Number(monthStats[0]?.cost) || 0,
        generationsToday: todayStats[0]?.count || 0,
        generationsThisMonth: monthStats[0]?.count || 0
      },
      byModel: modelStats.reduce((acc, stat) => {
        acc[stat.model] = {
          count: stat.count,
          cost: Number(stat.cost) || 0,
          successRate: Number(stat.successRate) || 0,
          averageLatency: Number(stat.averageLatency) || 0,
          averageQuality: 7.5 // Placeholder - would come from quality evaluations
        };
        return acc;
      }, {} as any),
      bySection: {
        // Placeholder - would be calculated from actual section data
        'definition_overview': {
          count: Math.floor(total.totalGenerations * 0.3),
          cost: (Number(total.totalCost) || 0) * 0.3,
          successRate: Number(total.successRate) || 0,
          averageQuality: 8.2,
          averageTokens: 250
        },
        'key_concepts': {
          count: Math.floor(total.totalGenerations * 0.25),
          cost: (Number(total.totalCost) || 0) * 0.25,
          successRate: Number(total.successRate) || 0,
          averageQuality: 7.8,
          averageTokens: 200
        }
      },
      qualityMetrics: {
        averageScore: 7.8, // Placeholder
        scoreDistribution: {
          excellent: Math.floor(total.totalGenerations * 0.4),
          good: Math.floor(total.totalGenerations * 0.35),
          needsWork: Math.floor(total.totalGenerations * 0.2),
          poor: Math.floor(total.totalGenerations * 0.05)
        },
        improvementRate: 0.15 // Placeholder
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
        processingTime: gen.latency || 0
      })),
      timeline: timelineData.map(day => ({
        date: day.date,
        generations: day.generations,
        cost: Number(day.cost) || 0,
        successRate: Number(day.successRate) || 0,
        averageQuality: 7.8 // Placeholder
      })),
      costAnalytics: {
        projectedMonthlyCost: (Number(todayStats[0]?.cost) || 0) * 30,
        costEfficiency: 0.85, // Placeholder
        savingsFromBatching: (Number(total.totalCost) || 0) * 0.5, // 50% savings from batching
        costByComplexity: {
          simple: (Number(total.totalCost) || 0) * 0.6,
          moderate: (Number(total.totalCost) || 0) * 0.3,
          complex: (Number(total.totalCost) || 0) * 0.1
        }
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting generation statistics:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get quality summary for completed column
 */
router.get('/quality/:columnId', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
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
        poor: 7
      },
      improvementsMade: 22,
      finalizedTerms: 85,
      lastUpdated: new Date()
    };

    res.json({ success: true, data: qualitySummary });
  } catch (error) {
    logger.error('Error getting quality summary:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get processing history
 */
router.get('/history', authMiddleware, tokenMiddleware, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Get recent processing operations from analytics
    const history = await db.select()
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
      errorMessage: item.errorMessage
    }));

    res.json({ 
      success: true, 
      data: processedHistory,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        hasMore: history.length === Number(limit)
      }
    });
  } catch (error) {
    logger.error('Error getting processing history:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;