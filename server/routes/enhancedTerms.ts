import type { Express, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { enhancedTerms } from '../../shared/enhancedSchema';
import { db } from '../db';
import { enhancedStorage } from '../enhancedStorage';
import { multiAuthMiddleware } from '../middleware/multiAuth';
import { log as logger } from '../utils/logger';

export default function enhancedTermsRoutes(app: Express) {
  /**
   * Get enhanced term by ID
   */
  app.get('/api/enhanced/terms/:id', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Term ID is required',
        });
      }

      // Try to get the enhanced term
      const [term] = await db
        .select()
        .from(enhancedTerms)
        .where(eq(enhancedTerms.id, id))
        .limit(1);

      if (!term) {
        return res.status(404).json({
          success: false,
          error: 'Term not found',
        });
      }

      // Get sections for this term
      const sections = await enhancedStorage.getTermSections(id);
      logger.info(`Route: Got ${sections.length} sections for term ${id}`);
      
      // Get AI-generated content if available
      const aiContent = await enhancedStorage.getTermContent(id);

      // Transform to match expected format
      const enhancedTerm = {
        ...term,
        sections,
        aiContent,
        // Add computed fields
        hasContent: sections.length > 0,
        completionStatus: {
          totalSections: 42,
          completedSections: sections.filter(s => s.isCompleted).length,
          percentage: Math.round((sections.filter(s => s.isCompleted).length / 42) * 100),
        },
      };
      
      logger.info(`Route: Returning enhanced term with ${enhancedTerm.sections.length} sections`);

      // Track view
      try {
        await db
          .update(enhancedTerms)
          .set({ 
            viewCount: (term.viewCount || 0) + 1,
            lastViewed: new Date(),
          })
          .where(eq(enhancedTerms.id, id));
      } catch (error) {
        logger.error('Failed to update view count:', error);
      }

      const response = {
        success: true,
        data: enhancedTerm,
      };
      
      logger.info(`Route: Sending response with data.sections length: ${response.data.sections?.length}`);
      res.json(response);

    } catch (error) {
      logger.error('Error fetching enhanced term:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch term',
      });
    }
  });

  /**
   * Get enhanced term by slug
   */
  app.get('/api/enhanced/terms/slug/:slug', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({
          success: false,
          error: 'Term slug is required',
        });
      }

      // Get the enhanced term by slug
      const [term] = await db
        .select()
        .from(enhancedTerms)
        .where(eq(enhancedTerms.slug, slug))
        .limit(1);

      if (!term) {
        return res.status(404).json({
          success: false,
          error: 'Term not found',
        });
      }

      // Redirect to the ID-based endpoint
      res.redirect(`/api/enhanced/terms/${term.id}`);

    } catch (error) {
      logger.error('Error fetching enhanced term by slug:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch term',
      });
    }
  });

  /**
   * List enhanced terms
   */
  app.get('/api/enhanced/terms', multiAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { 
        page = '1', 
        limit = '24',
        search = '',
        category = '',
        sortBy = 'name',
        sortOrder = 'asc' 
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Get terms with pagination
      const terms = await enhancedStorage.getEnhancedTerms({
        limit: limitNum,
        offset,
        search: search as string,
        category: category as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        data: terms.terms,
        total: terms.total,
        page: pageNum,
        limit: limitNum,
        hasMore: offset + limitNum < terms.total,
      });

    } catch (error) {
      logger.error('Error fetching enhanced terms:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch terms',
      });
    }
  });
}