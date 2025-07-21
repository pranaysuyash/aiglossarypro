import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import type { ApiResponse } from '../../shared/types';
import { requireAdmin } from '../middleware/adminAuth';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { validateQuery } from '../middleware/security';
import { optimizedStorage as storage } from '../optimizedStorage';
import {
  addBeginnerContext,
  calculateAccessibilityScore,
  generateAccessibilityReport,
  generateSimplificationSuggestion,
  processTermsForAccessibility,
} from '../utils/contentAccessibility';
import { log } from '../utils/logger';
import { validate } from '../middleware/validationMiddleware';
import { contentSchemas, paramSchemas } from '../schemas/apiValidation';

/**
 * Content accessibility and improvement routes
 */
export function registerContentRoutes(app: Express): void {
  // Get accessibility score for a specific term
  app.get(
    '/api/content/accessibility/term/:id',
    validate.params(paramSchemas.id),
    async (req: Request, res: Response) => {
    try {
      const termId = req.params.id;
      const term = await storage.getTermById(termId);

      if (!term) {
        return res.status(404).json({
          success: false,
          message: 'Term not found',
        });
      }

      const score = calculateAccessibilityScore(term.definition);
      const suggestion =
        score.level !== 'beginner' ? generateSimplificationSuggestion(term.definition) : null;

      const response: ApiResponse<any> = {
        success: true,
        data: {
          termId: term.id,
          termName: term.name,
          accessibilityScore: score,
          simplificationSuggestion: suggestion,
          needsImprovement: score.score < 70,
        },
      };

      res.json(response);
    } catch (error) {
      log.error('Error getting term accessibility score', {
        termId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        message: 'Failed to analyze term accessibility',
      });
    }
  });

  // Batch analyze terms for accessibility
  app.post(
    '/api/content/accessibility/batch-analyze',
    multiAuthMiddleware,
    requireAdmin,
    validate.body(contentSchemas.batchAnalyzeAccessibility, {
      sanitizeHtml: true,
      logErrors: true
    }),
    async (req: Request, res: Response) => {
      try {
        const { termIds, limit } = req.body;

        let terms;
        if (termIds && Array.isArray(termIds)) {
          // Analyze specific terms
          terms = await Promise.all(
            termIds.map(async (id: string) => {
              const term: { id: string; name: string; definition: string } | null =
                await storage.getTermById(id);
              return term ? { id: term.id, name: term.name, definition: term.definition } : null;
            })
          ).then(results =>
            results.filter(
              (term): term is { id: string; name: string; definition: string } => term !== null
            )
          );
        } else {
          // Analyze all terms (with limit)
          const allTerms = await storage.getAllTerms({ limit: limit || 100, page: 1 });
          terms = allTerms.terms.map((term: any) => ({
            id: term.id,
            name: term.name,
            definition: term.definition,
          }));
        }

        log.info('Starting batch accessibility analysis', {
          termCount: terms.length,
          requestedBy: (req.user as any)?.id,
        });

        const results = await processTermsForAccessibility(terms);

        // Generate summary report
        const report = generateAccessibilityReport(
          results.map(r => ({ score: r.accessibilityScore, termName: r.termName }))
        );

        const response: ApiResponse<any> = {
          success: true,
          data: {
            results,
            report,
            analyzedCount: results.length,
            summary: {
              needsImprovement: results.filter(r => r.needsImprovement).length,
              averageScore: Math.round(
                results.reduce((sum, r) => sum + r.accessibilityScore.score, 0) / results.length
              ),
            },
          },
        };

        res.json(response);
      } catch (error) {
        log.error('Error in batch accessibility analysis', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          message: 'Failed to perform batch accessibility analysis',
        });
      }
    }
  );

  // Get simplified version of a term
  app.get('/api/content/simplify/term/:id', async (req: Request, res: Response) => {
    try {
      const termId = req.params.id;
      const term = await storage.getTermById(termId);

      if (!term) {
        return res.status(404).json({
          success: false,
          message: 'Term not found',
        });
      }

      const suggestion = generateSimplificationSuggestion(term.definition);
      const enhancedDefinition = addBeginnerContext(term.definition, term.name);

      const response: ApiResponse<any> = {
        success: true,
        data: {
          termId: term.id,
          termName: term.name,
          originalDefinition: term.definition,
          simplificationSuggestion: suggestion,
          enhancedDefinition,
          technicalTerms: suggestion.technicalTerms,
        },
      };

      res.json(response);
    } catch (error) {
      log.error('Error generating term simplification', {
        termId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        message: 'Failed to generate simplified version',
      });
    }
  });

  // Apply accessibility improvements to a term
  app.put(
    '/api/content/accessibility/term/:id/improve',
    multiAuthMiddleware,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const termId = req.params.id;
        const { useSimplified, useEnhanced, customDefinition } = req.body;

        const term = await storage.getTermById(termId);
        if (!term) {
          return res.status(404).json({
            success: false,
            message: 'Term not found',
          });
        }

        let newDefinition = term.definition;

        if (customDefinition) {
          newDefinition = customDefinition;
        } else if (useSimplified) {
          const suggestion = generateSimplificationSuggestion(term.definition);
          newDefinition = suggestion.simplifiedText;
        } else if (useEnhanced) {
          newDefinition = addBeginnerContext(term.definition, term.name);
        }

        // Update the term
        await storage.updateTerm(termId, {
          ...term,
          definition: newDefinition,
          lastModified: new Date(),
        });

        // Calculate new accessibility score
        const newScore = calculateAccessibilityScore(newDefinition);

        log.info('Applied accessibility improvements to term', {
          termId,
          termName: term.name,
          oldScore: calculateAccessibilityScore(term.definition).score,
          newScore: newScore.score,
          improvement: newScore.score - calculateAccessibilityScore(term.definition).score,
        });

        const response: ApiResponse<any> = {
          success: true,
          data: {
            termId,
            updatedDefinition: newDefinition,
            newAccessibilityScore: newScore,
            message: 'Term accessibility improved successfully',
          },
        };

        res.json(response);
      } catch (error) {
        log.error('Error applying accessibility improvements', {
          termId: req.params.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          message: 'Failed to apply accessibility improvements',
        });
      }
    }
  );

  // Get glossary-wide accessibility report
  app.get(
    '/api/content/accessibility/report',
    multiAuthMiddleware,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Get sample of terms for analysis (configurable via query param)
        const sampleSize = parseInt(req.query.sampleSize as string) || 500;
        const allTerms = await storage.getAllTerms({ limit: sampleSize, page: 1 });

        const termsData = allTerms.data.map((term: any) => ({
          id: term.id,
          name: term.name,
          definition: term.definition,
        }));

        log.info('Generating accessibility report', {
          sampleSize: termsData.length,
          requestedBy: (req.user as any)?.id,
        });

        const results = await processTermsForAccessibility(termsData);
        const report = generateAccessibilityReport(
          results.map(r => ({ score: r.accessibilityScore, termName: r.termName }))
        );

        // Get top terms needing improvement
        const termsNeedingImprovement = results
          .filter(r => r.needsImprovement)
          .sort((a, b) => a.accessibilityScore.score - b.accessibilityScore.score)
          .slice(0, 20)
          .map(r => ({
            termId: r.termId,
            termName: r.termName,
            score: r.accessibilityScore.score,
            level: r.accessibilityScore.level,
            improvements: r.accessibilityScore.improvements,
          }));

        const response: ApiResponse<any> = {
          success: true,
          data: {
            report,
            termsNeedingImprovement,
            analyzedTermsCount: results.length,
            timestamp: new Date().toISOString(),
          },
        };

        res.json(response);
      } catch (error) {
        log.error('Error generating accessibility report', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          message: 'Failed to generate accessibility report',
        });
      }
    }
  );

  // Search for terms by accessibility level
  const accessibilitySearchSchema = z.object({
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    minScore: z.coerce.number().min(0).max(100).optional(),
    maxScore: z.coerce.number().min(0).max(100).optional(),
    needsImprovement: z.coerce.boolean().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    page: z.coerce.number().min(1).default(1),
  });

  app.get(
    '/api/content/accessibility/search',
    validateQuery(accessibilitySearchSchema),
    async (req: Request, res: Response) => {
      try {
        const { level, minScore, maxScore, needsImprovement, limit, page } = req.query as any;

        // Get terms (this is a simplified implementation - in production,
        // you'd want to cache accessibility scores in the database)
        const allTerms = await storage.getAllTerms({ limit: 1000, page: 1 });

        const termsWithScores = allTerms.data.map((term: any) => {
          const score = calculateAccessibilityScore(term.definition);
          return {
            ...term,
            accessibilityScore: score,
          };
        });

        // Filter by criteria
        let filteredTerms = termsWithScores;

        if (level) {
          filteredTerms = filteredTerms.filter(term => term.accessibilityScore.level === level);
        }

        if (minScore !== undefined) {
          filteredTerms = filteredTerms.filter(term => term.accessibilityScore.score >= minScore);
        }

        if (maxScore !== undefined) {
          filteredTerms = filteredTerms.filter(term => term.accessibilityScore.score <= maxScore);
        }

        if (needsImprovement !== undefined) {
          const needsFilter = needsImprovement;
          filteredTerms = filteredTerms.filter(
            term => term.accessibilityScore.score < 70 === needsFilter
          );
        }

        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTerms = filteredTerms.slice(startIndex, endIndex);

        const response: ApiResponse<any> = {
          success: true,
          data: {
            terms: paginatedTerms.map(term => ({
              id: term.id,
              name: term.name,
              definition: `${term.definition.substring(0, 200)}...`,
              accessibilityScore: term.accessibilityScore,
            })),
            pagination: {
              page,
              limit,
              total: filteredTerms.length,
              totalPages: Math.ceil(filteredTerms.length / limit),
            },
          },
        };

        res.json(response);
      } catch (error) {
        log.error('Error searching terms by accessibility', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          message: 'Failed to search terms by accessibility criteria',
        });
      }
    }
  );
}
