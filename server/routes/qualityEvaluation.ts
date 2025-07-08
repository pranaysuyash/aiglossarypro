import { Router } from 'express';
import { aiQualityEvaluationService } from '../services/aiQualityEvaluationService';
import { evaluationTemplateService } from '../services/evaluationTemplateService';
import { qualityAnalyticsService } from '../services/qualityAnalyticsService';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/adminAuth';
import { requireAdmin } from '../middleware/adminAuth';
import { z } from 'zod';
import { log as logger } from '../utils/logger';

const router = Router();

// Validation schemas
const evaluateContentSchema = z.object({
  termId: z.string().uuid(),
  sectionName: z.string().optional(),
  content: z.string().min(1),
  contentType: z.enum(['definition', 'example', 'tutorial', 'theory', 'application', 'general']),
  targetAudience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  referenceContent: z.string().optional(),
  model: z.string().optional()
});

const batchEvaluationSchema = z.object({
  evaluations: z.array(evaluateContentSchema),
  model: z.string().optional()
});

const qualityAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  termId: z.string().uuid().optional(),
  model: z.string().optional(),
  minScore: z.number().min(0).max(10).optional(),
  maxScore: z.number().min(0).max(10).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'model', 'contentType']).optional()
});

const compareContentSchema = z.object({
  content: z.string().min(1),
  reference: z.string().min(1),
  contentType: z.string()
});

const scheduleAuditSchema = z.object({
  schedule: z.enum(['daily', 'weekly', 'monthly']),
  emailRecipients: z.array(z.string().email()).optional(),
  slackWebhook: z.string().url().optional(),
  qualityThreshold: z.number().min(0).max(10).optional(),
  includeRecommendations: z.boolean().optional()
});

/**
 * @route POST /api/quality/evaluate
 * @desc Evaluate content quality using AI
 * @access Private
 */
router.post(
  '/evaluate',
  authenticateToken,
  validateRequest(evaluateContentSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const evaluationRequest = {
        ...req.body,
        userId
      };

      const result = await aiQualityEvaluationService.evaluateContent(evaluationRequest);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error evaluating content:', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      next(error);
    }
  }
);

/**
 * @route POST /api/quality/batch-evaluate
 * @desc Batch evaluate multiple content pieces
 * @access Private
 */
router.post(
  '/batch-evaluate',
  authenticateToken,
  validateRequest(batchEvaluationSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const batchRequest = {
        ...req.body,
        userId
      };

      const result = await aiQualityEvaluationService.batchEvaluate(batchRequest);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error in batch evaluation:', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/analytics
 * @desc Get quality analytics and reports
 * @access Private
 */
router.get(
  '/analytics',
  authenticateToken,
  async (req, res, next) => {
    try {
      const analyticsRequest = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        termId: req.query.termId as string | undefined,
        model: req.query.model as string | undefined,
        minScore: req.query.minScore ? Number(req.query.minScore) : undefined,
        maxScore: req.query.maxScore ? Number(req.query.maxScore) : undefined,
        groupBy: req.query.groupBy as any
      };

      const result = await aiQualityEvaluationService.getQualityAnalytics(analyticsRequest);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting quality analytics:', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      next(error);
    }
  }
);

/**
 * @route POST /api/quality/compare
 * @desc Compare content quality against reference
 * @access Private
 */
router.post(
  '/compare',
  authenticateToken,
  validateRequest(compareContentSchema),
  async (req, res, next) => {
    try {
      const { content, reference, contentType } = req.body;

      const result = await aiQualityEvaluationService.compareWithReference(
        content,
        reference,
        contentType
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error comparing content:', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/templates
 * @desc Get evaluation templates
 * @access Private
 */
router.get(
  '/templates',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { contentType, audience } = req.query;

      let templates;
      if (contentType) {
        templates = evaluationTemplateService.getTemplatesByContentType(contentType as string);
      } else if (audience) {
        templates = evaluationTemplateService.getTemplatesByAudience(audience as string);
      } else {
        templates = evaluationTemplateService.getAllTemplates();
      }

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      logger.error('Error getting templates:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/templates/:templateId
 * @desc Get specific evaluation template
 * @access Private
 */
router.get(
  '/templates/:templateId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const template = evaluationTemplateService.getTemplate(req.params.templateId);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        data: template
      });

    } catch (error) {
      logger.error('Error getting template:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route POST /api/quality/report
 * @desc Generate quality report
 * @access Admin
 */
router.post(
  '/report',
  requireAdmin,
  async (req, res, next) => {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days
        endDate = new Date(),
        includeAllTerms = false,
        minEvaluations = 1,
        groupBy
      } = req.body;

      const report = await qualityAnalyticsService.generateQualityReport(
        new Date(startDate),
        new Date(endDate),
        {
          includeAllTerms,
          minEvaluations,
          groupBy
        }
      );

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      logger.error('Error generating quality report:', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/trends/:termId
 * @desc Get quality trend analysis for a term
 * @access Private
 */
router.get(
  '/trends/:termId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const trendAnalysis = await qualityAnalyticsService.getQualityTrendAnalysis(
        req.params.termId
      );

      res.json({
        success: true,
        data: trendAnalysis
      });

    } catch (error) {
      logger.error('Error getting trend analysis:', {
        error: error instanceof Error ? error.message : String(error),
        termId: req.params.termId
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/segments
 * @desc Compare quality across different segments
 * @access Private
 */
router.get(
  '/segments',
  authenticateToken,
  async (req, res, next) => {
    try {
      const {
        segmentType = 'category',
        startDate,
        endDate
      } = req.query;

      const comparison = await qualityAnalyticsService.compareQualitySegments(
        segmentType as any,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: comparison
      });

    } catch (error) {
      logger.error('Error comparing segments:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/recommendations/:termId?
 * @desc Get quality improvement recommendations
 * @access Private
 */
router.get(
  '/recommendations/:termId?',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { targetScore } = req.query;

      const recommendations = await qualityAnalyticsService.getImprovementRecommendations(
        req.params.termId,
        targetScore ? Number(targetScore) : undefined
      );

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      logger.error('Error getting recommendations:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/export
 * @desc Export quality data
 * @access Admin
 */
router.get(
  '/export',
  requireAdmin,
  async (req, res, next) => {
    try {
      const {
        format = 'json',
        startDate,
        endDate,
        includeRawScores = false,
        includeDimensions = true
      } = req.query;

      const exportData = await qualityAnalyticsService.exportQualityData(
        format as any,
        {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          includeRawScores: includeRawScores === 'true',
          includeDimensions: includeDimensions === 'true'
        }
      );

      // Set appropriate headers based on format
      const contentType = format === 'json' ? 'application/json' :
                         format === 'csv' ? 'text/csv' :
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      const filename = `quality-export-${Date.now()}.${format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);

    } catch (error) {
      logger.error('Error exporting quality data:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/metrics/realtime
 * @desc Get real-time quality metrics
 * @access Admin
 */
router.get(
  '/metrics/realtime',
  requireAdmin,
  async (req, res, next) => {
    try {
      const metrics = await qualityAnalyticsService.getRealTimeMetrics();

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      logger.error('Error getting real-time metrics:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route POST /api/quality/audit/schedule
 * @desc Schedule automated quality audits
 * @access Admin
 */
router.post(
  '/audit/schedule',
  requireAdmin,
  validateRequest(scheduleAuditSchema),
  async (req, res, next) => {
    try {
      const auditConfig = await qualityAnalyticsService.scheduleQualityAudit(
        req.body.schedule,
        {
          emailRecipients: req.body.emailRecipients,
          slackWebhook: req.body.slackWebhook,
          qualityThreshold: req.body.qualityThreshold,
          includeRecommendations: req.body.includeRecommendations
        }
      );

      res.json({
        success: true,
        data: auditConfig
      });

    } catch (error) {
      logger.error('Error scheduling audit:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/flagged
 * @desc Get auto-flagged low quality content
 * @access Admin
 */
router.get(
  '/flagged',
  requireAdmin,
  async (req, res, next) => {
    try {
      const { minScore = 5.5 } = req.query;

      const flaggedContent = await aiQualityEvaluationService.autoFlagLowQualityContent(
        Number(minScore)
      );

      res.json({
        success: true,
        data: flaggedContent
      });

    } catch (error) {
      logger.error('Error getting flagged content:', {
        error: error instanceof Error ? error.message : String(error)
      });
      next(error);
    }
  }
);

/**
 * @route GET /api/quality/improvements/:termId
 * @desc Get detailed improvement recommendations for a term
 * @access Private
 */
router.get(
  '/improvements/:termId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const improvements = await aiQualityEvaluationService.getImprovementRecommendations(
        req.params.termId
      );

      res.json({
        success: true,
        data: improvements
      });

    } catch (error) {
      logger.error('Error getting improvement recommendations:', {
        error: error instanceof Error ? error.message : String(error),
        termId: req.params.termId
      });
      next(error);
    }
  }
);

export default router;