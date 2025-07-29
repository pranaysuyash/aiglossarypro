/**
 * Admin Content Management Routes
 *
 * Backend API for content management tools, bulk operations,
 * and quality validation.
 */

import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { Express, Request, Response } from 'express'
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
// TODO: Fix these imports for production build
// import ContentGapAnalyzer from '../../../scripts/content-gap-analysis';
// import ContentPopulator from '../../../scripts/content-population';
import { enhancedTerms, termSections } from '@aiglossarypro/shared/enhancedSchema';
import type { ApiResponse } from '@aiglossarypro/shared/types';
import { db } from '@aiglossarypro/database';
import { log as logger } from '../../utils/logger';
import { DataQualityValidator } from '../../validators/dataQualityValidator';

interface BulkOperation {
  id: string;
  type: 'generate-definitions' | 'enhance-content' | 'validate-quality' | 'categorize-terms';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  startedAt?: string;
  completedAt?: string;
  results?: Response;
  errors?: string[];
}

interface ContentValidationResult {
  termId: string;
  termName: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
  qualityScore: number;
}

// In-memory store for bulk operations (in production, use Redis or database)
const bulkOperations = new Map<string, BulkOperation>();
// const contentPopulator = new ContentPopulator();
// const gapAnalyzer = new ContentGapAnalyzer();

export function registerContentManagementRoutes(app: Express): void {
  /**
   * @openapi
   * /api/admin/content/stats:
   *   get:
   *     tags:
   *       - Admin Content
   *     summary: Get content statistics
   *     description: Retrieve comprehensive statistics about content quality and completeness
   *     responses:
   *       200:
   *         description: Content statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalTerms:
   *                       type: integer
   *                     completedTerms:
   *                       type: integer
   *                     missingDefinitions:
   *                       type: integer
   *                     averageCompleteness:
   *                       type: number
   *                     qualityDistribution:
   *                       type: object
   */
  app.get('/api/admin/content/stats', async (req: Request, res: Response) => {
    try {
      // Get basic term counts
      const totalTermsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(enhancedTerms);
      const totalTerms = totalTermsResult[0]?.count || 0;

      // Get terms with missing definitions
      const missingDefinitionsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(enhancedTerms)
        .where(
          or(
            isNull(enhancedTerms.fullDefinition),
            sql`length(${enhancedTerms.fullDefinition}) < 100`
          )
        );
      const missingDefinitions = missingDefinitionsResult[0]?.count || 0;

      // Get terms with missing short definitions
      const missingShortDefinitionsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(enhancedTerms)
        .where(
          or(
            isNull(enhancedTerms.shortDefinition),
            sql`length(${enhancedTerms.shortDefinition}) < 50`
          )
        );
      const missingShortDefinitions = missingShortDefinitionsResult[0]?.count || 0;

      // Get uncategorized terms
      const uncategorizedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(enhancedTerms)
        .where(
          or(
            isNull(enhancedTerms.mainCategories),
            sql`array_length(${enhancedTerms.mainCategories}, 1) IS NULL`
          )
        );
      const uncategorizedTerms = uncategorizedResult[0]?.count || 0;

      // Get terms with code examples
      const codeExamplesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(enhancedTerms)
        .where(eq(enhancedTerms.hasCodeExamples, true));
      const termsWithCodeExamples = codeExamplesResult[0]?.count || 0;

      // Get terms with interactive elements
      const interactiveResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(enhancedTerms)
        .where(eq(enhancedTerms.hasInteractiveElements, true));
      const termsWithInteractiveElements = interactiveResult[0]?.count || 0;

      // Calculate quality metrics
      const allTerms = await db
        .select({
          id: enhancedTerms.id,
          name: enhancedTerms.name,
          fullDefinition: enhancedTerms.fullDefinition,
          shortDefinition: enhancedTerms.shortDefinition,
          mainCategories: enhancedTerms.mainCategories,
          hasCodeExamples: enhancedTerms.hasCodeExamples,
          hasInteractiveElements: enhancedTerms.hasInteractiveElements,
          difficultyLevel: enhancedTerms.difficultyLevel,
        })
        .from(enhancedTerms);

      let totalCompleteness = 0;
      let completedTerms = 0;
      let lowQualityTerms = 0;
      const qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };

      allTerms.forEach(term => {
        const qualityScore = DataQualityValidator.calculateQualityScore(term);
        totalCompleteness += qualityScore;

        if (qualityScore >= 80) {
          qualityDistribution.excellent++;
          completedTerms++;
        } else if (qualityScore >= 60) {
          qualityDistribution.good++;
          completedTerms++;
        } else if (qualityScore >= 40) {
          qualityDistribution.fair++;
        } else {
          qualityDistribution.poor++;
          lowQualityTerms++;
        }
      });

      const averageCompleteness = totalTerms > 0 ? totalCompleteness / totalTerms : 0;

      const stats = {
        totalTerms,
        completedTerms,
        missingDefinitions,
        missingShortDefinitions,
        uncategorizedTerms,
        lowQualityTerms,
        termsWithCodeExamples,
        termsWithInteractiveElements,
        averageCompleteness: Math.round(averageCompleteness * 10) / 10,
        qualityDistribution,
      };

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching content stats', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch content statistics',
      });
    }
  });

  /**
   * @openapi
   * /api/admin/content/bulk-operations:
   *   post:
   *     tags:
   *       - Admin Content
   *     summary: Start bulk operation
   *     description: Start a bulk content operation like generating definitions or enhancing content
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [generate-definitions, enhance-content, validate-quality, categorize-terms]
   *               options:
   *                 type: object
   *                 description: Operation-specific options
   *     responses:
   *       200:
   *         description: Bulk operation started successfully
   *       400:
   *         description: Invalid operation type or options
   */
  app.post('/api/admin/content/bulk-operations', async (req: Request, res: Response) => {
    try {
      const { type, options = {} } = req.body;

      const validTypes = [
        'generate-definitions',
        'enhance-content',
        'validate-quality',
        'categorize-terms',
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid operation type',
        });
      }

      const operationId = uuidv4();
      const operation: BulkOperation = {
        id: operationId,
        type,
        status: 'pending',
        progress: 0,
        totalItems: 0,
        processedItems: 0,
        startedAt: new Date().toISOString(),
        errors: [],
      };

      bulkOperations.set(operationId, operation);

      // Start the operation asynchronously
      processBulkOperation(operationId, type, options).catch(error => {
        logger.error('Bulk operation failed', { operationId, error });
        const op = bulkOperations.get(operationId);
        if (op) {
          op.status = 'failed';
          op.errors?.push(error.message);
          op.completedAt = new Date().toISOString();
        }
      });

      const response: ApiResponse<BulkOperation> = {
        success: true,
        data: operation,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error starting bulk operation', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Failed to start bulk operation',
      });
    }
  });

  /**
   * @openapi
   * /api/admin/content/bulk-operations/{id}:
   *   get:
   *     tags:
   *       - Admin Content
   *     summary: Get bulk operation status
   *     description: Get the current status of a bulk operation
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Operation ID
   *     responses:
   *       200:
   *         description: Operation status retrieved successfully
   *       404:
   *         description: Operation not found
   */
  app.get('/api/admin/content/bulk-operations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const operation = bulkOperations.get(id);

      if (!operation) {
        return res.status(404).json({
          success: false,
          error: 'Operation not found',
        });
      }

      const response: ApiResponse<BulkOperation> = {
        success: true,
        data: operation,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error fetching operation status', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch operation status',
      });
    }
  });

  /**
   * @openapi
   * /api/admin/content/validate:
   *   post:
   *     tags:
   *       - Admin Content
   *     summary: Validate content quality
   *     description: Run quality validation on content
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               scope:
   *                 type: string
   *                 enum: [all, sample]
   *               sampleSize:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 1000
   *     responses:
   *       200:
   *         description: Validation completed successfully
   */
  app.post('/api/admin/content/validate', async (req: Request, res: Response) => {
    try {
      const { scope = 'sample', sampleSize = 50 } = req.body;

      let query = db.select().from(enhancedTerms);

      if (scope === 'sample') {
        query = query.limit(Math.min(sampleSize, 1000));
      }

      const terms = await query;
      const results: ContentValidationResult[] = [];

      for (const term of terms) {
        const validation = validateTermQuality(term);
        results.push(validation);
      }

      // Sort by severity and quality score
      results.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) {return severityDiff;}
        return a.qualityScore - b.qualityScore;
      });

      const validationSummary = {
        totalValidated: results.length,
        highSeverityIssues: results.filter(r => r.severity === 'high').length,
        mediumSeverityIssues: results.filter(r => r.severity === 'medium').length,
        lowSeverityIssues: results.filter(r => r.severity === 'low').length,
        averageQualityScore: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length,
        results: results.slice(0, 100), // Limit results for performance
      };

      const response: ApiResponse<typeof validationSummary> = {
        success: true,
        data: validationSummary,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error validating content', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Failed to validate content',
      });
    }
  });
}

// Helper function to process bulk operations
async function processBulkOperation(
  operationId: string,
  type: string,
  options: Record<string, unknown>
): Promise<void> {
  const operation = bulkOperations.get(operationId);
  if (!operation) {return;}

  try {
    operation.status = 'running';

    switch (type) {
      case 'generate-definitions':
        await processGenerateDefinitions(operation, options);
        break;
      case 'enhance-content':
        await processEnhanceContent(operation, options);
        break;
      case 'categorize-terms':
        await processCategorizeTerms(operation, options);
        break;
      case 'validate-quality':
        await processValidateQuality(operation, options);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }

    operation.status = 'completed';
    operation.completedAt = new Date().toISOString();
    operation.progress = 100;
  } catch (error) {
    operation.status = 'failed';
    operation.errors?.push(error instanceof Error ? error.message : String(error));
    operation.completedAt = new Date().toISOString();
  }
}

async function processGenerateDefinitions(operation: BulkOperation, options: Record<string, unknown>): Promise<void> {
  // Get terms with missing definitions
  const terms = await db
    .select()
    .from(enhancedTerms)
    .where(
      or(isNull(enhancedTerms.fullDefinition), sql`length(${enhancedTerms.fullDefinition}) < 100`)
    )
    .limit(options.batchSize || 50);

  operation.totalItems = terms.length;

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];

    try {
      // Use content populator to enhance term
      const enhanced = await contentPopulator.enhanceTerm(term);

      // Update term in database
      await db
        .update(enhancedTerms)
        .set({
          fullDefinition: enhanced.definition,
          shortDefinition: enhanced.shortDefinition,
          updatedAt: new Date(),
        })
        .where(eq(enhancedTerms.id, term.id));

      operation.processedItems = i + 1;
      operation.progress = Math.round((operation.processedItems / operation.totalItems) * 100);
    } catch (error) {
      operation.errors?.push(`Failed to process term ${term.name}: ${error}`);
    }
  }
}

async function processEnhanceContent(operation: BulkOperation, options: Record<string, unknown>): Promise<void> {
  // Get terms with low quality scores
  const terms = await db
    .select()
    .from(enhancedTerms)
    .limit(options.batchSize || 50);

  operation.totalItems = terms.length;

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];

    try {
      const qualityScore = DataQualityValidator.calculateQualityScore(term);

      if (qualityScore < 70) {
        // Enhance the term
        const enhanced = await contentPopulator.enhanceTerm(term);

        await db
          .update(enhancedTerms)
          .set({
            fullDefinition: enhanced.definition,
            shortDefinition: enhanced.shortDefinition,
            mainCategories: enhanced.mainCategory ? [enhanced.mainCategory] : undefined,
            subCategories: enhanced.subCategory ? [enhanced.subCategory] : undefined,
            updatedAt: new Date(),
          })
          .where(eq(enhancedTerms.id, term.id));
      }

      operation.processedItems = i + 1;
      operation.progress = Math.round((operation.processedItems / operation.totalItems) * 100);
    } catch (error) {
      operation.errors?.push(`Failed to enhance term ${term.name}: ${error}`);
    }
  }
}

async function processCategorizeTerms(operation: BulkOperation, options: Record<string, unknown>): Promise<void> {
  // Get uncategorized terms
  const terms = await db
    .select()
    .from(enhancedTerms)
    .where(
      or(
        isNull(enhancedTerms.mainCategories),
        sql`array_length(${enhancedTerms.mainCategories}, 1) IS NULL`
      )
    )
    .limit(options.batchSize || 100);

  operation.totalItems = terms.length;

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];

    try {
      // Simple categorization logic (in production, use AI/ML)
      const category = inferCategory(term.name, term.fullDefinition);
      const subCategory = inferSubCategory(term.name, term.fullDefinition);

      await db
        .update(enhancedTerms)
        .set({
          mainCategories: [category],
          subCategories: subCategory ? [subCategory] : undefined,
          updatedAt: new Date(),
        })
        .where(eq(enhancedTerms.id, term.id));

      operation.processedItems = i + 1;
      operation.progress = Math.round((operation.processedItems / operation.totalItems) * 100);
    } catch (error) {
      operation.errors?.push(`Failed to categorize term ${term.name}: ${error}`);
    }
  }
}

async function processValidateQuality(operation: BulkOperation, options: Record<string, unknown>): Promise<void> {
  const terms = await db
    .select()
    .from(enhancedTerms)
    .limit(options.batchSize || 200);

  operation.totalItems = terms.length;
  const results: ContentValidationResult[] = [];

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];

    try {
      const validation = validateTermQuality(term);
      results.push(validation);

      operation.processedItems = i + 1;
      operation.progress = Math.round((operation.processedItems / operation.totalItems) * 100);
    } catch (error) {
      operation.errors?.push(`Failed to validate term ${term.name}: ${error}`);
    }
  }

  operation.results = {
    totalValidated: results.length,
    issuesFound: results.filter(r => r.issues.length > 0).length,
    averageQualityScore: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length,
  };
}

// Quality calculation functions
function calculateTermQuality(term: any): number {
  let score = 0;

  // Definition quality (40 points)
  if (term.fullDefinition) {
    if (term.fullDefinition.length > 200) {score += 25;}
    else if (term.fullDefinition.length > 100) {score += 15;}
    else if (term.fullDefinition.length > 50) {score += 10;}
  }

  if (term.shortDefinition && term.shortDefinition.length > 50) {score += 15;}

  // Categorization (20 points)
  if (term.mainCategories && term.mainCategories.length > 0) {score += 15;}
  if (term.subCategories && term.subCategories.length > 0) {score += 5;}

  // Content richness (30 points)
  if (term.hasCodeExamples) {score += 10;}
  if (term.hasInteractiveElements) {score += 10;}
  if (term.difficultyLevel) {score += 5;}
  if (term.keywords && term.keywords.length > 0) {score += 5;}

  // Completeness (10 points)
  if (term.searchText && term.searchText.length > 100) {score += 10;}

  return Math.min(score, 100);
}

function validateTermQuality(term: any): ContentValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Check definition quality
  if (!term.fullDefinition || term.fullDefinition.length < 50) {
    issues.push('Missing or inadequate definition');
    suggestions.push('Add a comprehensive definition (200+ characters)');
    severity = 'high';
  } else if (term.fullDefinition.length < 100) {
    issues.push('Definition is too short');
    suggestions.push('Expand definition to provide more context');
    if (severity === 'low') {severity = 'medium';}
  }

  if (!term.shortDefinition || term.shortDefinition.length < 30) {
    issues.push('Missing short definition');
    suggestions.push('Add a concise summary (50-150 characters)');
    if (severity === 'low') {severity = 'medium';}
  }

  // Check categorization
  if (!term.mainCategories || term.mainCategories.length === 0) {
    issues.push('No main category assigned');
    suggestions.push('Assign appropriate main category');
    if (severity === 'low') {severity = 'medium';}
  }

  // Check content richness
  if (!term.hasCodeExamples && isTechnicalTerm(term.name)) {
    issues.push('Missing code examples for technical term');
    suggestions.push('Add relevant code examples or implementations');
  }

  if (!term.hasInteractiveElements) {
    suggestions.push('Consider adding interactive elements for better engagement');
  }

  const qualityScore = calculateTermQuality(term);

  return {
    termId: term.id,
    termName: term.name,
    issues,
    severity,
    suggestions,
    qualityScore,
  };
}

function isTechnicalTerm(termName: string): boolean {
  const technicalKeywords = [
    'algorithm',
    'network',
    'model',
    'learning',
    'neural',
    'deep',
    'classification',
    'regression',
    'clustering',
    'optimization',
  ];

  return technicalKeywords.some(keyword => termName.toLowerCase().includes(keyword));
}

function inferCategory(termName: string, definition?: string): string {
  const name = termName.toLowerCase();
  const def = definition?.toLowerCase() || '';

  if (name.includes('neural') || name.includes('network') || def.includes('neural')) {
    return 'Neural Networks and Deep Learning';
  }
  if (name.includes('algorithm') || def.includes('algorithm')) {
    return 'Algorithms and Optimization';
  }
  if (name.includes('model') || name.includes('regression') || name.includes('classification')) {
    return 'Machine Learning Models';
  }
  if (name.includes('learning') || def.includes('learning')) {
    return 'Machine Learning Techniques';
  }
  if (name.includes('data') || def.includes('data')) {
    return 'Data Science and Analytics';
  }

  return 'Fundamental Concepts';
}

function inferSubCategory(termName: string, definition?: string): string {
  const name = termName.toLowerCase();
  const def = definition?.toLowerCase() || '';

  if (name.includes('supervised') || def.includes('supervised')) {return 'Supervised Learning';}
  if (name.includes('unsupervised') || def.includes('unsupervised')) {return 'Unsupervised Learning';}
  if (name.includes('reinforcement') || def.includes('reinforcement'))
    {return 'Reinforcement Learning';}
  if (name.includes('deep') || name.includes('neural')) {return 'Deep Learning';}
  if (name.includes('nlp') || name.includes('language')) {return 'Natural Language Processing';}
  if (name.includes('vision') || name.includes('image')) {return 'Computer Vision';}

  return 'General AI/ML';
}