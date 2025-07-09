import { Router } from 'express';
import { z } from 'zod';
import { authenticateFirebaseToken } from '../../middleware/firebaseAuth';
import { validateRequest } from '../../middleware/validateRequest';
import { aiContentGenerationService } from '../../services/aiContentGenerationService';
import { promptTemplateService } from '../../services/promptTemplateService';
import { log as logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const generateContentSchema = z.object({
  termId: z.string().uuid('Term ID must be a valid UUID'),
  sectionName: z.string().min(1, 'Section name is required'),
  templateId: z.string().optional(),
  model: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o-mini']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  regenerate: z.boolean().default(false),
});

const bulkGenerateSchema = z.object({
  termId: z.string().uuid('Term ID must be a valid UUID'),
  sectionNames: z.array(z.string().min(1)).min(1, 'At least one section name is required'),
  templateId: z.string().optional(),
  model: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o-mini']).optional(),
  regenerate: z.boolean().default(false),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Template description is required'),
  template: z.string().min(10, 'Template content must be at least 10 characters'),
  variables: z.array(z.string()).default([]),
  category: z.string().min(1, 'Template category is required'),
  isDefault: z.boolean().default(false),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  template: z.string().min(10).optional(),
  variables: z.array(z.string()).optional(),
  category: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

/**
 * @swagger
 * /api/admin/generate:
 *   post:
 *     summary: Generate AI content for a specific term and section
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termId
 *               - sectionName
 *             properties:
 *               termId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the term
 *               sectionName:
 *                 type: string
 *                 description: Name of the section to generate content for
 *               templateId:
 *                 type: string
 *                 description: Optional template ID to use
 *               model:
 *                 type: string
 *                 enum: [gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o-mini]
 *                 description: OpenAI model to use
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 description: Temperature for generation (0-2)
 *               maxTokens:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 4000
 *                 description: Maximum tokens to generate
 *               regenerate:
 *                 type: boolean
 *                 description: Force regeneration even if content exists
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 content:
 *                   type: string
 *                   description: Generated content
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     termId:
 *                       type: string
 *                     termName:
 *                       type: string
 *                     sectionName:
 *                       type: string
 *                     templateUsed:
 *                       type: string
 *                     model:
 *                       type: string
 *                     promptTokens:
 *                       type: number
 *                     completionTokens:
 *                       type: number
 *                     totalTokens:
 *                       type: number
 *                     cost:
 *                       type: number
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     processingTime:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/generate',
  authenticateFirebaseToken,
  validateRequest(generateContentSchema),
  async (req, res) => {
    try {
      const { termId, sectionName, templateId, model, temperature, maxTokens, regenerate } =
        req.body;
      const userId = req.user?.uid;

      logger.info('AI content generation request', {
        termId,
        sectionName,
        templateId,
        model,
        userId,
        regenerate,
      });

      const result = await aiContentGenerationService.generateContent({
        termId,
        sectionName,
        templateId,
        model,
        temperature,
        maxTokens,
        userId,
        regenerate,
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to generate content',
        });
      }
    } catch (error) {
      logger.error('Error in AI content generation endpoint:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/generate/bulk:
 *   post:
 *     summary: Generate AI content for multiple sections of a term
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termId
 *               - sectionNames
 *             properties:
 *               termId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the term
 *               sectionNames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of section names to generate content for
 *               templateId:
 *                 type: string
 *                 description: Optional template ID to use
 *               model:
 *                 type: string
 *                 enum: [gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o-mini]
 *                 description: OpenAI model to use
 *               regenerate:
 *                 type: boolean
 *                 description: Force regeneration even if content exists
 *     responses:
 *       200:
 *         description: Bulk generation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalSections:
 *                       type: number
 *                     successCount:
 *                       type: number
 *                     failureCount:
 *                       type: number
 *                     totalCost:
 *                       type: number
 *                     totalTokens:
 *                       type: number
 *                     processingTime:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/generate/bulk',
  authenticateFirebaseToken,
  validateRequest(bulkGenerateSchema),
  async (req, res) => {
    try {
      const { termId, sectionNames, templateId, model, regenerate } = req.body;
      const userId = req.user?.uid;

      logger.info('Bulk AI content generation request', {
        termId,
        sectionCount: sectionNames.length,
        templateId,
        model,
        userId,
        regenerate,
      });

      const result = await aiContentGenerationService.generateBulkContent({
        termId,
        sectionNames,
        templateId,
        model,
        userId,
        regenerate,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in bulk AI content generation endpoint:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/generate/templates:
 *   get:
 *     summary: Get all available prompt templates
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                 stats:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templates', authenticateFirebaseToken, async (_req, res) => {
  try {
    const templates = promptTemplateService.getAllTemplates();
    const stats = promptTemplateService.getTemplateStats();

    res.json({
      success: true,
      templates,
      stats,
    });
  } catch (error) {
    logger.error('Error getting templates:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/admin/generate/templates/{category}:
 *   get:
 *     summary: Get templates by category
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Template category
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templates/:category', authenticateFirebaseToken, async (req, res) => {
  try {
    const { category } = req.params;
    const templates = promptTemplateService.getTemplatesByCategory(category);

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    logger.error('Error getting templates by category:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/admin/generate/templates:
 *   post:
 *     summary: Create a new prompt template
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - template
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               description:
 *                 type: string
 *                 description: Template description
 *               template:
 *                 type: string
 *                 description: Template content with variables
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Available variables
 *               category:
 *                 type: string
 *                 description: Template category
 *               isDefault:
 *                 type: boolean
 *                 description: Whether this is a default template
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/templates',
  authenticateFirebaseToken,
  validateRequest(createTemplateSchema),
  async (req, res) => {
    try {
      const { name, description, template, variables, category, isDefault } = req.body;

      const newTemplate = promptTemplateService.addTemplate({
        name,
        description,
        template,
        variables,
        category,
        isDefault,
      });

      logger.info('Created new prompt template', {
        templateId: newTemplate.id,
        name,
        category,
        userId: req.user?.uid,
      });

      res.status(201).json({
        success: true,
        template: newTemplate,
      });
    } catch (error) {
      logger.error('Error creating template:', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/generate/templates/{templateId}:
 *   put:
 *     summary: Update a prompt template
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               template:
 *                 type: string
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.put(
  '/templates/:templateId',
  authenticateFirebaseToken,
  validateRequest(updateTemplateSchema),
  async (req, res) => {
    try {
      const { templateId } = req.params;
      const updates = req.body;

      const updatedTemplate = promptTemplateService.updateTemplate(templateId, updates);

      logger.info('Updated prompt template', {
        templateId,
        updates: Object.keys(updates),
        userId: req.user?.uid,
      });

      res.json({
        success: true,
        template: updatedTemplate,
      });
    } catch (error) {
      logger.error('Error updating template:', {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  }
);

/**
 * @swagger
 * /api/admin/generate/templates/{templateId}:
 *   delete:
 *     summary: Delete a prompt template
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.delete('/templates/:templateId', authenticateFirebaseToken, async (req, res) => {
  try {
    const { templateId } = req.params;

    const deleted = promptTemplateService.deleteTemplate(templateId);

    if (deleted) {
      logger.info('Deleted prompt template', {
        templateId,
        userId: req.user?.uid,
      });

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }
  } catch (error) {
    logger.error('Error deleting template:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message.includes('Cannot delete default template')) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete default template',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/admin/generate/stats:
 *   get:
 *     summary: Get AI generation statistics
 *     tags: [Admin - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: termId
 *         schema:
 *           type: string
 *         description: Optional term ID to filter stats
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalGenerations:
 *                       type: number
 *                     successRate:
 *                       type: number
 *                     totalCost:
 *                       type: number
 *                     averageCost:
 *                       type: number
 *                     averageTokens:
 *                       type: number
 *                     modelUsage:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticateFirebaseToken, async (req, res) => {
  try {
    const { termId } = req.query;

    const stats = await aiContentGenerationService.getGenerationStats(termId as string);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error getting generation stats:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
