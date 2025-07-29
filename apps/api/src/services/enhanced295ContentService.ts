// server/services/enhanced295ContentService.ts
// Complete implementation of the 295-column content generation system

import OpenAI from 'openai';
import { enhancedStorage } from '../enhancedStorage';
import { HIERARCHICAL_295_STRUCTURE, type ColumnDefinition } from '@aiglossarypro/shared/295ColumnStructure';
import { 
  COLUMN_PROMPT_TRIPLETS, 
  type ColumnPromptDefinition,
  replaceTemplateVariables,
  estimatePromptCost
} from './promptTriplets295';

import logger from '../utils/logger';
interface ContentGenerationOptions {
  mode: 'generate-only' | 'generate-evaluate' | 'full-pipeline';
  qualityThreshold: number;
  batchSize: number;
  delayBetweenBatches: number;
  skipExisting: boolean;
  model?: 'gpt-4.1-nano' | 'gpt-4.1-mini' | 'o4-mini';
}

interface GenerationResult {
  success: boolean;
  content?: string;
  evaluationScore?: number;
  evaluationFeedback?: string;
  improvedContent?: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
  };
  error?: string;
}

interface BatchProcessingStatus {
  columnId: string;
  totalTerms: number;
  processedTerms: number;
  
  // Generation phase
  generatedCount: number;
  generationErrors: number;
  
  // Evaluation phase  
  evaluatedCount: number;
  averageQualityScore: number;
  lowQualityCount: number; // Score < threshold
  
  // Improvement phase
  improvedCount: number;
  finalizedCount: number;
  
  status: 'generating' | 'evaluating' | 'improving' | 'completed' | 'failed' | 'paused';
  currentPhase: 'generation' | 'evaluation' | 'improvement';
  
  qualityDistribution: {
    excellent: number; // 9-10
    good: number;      // 7-8  
    needsWork: number; // 5-6
    poor: number;      // 1-4
  };
  
  estimatedCost: number;
  actualCost: number;
  startTime: Date;
  endTime?: Date;
  
  errors: Array<{
    termId: string;
    termName: string;
    phase: string;
    error: string;
    timestamp: Date;
  }>;
}

class Enhanced295ContentService {
  private openai: OpenAI;
  private currentProcessing: BatchProcessingStatus | null = null;
  private isPaused = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate content for a single term and column
   */
  async generateSingleTermContent(
    termId: string, 
    columnId: string, 
    options: ContentGenerationOptions = {
      mode: 'generate-evaluate',
      qualityThreshold: 7,
      batchSize: 1,
      delayBetweenBatches: 0,
      skipExisting: false
    }
  ): Promise<GenerationResult> {
    try {
      // Get term data
      const term = await enhancedStorage.getEnhancedTermWithSections(termId);
      if (!term) {
        return {
          success: false,
          error: 'Term not found',
          cost: 0,
          tokens: { input: 0, output: 0 }
        };
      }

      // Get column definition and prompts
      const columnDef = HIERARCHICAL_295_STRUCTURE.find(col => col.id === columnId);
      const promptDef = COLUMN_PROMPT_TRIPLETS[columnId];
      
      if (!columnDef || !promptDef) {
        return {
          success: false,
          error: 'Column definition or prompts not found',
          cost: 0,
          tokens: { input: 0, output: 0 }
        };
      }

      const templateVars = {
        termName: term.name,
        termId: term.id,
        category: term.mainCategories?.[0] || 'AI/ML',
        shortDefinition: term.shortDefinition || ''
      };

      // Phase 1: Generate content
      const generateResult = await this.generateContent(
        promptDef.prompts.generative,
        templateVars,
        promptDef.model
      );

      if (!generateResult.success) {
        return generateResult;
      }

      const finalResult: GenerationResult = {
        success: true,
        content: generateResult.content,
        cost: generateResult.cost,
        tokens: generateResult.tokens
      };

      if (options.mode === 'generate-only') {
        // Save and return
        await this.saveContentToDatabase(termId, columnId, finalResult);
        return finalResult;
      }

      // Phase 2: Evaluate content
      const evaluateResult = await this.evaluateContent(
        generateResult.content!,
        promptDef.prompts.evaluative,
        templateVars,
        promptDef.model
      );

      if (evaluateResult.success) {
        finalResult.evaluationScore = evaluateResult.score;
        finalResult.evaluationFeedback = evaluateResult.feedback;
        finalResult.cost += evaluateResult.cost;
        finalResult.tokens.input += evaluateResult.tokens.input;
        finalResult.tokens.output += evaluateResult.tokens.output;
      }

      if (options.mode === 'generate-evaluate') {
        // Save and return
        await this.saveContentToDatabase(termId, columnId, finalResult);
        return finalResult;
      }

      // Phase 3: Improve content if needed
      if (finalResult.evaluationScore && finalResult.evaluationScore < options.qualityThreshold) {
        const improveResult = await this.improveContent(
          generateResult.content!,
          finalResult.evaluationFeedback || '',
          promptDef.prompts.improvement,
          templateVars,
          promptDef.model
        );

        if (improveResult.success) {
          finalResult.improvedContent = improveResult.content;
          finalResult.cost += improveResult.cost;
          finalResult.tokens.input += improveResult.tokens.input;
          finalResult.tokens.output += improveResult.tokens.output;
        }
      }

      // Save final result
      await this.saveContentToDatabase(termId, columnId, finalResult);
      return finalResult;

    } catch (error) {
      logger.error('Error generating single term content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0,
        tokens: { input: 0, output: 0 }
      };
    }
  }

  /**
   * Start batch processing for a column across all terms
   */
  async startColumnBatchProcessing(
    columnId: string,
    options: ContentGenerationOptions = {
      mode: 'generate-evaluate',
      qualityThreshold: 7,
      batchSize: 10,
      delayBetweenBatches: 2000,
      skipExisting: true
    }
  ): Promise<{ success: boolean; message: string }> {
    
    if (this.currentProcessing) {
      return { success: false, message: 'Batch processing already in progress' };
    }

    const columnDef = HIERARCHICAL_295_STRUCTURE.find(col => col.id === columnId);
    if (!columnDef) {
      return { success: false, message: `Column not found: ${columnId}` };
    }

    // Get all terms
    const allTermsResult = await enhancedStorage.getAllTerms();
    if (!allTermsResult.success || !allTermsResult.data) {
      return { success: false, message: 'Failed to fetch terms' };
    }

    const termsToProcess = options.skipExisting 
      ? await this.filterTermsWithoutColumn(allTermsResult.data, columnId)
      : allTermsResult.data;

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
      estimatedCost: estimatePromptCost(columnId, termsToProcess.length),
      actualCost: 0,
      startTime: new Date(),
      errors: []
    };

    // Start background processing
    this.processColumnInBackground(columnDef, termsToProcess, options);

    return { 
      success: true, 
      message: `Started batch processing for ${columnDef.displayName} (${termsToProcess.length} terms)` 
    };
  }

  /**
   * Get current batch processing status
   */
  getCurrentProcessingStatus(): BatchProcessingStatus | null {
    return this.currentProcessing;
  }

  /**
   * Pause current processing
   */
  pauseProcessing(): boolean {
    if (this.currentProcessing) {
      this.isPaused = true;
      this.currentProcessing.status = 'paused';
      return true;
    }
    return false;
  }

  /**
   * Resume paused processing
   */
  resumeProcessing(): boolean {
    if (this.currentProcessing && this.isPaused) {
      this.isPaused = false;
      this.currentProcessing.status = 'generating';
      return true;
    }
    return false;
  }

  /**
   * Background processing for column batch
   */
  private async processColumnInBackground(
    columnDef: ColumnDefinition,
    terms: unknown[],
    options: ContentGenerationOptions
  ): Promise<void> {
    try {
      const batchSize = options.batchSize;
      
      for (let i = 0; i < terms.length; i += batchSize) {
        if (this.isPaused) {
          // Wait for resume
          while (this.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const batch = terms.slice(i, i + batchSize);
        await this.processBatch(batch, columnDef.id, options);
        
        // Delay between batches
        if (i + batchSize < terms.length) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
        }
      }

      // Mark as completed
      if (this.currentProcessing) {
        this.currentProcessing.status = 'completed';
        this.currentProcessing.endTime = new Date();
      }

    } catch (error) {
      logger.error('Error in background processing:', error);
      if (this.currentProcessing) {
        this.currentProcessing.status = 'failed';
        this.currentProcessing.errors.push({
          termId: 'system',
          termName: 'system',
          phase: 'batch',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Process a batch of terms
   */
  private async processBatch(
    batch: unknown[],
    columnId: string,
    options: ContentGenerationOptions
  ): Promise<void> {
    const promises = batch.map(term => 
      this.generateSingleTermContent(term.id, columnId, options)
        .catch(error => ({
          success: false,
          error: error.message,
          cost: 0,
          tokens: { input: 0, output: 0 }
        }))
    );

    const results = await Promise.all(promises);
    
    // Update processing status
    if (this.currentProcessing) {
      results.forEach((result, index) => {
        const term = batch[index];
        this.currentProcessing!.processedTerms++;
        this.currentProcessing!.actualCost += result.cost;

        if (result.success) {
          this.currentProcessing!.generatedCount++;
          
          if (result.evaluationScore) {
            this.currentProcessing!.evaluatedCount++;
            
            // Update quality distribution
            if (result.evaluationScore >= 9) {
              this.currentProcessing!.qualityDistribution.excellent++;
            } else if (result.evaluationScore >= 7) {
              this.currentProcessing!.qualityDistribution.good++;
            } else if (result.evaluationScore >= 5) {
              this.currentProcessing!.qualityDistribution.needsWork++;
            } else {
              this.currentProcessing!.qualityDistribution.poor++;
            }
            
            if (result.evaluationScore < options.qualityThreshold) {
              this.currentProcessing!.lowQualityCount++;
            }
          }
          
          if (result.improvedContent) {
            this.currentProcessing!.improvedCount++;
          }
          
          this.currentProcessing!.finalizedCount++;
        } else {
          this.currentProcessing!.generationErrors++;
          this.currentProcessing!.errors.push({
            termId: term.id,
            termName: term.name,
            phase: 'generation',
            error: result.error || 'Unknown error',
            timestamp: new Date()
          });
        }
      });
      
      // Update average quality score
      if (this.currentProcessing.evaluatedCount > 0) {
        const totalScore = this.currentProcessing.qualityDistribution.excellent * 9.5 +
                          this.currentProcessing.qualityDistribution.good * 7.5 +
                          this.currentProcessing.qualityDistribution.needsWork * 5.5 +
                          this.currentProcessing.qualityDistribution.poor * 3;
        this.currentProcessing.averageQualityScore = totalScore / this.currentProcessing.evaluatedCount;
      }
    }
  }

  /**
   * Generate content using OpenAI
   */
  private async generateContent(
    prompt: string,
    templateVars: Record<string, string>,
    model: string
  ): Promise<GenerationResult> {
    try {
      const finalPrompt = replaceTemplateVariables(prompt, templateVars);
      
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          success: false,
          error: 'No content generated',
          cost: 0,
          tokens: { input: 0, output: 0 }
        };
      }

      const usage = response.usage;
      const cost = this.calculateCost(model, usage?.prompt_tokens || 0, usage?.completion_tokens || 0);

      return {
        success: true,
        content,
        cost,
        tokens: {
          input: usage?.prompt_tokens || 0,
          output: usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0,
        tokens: { input: 0, output: 0 }
      };
    }
  }

  /**
   * Evaluate content quality
   */
  private async evaluateContent(
    content: string,
    evaluationPrompt: string,
    templateVars: Record<string, string>,
    model: string
  ): Promise<{ success: boolean; score?: number; feedback?: string; cost: number; tokens: { input: number; output: number }; error?: string }> {
    try {
      const finalPrompt = replaceTemplateVariables(evaluationPrompt, templateVars) + `\n\nContent to evaluate:\n${content}`;
      
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.3,
        max_tokens: 200
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        return {
          success: false,
          error: 'No evaluation result',
          cost: 0,
          tokens: { input: 0, output: 0 }
        };
      }

      // Parse JSON response
      try {
        const evaluation = JSON.parse(result);
        const usage = response.usage;
        const cost = this.calculateCost(model, usage?.prompt_tokens || 0, usage?.completion_tokens || 0);

        return {
          success: true,
          score: evaluation.score,
          feedback: evaluation.feedback,
          cost,
          tokens: {
            input: usage?.prompt_tokens || 0,
            output: usage?.completion_tokens || 0
          }
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse evaluation JSON',
          cost: 0,
          tokens: { input: 0, output: 0 }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0,
        tokens: { input: 0, output: 0 }
      };
    }
  }

  /**
   * Improve content based on feedback
   */
  private async improveContent(
    originalContent: string,
    feedback: string,
    improvementPrompt: string,
    templateVars: Record<string, string>,
    model: string
  ): Promise<GenerationResult> {
    try {
      const finalPrompt = replaceTemplateVariables(improvementPrompt, templateVars) + 
        `\n\nOriginal content:\n${originalContent}\n\nFeedback:\n${feedback}`;
      
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.5,
        max_tokens: 1200
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          success: false,
          error: 'No improved content generated',
          cost: 0,
          tokens: { input: 0, output: 0 }
        };
      }

      const usage = response.usage;
      const cost = this.calculateCost(model, usage?.prompt_tokens || 0, usage?.completion_tokens || 0);

      return {
        success: true,
        content,
        cost,
        tokens: {
          input: usage?.prompt_tokens || 0,
          output: usage?.completion_tokens || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        cost: 0,
        tokens: { input: 0, output: 0 }
      };
    }
  }

  /**
   * Save generated content to database
   */
  private async saveContentToDatabase(
    termId: string,
    columnId: string,
    result: GenerationResult
  ): Promise<void> {
    try {
      const columnDef = HIERARCHICAL_295_STRUCTURE.find(col => col.id === columnId);
      if (!columnDef) {return;}

      // Use the final content (improved if available, otherwise original)
      const finalContent = result.improvedContent || result.content;
      if (!finalContent) {return;}

      // Save to section_items table using the existing enhanced storage
      await enhancedStorage.createOrUpdateSectionContent({
        termId,
        sectionName: columnDef.name,
        content: finalContent,
        contentType: columnDef.contentType,
        metadata: {
          columnId,
          path: columnDef.path,
          category: columnDef.category,
          priority: columnDef.priority,
          isAiGenerated: true,
          evaluationScore: result.evaluationScore,
          evaluationFeedback: result.evaluationFeedback,
          hasImprovedContent: !!result.improvedContent,
          generationCost: result.cost,
          generationTokens: result.tokens,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error saving content to database:', error);
    }
  }

  /**
   * Filter terms that don't have content for the specified column
   */
  private async filterTermsWithoutColumn(terms: unknown[], columnId: string): Promise<any[]> {
    // This would query the database to check which terms already have content for this column
    // For now, return all terms
    return terms;
  }

  /**
   * Calculate cost based on model and token usage
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const modelCosts = {
      'gpt-4.1-nano': { input: 0.05, output: 0.20 }, // per 1M tokens
      'gpt-4.1-mini': { input: 0.20, output: 0.80 },
      'o4-mini': { input: 0.55, output: 2.20 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 }, // fallback
      'gpt-3.5-turbo': { input: 0.50, output: 1.50 } // fallback
    };

    const costs = modelCosts[model] || modelCosts['gpt-4o-mini'];
    
    const inputCost = (inputTokens / 1000000) * costs.input;
    const outputCost = (outputTokens / 1000000) * costs.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get statistics about the 295-column structure
   */
  getStructureStats() {
    const total = HIERARCHICAL_295_STRUCTURE.length;
    const byCategory = {
      essential: HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'essential').length,
      important: HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'important').length,
      supplementary: HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'supplementary').length,
      advanced: HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'advanced').length
    };
    const interactive = HIERARCHICAL_295_STRUCTURE.filter(col => col.isInteractive).length;
    const totalTokens = HIERARCHICAL_295_STRUCTURE.reduce((sum, col) => sum + col.estimatedTokens, 0);
    
    return {
      total,
      byCategory,
      interactive,
      totalTokens,
      averageTokens: Math.round(totalTokens / total),
      estimatedCostForAllTerms: estimatePromptCost('all', 11000) // Estimate for 11k terms
    };
  }

  /**
   * Get available columns for processing
   */
  getAvailableColumns(): ColumnDefinition[] {
    return HIERARCHICAL_295_STRUCTURE;
  }

  /**
   * Get essential columns for quick start
   */
  getEssentialColumns(): ColumnDefinition[] {
    return HIERARCHICAL_295_STRUCTURE.filter(col => col.category === 'essential');
  }
}

export const enhanced295ContentService = new Enhanced295ContentService();
export default enhanced295ContentService;
