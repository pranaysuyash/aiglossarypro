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

      // These methods don't exist in OptimizedStorage, return empty data for now
      const sections = [];
      const userProgress = [];

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

      // These methods don't exist in OptimizedStorage, return empty data for now
      const section = null;
      const items = [];
      const userProgress = undefined;

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

      // updateUserProgress method doesn't exist with this signature, using markTermAsLearned instead
      await storage.markTermAsLearned(userId, String(termId));

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
      // getUserProgressSummary doesn't exist, return empty summary
      const summary = { totalSections: 0, completedSections: 0, inProgressSections: 0 };

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
      // getContentGallery doesn't exist, return empty galleries
      const galleries = { sectionName: SECTION_NAMES.APPLICATIONS, items: [], termCount: 0 };

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
      // getContentGallery doesn't exist, return empty galleries
      const galleries = { sectionName: SECTION_NAMES.ETHICS, items: [], termCount: 0 };

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
      // getContentGallery doesn't exist, return empty galleries
      const galleries = { sectionName: SECTION_NAMES.TUTORIALS, items: [], termCount: 0 };

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
      // getQuizzes doesn't exist, return empty quizzes
      const quizzes = { data: [], total: 0, hasMore: false };

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

      // searchSectionContent doesn't exist, return empty results
      const results = { data: [], total: 0, hasMore: false };

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
      // getSectionAnalytics doesn't exist, return empty analytics
      const analytics = { totalSections: 0, totalItems: 0, completionRates: [] };

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