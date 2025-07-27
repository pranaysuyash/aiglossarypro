import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { qualityAnalyticsService } from '../../server/services/qualityAnalyticsService';
import * as db from '../../server/db';
import * as logger from '../../server/utils/logger';

// Mock dependencies
vi.mock('../../server/db');
vi.mock('../../server/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}));

describe('QualityAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock database queries
    (db as any).db = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('analyzeTermQuality', () => {
    it('should analyze term quality and return metrics', async () => {
      // Mock term data
      const mockTerm = {
        id: 'test-term-id',
        name: 'Machine Learning',
        shortDefinition: 'A subset of AI',
        longDefinition: 'Machine learning is a method of data analysis...',
        relatedTerms: ['AI', 'Deep Learning'],
        tags: ['technology', 'ai'],
        metadata: {}
      };

      (db as any).db.execute.mockResolvedValueOnce([mockTerm]);

      const result = await qualityAnalyticsService.analyzeTermQuality('test-term-id');

      expect(result.termId).toBe('test-term-id');
      expect(result.scores).toBeDefined();
      expect(result.scores.completeness).toBeGreaterThanOrEqual(0);
      expect(result.scores.completeness).toBeLessThanOrEqual(1);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(10);
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.improvements).toBeInstanceOf(Array);
    });

    it('should identify quality issues', async () => {
      // Mock term with quality issues
      const mockTerm = {
        id: 'test-term-id',
        name: 'ML',
        shortDefinition: '', // Missing short definition
        longDefinition: 'Short desc', // Too short
        relatedTerms: [],
        tags: [],
        metadata: {}
      };

      (db as any).db.execute.mockResolvedValueOnce([mockTerm]);

      const result = await qualityAnalyticsService.analyzeTermQuality('test-term-id');

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.type === 'missing_content')).toBe(true);
      expect(result.overallScore).toBeLessThan(5);
    });

    it('should handle missing term gracefully', async () => {
      (db as any).db.execute.mockResolvedValueOnce([]);

      await expect(
        qualityAnalyticsService.analyzeTermQuality('non-existent-id')
      ).rejects.toThrow('Term not found');
    });
  });

  describe('generateQualityReport', () => {
    it('should generate comprehensive quality report', async () => {
      // Mock data for report
      const mockTerms = [
        { id: '1', name: 'Term1', overallScore: 8.5 },
        { id: '2', name: 'Term2', overallScore: 6.2 },
        { id: '3', name: 'Term3', overallScore: 9.1 }
      ];

      (db as any).db.execute.mockResolvedValue(mockTerms);

      const report = await qualityAnalyticsService.generateQualityReport();

      expect(report.reportId).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalTerms).toBe(3);
      expect(report.summary.averageScore).toBeCloseTo(7.93, 1);
      expect(report.termsByQuality).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should categorize terms by quality level', async () => {
      const mockTerms = [
        { id: '1', name: 'Excellent', overallScore: 9.5 },
        { id: '2', name: 'Good', overallScore: 7.0 },
        { id: '3', name: 'Fair', overallScore: 5.5 },
        { id: '4', name: 'Poor', overallScore: 3.0 }
      ];

      (db as any).db.execute.mockResolvedValue(mockTerms);

      const report = await qualityAnalyticsService.generateQualityReport();

      expect(report.termsByQuality.excellent).toBe(1);
      expect(report.termsByQuality.good).toBe(1);
      expect(report.termsByQuality.fair).toBe(1);
      expect(report.termsByQuality.poor).toBe(1);
    });
  });

  describe('trackQualityMetrics', () => {
    it('should track quality metrics over time', async () => {
      const metrics = {
        termId: 'test-term-id',
        score: 8.5,
        dimensions: {
          completeness: 0.9,
          accuracy: 0.85,
          clarity: 0.8,
          structure: 0.85
        }
      };

      await qualityAnalyticsService.trackQualityMetrics(metrics);

      expect(db.db.insert).toHaveBeenCalled();
      expect(db.db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          termId: 'test-term-id',
          score: 8.5
        })
      );
    });
  });

  describe('getQualityTrends', () => {
    it('should return quality trends for a term', async () => {
      const mockHistory = [
        { score: 6.0, evaluatedAt: new Date('2024-01-01') },
        { score: 7.0, evaluatedAt: new Date('2024-01-15') },
        { score: 8.0, evaluatedAt: new Date('2024-02-01') }
      ];

      (db as any).db.execute.mockResolvedValueOnce(mockHistory);

      const trends = await qualityAnalyticsService.getQualityTrends('test-term-id');

      expect(trends.termId).toBe('test-term-id');
      expect(trends.trend.direction).toBe('improving');
      expect(trends.trend.rate).toBeGreaterThan(0);
      expect(trends.historicalScores).toHaveLength(3);
    });

    it('should identify declining trends', async () => {
      const mockHistory = [
        { score: 8.0, evaluatedAt: new Date('2024-01-01') },
        { score: 7.0, evaluatedAt: new Date('2024-01-15') },
        { score: 6.0, evaluatedAt: new Date('2024-02-01') }
      ];

      (db as any).db.execute.mockResolvedValueOnce(mockHistory);

      const trends = await qualityAnalyticsService.getQualityTrends('test-term-id');

      expect(trends.trend.direction).toBe('declining');
      expect(trends.trend.rate).toBeLessThan(0);
    });
  });

  describe('compareQualityAcrossCategories', () => {
    it('should compare quality across different categories', async () => {
      const mockCategoryData = [
        { category: 'Machine Learning', avgScore: 8.2, termCount: 50 },
        { category: 'Deep Learning', avgScore: 7.8, termCount: 30 },
        { category: 'NLP', avgScore: 8.5, termCount: 25 }
      ];

      (db as any).db.execute.mockResolvedValueOnce(mockCategoryData);

      const comparison = await qualityAnalyticsService.compareQualityAcrossCategories();

      expect(comparison).toHaveLength(3);
      expect(comparison[0].category).toBe('NLP'); // Highest average
      expect(comparison[0].averageScore).toBe(8.5);
      expect(comparison[0].termCount).toBe(25);
    });
  });

  describe('getImprovementRecommendations', () => {
    it('should generate improvement recommendations', async () => {
      const analysis = {
        termId: 'test-term-id',
        scores: {
          completeness: 0.4,
          accuracy: 0.9,
          clarity: 0.6,
          structure: 0.8
        },
        issues: [
          { type: 'missing_content', severity: 'high', field: 'examples' }
        ]
      };

      const recommendations = await qualityAnalyticsService.getImprovementRecommendations(
        'test-term-id',
        analysis as any
      );

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.priority === 'high')).toBe(true);
      expect(recommendations.some(r => r.area === 'completeness')).toBe(true);
    });
  });
});