import type { Express } from "express";
import { aiService } from "./aiService";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { isUserAdmin } from "./utils/authUtils";

export function registerAIRoutes(app: Express): void {
  // Generate definition for a new term
  app.post('/api/ai/generate-definition', isAuthenticated, async (req: any, res) => {
    try {
      const { term, category, context } = req.body;
      
      if (!term || typeof term !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Term is required and must be a string' 
        });
      }

      const result = await aiService.generateDefinition(term, category, context);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating definition:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate definition'
      });
    }
  });

  // Get term suggestions
  app.get('/api/ai/term-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const focusCategory = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 8;
      
      // Get existing terms and categories
      const categories = await storage.getCategories();
      const existingTerms = await storage.getAllTermNames();
      
      const result = await aiService.generateTermSuggestions(
        existingTerms, 
        categories, 
        focusCategory
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating term suggestions:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      });
    }
  });

  // Categorize a term
  app.post('/api/ai/categorize-term', isAuthenticated, async (req: any, res) => {
    try {
      const { term, definition } = req.body;
      
      if (!term || !definition) {
        return res.status(400).json({ 
          success: false, 
          error: 'Term and definition are required' 
        });
      }

      const categories = await storage.getCategories();
              const result = await aiService.categorizeTerm(term, definition, categories);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error categorizing term:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to categorize term'
      });
    }
  });

  // Semantic search
  app.get('/api/ai/semantic-search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: { matches: [] }
        });
      }

      // Get only the terms we need for semantic analysis (much more efficient!)
      const searchLimit = Math.min(100, limit * 10); // Get 10x the requested results for better selection
      const allTerms = await storage.getAllTermsForSearch(searchLimit);
      
      if (allTerms.length === 0) {
        return res.json({
          success: true,
          data: { matches: [] }
        });
      }

      const result = await aiService.semanticSearch(query, allTerms, limit);
      
      // Fetch full term details for the matches
      const termDetails = await Promise.all(
        result.matches.map(async (match) => {
          const term = await storage.getTermById(match.termId);
          return {
            ...match,
            term: term
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          matches: termDetails.filter(m => m.term !== null)
        }
      });
    } catch (error) {
      console.error('Error performing semantic search:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to perform semantic search'
      });
    }
  });

  // Improve existing term definition
  app.post('/api/ai/improve-definition/:id', isAuthenticated, async (req: any, res) => {
    try {
      const termId = req.params.id;
      
      const term = await storage.getTermById(termId);
      if (!term) {
        return res.status(404).json({ 
          success: false, 
          error: 'Term not found' 
        });
      }

      const result = await aiService.improveDefinition(term);
      
      res.json({
        success: true,
        data: result,
        originalTerm: term
      });
    } catch (error) {
      console.error('Error improving definition:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to improve definition'
      });
    }
  });

  // Apply AI-generated improvements to a term
  app.put('/api/ai/apply-improvements/:id', isAuthenticated, async (req: any, res) => {
    try {
      const termId = req.params.id;
      const { improvements } = req.body;
      
      // Only allow admin to apply improvements
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false, 
          error: "Admin privileges required" 
        });
      }

      const term = await storage.getTermById(termId);
      if (!term) {
        return res.status(404).json({ 
          success: false, 
          error: 'Term not found' 
        });
      }

      // Update the term with AI improvements
      const updatedTerm = await storage.updateTerm(termId, {
        shortDefinition: improvements.shortDefinition || term.shortDefinition,
        definition: improvements.definition || term.definition,
        characteristics: improvements.characteristics || term.characteristics,
        applications: improvements.applications || term.applications,
        mathFormulation: improvements.mathFormulation || term.mathFormulation
      });

      res.json({
        success: true,
        data: updatedTerm
      });
    } catch (error) {
      console.error('Error applying improvements:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to apply improvements'
      });
    }
  });

  // Note: Batch categorize functionality moved to /api/admin/batch/categorize

  // Get AI service status and stats
  app.get('/api/ai/status', isAuthenticated, async (req: any, res) => {
    try {
      const cacheStats = aiService.getCacheStats();
      const rateLimitStatus = aiService.getRateLimitStatus();
      
      res.json({
        success: true,
        data: {
          status: 'operational',
          cache: cacheStats,
          rateLimit: rateLimitStatus,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting AI service status:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get service status'
      });
    }
  });

  // Clear AI cache (admin only)
  app.delete('/api/ai/cache', isAuthenticated, async (req: any, res) => {
    try {
      // Only allow admin
      const userId = req.user.claims.sub;
      const isAdmin = await isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false, 
          error: "Admin privileges required" 
        });
      }

      aiService.clearCache();
      
      res.json({
        success: true,
        message: 'AI cache cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing AI cache:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear cache'
      });
    }
  });

  // Get AI-powered content suggestions for improving the glossary
  app.get('/api/ai/content-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const categories = await storage.getCategories();
      const termCount = await storage.getTermCount();
      const recentTerms = await storage.getRecentTerms(10);
      
      // Get suggestions based on current content
      const existingTerms = recentTerms.map(t => t.name);
      const suggestions = await aiService.generateTermSuggestions(
        existingTerms,
        categories
      );

      res.json({
        success: true,
        data: {
          totalTerms: termCount,
          totalCategories: categories.length,
          suggestions: suggestions.suggestions,
          recommendations: [
            {
              type: 'coverage',
              message: `Your glossary has ${termCount} terms across ${categories.length} categories. Consider adding more terms in underrepresented areas.`
            },
            {
              type: 'trending',
              message: 'Focus on emerging AI/ML concepts like Large Language Models, Prompt Engineering, and Retrieval-Augmented Generation.'
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error getting content suggestions:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get content suggestions'
      });
    }
  });
}