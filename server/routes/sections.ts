import { Express, Request, Response } from 'express';
import { optimizedStorage as storage } from "../optimizedStorage";
import { authenticateToken } from '../middleware/adminAuth';
import type { 
  ISectionResponse, 
  ITermSectionsResponse, 
  IProgressUpdate, 
  IProgressSummary,
  IContentGalleryResponse 
} from '../../shared/types';
import { log as logger } from '../utils/logger';
import { SECTION_NAMES, DEFAULT_LIMITS } from '../constants';
import { 
  validateParams, 
  validateQuery, 
  sectionParamsSchema, 
  progressParamsSchema,
  queryParamsSchema,
  quizQuerySchema,
  paginationSchema 
} from '../utils/validation';

export function registerSectionRoutes(app: Express): void {

  // Get all sections for a term
  app.get('/api/terms/:termId/sections', async (req: Request, res: Response) => {
    try {
      const { termId } = req.params;
      const userId = req.user?.claims?.sub;

      const sections = await storage.getTermSections(termId);
      const userProgress = userId ? await storage.getUserProgressForTerm(userId, termId) : [];

      const response: ITermSectionsResponse = {
        term: await storage.getTermById(termId),
        sections,
        userProgress
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Error fetching term sections', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch term sections'
      });
    }
  });

  // Get specific section with items
  app.get('/api/sections/:sectionId', async (req: Request, res: Response) => {
    try {
      const { sectionId } = validateParams(sectionParamsSchema)(req);
      const userId = req.user?.claims?.sub;

      const section = await storage.getSectionById(sectionId);
      const items = await storage.getSectionItems(sectionId);
      const userProgress = userId ? await storage.getUserProgressForSection(userId, sectionId) : undefined;

      const response: ISectionResponse = {
        section,
        items,
        userProgress
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Error fetching section', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch section'
      });
    }
  });

  // Update user progress for a section
  app.patch('/api/progress/:termId/:sectionId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { termId, sectionId } = validateParams(progressParamsSchema)(req);
      const userId = req.user!.claims.sub;
      const progressUpdate: IProgressUpdate = req.body;

      await storage.updateUserProgress(
        userId,
        termId,
        sectionId,
        progressUpdate
      );

      res.json({
        success: true,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      logger.error('Error updating progress', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to update progress'
      });
    }
  });

  // Get user's overall progress summary
  app.get('/api/progress/summary', authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.claims.sub;
      const summary = await storage.getUserProgressSummary(userId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error fetching progress summary', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch progress summary'
      });
    }
  });

  // Content-driven site sections

  // Applications Gallery
  app.get('/api/content/applications', async (req: Request, res: Response) => {
    try {
      const { page, limit } = validateQuery(paginationSchema)(req);
      const galleries = await storage.getContentGallery(SECTION_NAMES.APPLICATIONS, {
        page,
        limit
      });

      res.json({
        success: true,
        data: galleries
      });
    } catch (error) {
      logger.error('Error fetching applications gallery', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications gallery'
      });
    }
  });

  // Ethics Hub
  app.get('/api/content/ethics', async (req: Request, res: Response) => {
    try {
      const { page, limit } = validateQuery(paginationSchema)(req);
      const galleries = await storage.getContentGallery(SECTION_NAMES.ETHICS, {
        page,
        limit
      });

      res.json({
        success: true,
        data: galleries
      });
    } catch (error) {
      logger.error('Error fetching ethics hub', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ethics hub'
      });
    }
  });

  // Hands-on Tutorials
  app.get('/api/content/tutorials', async (req: Request, res: Response) => {
    try {
      const { page, limit } = validateQuery(paginationSchema)(req);
      const galleries = await storage.getContentGallery(SECTION_NAMES.TUTORIALS, {
        page,
        limit
      });

      res.json({
        success: true,
        data: galleries
      });
    } catch (error) {
      logger.error('Error fetching tutorials', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tutorials'
      });
    }
  });

  // Quick Quiz system
  app.get('/api/content/quizzes', async (req: Request, res: Response) => {
    try {
      const { termId, difficulty } = validateQuery(quizQuerySchema)(req);
      const quizzes = await storage.getQuizzes({
        termId,
        difficulty
      });

      res.json({
        success: true,
        data: quizzes
      });
    } catch (error) {
      logger.error('Error fetching quizzes', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quizzes'
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
          error: 'Search query is required'
        });
      }

      const results = await storage.searchSectionContent({
        query: q,
        contentType,
        sectionName,
        page,
        limit
      });

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error searching section content', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to search section content'
      });
    }
  });

  // Get section statistics for analytics
  app.get('/api/sections/analytics', async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getSectionAnalytics();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching section analytics', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch section analytics'
      });
    }
  });
} 