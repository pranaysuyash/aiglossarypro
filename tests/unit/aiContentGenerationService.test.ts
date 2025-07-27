/**
 * AI Content Generation Service Tests
 *
 * Tests the AI content generation functionality including:
 * - Single model content generation
 * - Multi-model generation
 * - Error handling and retries
 * - Quality scoring and verification
 * - Cost tracking and analytics
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiContentGenerationService, ContentGenerationRequest } from '../../server/services/aiContentGenerationService';
import { db } from '../../server/db';
import { enhancedTerms, sections, sectionItems, aiUsageAnalytics } from '../../shared/enhancedSchema';
import { eq } from 'drizzle-orm';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                content: 'Generated test content',
                qualityScore: 0.95,
                metadata: {
                  sources: ['test source'],
                  relevance: 0.9
                }
              })
            }
          }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150
          }
        })
      }
    }
  }))
}));

// Mock logger
vi.mock('../../server/utils/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock prompt template service
vi.mock('../../server/services/promptTemplateService', () => ({
  promptTemplateService: {
    getPromptForSection: vi.fn().mockResolvedValue({
      systemPrompt: 'System prompt',
      userPrompt: 'User prompt'
    })
  }
}));

describe('AI Content Generation Service', () => {
  const testTermId = 'test-term-id';
  const testSectionName = 'overview';
  const testUserId = 'test-user-id';

  beforeEach(async () => {
    // Setup test data
    await db.insert(enhancedTerms).values({
      id: testTermId,
      name: 'Test Term',
      shortDefinition: 'Test definition',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await db.insert(sections).values({
      id: 'test-section-id',
      termId: testTermId,
      sectionName: testSectionName,
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(sectionItems).where(eq(sectionItems.termId, testTermId));
    await db.delete(sections).where(eq(sections.termId, testTermId));
    await db.delete(enhancedTerms).where(eq(enhancedTerms.id, testTermId));
    await db.delete(aiUsageAnalytics).where(eq(aiUsageAnalytics.termId, testTermId));
    vi.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should generate content for a term section', async () => {
      const request: ContentGenerationRequest = {
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      };

      const result = await aiContentGenerationService.generateContent(request);

      expect(result).toBeDefined();
      expect(result.content).toBe('Generated test content');
      expect(result.qualityScore).toBe(0.95);
      expect(result.model).toBe('gpt-4');
      expect(result.promptTokens).toBe(100);
      expect(result.completionTokens).toBe(50);
      expect(result.totalTokens).toBe(150);
    });

    it('should not regenerate existing content unless forced', async () => {
      // First generate content
      await aiContentGenerationService.generateContent({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId
      });

      // Try to generate again without regenerate flag
      const result = await aiContentGenerationService.generateContent({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId
      });

      expect(result.content).toBe('Generated test content');
      // Should have called OpenAI only once
      const OpenAI = (await import('openai')).default;
      expect(OpenAI).toHaveBeenCalledTimes(1);
    });

    it('should regenerate content when regenerate flag is true', async () => {
      // First generate content
      await aiContentGenerationService.generateContent({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId
      });

      // Regenerate with flag
      await aiContentGenerationService.generateContent({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId,
        regenerate: true
      });

      const OpenAI = (await import('openai')).default;
      expect(OpenAI).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors gracefully', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));
      (OpenAI as unknown).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      await expect(
        aiContentGenerationService.generateContent({
          termId: testTermId,
          sectionName: testSectionName,
          userId: testUserId
        })
      ).rejects.toThrow('API Error');
    });

    it('should track usage analytics', async () => {
      await aiContentGenerationService.generateContent({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId,
        model: 'gpt-4'
      });

      const analytics = await db
        .select()
        .from(aiUsageAnalytics)
        .where(eq(aiUsageAnalytics.termId, testTermId));

      expect(analytics).toHaveLength(1);
      expect(analytics[0].model).toBe('gpt-4');
      expect(analytics[0].promptTokens).toBe(100);
      expect(analytics[0].completionTokens).toBe(50);
      expect(analytics[0].totalTokens).toBe(150);
    });
  });

  describe('generateMultiModel', () => {
    it('should generate content with multiple models', async () => {
      const models = ['gpt-4', 'gpt-3.5-turbo'];
      
      const result = await aiContentGenerationService.generateMultiModel({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId,
        models
      });

      expect(result.versions).toHaveLength(2);
      expect(result.versions[0].model).toBe('gpt-4');
      expect(result.versions[1].model).toBe('gpt-3.5-turbo');
      expect(result.selectedModel).toBeDefined();
    });

    it('should select best model based on quality score', async () => {
      const OpenAI = (await import('openai')).default;
      let callCount = 0;
      
      (OpenAI as unknown).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockImplementation(() => {
              callCount++;
              return Promise.resolve({
                choices: [{
                  message: {
                    content: JSON.stringify({
                      content: `Generated content ${callCount}`,
                      qualityScore: callCount === 1 ? 0.8 : 0.95,
                      metadata: {}
                    })
                  }
                }],
                usage: {
                  prompt_tokens: 100,
                  completion_tokens: 50,
                  total_tokens: 150
                }
              });
            })
          }
        }
      }));

      const result = await aiContentGenerationService.generateMultiModel({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId,
        models: ['gpt-3.5-turbo', 'gpt-4']
      });

      expect(result.selectedModel).toBe('gpt-4');
      expect(result.selectedVersion.qualityScore).toBe(0.95);
    });
  });

  describe('verifyContent', () => {
    it('should verify generated content quality', async () => {
      const content = 'High quality generated content with examples and detailed explanation.';
      
      const verification = await aiContentGenerationService.verifyContent({
        termId: testTermId,
        sectionName: testSectionName,
        content,
        model: 'gpt-4'
      });

      expect(verification).toBeDefined();
      expect(verification.isValid).toBe(true);
      expect(verification.qualityScore).toBeGreaterThan(0);
      expect(verification.issues).toHaveLength(0);
    });

    it('should detect low quality content', async () => {
      const content = 'Short content.';
      
      const verification = await aiContentGenerationService.verifyContent({
        termId: testTermId,
        sectionName: testSectionName,
        content,
        model: 'gpt-4'
      });

      expect(verification.isValid).toBe(false);
      expect(verification.issues).toContain('Content too short');
    });
  });

  describe('getGenerationStats', () => {
    it('should return generation statistics', async () => {
      // Generate some content
      await aiContentGenerationService.generateContent({
        termId: testTermId,
        sectionName: testSectionName,
        userId: testUserId,
        model: 'gpt-4'
      });

      const stats = await aiContentGenerationService.getGenerationStats({
        startDate: new Date(Date.now() - 86400000), // 1 day ago
        endDate: new Date()
      });

      expect(stats).toBeDefined();
      expect(stats.totalGenerations).toBe(1);
      expect(stats.totalTokens).toBe(150);
      expect(stats.modelUsage['gpt-4']).toBe(1);
    });
  });

  describe('getCostEstimate', () => {
    it('should estimate generation cost', async () => {
      const estimate = await aiContentGenerationService.getCostEstimate({
        termId: testTermId,
        sectionName: testSectionName,
        model: 'gpt-4',
        estimatedTokens: 1000
      });

      expect(estimate).toBeDefined();
      expect(estimate.estimatedCost).toBeGreaterThan(0);
      expect(estimate.model).toBe('gpt-4');
      expect(estimate.estimatedTokens).toBe(1000);
    });
  });
});