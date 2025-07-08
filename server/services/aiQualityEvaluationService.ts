import { db } from '../db';
import { 
  enhancedTerms, 
  sections, 
  sectionItems,
  aiUsageAnalytics,
  aiContentVerification,
  termVersions
} from '../../shared/enhancedSchema';
import { eq, and, desc, gte, sql, lte } from 'drizzle-orm';
import { log as logger } from '../utils/logger';
import OpenAI from 'openai';

// Quality dimension types
export interface QualityDimension {
  score: number; // 1-10 scale
  confidence: number; // 0-1 confidence level
  feedback: string; // Specific feedback for this dimension
  issues: string[]; // Specific issues found
  improvements: string[]; // Improvement suggestions
}

export interface QualityEvaluationResult {
  overallScore: number; // Weighted average of all dimensions
  dimensions: {
    accuracy: QualityDimension;
    clarity: QualityDimension;
    completeness: QualityDimension;
    relevance: QualityDimension;
    style: QualityDimension;
    engagement: QualityDimension;
  };
  summary: {
    strengths: string[];
    weaknesses: string[];
    criticalIssues: string[];
    improvements: string[];
  };
  metadata: {
    evaluatedAt: Date;
    evaluationModel: string;
    evaluationTime: number; // milliseconds
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
  };
}

export interface EvaluationRequest {
  termId: string;
  sectionName?: string; // If not provided, evaluate entire term
  content: string;
  contentType: 'definition' | 'example' | 'tutorial' | 'theory' | 'application' | 'general';
  targetAudience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  referenceContent?: string; // Optional high-quality reference for comparison
  model?: string;
  userId?: string;
}

export interface BatchEvaluationRequest {
  evaluations: EvaluationRequest[];
  model?: string;
  userId?: string;
}

export interface QualityAnalyticsRequest {
  startDate?: Date;
  endDate?: Date;
  termId?: string;
  model?: string;
  minScore?: number;
  maxScore?: number;
  groupBy?: 'day' | 'week' | 'month' | 'model' | 'contentType';
}

export interface QualityAnalyticsResult {
  averageScores: {
    overall: number;
    accuracy: number;
    clarity: number;
    completeness: number;
    relevance: number;
    style: number;
    engagement: number;
  };
  trends: {
    date: string;
    scores: {
      overall: number;
      [dimension: string]: number;
    };
    evaluationCount: number;
  }[];
  distribution: {
    scoreRange: string; // e.g., "8-10", "6-8", "4-6", "2-4", "0-2"
    count: number;
    percentage: number;
  }[];
  commonIssues: {
    issue: string;
    frequency: number;
    affectedDimensions: string[];
  }[];
  modelComparison?: {
    model: string;
    averageScore: number;
    evaluationCount: number;
    averageCost: number;
  }[];
}

/**
 * AI-powered Quality Evaluation Service for content assessment
 */
export class AIQualityEvaluationService {
  private openai: OpenAI;
  private readonly DEFAULT_MODEL = 'gpt-4o-mini';
  private readonly EVALUATION_MODELS = ['gpt-4o-mini', 'gpt-4', 'gpt-4-turbo'];
  
  private readonly MODEL_COSTS = {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
  };

  // Dimension weights for overall score calculation
  private readonly DIMENSION_WEIGHTS = {
    accuracy: 0.30,
    clarity: 0.20,
    completeness: 0.20,
    relevance: 0.15,
    style: 0.10,
    engagement: 0.05
  };

  // Quality thresholds
  private readonly QUALITY_THRESHOLDS = {
    excellent: 8.5,
    good: 7.0,
    acceptable: 5.5,
    poor: 4.0
  };

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Evaluate content quality using AI
   */
  async evaluateContent(request: EvaluationRequest): Promise<QualityEvaluationResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting quality evaluation for ${request.termId}`, {
        sectionName: request.sectionName,
        contentType: request.contentType,
        contentLength: request.content.length
      });

      // Get evaluation prompt based on content type
      const evaluationPrompt = this.getEvaluationPrompt(request);

      // Call OpenAI for evaluation
      const completion = await this.openai.chat.completions.create({
        model: request.model || this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No evaluation response from AI');
      }

      // Parse AI response
      const evaluationData = JSON.parse(responseContent);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(evaluationData.dimensions);

      // Build result
      const result: QualityEvaluationResult = {
        overallScore,
        dimensions: evaluationData.dimensions,
        summary: evaluationData.summary,
        metadata: {
          evaluatedAt: new Date(),
          evaluationModel: request.model || this.DEFAULT_MODEL,
          evaluationTime: Date.now() - startTime,
          tokenUsage: {
            prompt: completion.usage?.prompt_tokens || 0,
            completion: completion.usage?.completion_tokens || 0,
            total: completion.usage?.total_tokens || 0
          },
          cost: this.calculateCost(
            request.model || this.DEFAULT_MODEL,
            completion.usage?.prompt_tokens || 0,
            completion.usage?.completion_tokens || 0
          )
        }
      };

      // Store evaluation results
      await this.storeEvaluationResults(request, result);

      // Log analytics
      await this.logEvaluationAnalytics(request, result);

      logger.info(`✅ Quality evaluation completed`, {
        termId: request.termId,
        overallScore,
        evaluationTime: result.metadata.evaluationTime,
        cost: result.metadata.cost
      });

      return result;

    } catch (error) {
      logger.error('Error in quality evaluation:', {
        error: error instanceof Error ? error.message : String(error),
        termId: request.termId
      });
      throw error;
    }
  }

  /**
   * Batch evaluate multiple content pieces
   */
  async batchEvaluate(request: BatchEvaluationRequest): Promise<{
    results: QualityEvaluationResult[];
    summary: {
      totalEvaluations: number;
      averageScore: number;
      successCount: number;
      failureCount: number;
      totalCost: number;
      totalTime: number;
    };
  }> {
    const startTime = Date.now();
    const results: QualityEvaluationResult[] = [];
    let totalCost = 0;
    let totalScore = 0;
    let successCount = 0;
    let failureCount = 0;

    logger.info(`Starting batch evaluation for ${request.evaluations.length} items`);

    for (const evaluation of request.evaluations) {
      try {
        const result = await this.evaluateContent({
          ...evaluation,
          model: evaluation.model || request.model,
          userId: evaluation.userId || request.userId
        });

        results.push(result);
        totalScore += result.overallScore;
        totalCost += result.metadata.cost;
        successCount++;

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        failureCount++;
        logger.error(`Batch evaluation error for ${evaluation.termId}:`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const averageScore = successCount > 0 ? totalScore / successCount : 0;

    logger.info(`Batch evaluation completed`, {
      totalEvaluations: request.evaluations.length,
      successCount,
      failureCount,
      averageScore,
      totalCost,
      totalTime
    });

    return {
      results,
      summary: {
        totalEvaluations: request.evaluations.length,
        averageScore,
        successCount,
        failureCount,
        totalCost,
        totalTime
      }
    };
  }

  /**
   * Get quality analytics and reports
   */
  async getQualityAnalytics(request: QualityAnalyticsRequest): Promise<QualityAnalyticsResult> {
    try {
      // This would require complex database queries
      // For now, returning a structured response
      // In production, this would aggregate data from stored evaluations

      const mockTrends = this.generateMockTrends(request);
      const mockDistribution = this.generateMockDistribution();
      const mockIssues = this.generateMockCommonIssues();

      return {
        averageScores: {
          overall: 7.5,
          accuracy: 8.0,
          clarity: 7.2,
          completeness: 7.8,
          relevance: 7.5,
          style: 7.0,
          engagement: 6.8
        },
        trends: mockTrends,
        distribution: mockDistribution,
        commonIssues: mockIssues,
        modelComparison: request.groupBy === 'model' ? [
          {
            model: 'gpt-4o-mini',
            averageScore: 7.8,
            evaluationCount: 150,
            averageCost: 0.002
          },
          {
            model: 'gpt-4',
            averageScore: 8.2,
            evaluationCount: 50,
            averageCost: 0.15
          }
        ] : undefined
      };

    } catch (error) {
      logger.error('Error getting quality analytics:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Compare content quality against reference
   */
  async compareWithReference(
    content: string,
    reference: string,
    contentType: string
  ): Promise<{
    similarityScore: number;
    improvements: string[];
    missingElements: string[];
    additionalElements: string[];
  }> {
    try {
      const prompt = this.getComparisonPrompt(content, reference, contentType);

      const completion = await this.openai.chat.completions.create({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert content evaluator specializing in technical content comparison.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      return {
        similarityScore: result.similarityScore || 0,
        improvements: result.improvements || [],
        missingElements: result.missingElements || [],
        additionalElements: result.additionalElements || []
      };

    } catch (error) {
      logger.error('Error comparing with reference:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get evaluation prompt based on content type
   */
  private getEvaluationPrompt(request: EvaluationRequest): string {
    const audienceContext = request.targetAudience 
      ? `The target audience is ${request.targetAudience} level learners.`
      : '';

    const referenceContext = request.referenceContent
      ? `\n\nREFERENCE CONTENT FOR COMPARISON:\n${request.referenceContent}`
      : '';

    return `Evaluate the following ${request.contentType} content for an AI/ML glossary term.

CONTENT TO EVALUATE:
${request.content}

${audienceContext}
${referenceContext}

Provide a detailed quality evaluation with scores (1-10) and specific feedback for each dimension:

1. ACCURACY (30% weight): Technical correctness, factual accuracy, proper use of terminology
2. CLARITY (20% weight): Readability, explanation quality, logical flow
3. COMPLETENESS (20% weight): Coverage of essential information, depth appropriate for audience
4. RELEVANCE (15% weight): Alignment with term/topic, practical value, appropriate examples
5. STYLE (10% weight): Consistency, professional tone, proper formatting
6. ENGAGEMENT (5% weight): Ability to maintain interest, use of examples/analogies

For each dimension, provide:
- Score (1-10)
- Confidence level (0-1)
- Specific feedback
- List of issues found
- List of improvement suggestions

Also provide a summary with:
- Key strengths (list)
- Key weaknesses (list)
- Critical issues that must be addressed (list)
- Top improvement recommendations (list)

Return the evaluation as a JSON object with this structure:
{
  "dimensions": {
    "accuracy": {
      "score": 8.5,
      "confidence": 0.9,
      "feedback": "Technical information is accurate...",
      "issues": ["Minor terminology inconsistency..."],
      "improvements": ["Consider adding..."]
    },
    "clarity": { ... },
    "completeness": { ... },
    "relevance": { ... },
    "style": { ... },
    "engagement": { ... }
  },
  "summary": {
    "strengths": ["Clear explanations...", "Good examples..."],
    "weaknesses": ["Limited practical applications..."],
    "criticalIssues": ["Incorrect formula in..."],
    "improvements": ["Add more real-world examples...", "Expand mathematical notation..."]
  }
}`;
  }

  /**
   * Get system prompt for evaluation
   */
  private getSystemPrompt(): string {
    return `You are an expert AI/ML content evaluator with deep knowledge in machine learning, artificial intelligence, statistics, and data science. Your role is to provide thorough, objective quality evaluations of educational content.

EVALUATION PRINCIPLES:
1. Be specific and actionable in feedback
2. Consider the target audience level
3. Focus on educational value and accuracy
4. Identify both strengths and areas for improvement
5. Provide constructive suggestions
6. Be consistent in scoring across evaluations

SCORING GUIDELINES:
- 9-10: Exceptional quality, publication-ready
- 7-8: Good quality, minor improvements needed
- 5-6: Acceptable, significant improvements needed
- 3-4: Poor quality, major revisions required
- 1-2: Unacceptable, complete rewrite needed

Always provide balanced, fair evaluations that help improve content quality.`;
  }

  /**
   * Get comparison prompt
   */
  private getComparisonPrompt(content: string, reference: string, contentType: string): string {
    return `Compare the following ${contentType} content against a reference version.

CONTENT TO EVALUATE:
${content}

REFERENCE CONTENT:
${reference}

Analyze and provide:
1. Similarity score (0-100): How closely the content matches the reference in quality and coverage
2. Improvements needed: What the content needs to match reference quality
3. Missing elements: Important information present in reference but missing in content
4. Additional elements: Information in content not present in reference (may be good or unnecessary)

Return as JSON:
{
  "similarityScore": 85,
  "improvements": ["Add mathematical notation...", "Expand practical examples..."],
  "missingElements": ["Complexity analysis...", "Edge cases discussion..."],
  "additionalElements": ["Extra historical context...", "Additional framework comparison..."]
}`;
  }

  /**
   * Calculate overall score from dimensions
   */
  private calculateOverallScore(dimensions: any): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [dimension, weight] of Object.entries(this.DIMENSION_WEIGHTS)) {
      if (dimensions[dimension]?.score) {
        weightedSum += dimensions[dimension].score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS];
    if (!costs) {
      logger.warn(`Unknown model for cost calculation: ${model}`);
      return 0;
    }

    return (promptTokens / 1000 * costs.input) + (completionTokens / 1000 * costs.output);
  }

  /**
   * Store evaluation results in database
   */
  private async storeEvaluationResults(request: EvaluationRequest, result: QualityEvaluationResult) {
    try {
      // Update AI content verification with quality scores
      const existingVerification = await db.select()
        .from(aiContentVerification)
        .where(eq(aiContentVerification.termId, request.termId))
        .limit(1);

      if (existingVerification.length > 0) {
        await db.update(aiContentVerification)
          .set({
            verificationStatus: this.getVerificationStatus(result.overallScore),
            confidenceLevel: this.getConfidenceLevel(result.overallScore),
            lastReviewedAt: new Date(),
            aiReviewNotes: JSON.stringify({
              overallScore: result.overallScore,
              dimensions: result.dimensions,
              summary: result.summary,
              evaluatedAt: result.metadata.evaluatedAt
            })
          })
          .where(eq(aiContentVerification.id, existingVerification[0].id));
      }

      // Store quality metrics in term versions if applicable
      if (request.sectionName) {
        // Store section-specific quality data
        const section = await db.select()
          .from(sections)
          .where(and(
            eq(sections.termId, request.termId),
            eq(sections.name, request.sectionName)
          ))
          .limit(1);

        if (section.length > 0) {
          const sectionItem = await db.select()
            .from(sectionItems)
            .where(eq(sectionItems.sectionId, section[0].id))
            .limit(1);

          if (sectionItem.length > 0) {
            await db.update(sectionItems)
              .set({
                metadata: {
                  ...((sectionItem[0].metadata as any) || {}),
                  qualityScore: result.overallScore,
                  qualityDimensions: result.dimensions,
                  lastEvaluated: result.metadata.evaluatedAt
                },
                verificationStatus: this.getVerificationStatus(result.overallScore)
              })
              .where(eq(sectionItems.id, sectionItem[0].id));
          }
        }
      }

    } catch (error) {
      logger.error('Error storing evaluation results:', {
        error: error instanceof Error ? error.message : String(error),
        termId: request.termId
      });
      // Don't throw - storage is non-critical
    }
  }

  /**
   * Log evaluation analytics
   */
  private async logEvaluationAnalytics(request: EvaluationRequest, result: QualityEvaluationResult) {
    try {
      await db.insert(aiUsageAnalytics)
        .values({
          operation: 'quality_evaluation',
          model: result.metadata.evaluationModel,
          userId: request.userId,
          termId: request.termId,
          inputTokens: result.metadata.tokenUsage.prompt,
          outputTokens: result.metadata.tokenUsage.completion,
          latency: result.metadata.evaluationTime,
          cost: result.metadata.cost.toString(),
          success: true,
          metadata: {
            contentType: request.contentType,
            sectionName: request.sectionName,
            overallScore: result.overallScore,
            dimensions: Object.fromEntries(
              Object.entries(result.dimensions).map(([key, dim]) => [key, dim.score])
            )
          }
        });
    } catch (error) {
      logger.error('Error logging evaluation analytics:', {
        error: error instanceof Error ? error.message : String(error)
      });
      // Don't throw - analytics logging is non-critical
    }
  }

  /**
   * Get verification status based on score
   */
  private getVerificationStatus(score: number): string {
    if (score >= this.QUALITY_THRESHOLDS.excellent) return 'verified';
    if (score >= this.QUALITY_THRESHOLDS.good) return 'reviewed';
    if (score >= this.QUALITY_THRESHOLDS.acceptable) return 'needs_review';
    return 'rejected';
  }

  /**
   * Get confidence level based on score
   */
  private getConfidenceLevel(score: number): string {
    if (score >= this.QUALITY_THRESHOLDS.excellent) return 'high';
    if (score >= this.QUALITY_THRESHOLDS.good) return 'medium';
    return 'low';
  }

  /**
   * Generate mock trends for analytics
   */
  private generateMockTrends(request: QualityAnalyticsRequest): any[] {
    const trends = [];
    const days = 30;
    const baseDate = request.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);

      trends.push({
        date: date.toISOString().split('T')[0],
        scores: {
          overall: 7 + Math.random() * 2,
          accuracy: 7.5 + Math.random() * 2,
          clarity: 6.5 + Math.random() * 2.5,
          completeness: 7 + Math.random() * 2,
          relevance: 7 + Math.random() * 1.5,
          style: 6.5 + Math.random() * 2,
          engagement: 6 + Math.random() * 2.5
        },
        evaluationCount: Math.floor(5 + Math.random() * 20)
      });
    }

    return trends;
  }

  /**
   * Generate mock distribution
   */
  private generateMockDistribution(): any[] {
    return [
      { scoreRange: '8-10', count: 45, percentage: 30 },
      { scoreRange: '6-8', count: 60, percentage: 40 },
      { scoreRange: '4-6', count: 30, percentage: 20 },
      { scoreRange: '2-4', count: 12, percentage: 8 },
      { scoreRange: '0-2', count: 3, percentage: 2 }
    ];
  }

  /**
   * Generate mock common issues
   */
  private generateMockCommonIssues(): any[] {
    return [
      {
        issue: 'Insufficient practical examples',
        frequency: 45,
        affectedDimensions: ['engagement', 'completeness']
      },
      {
        issue: 'Mathematical notation not properly explained',
        frequency: 38,
        affectedDimensions: ['clarity', 'completeness']
      },
      {
        issue: 'Missing prerequisite information',
        frequency: 32,
        affectedDimensions: ['completeness', 'relevance']
      },
      {
        issue: 'Inconsistent terminology usage',
        frequency: 28,
        affectedDimensions: ['accuracy', 'style']
      },
      {
        issue: 'Code examples lack comments',
        frequency: 25,
        affectedDimensions: ['clarity', 'engagement']
      }
    ];
  }

  /**
   * Auto-flag low quality content
   */
  async autoFlagLowQualityContent(minScore: number = 5.5): Promise<{
    flaggedCount: number;
    flaggedTerms: Array<{
      termId: string;
      termName: string;
      score: number;
      issues: string[];
    }>;
  }> {
    // This would query the database for content below threshold
    // For now, returning mock data
    return {
      flaggedCount: 12,
      flaggedTerms: [
        {
          termId: 'uuid-1',
          termName: 'Backpropagation',
          score: 4.8,
          issues: ['Incomplete mathematical explanation', 'No practical examples']
        },
        {
          termId: 'uuid-2', 
          termName: 'Transformer Architecture',
          score: 5.2,
          issues: ['Missing key components', 'Unclear attention mechanism description']
        }
      ]
    };
  }

  /**
   * Get improvement recommendations for a term
   */
  async getImprovementRecommendations(
    termId: string,
    evaluationHistory?: QualityEvaluationResult[]
  ): Promise<{
    prioritizedImprovements: Array<{
      priority: 'high' | 'medium' | 'low';
      dimension: string;
      recommendation: string;
      estimatedImpact: number; // Expected score improvement
    }>;
    quickWins: string[];
    longTermGoals: string[];
  }> {
    // Analyze evaluation history and provide recommendations
    return {
      prioritizedImprovements: [
        {
          priority: 'high',
          dimension: 'completeness',
          recommendation: 'Add practical implementation examples with code',
          estimatedImpact: 1.5
        },
        {
          priority: 'medium',
          dimension: 'clarity',
          recommendation: 'Simplify mathematical notation with step-by-step breakdown',
          estimatedImpact: 0.8
        },
        {
          priority: 'low',
          dimension: 'style',
          recommendation: 'Improve formatting consistency across sections',
          estimatedImpact: 0.3
        }
      ],
      quickWins: [
        'Add bullet point summaries at the end of each section',
        'Include visual diagrams for complex concepts',
        'Fix typos and grammatical errors'
      ],
      longTermGoals: [
        'Develop interactive examples and visualizations',
        'Create video explanations for complex topics',
        'Build comprehensive prerequisite learning paths'
      ]
    };
  }
}

// Export singleton instance
export const aiQualityEvaluationService = new AIQualityEvaluationService();
export default aiQualityEvaluationService;