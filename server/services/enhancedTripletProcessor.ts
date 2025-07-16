import OpenAI from 'openai';
import { aiUsageAnalytics } from '../../shared/enhancedSchema';
import { db } from '../db';
import { enhancedStorage } from '../enhancedStorage';
import { log as logger } from '../utils/logger';

export interface PromptTriplet {
  generative: string;
  evaluative: string;
  improvement: string;
}

export interface ColumnDefinitionWithTriplets {
  id: string;
  name: string;
  displayName: string;
  priority: number;
  category: 'essential' | 'important' | 'supplementary' | 'advanced';
  estimatedTokens: number;
  description: string;
  prompts: PromptTriplet;
  complexity: 'simple' | 'moderate' | 'complex';
  recommendedModel: string;
}

export interface ContentQuality {
  originalContent: string;
  evaluationScore: number;
  evaluationFeedback: string;
  improvedContent?: string;
  needsImprovement: boolean;
  processingPhase: 'generated' | 'evaluated' | 'improved' | 'final';
}

export interface ColumnProcessingStatusWithQuality {
  columnId: string;
  totalTerms: number;
  processedTerms: number;

  // Generation phase
  generatedCount: number;
  generationErrors: number;

  // Evaluation phase
  evaluatedCount: number;
  averageQualityScore: number;
  lowQualityCount: number; // Score < 7

  // Improvement phase
  improvedCount: number;
  finalizedCount: number;

  status: 'generating' | 'evaluating' | 'improving' | 'completed' | 'failed';
  currentPhase: 'generation' | 'evaluation' | 'improvement';

  qualityDistribution: {
    excellent: number; // 9-10
    good: number; // 7-8
    needsWork: number; // 5-6
    poor: number; // 1-4
  };

  estimatedCost: number;
  actualCost: number;
  startedAt: Date;
  completedAt?: Date;
  errors: Array<{
    termId: string;
    termName: string;
    phase: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface ProcessingOptions {
  mode: 'generate-only' | 'generate-evaluate' | 'full-pipeline';
  qualityThreshold: number;
  batchSize: number;
  delayBetweenBatches: number;
  skipExisting: boolean;
}

// Enhanced column definitions with prompt triplets
const ENHANCED_COLUMN_DEFINITIONS: ColumnDefinitionWithTriplets[] = [
  {
    id: 'term',
    name: 'term',
    displayName: 'Term Name',
    priority: 1,
    category: 'essential',
    estimatedTokens: 50,
    description: 'Core term name and key variations',
    complexity: 'simple',
    recommendedModel: 'gpt-4.1-nano',
    prompts: {
      generative: `Generate the primary term name and common variations for this AI/ML concept.
      
TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

OUTPUT FORMAT:
Primary Term: [Main term name]
Variations: [Alternative names, acronyms, synonyms]
Common Spellings: [Different spellings if applicable]

Keep it concise and accurate.`,

      evaluative: `Evaluate the term name and variations for accuracy and completeness.
      
TERM: {TERM_NAME}
GENERATED CONTENT: {CONTENT}

Rate from 1-10 based on:
- Accuracy of primary term
- Completeness of variations
- Industry standard usage
- Clarity and consistency

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,

      improvement: `Improve the term name and variations based on the evaluation feedback.
      
ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide an improved version addressing the feedback while maintaining the same format.`,
    },
  },
  {
    id: 'definition_overview',
    name: 'definition_overview',
    displayName: 'Definition & Overview',
    priority: 2,
    category: 'essential',
    estimatedTokens: 300,
    description: 'Clear, comprehensive definition with overview',
    complexity: 'simple',
    recommendedModel: 'gpt-4.1-nano',
    prompts: {
      generative: `Write a clear, comprehensive definition and overview for this AI/ML term.

TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

Requirements:
- Start with a concise 1-2 sentence definition
- Expand with a clear overview explaining the concept
- Use accessible language while maintaining technical accuracy
- Include the fundamental purpose and scope
- Length: 150-250 words

Focus on clarity and educational value.`,

      evaluative: `Evaluate this definition and overview for quality and educational value.

TERM: {TERM_NAME}
CONTENT: {CONTENT}

Rate from 1-10 based on:
- Clarity and accessibility
- Technical accuracy
- Completeness of explanation
- Educational value
- Appropriate length and structure

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,

      improvement: `Improve this definition and overview based on the evaluation feedback.

ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide an improved version that addresses the feedback while maintaining clarity and educational value.`,
    },
  },
  {
    id: 'key_concepts',
    name: 'key_concepts',
    displayName: 'Key Concepts',
    priority: 3,
    category: 'essential',
    estimatedTokens: 250,
    description: 'Essential concepts for understanding',
    complexity: 'simple',
    recommendedModel: 'gpt-4.1-nano',
    prompts: {
      generative: `Identify and explain the key concepts essential for understanding this AI/ML term.

TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

Format as a bulleted list of 4-6 key concepts, each with:
• Concept Name: Brief explanation (1-2 sentences)

Focus on the most important concepts someone needs to understand this term.`,

      evaluative: `Evaluate the key concepts for completeness and educational value.

TERM: {TERM_NAME}
CONTENT: {CONTENT}

Rate from 1-10 based on:
- Completeness of essential concepts
- Clarity of explanations
- Logical organization
- Educational progression
- Relevance to the main term

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,

      improvement: `Improve the key concepts based on the evaluation feedback.

ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide improved key concepts that address the feedback while maintaining clarity and completeness.`,
    },
  },
  {
    id: 'basic_examples',
    name: 'basic_examples',
    displayName: 'Basic Examples',
    priority: 4,
    category: 'essential',
    estimatedTokens: 200,
    description: 'Concrete examples for clarity',
    complexity: 'simple',
    recommendedModel: 'gpt-4.1-nano',
    prompts: {
      generative: `Provide clear, concrete examples to illustrate this AI/ML concept.

TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

Provide 2-3 specific, real-world examples that demonstrate the concept:
1. [Example name]: [Clear explanation of how it demonstrates the concept]
2. [Example name]: [Clear explanation]
3. [Example name]: [Clear explanation]

Use examples that are well-known and easy to understand.`,

      evaluative: `Evaluate the examples for clarity and educational effectiveness.

TERM: {TERM_NAME}
CONTENT: {CONTENT}

Rate from 1-10 based on:
- Relevance to the main concept
- Clarity and accessibility
- Diversity of examples
- Real-world applicability
- Educational value

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,

      improvement: `Improve the examples based on the evaluation feedback.

ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide improved examples that address the feedback while maintaining clarity and relevance.`,
    },
  },
  {
    id: 'advantages',
    name: 'advantages',
    displayName: 'Advantages',
    priority: 5,
    category: 'essential',
    estimatedTokens: 180,
    description: 'Benefits and advantages',
    complexity: 'simple',
    recommendedModel: 'gpt-4.1-nano',
    prompts: {
      generative: `Explain the key advantages and benefits of this AI/ML concept.

TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

List 4-5 main advantages as bullet points:
• [Advantage]: [Explanation of why this is beneficial]

Focus on practical benefits, performance improvements, and real-world value.`,

      evaluative: `Evaluate the advantages for accuracy and completeness.

TERM: {TERM_NAME}
CONTENT: {CONTENT}

Rate from 1-10 based on:
- Accuracy of stated advantages
- Completeness of key benefits
- Practical relevance
- Clear explanations
- Balanced perspective

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,

      improvement: `Improve the advantages based on the evaluation feedback.

ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide improved advantages that address the feedback while maintaining accuracy and completeness.`,
    },
  },
];

// Model pricing (updated for 2025)
const MODEL_COSTS = {
  'gpt-4.1-nano': { input: 0.00005, output: 0.0002 }, // Per 1K tokens (batch pricing)
  'gpt-4.1-mini': { input: 0.0002, output: 0.0008 },
  'o4-mini': { input: 0.00055, output: 0.0022 },
};

export class EnhancedTripletProcessor {
  private openai: OpenAI;
  private currentProcessing: ColumnProcessingStatusWithQuality | null = null;
  private contentQualityMap = new Map<string, ContentQuality>();
  private isProcessing = false;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Start processing a column with the full Generate → Evaluate → Improve pipeline
   */
  async startColumnProcessingWithQuality(
    columnId: string,
    options: ProcessingOptions = {
      mode: 'generate-evaluate',
      qualityThreshold: 7,
      batchSize: 10,
      delayBetweenBatches: 2000,
      skipExisting: true,
    }
  ): Promise<{ success: boolean; message: string }> {
    if (this.isProcessing) {
      return { success: false, message: 'Another processing operation is already in progress' };
    }

    const column = ENHANCED_COLUMN_DEFINITIONS.find(col => col.id === columnId);
    if (!column) {
      return { success: false, message: `Column not found: ${columnId}` };
    }

    try {
      // Get terms to process
      const allTermsResult = await enhancedStorage.getAllTerms();
      if (!allTermsResult.success || !allTermsResult.data) {
        return { success: false, message: 'Failed to fetch terms' };
      }

      const termsToProcess = options.skipExisting
        ? await this.filterTermsWithoutColumn(allTermsResult.data, columnId)
        : allTermsResult.data;

      if (termsToProcess.length === 0) {
        return {
          success: false,
          message: 'No terms to process (all may already have content for this column)',
        };
      }

      // Initialize processing status
      this.currentProcessing = {
        columnId,
        totalTerms: termsToProcess.length,
        processedTerms: 0,
        generatedCount: 0,
        generationErrors: 0,
        evaluatedCount: 0,
        averageQualityScore: 0,
        lowQualityCount: 0,
        improvedCount: 0,
        finalizedCount: 0,
        status: 'generating',
        currentPhase: 'generation',
        qualityDistribution: { excellent: 0, good: 0, needsWork: 0, poor: 0 },
        estimatedCost: this.calculateEstimatedCost(termsToProcess.length, column, options.mode),
        actualCost: 0,
        startedAt: new Date(),
        errors: [],
      };

      this.isProcessing = true;

      // Start processing pipeline in background
      this.processColumnWithQualityPipeline(column, termsToProcess, options)
        .catch(error => {
          logger.error('Error in column processing pipeline:', error);
          if (this.currentProcessing) {
            this.currentProcessing.status = 'failed';
          }
        })
        .finally(() => {
          this.isProcessing = false;
        });

      return {
        success: true,
        message: `Started processing ${column.displayName} with quality pipeline`,
      };
    } catch (error) {
      this.isProcessing = false;
      logger.error('Error starting column processing:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Main processing pipeline: Generate → Evaluate → Improve
   */
  private async processColumnWithQualityPipeline(
    column: ColumnDefinitionWithTriplets,
    terms: any[],
    options: ProcessingOptions
  ): Promise<void> {
    try {
      logger.info(
        `Starting ${options.mode} pipeline for column ${column.id} with ${terms.length} terms`
      );

      // Phase 1: Generation
      await this.generatePhase(column, terms, options);

      if (options.mode === 'generate-only') {
        this.currentProcessing!.status = 'completed';
        this.currentProcessing!.completedAt = new Date();
        return;
      }

      // Phase 2: Evaluation
      if (this.currentProcessing) {
        this.currentProcessing.currentPhase = 'evaluation';
      }
      await this.evaluatePhase(column, terms, options);

      if (options.mode === 'generate-evaluate') {
        this.currentProcessing!.status = 'completed';
        this.currentProcessing!.completedAt = new Date();
        return;
      }

      // Phase 3: Improvement
      if (this.currentProcessing) {
        this.currentProcessing.currentPhase = 'improvement';
      }
      await this.improvePhase(column, terms, options);

      this.currentProcessing!.status = 'completed';
      this.currentProcessing!.completedAt = new Date();

      logger.info(`Completed ${options.mode} pipeline for column ${column.id}`);
    } catch (error) {
      logger.error('Error in processing pipeline:', {
        error: error instanceof Error ? error.message : String(error),
      });
      if (this.currentProcessing) {
        this.currentProcessing.status = 'failed';
      }
      throw error;
    }
  }

  /**
   * Generation phase
   */
  private async generatePhase(
    column: ColumnDefinitionWithTriplets,
    terms: any[],
    options: ProcessingOptions
  ): Promise<void> {
    logger.info(`Starting generation phase for ${terms.length} terms`);

    for (let i = 0; i < terms.length; i += options.batchSize) {
      const batch = terms.slice(i, i + options.batchSize);

      await Promise.all(
        batch.map(async term => {
          try {
            const content = await this.generateContentForTerm(term, column);

            if (content) {
              this.currentProcessing!.generatedCount++;

              // Store quality information
              const qualityInfo: ContentQuality = {
                originalContent: content,
                evaluationScore: 0,
                evaluationFeedback: '',
                needsImprovement: false,
                processingPhase: 'generated',
              };

              this.contentQualityMap.set(`${term.id}-${column.id}`, qualityInfo);
            }
          } catch (error) {
            logger.error(`Error generating content for term ${term.id}:`, error);
            this.currentProcessing!.generationErrors++;
            this.currentProcessing?.errors.push({
              termId: term.id,
              termName: term.name,
              phase: 'generation',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
          }

          this.currentProcessing!.processedTerms++;
        })
      );

      // Add delay between batches
      if (i + options.batchSize < terms.length) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
      }
    }

    logger.info(
      `Generation phase completed. Generated: ${this.currentProcessing?.generatedCount}, Errors: ${this.currentProcessing?.generationErrors}`
    );
  }

  /**
   * Evaluation phase
   */
  private async evaluatePhase(
    column: ColumnDefinitionWithTriplets,
    terms: any[],
    options: ProcessingOptions
  ): Promise<void> {
    logger.info(`Starting evaluation phase for generated content`);

    const generatedTerms = terms.filter(term =>
      this.contentQualityMap.has(`${term.id}-${column.id}`)
    );

    for (let i = 0; i < generatedTerms.length; i += options.batchSize) {
      const batch = generatedTerms.slice(i, i + options.batchSize);

      await Promise.all(
        batch.map(async term => {
          try {
            const qualityKey = `${term.id}-${column.id}`;
            const qualityInfo = this.contentQualityMap.get(qualityKey);

            if (qualityInfo) {
              const evaluation = await this.evaluateContent(
                term,
                column,
                qualityInfo.originalContent
              );

              if (evaluation) {
                qualityInfo.evaluationScore = evaluation.score;
                qualityInfo.evaluationFeedback = evaluation.feedback;
                qualityInfo.needsImprovement = evaluation.score < options.qualityThreshold;
                qualityInfo.processingPhase = 'evaluated';

                // Update quality distribution
                this.updateQualityDistribution(evaluation.score);

                this.currentProcessing!.evaluatedCount++;

                if (evaluation.score < options.qualityThreshold) {
                  this.currentProcessing!.lowQualityCount++;
                }
              }
            }
          } catch (error) {
            logger.error(`Error evaluating content for term ${term.id}:`, error);
            this.currentProcessing?.errors.push({
              termId: term.id,
              termName: term.name,
              phase: 'evaluation',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
          }
        })
      );

      // Add delay between batches
      if (i + options.batchSize < generatedTerms.length) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
      }
    }

    // Calculate average quality score
    const scores = Array.from(this.contentQualityMap.values())
      .filter(q => q.evaluationScore > 0)
      .map(q => q.evaluationScore);

    this.currentProcessing!.averageQualityScore =
      scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    logger.info(
      `Evaluation phase completed. Evaluated: ${this.currentProcessing?.evaluatedCount}, Avg Score: ${this.currentProcessing?.averageQualityScore.toFixed(1)}`
    );
  }

  /**
   * Improvement phase
   */
  private async improvePhase(
    column: ColumnDefinitionWithTriplets,
    terms: any[],
    options: ProcessingOptions
  ): Promise<void> {
    logger.info(`Starting improvement phase for low-quality content`);

    const termsNeedingImprovement = terms.filter(term => {
      const qualityInfo = this.contentQualityMap.get(`${term.id}-${column.id}`);
      return qualityInfo?.needsImprovement;
    });

    for (let i = 0; i < termsNeedingImprovement.length; i += options.batchSize) {
      const batch = termsNeedingImprovement.slice(i, i + options.batchSize);

      await Promise.all(
        batch.map(async term => {
          try {
            const qualityKey = `${term.id}-${column.id}`;
            const qualityInfo = this.contentQualityMap.get(qualityKey);

            if (qualityInfo) {
              const improvedContent = await this.improveContent(
                term,
                column,
                qualityInfo.originalContent,
                qualityInfo.evaluationFeedback
              );

              if (improvedContent) {
                qualityInfo.improvedContent = improvedContent;
                qualityInfo.processingPhase = 'improved';

                this.currentProcessing!.improvedCount++;
              }
            }
          } catch (error) {
            logger.error(`Error improving content for term ${term.id}:`, error);
            this.currentProcessing?.errors.push({
              termId: term.id,
              termName: term.name,
              phase: 'improvement',
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
          }
        })
      );

      // Add delay between batches
      if (i + options.batchSize < termsNeedingImprovement.length) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
      }
    }

    // Finalize all content
    this.currentProcessing!.finalizedCount = this.contentQualityMap.size;

    logger.info(
      `Improvement phase completed. Improved: ${this.currentProcessing?.improvedCount}, Finalized: ${this.currentProcessing?.finalizedCount}`
    );
  }

  /**
   * Generate content for a single term
   */
  private async generateContentForTerm(
    term: any,
    column: ColumnDefinitionWithTriplets
  ): Promise<string | null> {
    try {
      const prompt = this.buildPrompt(column.prompts.generative, term, column);

      const completion = await this.openai.chat.completions.create({
        model: column.recommendedModel,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: column.estimatedTokens * 2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      // Calculate and track cost
      const cost = this.calculateCost(
        column.recommendedModel,
        completion.usage?.prompt_tokens || 0,
        completion.usage?.completion_tokens || 0
      );

      this.currentProcessing!.actualCost += cost;

      // Log analytics
      await this.logUsageAnalytics({
        operation: 'generate_content',
        termId: term.id,
        model: column.recommendedModel,
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        cost,
        latency: 0,
        success: true,
      });

      return content;
    } catch (error) {
      logger.error(`Error generating content for term ${term.id}:`, error);
      return null;
    }
  }

  /**
   * Evaluate generated content
   */
  private async evaluateContent(
    term: any,
    column: ColumnDefinitionWithTriplets,
    content: string
  ): Promise<{ score: number; feedback: string } | null> {
    try {
      const prompt = this.buildEvaluationPrompt(column.prompts.evaluative, term, column, content);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini', // Use more capable model for evaluation
        messages: [
          {
            role: 'system',
            content:
              'You are an AI content evaluator. Respond only with valid JSON containing "score" and "feedback" fields.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No evaluation response');
      }

      // Parse JSON response
      const evaluation = JSON.parse(response);

      if (typeof evaluation.score !== 'number' || typeof evaluation.feedback !== 'string') {
        throw new Error('Invalid evaluation response format');
      }

      return {
        score: Math.max(1, Math.min(10, evaluation.score)),
        feedback: evaluation.feedback,
      };
    } catch (error) {
      logger.error(`Error evaluating content for term ${term.id}:`, error);
      return null;
    }
  }

  /**
   * Improve content based on evaluation feedback
   */
  private async improveContent(
    term: any,
    column: ColumnDefinitionWithTriplets,
    originalContent: string,
    feedback: string
  ): Promise<string | null> {
    try {
      const prompt = this.buildImprovementPrompt(
        column.prompts.improvement,
        term,
        column,
        originalContent,
        feedback
      );

      const completion = await this.openai.chat.completions.create({
        model: column.recommendedModel,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: column.estimatedTokens * 2,
      });

      const improvedContent = completion.choices[0]?.message?.content;
      if (!improvedContent) {
        throw new Error('No improved content returned');
      }

      return improvedContent;
    } catch (error) {
      logger.error(`Error improving content for term ${term.id}:`, error);
      return null;
    }
  }

  /**
   * Build prompt with term context
   */
  private buildPrompt(template: string, term: any, _column: ColumnDefinitionWithTriplets): string {
    return template
      .replace('{TERM_NAME}', term.name)
      .replace('{TERM_CONTEXT}', term.fullDefinition || term.shortDescription || '');
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(
    template: string,
    term: any,
    _column: ColumnDefinitionWithTriplets,
    content: string
  ): string {
    return template.replace('{TERM_NAME}', term.name).replace('{CONTENT}', content);
  }

  /**
   * Build improvement prompt
   */
  private buildImprovementPrompt(
    template: string,
    _term: any,
    _column: ColumnDefinitionWithTriplets,
    originalContent: string,
    feedback: string
  ): string {
    return template
      .replace('{ORIGINAL_CONTENT}', originalContent)
      .replace('{EVALUATION_FEEDBACK}', feedback);
  }

  /**
   * Update quality distribution
   */
  private updateQualityDistribution(score: number): void {
    if (!this.currentProcessing) {return;}

    if (score >= 9) {
      this.currentProcessing.qualityDistribution.excellent++;
    } else if (score >= 7) {
      this.currentProcessing.qualityDistribution.good++;
    } else if (score >= 5) {
      this.currentProcessing.qualityDistribution.needsWork++;
    } else {
      this.currentProcessing.qualityDistribution.poor++;
    }
  }

  /**
   * Filter terms that don't have content for the specified column
   */
  private async filterTermsWithoutColumn(terms: any[], _columnId: string): Promise<any[]> {
    // This would check the database for existing content
    // For now, return all terms
    return terms;
  }

  /**
   * Calculate estimated cost for processing
   */
  private calculateEstimatedCost(
    termCount: number,
    column: ColumnDefinitionWithTriplets,
    mode: string
  ): number {
    const costs = MODEL_COSTS[column.recommendedModel as keyof typeof MODEL_COSTS];
    if (!costs) {return 0;}

    const tokensPerTerm = column.estimatedTokens;
    const totalTokens = termCount * tokensPerTerm;

    let multiplier = 1;
    if (mode === 'generate-evaluate') {multiplier = 1.5;}
    if (mode === 'full-pipeline') {multiplier = 2.0;}

    return (totalTokens / 1000) * costs.output * multiplier;
  }

  /**
   * Calculate API cost
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
    if (!costs) {return 0;}

    return (promptTokens / 1000) * costs.input + (completionTokens / 1000) * costs.output;
  }

  /**
   * Log usage analytics
   */
  private async logUsageAnalytics(data: {
    operation: string;
    termId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latency: number;
    success: boolean;
  }): Promise<void> {
    try {
      await db.insert(aiUsageAnalytics).values({
        operation: data.operation,
        model: data.model,
        termId: data.termId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        latency: data.latency,
        cost: data.cost.toString(),
        success: data.success,
      });
    } catch (error) {
      logger.error('Error logging usage analytics:', error);
    }
  }

  /**
   * Get system prompt
   */
  private getSystemPrompt(): string {
    return `You are an AI/ML educational content expert. Your role is to generate high-quality, accurate, and educational content for AI/ML terms and concepts.

IMPORTANT GUIDELINES:
1. **Accuracy First**: Ensure all technical information is accurate and verifiable
2. **Educational Focus**: Write for learners, making complex concepts accessible
3. **No Fabrication**: Never invent sources, citations, or references
4. **Structured Content**: Organize information logically with clear sections
5. **Practical Examples**: Include real-world applications when relevant
6. **Appropriate Level**: Match content to the specified difficulty level
7. **Markdown Formatting**: Use proper markdown for readability

CONTENT REQUIREMENTS:
- Focus on technical accuracy and educational value
- Provide practical insights and examples
- Avoid speculation or unverified claims
- Use clear, professional language
- Structure content for easy reading and comprehension

Your content will be marked as AI-generated and subject to expert review. Prioritize accuracy and educational value over completeness.`;
  }

  /**
   * Get current processing status
   */
  getCurrentProcessingStatus(): ColumnProcessingStatusWithQuality | null {
    return this.currentProcessing;
  }

  /**
   * Get available columns for processing
   */
  getAvailableColumns(): ColumnDefinitionWithTriplets[] {
    return ENHANCED_COLUMN_DEFINITIONS;
  }

  /**
   * Stop current processing
   */
  stopProcessing(): { success: boolean; message: string } {
    if (!this.isProcessing) {
      return { success: false, message: 'No processing operation is currently running' };
    }

    this.isProcessing = false;
    if (this.currentProcessing) {
      this.currentProcessing.status = 'failed';
      this.currentProcessing.completedAt = new Date();
    }

    return { success: true, message: 'Processing stopped successfully' };
  }
}

// Export singleton instance
export const enhancedTripletProcessor = new EnhancedTripletProcessor();
export default enhancedTripletProcessor;
