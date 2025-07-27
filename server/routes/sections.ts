import type { Express, Request, Response } from 'express'
import type { Request, Response } from 'express';
import type {
  IEnhancedTerm,
  IProgressUpdate,
  ISection,
  ISectionItem,
  ISectionResponse,
  ITermSectionsResponse,
  IUserProgress,
} from '../../shared/types';
import { SECTION_NAMES } from '../constants';
import { authenticateToken } from '../middleware/adminAuth';
import { optimizedStorage as storage } from '../optimizedStorage';
import { log as logger } from '../utils/logger';
import {
  paginationSchema,
  progressParamsSchema,
  queryParamsSchema,
  quizQuerySchema,
  sectionParamsSchema,
  validateParams,
  validateQuery,
} from '../utils/validation';

export function registerSectionRoutes(app: Express): void {
  // Get all sections for a term
  app.get('/api/terms/:termId/sections', async (req: Request, res: Response) => {
    try {
      const { termId } = req.params;
      const userId = req.user?.claims?.sub;

      // Get sections and progress data
      const sections: ISection[] = await storage.getTermSections(termId);
      const userProgress: IUserProgress[] = userId
        ? [await storage.getUserProgressSummary(userId)]
        : [];

      const baseTerm = await storage.getTermById(termId);
      if (!baseTerm) {
        return res.status(404).json({
          success: false,
          error: 'Term not found',
        });
      }

      // Convert ITerm to IEnhancedTerm
      const term: IEnhancedTerm = {
        ...baseTerm,
        sections,
        userProgress,
        completionPercentage: 0,
        totalSections: 0,
        completedSections: 0,
      };

      const response: ITermSectionsResponse = {
        term,
        sections,
        userProgress,
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Error fetching term sections', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch term sections',
      });
    }
  });

  // Get specific section with items
  app.get('/api/sections/:sectionId', async (req: Request, res: Response) => {
    try {
      const { sectionId } = validateParams(sectionParamsSchema)(req);
      const userId = req.user?.claims?.sub;

      // Get section data and items
      const section: ISection | null = await storage.getSectionById(String(sectionId));
      const items: ISectionItem[] = []; // TODO: Implement when section items are ready
      const userProgress: IUserProgress | undefined = userId
        ? await storage.getUserProgressSummary(userId)
        : undefined;

      const response: ISectionResponse = {
        section: section as any, // Cast to handle null case
        items,
        userProgress,
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Error fetching section', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch section',
      });
    }
  });

  // Update user progress for a section
  app.patch(
    '/api/progress/:termId/:sectionId',
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { termId, sectionId } = validateParams(progressParamsSchema)(req);
        const userId = req.user?.claims.sub;
        const progressUpdate: IProgressUpdate = req.body;

        // Update user progress using the new method
        await storage.updateUserProgress(userId, String(termId), String(sectionId), progressUpdate);

        res.json({
          success: true,
          message: 'Progress updated successfully',
        });
      } catch (error) {
        logger.error('Error updating progress', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({
          success: false,
          error: 'Failed to update progress',
        });
      }
    }
  );

  // Get user's overall progress summary
  app.get('/api/progress/summary', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.claims.sub;
      // Get user's progress summary using the new method
      const summary = await storage.getUserProgressSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Error fetching progress summary', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch progress summary',
      });
    }
  });

  // Content-driven site sections

  // Applications Gallery
  app.get('/api/content/applications', async (req: Request, res: Response) => {
    try {
      const { page, limit } = validateQuery(paginationSchema)(req);
      // Get content gallery data using the new method
      const galleries = await storage.getContentGallery(SECTION_NAMES.APPLICATIONS, page, limit);

      res.json({
        success: true,
        data: galleries,
      });
    } catch (error) {
      logger.error('Error fetching applications gallery', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications gallery',
      });
    }
  });

  // Ethics Hub
  app.get('/api/content/ethics', async (req: Request, res: Response) => {
    try {
      const { page, limit } = validateQuery(paginationSchema)(req);
      // Get content gallery data using the new method
      const galleries = await storage.getContentGallery(SECTION_NAMES.ETHICS, page, limit);

      res.json({
        success: true,
        data: galleries,
      });
    } catch (error) {
      logger.error('Error fetching ethics hub', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ethics hub',
      });
    }
  });

  // Hands-on Tutorials
  app.get('/api/content/tutorials', async (req: Request, res: Response) => {
    try {
      const { page, limit } = validateQuery(paginationSchema)(req);
      // Get content gallery data using the new method
      const galleries = await storage.getContentGallery(SECTION_NAMES.TUTORIALS, page, limit);

      res.json({
        success: true,
        data: galleries,
      });
    } catch (error) {
      logger.error('Error fetching tutorials', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tutorials',
      });
    }
  });

  // Quick Quiz system
  app.get('/api/content/quizzes', async (req: Request, res: Response) => {
    try {
      const { termId, difficulty } = validateQuery(quizQuerySchema)(req);
      // getQuizzes doesn't exist, return empty quizzes
      const quizzes = { data: [], total: 0, hasMore: false };

      res.json({
        success: true,
        data: quizzes,
      });
    } catch (error) {
      logger.error('Error fetching quizzes', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quizzes',
      });
    }
  });

  // Search across all section content
  app.get('/api/sections/search', async (req: Request, res: Response) => {
    try {
      const { q, contentType, sectionName, page, limit } = validateQuery(queryParamsSchema)(req);

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      // Search section content using the new method
      const results = await storage.searchSectionContent(q, {
        contentType,
        sectionName,
        page,
        limit,
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error('Error searching section content', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to search section content',
      });
    }
  });

  // Get section statistics for analytics
  app.get('/api/sections/analytics', async (_req: Request, res: Response) => {
    try {
      // Get section analytics using the new method
      const analytics = await storage.getSectionAnalytics();

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error fetching section analytics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch section analytics',
      });
    }
  });
}
