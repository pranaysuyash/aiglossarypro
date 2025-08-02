import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enhancedAIContentService } from '../../server/services/enhancedAIContentService';
import { getColumnById } from '../../shared/all296ColumnDefinitions';
// Mock dependencies
vi.mock('../../server/db');
vi.mock('../../shared/all296ColumnDefinitions');
vi.mock('openai');
vi.mock('../../server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}));
describe('EnhancedAIContentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock environment variable
        process.env.OPENAI_API_KEY = 'test-api-key';
        // Mock OpenAI
        vi.mock('openai', () => ({
            default: vi.fn(() => ({
                chat: {
                    completions: {
                        create: vi.fn().mockResolvedValue({
                            choices: [{
                                    message: {
                                        content: JSON.stringify({
                                            content: 'Generated test content',
                                            metadata: {
                                                quality: 'high',
                                                confidence: 0.9
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
    });
    afterEach(() => {
        vi.resetModules();
    });
    describe('generateContent', () => {
        it('should generate content for a valid request', async () => {
            const mockColumn = {
                id: 'definition',
                name: 'Definition',
                section: 'Core Concepts',
                contentType: 'text',
                model: 'gpt-4'
            };
            getColumnById.mockReturnValue(mockColumn);
            const request = {
                termId: 'test-term-id',
                termName: 'Machine Learning',
                columnId: 'definition',
                userId: 'test-user'
            };
            const result = await enhancedAIContentService.generateContent(request);
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.metadata).toBeDefined();
            expect(result.metadata?.model).toBe('gpt-4');
        });
        it('should handle invalid column ID', async () => {
            getColumnById.mockReturnValue(null);
            const request = {
                termId: 'test-term-id',
                termName: 'Machine Learning',
                columnId: 'invalid-column',
                userId: 'test-user'
            };
            const result = await enhancedAIContentService.generateContent(request);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Column not found');
        });
        it('should handle OpenAI API errors gracefully', async () => {
            const mockColumn = {
                id: 'definition',
                name: 'Definition',
                section: 'Core Concepts',
                contentType: 'text',
                model: 'gpt-4'
            };
            getColumnById.mockReturnValue(mockColumn);
            // Mock OpenAI to throw error
            const OpenAI = (await import('openai')).default;
            OpenAI.mockImplementation(() => ({
                chat: {
                    completions: {
                        create: vi.fn().mockRejectedValue(new Error('API Error'))
                    }
                }
            }));
            const request = {
                termId: 'test-term-id',
                termName: 'Machine Learning',
                columnId: 'definition',
                userId: 'test-user'
            };
            const result = await enhancedAIContentService.generateContent(request);
            expect(result.success).toBe(false);
            expect(result.error).toContain('API Error');
        });
    });
    describe('evaluateContent', () => {
        it('should evaluate existing content', async () => {
            const request = {
                termId: 'test-term-id',
                columnId: 'definition',
                content: 'This is a test definition of machine learning.',
                userId: 'test-user'
            };
            const result = await enhancedAIContentService.evaluateContent(request);
            expect(result.success).toBe(true);
            expect(result.score).toBeDefined();
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(10);
        });
        it('should handle evaluation errors', async () => {
            // Mock OpenAI to throw error
            const OpenAI = (await import('openai')).default;
            OpenAI.mockImplementation(() => ({
                chat: {
                    completions: {
                        create: vi.fn().mockRejectedValue(new Error('Evaluation failed'))
                    }
                }
            }));
            const request = {
                termId: 'test-term-id',
                columnId: 'definition',
                content: 'Test content',
                userId: 'test-user'
            };
            const result = await enhancedAIContentService.evaluateContent(request);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Evaluation failed');
        });
    });
    describe('improveContent', () => {
        it('should improve content based on evaluation feedback', async () => {
            const request = {
                termId: 'test-term-id',
                columnId: 'definition',
                content: 'Simple definition',
                evaluationFeedback: 'Add more technical details',
                userId: 'test-user'
            };
            const result = await enhancedAIContentService.improveContent(request);
            expect(result.success).toBe(true);
            expect(result.improvedContent).toBeDefined();
            expect(result.changes).toBeDefined();
        });
    });
    describe('generateWithPipeline', () => {
        it('should execute full generation pipeline', async () => {
            const mockColumn = {
                id: 'definition',
                name: 'Definition',
                section: 'Core Concepts',
                contentType: 'text',
                model: 'gpt-4'
            };
            getColumnById.mockReturnValue(mockColumn);
            const request = {
                termId: 'test-term-id',
                termName: 'Machine Learning',
                columnId: 'definition',
                userId: 'test-user',
                options: {
                    mode: 'full-pipeline',
                    qualityThreshold: 7.5
                }
            };
            const result = await enhancedAIContentService.generateWithPipeline(request);
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.metadata?.pipelineStage).toBe('completed');
            expect(result.qualityScore).toBeDefined();
        });
        it('should handle generate-only mode', async () => {
            const mockColumn = {
                id: 'definition',
                name: 'Definition',
                section: 'Core Concepts',
                contentType: 'text',
                model: 'gpt-4'
            };
            getColumnById.mockReturnValue(mockColumn);
            const request = {
                termId: 'test-term-id',
                termName: 'Machine Learning',
                columnId: 'definition',
                userId: 'test-user',
                options: {
                    mode: 'generate-only'
                }
            };
            const result = await enhancedAIContentService.generateWithPipeline(request);
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.metadata?.pipelineStage).toBe('generated');
        });
    });
});
