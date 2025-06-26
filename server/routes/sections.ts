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
      console.error('Error fetching term sections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch term sections'
      });
    }
  });

  // Get specific section with items
  app.get('/api/sections/:sectionId', async (req: Request, res: Response) => {
    try {
      const { sectionId } = req.params;
      const userId = req.user?.claims?.sub;

      const section = await storage.getSectionById(parseInt(sectionId));
      const items = await storage.getSectionItems(parseInt(sectionId));
      const userProgress = userId ? await storage.getUserProgressForSection(userId, parseInt(sectionId)) : undefined;

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
      console.error('Error fetching section:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch section'
      });
    }
  });

  // Update user progress for a section
  app.patch('/api/progress/:termId/:sectionId', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { termId, sectionId } = req.params;
      const userId = req.user!.claims.sub;
      const progressUpdate: IProgressUpdate = req.body;

      await storage.updateUserProgress(
        userId,
        parseInt(termId),
        parseInt(sectionId),
        progressUpdate
      );

      res.json({
        success: true,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      console.error('Error updating progress:', error);
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
      console.error('Error fetching progress summary:', error);
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
      const { page = 1, limit = 12 } = req.query;
      const galleries = await storage.getContentGallery('Applications', {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: galleries
      });
    } catch (error) {
      console.error('Error fetching applications gallery:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications gallery'
      });
    }
  });

  // Ethics Hub
  app.get('/api/content/ethics', async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 12 } = req.query;
      const galleries = await storage.getContentGallery('Ethics and Responsible AI', {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: galleries
      });
    } catch (error) {
      console.error('Error fetching ethics hub:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ethics hub'
      });
    }
  });

  // Hands-on Tutorials
  app.get('/api/content/tutorials', async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 12 } = req.query;
      const galleries = await storage.getContentGallery('Hands-on Tutorials', {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: galleries
      });
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tutorials'
      });
    }
  });

  // Quick Quiz system
  app.get('/api/content/quizzes', async (req: Request, res: Response) => {
    try {
      const { termId, difficulty } = req.query;
      const quizzes = await storage.getQuizzes({
        termId: termId ? parseInt(termId as string) : undefined,
        difficulty: difficulty as 'easy' | 'medium' | 'hard' | undefined
      });

      res.json({
        success: true,
        data: quizzes
      });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quizzes'
      });
    }
  });

  // Search across all section content
  app.get('/api/sections/search', async (req: Request, res: Response) => {
    try {
      const { q, contentType, sectionName, page = 1, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const results = await storage.searchSectionContent({
        query: q as string,
        contentType: contentType as string,
        sectionName: sectionName as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error searching section content:', error);
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
      console.error('Error fetching section analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch section analytics'
      });
    }
  });
} 