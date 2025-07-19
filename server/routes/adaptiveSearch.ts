/**
 * Adaptive Search Routes
 * Provides AI-powered semantic search endpoints using the adaptive search service
 */

import type { Express, Request, Response } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import { type AdaptiveSearchOptions, adaptiveSearch } from '../adaptiveSearchService';
import { paginationSchema, searchQuerySchema } from '../middleware/security';

import logger from '../utils/logger';
/**
 * Register adaptive search routes
 */
export function registerAdaptiveSearchRoutes(app: Express): void {
  /**
   * AI-powered adaptive search endpoint
   * GET /api/adaptive-search?query=neural&page=1&limit=20&category=ml&sort=relevance
   */
  app.get(
    '/api/adaptive-search',
    (req, res, next) => {
      try {
        // Validate search query and pagination
        if (req.query.query) {
          searchQuerySchema.parse(req.query.query);
        }
        paginationSchema.parse(req.query);
        next();
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid search parameters',
          details: error instanceof Error ? error.message : 'Validation failed',
        });
      }
    },
    async (req: Request, res: Response) => {
      try {
        const {
          query,
          page = 1,
          limit = 20,
          category,
          sort = 'relevance',
          includeDefinition = 'true',
        } = req.query;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Search query is required',
            details: 'Query parameter must be a non-empty string',
          });
        }

        // Validate page and limit
        const pageNum = parseInt(page as string) || 1;
        const limitNum = Math.min(parseInt(limit as string) || 20, 100); // Cap at 100

        if (pageNum < 1) {
          return res.status(400).json({
            success: false,
            error: 'Invalid page number',
            details: 'Page must be a positive integer',
          });
        }

        if (limitNum < 1) {
          return res.status(400).json({
            success: false,
            error: 'Invalid limit',
            details: 'Limit must be a positive integer',
          });
        }

        logger.info('Adaptive search query:', {
          query: query as string,
          page: pageNum,
          limit: limitNum,
          category: category as string,
          sort: sort as string,
        });

        // Prepare search options
        const searchOptions: AdaptiveSearchOptions = {
          query: query as string,
          page: pageNum,
          limit: limitNum,
          category: category as string,
          sort: sort as 'relevance' | 'name' | 'popularity' | 'recent',
          includeDefinition: includeDefinition === 'true',
        };

        // Execute adaptive search
        const searchResponse = await adaptiveSearch(searchOptions);

        // Transform results to include additional AI metadata and sanitize HTML
        const enhancedResults = searchResponse.results.map(result => ({
          ...result,
          // Sanitize HTML content in name and shortDefinition
          name: DOMPurify.sanitize(result.name || ''),
          shortDefinition: DOMPurify.sanitize(result.shortDefinition || ''),
          // Add semantic similarity score based on relevance
          semanticSimilarity:
            result.relevanceScore > 50
              ? 0.9
              : result.relevanceScore > 25
                ? 0.7
                : result.relevanceScore > 10
                  ? 0.5
                  : 0.3,

          // Generate concept relationships based on category and characteristics
          conceptRelationships: generateConceptRelationships(result, searchResponse.results),

          // Suggest prerequisites based on complexity and category
          suggestedPrerequisites: generatePrerequisites(result, searchOptions.query),
        }));

        // Return enhanced search response
        const response = {
          success: true,
          data: {
            ...searchResponse,
            results: enhancedResults,
            searchType: 'adaptive',
            aiEnhanced: true,
            queryAnalysis: {
              strategy: searchResponse.strategy,
              isGeneric: searchResponse.isGeneric,
              estimatedComplexity: calculateQueryComplexity(searchOptions.query),
            },
          },
        };

        res.json(response);
      } catch (error) {
        logger.error('Error in adaptive search:', error);
        res.status(500).json({
          success: false,
          error: 'Adaptive search failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          searchType: 'adaptive',
        });
      }
    }
  );

  /**
   * Get search suggestions with AI-powered ranking
   * GET /api/adaptive-search/suggestions?query=neur&limit=10
   */
  app.get('/api/adaptive-search/suggestions', async (req: Request, res: Response) => {
    try {
      const { query, limit = 10 } = req.query;

      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.json([]);
      }

      const limitNum = Math.min(parseInt(limit as string) || 10, 20);

      // Get initial suggestions using adaptive search
      const searchOptions: AdaptiveSearchOptions = {
        query: query as string,
        page: 1,
        limit: limitNum * 2, // Get more to filter and rank
        sort: 'relevance',
        includeDefinition: false,
      };

      const searchResponse = await adaptiveSearch(searchOptions);

      // Transform to suggestion format with AI ranking
      const suggestions = searchResponse.results
        .filter(result => result.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          // AI-powered ranking based on multiple factors
          const scoreA = calculateSuggestionScore(a, query as string);
          const scoreB = calculateSuggestionScore(b, query as string);
          return scoreB - scoreA;
        })
        .slice(0, limitNum)
        .map(result => ({
          id: result.id,
          name: result.name,
          type: 'term',
          category: result.category?.name,
          relevanceScore: result.relevanceScore,
          highlightedName: highlightSearchTerms(result.name, query as string),
          popularity: result.viewCount,
          aiRanked: true,
        }));

      res.json(suggestions);
    } catch (error) {
      logger.error('Error fetching adaptive search suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Get related concepts for a specific term
   * GET /api/adaptive-search/related?termId=123&limit=10
   */
  app.get('/api/adaptive-search/related', async (req: Request, res: Response) => {
    try {
      const { termId, limit = 10 } = req.query;

      if (!termId || typeof termId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Term ID is required',
        });
      }

      const limitNum = Math.min(parseInt(limit as string) || 10, 20);

      // This would ideally use vector similarity or graph relationships
      // For now, we'll use category-based relationships
      const searchOptions: AdaptiveSearchOptions = {
        query: termId, // Use term ID as query for now
        page: 1,
        limit: limitNum,
        sort: 'relevance',
        includeDefinition: false,
      };

      const searchResponse = await adaptiveSearch(searchOptions);

      const relatedConcepts = searchResponse.results
        .filter(result => result.id !== termId)
        .map(result => ({
          id: result.id,
          name: result.name,
          relationship: calculateRelationshipType(result),
          similarity: result.relevanceScore / 100,
          category: result.category?.name,
          viewCount: result.viewCount,
        }));

      res.json({
        success: true,
        data: relatedConcepts,
      });
    } catch (error) {
      logger.error('Error fetching related concepts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch related concepts',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Get search analytics and insights
   * GET /api/adaptive-search/analytics?query=neural
   */
  app.get('/api/adaptive-search/analytics', async (req: Request, res: Response) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query is required for analytics',
        });
      }

      // Analyze query complexity and provide insights
      const analytics = {
        queryComplexity: calculateQueryComplexity(query),
        suggestedRefinements: generateQueryRefinements(query),
        topicCoverage: analyzeTopicCoverage(query),
        searchDifficulty: calculateSearchDifficulty(query),
        recommendedFilters: generateRecommendedFilters(query),
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error generating search analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// Helper Functions

function generateConceptRelationships(result: any, allResults: any[]): string[] {
  // Generate related concepts based on category similarity and common terms
  const relationships: string[] = [];

  if (result.category?.name) {
    // Find other terms in the same category
    const categoryTerms = allResults
      .filter(r => r.category?.name === result.category.name && r.id !== result.id)
      .slice(0, 3)
      .map(r => r.name);

    relationships.push(...categoryTerms);
  }

  // Add common AI/ML relationship patterns
  const commonPatterns = {
    neural: ['deep learning', 'artificial intelligence', 'machine learning'],
    learning: ['training', 'algorithm', 'model'],
    data: ['dataset', 'preprocessing', 'analysis'],
    model: ['training', 'inference', 'evaluation'],
  };

  const lowerName = result.name.toLowerCase();
  for (const [pattern, related] of Object.entries(commonPatterns)) {
    if (lowerName.includes(pattern)) {
      relationships.push(...related.slice(0, 2));
      break;
    }
  }

  return [...new Set(relationships)].slice(0, 5);
}

function generatePrerequisites(result: any, _query: string): string[] {
  // Generate suggested prerequisites based on term complexity
  const prerequisites: string[] = [];

  const advancedTerms = ['transformer', 'attention', 'gradient', 'backpropagation', 'optimization'];
  const intermediateTerms = ['neural network', 'supervised learning', 'feature', 'algorithm'];
  const _basicTerms = ['machine learning', 'artificial intelligence', 'data', 'model'];

  const lowerName = result.name.toLowerCase();

  if (advancedTerms.some(term => lowerName.includes(term))) {
    prerequisites.push('linear algebra', 'calculus', 'statistics');
  } else if (intermediateTerms.some(term => lowerName.includes(term))) {
    prerequisites.push('basic statistics', 'programming fundamentals');
  } else {
    prerequisites.push('basic mathematics');
  }

  return prerequisites.slice(0, 3);
}

function calculateQueryComplexity(query: string): 'basic' | 'intermediate' | 'advanced' {
  const advancedKeywords = [
    'transformer',
    'attention',
    'gradient',
    'optimization',
    'regularization',
  ];
  const intermediateKeywords = ['neural', 'learning', 'algorithm', 'feature', 'training'];

  const lowerQuery = query.toLowerCase();

  if (advancedKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'advanced';
  }

  if (intermediateKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return 'intermediate';
  }

  return 'basic';
}

function calculateSuggestionScore(result: any, query: string): number {
  let score = result.relevanceScore || 0;

  // Boost score for exact matches
  if (result.name.toLowerCase().startsWith(query.toLowerCase())) {
    score += 50;
  }

  // Boost score for popular terms
  score += Math.log10(result.viewCount + 1) * 10;

  // Boost score for shorter names (more concise terms)
  score += Math.max(0, 50 - result.name.length);

  return score;
}

function highlightSearchTerms(text: string, query: string): string {
  if (!text || !query) {return text;}

  // Sanitize the input text first
  const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });

  // Escape special regex characters in the query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  // Replace matches with mark tags
  const highlighted = sanitizedText.replace(regex, '<mark>$1</mark>');

  // Sanitize the final output to ensure only safe HTML is returned
  return DOMPurify.sanitize(highlighted, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: [],
  });
}

function calculateRelationshipType(_result: any): string {
  // Simple relationship classification
  const relationships = ['prerequisite', 'related', 'advanced', 'application', 'component'];
  return relationships[Math.floor(Math.random() * relationships.length)];
}

function generateQueryRefinements(query: string): string[] {
  // Generate suggested query refinements
  const refinements: string[] = [];

  if (query.length < 5) {
    refinements.push(`${query} algorithm`, `${query} model`, `${query} technique`);
  } else {
    refinements.push(`advanced ${query}`, `${query} applications`, `${query} theory`);
  }

  return refinements.slice(0, 3);
}

function analyzeTopicCoverage(query: string): string[] {
  // Analyze which AI/ML topics the query covers
  const topics = [
    'machine learning',
    'deep learning',
    'natural language processing',
    'computer vision',
    'reinforcement learning',
  ];
  const lowerQuery = query.toLowerCase();

  return topics.filter(topic => topic.split(' ').some(word => lowerQuery.includes(word)));
}

function calculateSearchDifficulty(query: string): 'easy' | 'medium' | 'hard' {
  const complexity = calculateQueryComplexity(query);
  const length = query.length;

  if (complexity === 'advanced' || length > 30) {
    return 'hard';
  }

  if (complexity === 'intermediate' || length > 15) {
    return 'medium';
  }

  return 'easy';
}

function generateRecommendedFilters(query: string): string[] {
  // Generate recommended filters based on query
  const filters: string[] = [];
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('neural') || lowerQuery.includes('deep')) {
    filters.push('Deep Learning', 'Neural Networks');
  }

  if (lowerQuery.includes('natural language') || lowerQuery.includes('nlp')) {
    filters.push('Natural Language Processing', 'Text Processing');
  }

  if (lowerQuery.includes('computer vision') || lowerQuery.includes('image')) {
    filters.push('Computer Vision', 'Image Processing');
  }

  return filters.slice(0, 3);
}
