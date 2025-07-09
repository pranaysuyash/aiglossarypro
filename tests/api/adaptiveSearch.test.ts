/**
 * Adaptive Search API Tests
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerAdaptiveSearchRoutes } from '../../server/routes/adaptiveSearch';

// Mock the adaptive search service
vi.mock('../../server/adaptiveSearchService', () => ({
  adaptiveSearch: vi.fn(),
}));

// Mock the security middleware
vi.mock('../../server/middleware/security', () => ({
  searchQuerySchema: {
    parse: vi.fn(),
  },
  paginationSchema: {
    parse: vi.fn(),
  },
}));

describe('Adaptive Search API', () => {
  let app: express.Application;
  let mockAdaptiveSearch: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    registerAdaptiveSearchRoutes(app);

    const { adaptiveSearch } = await import('../../server/adaptiveSearchService');
    mockAdaptiveSearch = vi.mocked(adaptiveSearch);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/adaptive-search', () => {
    it('should return search results for valid query', async () => {
      const mockResults = {
        results: [
          {
            id: '1',
            name: 'Neural Network',
            shortDefinition: 'A computing system inspired by biological neural networks',
            category: { id: '1', name: 'Deep Learning' },
            viewCount: 100,
            relevanceScore: 95,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        searchTime: 150,
        query: 'neural network',
        hasMore: false,
        strategy: 'fts',
        isGeneric: false,
      };

      mockAdaptiveSearch.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/adaptive-search')
        .query({ query: 'neural network' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        ...mockResults,
        searchType: 'adaptive',
        aiEnhanced: true,
      });
      expect(response.body.data.results[0]).toHaveProperty('semanticSimilarity');
      expect(response.body.data.results[0]).toHaveProperty('conceptRelationships');
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await request(app).get('/api/adaptive-search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should return 400 for empty query parameter', async () => {
      const response = await request(app).get('/api/adaptive-search').query({ query: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should handle page and limit parameters', async () => {
      const mockResults = {
        results: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
        searchTime: 50,
        query: 'test',
        hasMore: false,
        strategy: 'fts',
        isGeneric: false,
      };

      mockAdaptiveSearch.mockResolvedValueOnce(mockResults);

      const response = await request(app).get('/api/adaptive-search').query({
        query: 'test',
        page: '2',
        limit: '10',
      });

      expect(response.status).toBe(200);
      expect(mockAdaptiveSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          page: 2,
          limit: 10,
        })
      );
    });

    it('should cap limit at 100', async () => {
      const mockResults = {
        results: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
        searchTime: 50,
        query: 'test',
        hasMore: false,
        strategy: 'fts',
        isGeneric: false,
      };

      mockAdaptiveSearch.mockResolvedValueOnce(mockResults);

      const response = await request(app).get('/api/adaptive-search').query({
        query: 'test',
        limit: '200',
      });

      expect(response.status).toBe(200);
      expect(mockAdaptiveSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    it('should handle search service errors', async () => {
      mockAdaptiveSearch.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app).get('/api/adaptive-search').query({ query: 'test' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Adaptive search failed');
    });
  });

  describe('GET /api/adaptive-search/suggestions', () => {
    it('should return suggestions for valid query', async () => {
      const mockResults = {
        results: [
          {
            id: '1',
            name: 'Neural Network',
            category: { name: 'Deep Learning' },
            relevanceScore: 95,
            viewCount: 100,
          },
        ],
      };

      mockAdaptiveSearch.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/adaptive-search/suggestions')
        .query({ query: 'neural' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('type', 'term');
        expect(response.body[0]).toHaveProperty('aiRanked', true);
      }
    });

    it('should return empty array for short query', async () => {
      const response = await request(app)
        .get('/api/adaptive-search/suggestions')
        .query({ query: 'a' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should limit suggestions count', async () => {
      const mockResults = {
        results: Array.from({ length: 50 }, (_, i) => ({
          id: `${i}`,
          name: `Term ${i}`,
          category: { name: 'Test' },
          relevanceScore: 50,
          viewCount: 10,
        })),
      };

      mockAdaptiveSearch.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/adaptive-search/suggestions')
        .query({ query: 'term', limit: '5' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/adaptive-search/related', () => {
    it('should return related concepts for valid term ID', async () => {
      const mockResults = {
        results: [
          {
            id: '2',
            name: 'Deep Learning',
            category: { name: 'Machine Learning' },
            relevanceScore: 80,
          },
        ],
      };

      mockAdaptiveSearch.mockResolvedValueOnce(mockResults);

      const response = await request(app)
        .get('/api/adaptive-search/related')
        .query({ termId: '1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for missing term ID', async () => {
      const response = await request(app).get('/api/adaptive-search/related');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Term ID is required');
    });
  });

  describe('GET /api/adaptive-search/analytics', () => {
    it('should return analytics for valid query', async () => {
      const response = await request(app)
        .get('/api/adaptive-search/analytics')
        .query({ query: 'neural network' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('queryComplexity');
      expect(response.body.data).toHaveProperty('suggestedRefinements');
      expect(response.body.data).toHaveProperty('topicCoverage');
      expect(response.body.data).toHaveProperty('searchDifficulty');
      expect(response.body.data).toHaveProperty('recommendedFilters');
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app).get('/api/adaptive-search/analytics');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Query is required for analytics');
    });
  });

  describe('Search highlighting security', () => {
    it('should sanitize HTML in search highlighting', async () => {
      const mockResults = {
        results: [
          {
            id: '1',
            name: 'Test <script>alert("xss")</script> Term',
            shortDefinition: 'A test definition',
            category: { name: 'Test' },
            relevanceScore: 50,
            viewCount: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        searchTime: 50,
        query: 'test',
        hasMore: false,
        strategy: 'fts',
        isGeneric: false,
      };

      mockAdaptiveSearch.mockResolvedValueOnce(mockResults);

      const response = await request(app).get('/api/adaptive-search').query({ query: 'test' });

      expect(response.status).toBe(200);
      // Check that script tags are sanitized in the response
      const resultName = response.body.data.results[0].name;
      expect(resultName).not.toContain('<script>');
      expect(resultName).not.toContain('alert');
    });
  });
});
