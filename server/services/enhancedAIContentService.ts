// server/services/enhancedAIContentService.ts
// Enhanced AI content generation service supporting the full 295-column structure

import { and, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { db } from '../db';
import { log as logger } from '../utils/logger';
import { 
  sections, 
  sectionItems, 
  enhancedTerms,
  aiUsageAnalytics,
  modelContentVersions 
} from '../../shared/enhancedSchema';
import { HIERARCHICAL_295_STRUCTURE, getColumnById } from '../../shared/completeColumnStructure';
import { generatePromptsForTerm, getPromptsForColumn } from '../prompts/columnPromptTemplates';
import { getPromptTripletForColumn } from '../prompts/allColumnPrompts';

export interface Enhanced295GenerationRequest {
  termId: string;
  termName: string;
  columnId: string; // ID from the 295-column structure
  mode: 'generate-only' | 'generate-evaluate' | 'full-pipeline';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  skipExisting?: boolean;
}

export interface BatchColumnGenerationRequest {
  columnId: string; // Generate this column for all terms
  termIds?: string[]; // Optional: specific terms only
  mode: 'generate-only' | 'generate-evaluate' | 'full-pipeline';
  model?: string;
  qualityThreshold?: number; // For improvement decisions
  batchSize?: number;
  skipExisting?: boolean;
}

export interface GenerationResult {
  success: boolean;
  termId: string;
  columnId: string;
  content?: string;
  evaluationScore?: number;
  evaluationFeedback?: string;
  improvedContent?: string;
  finalContent?: string; // The content that should be saved
  metadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    processingTime: number;
    pipelineStage: 'generated' | 'evaluated' | 'improved';
  };
  error?: string;
}

export class Enhanced295AIContentService {
  private openai: OpenAI;
  private readonly modelPricing = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Generate content for a single column of a term using the 295-structure
   */
  async generateForColumn(request: Enhanced295GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    const column = getColumnById(request.columnId);
    
    if (!column) {
      return {
        success: false,
        termId: request.termId,
        columnId: request.columnId,
        error: `Column ${request.columnId} not found in 295-structure`,
        metadata: this.createEmptyMetadata()
      };
    }

    try {
      // Check if content exists and skip if requested
      if (request.skipExisting) {
        const existing = await this.checkExistingContent(request.termId, request.columnId);
        if (existing) {
          return {
            success: true,
            termId: request.termId,
            columnId: request.columnId,
            content: existing.content,
            finalContent: existing.content,
            metadata: {
              ...this.createEmptyMetadata(),
              pipelineStage: 'generated'
            }
          };
        }
      }

      // Get prompts for this column
      const prompts = this.getPromptsForColumn(request.columnId, request.termName);
      if (!prompts) {
        throw new Error(`No prompts found for column ${request.columnId}`);
      }

      // Stage 1: Generate
      const generateResult = await this.callOpenAI(
        prompts.generative,
        request.model || this.getModelForColumn(column),
        request.temperature,
        request.maxTokens || column.estimatedTokens
      );

      const result: GenerationResult = {
        success: true,
        termId: request.termId,
        columnId: request.columnId,
        content: generateResult.content,
        finalContent: generateResult.content,
        metadata: {
          ...generateResult.metadata,
          pipelineStage: 'generated'
        }
      };

      if (request.mode === 'generate-only') {
        await this.saveGeneratedContent(result);
        return result;
      }

      // Stage 2: Evaluate
      const evaluateResult = await this.callOpenAI(
        prompts.evaluative.replace('[CONTENT]', generateResult.content),
        'gpt-4o-mini', // Use cheaper model for evaluation
        0.3, // Lower temperature for consistent evaluation
        150
      );

      const evaluation = this.parseEvaluation(evaluateResult.content);
      result.evaluationScore = evaluation.score;
      result.evaluationFeedback = evaluation.feedback;
      result.metadata.pipelineStage = 'evaluated';
      result.metadata.promptTokens += evaluateResult.metadata.promptTokens;
      result.metadata.completionTokens += evaluateResult.metadata.completionTokens;
      result.metadata.totalTokens += evaluateResult.metadata.totalTokens;
      result.metadata.cost += evaluateResult.metadata.cost;

      if (request.mode === 'generate-evaluate' || evaluation.score >= 7) {
        await this.saveGeneratedContent(result);
        return result;
      }

      // Stage 3: Improve (if score < 7)
      const improvePrompt = prompts.improvement
        .replace('[CONTENT]', generateResult.content)
        .replace('[FEEDBACK]', evaluation.feedback);
        
      const improveResult = await this.callOpenAI(
        improvePrompt,
        request.model || this.getModelForColumn(column),
        request.temperature,
        request.maxTokens || column.estimatedTokens
      );

      result.improvedContent = improveResult.content;
      result.finalContent = improveResult.content;
      result.metadata.pipelineStage = 'improved';
      result.metadata.promptTokens += improveResult.metadata.promptTokens;
      result.metadata.completionTokens += improveResult.metadata.completionTokens;
      result.metadata.totalTokens += improveResult.metadata.totalTokens;
      result.metadata.cost += improveResult.metadata.cost;
      result.metadata.processingTime = Date.now() - startTime;

      await this.saveGeneratedContent(result);
      return result;

    } catch (error) {
      logger.error('Content generation error:', error);
      return {
        success: false,
        termId: request.termId,
        columnId: request.columnId,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: this.createEmptyMetadata()
      };
    }
  }

  /**
   * Generate a specific column for multiple terms
   */
  async generateColumnBatch(request: BatchColumnGenerationRequest): Promise<{
    results: GenerationResult[];
    summary: {
      totalTerms: number;
      successCount: number;
      failureCount: number;
      totalCost: number;
      totalTokens: number;
      averageScore?: number;
      improvedCount: number;
    };
  }> {
    const column = getColumnById(request.columnId);
    if (!column) {
      throw new Error(`Column ${request.columnId} not found`);
    }

    // Get terms to process
    const terms = request.termIds 
      ? await this.getTermsByIds(request.termIds)
      : await this.getAllTerms();

    const batchSize = request.batchSize || 10;
    const results: GenerationResult[] = [];
    let totalCost = 0;
    let totalTokens = 0;
    let successCount = 0;
    let failureCount = 0;
    let totalScore = 0;
    let improvedCount = 0;

    // Process in batches
    for (let i = 0; i < terms.length; i += batchSize) {
      const batch = terms.slice(i, i + batchSize);
      
      const batchPromises = batch.map(term => 
        this.generateForColumn({
          termId: term.id,
          termName: term.name,
          columnId: request.columnId,
          mode: request.mode || 'full-pipeline',
          model: request.model,
          skipExisting: request.skipExisting
        })
      );

      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          successCount++;
          totalCost += result.metadata.cost;
          totalTokens += result.metadata.totalTokens;
          if (result.evaluationScore) {
            totalScore += result.evaluationScore;
          }
          if (result.metadata.pipelineStage === 'improved') {
            improvedCount++;
          }
        } else {
          failureCount++;
        }
      }

      // Add delay between batches to avoid rate limits
      if (i + batchSize < terms.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return {
      results,
      summary: {
        totalTerms: terms.length,
        successCount,
        failureCount,
        totalCost,
        totalTokens,
        averageScore: successCount > 0 ? totalScore / successCount : 0,
        improvedCount
      }
    };
  }

  /**
   * Generate all 295 columns for a single term
   */
  async generateAllColumnsForTerm(
    termId: string, 
    termName: string,
    options?: {
      skipExisting?: boolean;
      onlyEssential?: boolean;
      onlyCategories?: string[];
      progressCallback?: (progress: number, currentColumn: string) => void;
    }
  ): Promise<{
    results: Map<string, GenerationResult>;
    summary: {
      totalColumns: number;
      successCount: number;
      failureCount: number;
      totalCost: number;
      totalTokens: number;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    const results = new Map<string, GenerationResult>();
    
    // Filter columns based on options
    let columnsToGenerate = HIERARCHICAL_295_STRUCTURE;
    if (options?.onlyEssential) {
      columnsToGenerate = columnsToGenerate.filter(col => col.category === 'essential');
    }
    if (options?.onlyCategories) {
      columnsToGenerate = columnsToGenerate.filter(col => 
        options.onlyCategories!.includes(col.category)
      );
    }

    let successCount = 0;
    let failureCount = 0;
    let totalCost = 0;
    let totalTokens = 0;

    for (let i = 0; i < columnsToGenerate.length; i++) {
      const column = columnsToGenerate[i];
      
      if (options?.progressCallback) {
        const progress = (i / columnsToGenerate.length) * 100;
        options.progressCallback(progress, column.displayName);
      }

      const result = await this.generateForColumn({
        termId,
        termName,
        columnId: column.id,
        mode: 'full-pipeline',
        skipExisting: options?.skipExisting
      });

      results.set(column.id, result);
      
      if (result.success) {
        successCount++;
        totalCost += result.metadata.cost;
        totalTokens += result.metadata.totalTokens;
      } else {
        failureCount++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      results,
      summary: {
        totalColumns: columnsToGenerate.length,
        successCount,
        failureCount,
        totalCost,
        totalTokens,
        processingTime: Date.now() - startTime
      }
    };
  }

  // Helper methods
  
  private getPromptsForColumn(columnId: string, termName: string) {
    // Try base prompts first
    const prompts = generatePromptsForTerm(columnId, termName);
    if (prompts) {return prompts;}
    
    // Try extended prompts
    const triplet = getPromptTripletForColumn(columnId);
    if (triplet) {
      return {
        generative: triplet.generative.replace(/\*\*\[TERM\]\*\*/g, `**${termName}**`),
        evaluative: triplet.evaluative.replace(/\*\*\[TERM\]\*\*/g, `**${termName}**`),
        improvement: triplet.improvement.replace(/\*\*\[TERM\]\*\*/g, `**${termName}**`)
      };
    }
    
    return null;
  }

  private getModelForColumn(column: any): string {
    // Model selection based on column complexity
    if (column.category === 'advanced' || column.estimatedTokens > 300) {
      return 'gpt-4o';
    } else if (column.category === 'essential' || column.priority <= 2) {
      return 'gpt-4o-mini';
    } else {
      return 'gpt-3.5-turbo';
    }
  }

  private async callOpenAI(
    prompt: string, 
    model: string, 
    temperature?: number,
    maxTokens?: number
  ) {
    const startTime = Date.now();
    
    const completion = await this.openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 500,
    });

    const content = completion.choices[0]?.message?.content || '';
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);
    
    return {
      content,
      metadata: {
        model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        cost,
        processingTime: Date.now() - startTime
      }
    };
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = this.modelPricing[model as keyof typeof this.modelPricing] || 
                   this.modelPricing['gpt-4o-mini'];
    
    return (promptTokens / 1000 * pricing.input) + (completionTokens / 1000 * pricing.output);
  }

  private parseEvaluation(evaluationText: string): { score: number; feedback: string } {
    try {
      const json = JSON.parse(evaluationText);
      return {
        score: json.score || 5,
        feedback: json.feedback || 'No feedback provided'
      };
    } catch {
      // Fallback parsing
      const scoreMatch = evaluationText.match(/score[:\s]+(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
      
      return {
        score,
        feedback: evaluationText
      };
    }
  }

  private async checkExistingContent(termId: string, columnId: string) {
    const result = await db.query.sectionItems.findFirst({
      where: and(
        eq(sectionItems.termId, termId),
        eq(sectionItems.columnId, columnId)
      )
    });
    
    return result;
  }

  private async saveGeneratedContent(result: GenerationResult) {
    if (!result.success || !result.finalContent) {return;}

    const column = getColumnById(result.columnId);
    if (!column) {return;}

    // Check if section exists
    let section = await db.query.sections.findFirst({
      where: eq(sections.name, column.section)
    });

    if (!section) {
      // Create section
      const [newSection] = await db.insert(sections).values({
        id: crypto.randomUUID(),
        name: column.section,
        displayName: column.section.charAt(0).toUpperCase() + column.section.slice(1),
        order: column.order,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      section = newSection;
    }

    // Save or update section item
    const existingItem = await db.query.sectionItems.findFirst({
      where: and(
        eq(sectionItems.termId, result.termId),
        eq(sectionItems.columnId, result.columnId)
      )
    });

    const itemData = {
      termId: result.termId,
      sectionId: section.id,
      columnId: result.columnId,
      contentType: column.contentType,
      content: result.finalContent,
      metadata: {
        model: result.metadata.model,
        generatedAt: new Date(),
        evaluationScore: result.evaluationScore,
        evaluationFeedback: result.evaluationFeedback,
        wasImproved: result.metadata.pipelineStage === 'improved',
        promptTokens: result.metadata.promptTokens,
        completionTokens: result.metadata.completionTokens,
        cost: result.metadata.cost
      },
      order: column.order,
      isAIGenerated: true,
      qualityScore: result.evaluationScore,
      updatedAt: new Date()
    };

    if (existingItem) {
      await db.update(sectionItems)
        .set(itemData)
        .where(eq(sectionItems.id, existingItem.id));
    } else {
      await db.insert(sectionItems).values({
        id: crypto.randomUUID(),
        ...itemData,
        createdAt: new Date()
      });
    }

    // Track usage analytics
    await db.insert(aiUsageAnalytics).values({
      id: crypto.randomUUID(),
      userId: 'system',
      action: 'content_generation',
      model: result.metadata.model,
      tokenUsage: {
        prompt: result.metadata.promptTokens,
        completion: result.metadata.completionTokens,
        total: result.metadata.totalTokens
      },
      cost: result.metadata.cost,
      metadata: {
        termId: result.termId,
        columnId: result.columnId,
        pipelineStage: result.metadata.pipelineStage,
        evaluationScore: result.evaluationScore
      },
      timestamp: new Date()
    });
  }

  private async getTermsByIds(termIds: string[]) {
    return db.query.enhancedTerms.findMany({
      where: (terms, { inArray }) => inArray(terms.id, termIds)
    });
  }

  private async getAllTerms() {
    return db.query.enhancedTerms.findMany({
      limit: 100 // Safety limit for testing
    });
  }

  private createEmptyMetadata() {
    return {
      model: '',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      processingTime: 0,
      pipelineStage: 'generated' as const
    };
  }
}

// Export singleton instance
export const enhanced295AIService = new Enhanced295AIContentService();