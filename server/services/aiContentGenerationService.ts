import { and, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import {
  aiContentVerification,
  aiUsageAnalytics,
  enhancedTerms,
  modelContentVersions,
  sectionItems,
  sections,
} from '../../shared/enhancedSchema';
import { db } from '../db';
import { log as logger } from '../utils/logger';
import { promptTemplateService } from './promptTemplateService';

export interface ContentGenerationRequest {
  termId: string;
  sectionName: string;
  templateId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  regenerate?: boolean; // Force regeneration even if content exists
  storeAsVersion?: boolean; // Store as model version for comparison
}

export interface MultiModelGenerationRequest {
  termId: string;
  sectionName: string;
  templateId?: string;
  models: string[]; // Array of models to generate with
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}

export interface ModelVersionResponse {
  id: string;
  model: string;
  content: string;
  qualityScore?: number;
  cost: number;
  processingTime: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: Date;
  isSelected: boolean;
  userRating?: number;
  userNotes?: string;
}

export interface ContentGenerationResponse {
  success: boolean;
  content?: string;
  metadata?: {
    termId: string;
    termName: string;
    sectionName: string;
    templateUsed: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    generatedAt: Date;
    processingTime: number;
  };
  error?: string;
}

export interface BulkGenerationRequest {
  termId: string;
  sectionNames: string[];
  templateId?: string;
  model?: string;
  userId?: string;
  regenerate?: boolean;
}

export interface BulkGenerationResponse {
  success: boolean;
  results: ContentGenerationResponse[];
  summary: {
    totalSections: number;
    successCount: number;
    failureCount: number;
    totalCost: number;
    totalTokens: number;
    processingTime: number;
  };
}

/**
 * Service for AI-powered content generation with comprehensive tracking and management
 */
export class AIContentGenerationService {
  private openai: OpenAI;
  private readonly DEFAULT_MODEL = 'gpt-4.1-mini';
  private readonly DEFAULT_TEMPERATURE = 0.7;
  private readonly DEFAULT_MAX_TOKENS = 1000;

  private readonly MODEL_COSTS = {
    'gpt-4.1': { input: 0.025, output: 0.1 }, // Per 1K tokens
    'gpt-4.1-mini': { input: 0.0002, output: 0.0008 }, // Per 1K tokens
    'gpt-4.1-nano': { input: 0.00005, output: 0.0002 }, // Per 1K tokens
    'o1-mini': { input: 0.003, output: 0.012 }, // Per 1K tokens
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // Per 1K tokens
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
   * Generate content for a specific term and section
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      await this.validateRequest(request);

      // Get term data
      const termData = await this.getTermData(request.termId);
      if (!termData) {
        throw new Error(`Term with ID ${request.termId} not found`);
      }

      // Check if content already exists and regenerate is false
      if (!request.regenerate) {
        const existingContent = await this.getExistingContent(request.termId, request.sectionName);
        if (existingContent) {
          logger.info(`Content already exists for ${termData.name} - ${request.sectionName}`);
          return {
            success: true,
            content: existingContent.content || '',
            metadata: {
              termId: request.termId,
              termName: termData.name,
              sectionName: request.sectionName,
              templateUsed: 'existing',
              model: 'cached',
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              cost: 0,
              generatedAt: existingContent.updatedAt || new Date(),
              processingTime: Date.now() - startTime,
            },
          };
        }
      }

      // Generate prompt using template service
      const prompt = await promptTemplateService.generateContent({
        termId: request.termId,
        sectionName: request.sectionName,
        templateId: request.templateId,
        model: request.model || this.DEFAULT_MODEL,
        temperature: request.temperature || this.DEFAULT_TEMPERATURE,
        maxTokens: request.maxTokens || this.DEFAULT_MAX_TOKENS,
      });

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: request.model || this.DEFAULT_MODEL,
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
        temperature: request.temperature || this.DEFAULT_TEMPERATURE,
        max_tokens: request.maxTokens || this.DEFAULT_MAX_TOKENS,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }

      // Calculate metrics
      const processingTime = Date.now() - startTime;
      const promptTokens = completion.usage?.prompt_tokens || 0;
      const completionTokens = completion.usage?.completion_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      const cost = this.calculateCost(
        request.model || this.DEFAULT_MODEL,
        promptTokens,
        completionTokens
      );

      // Store content in database
      if (request.storeAsVersion) {
        await this.storeModelVersion(request.termId, request.sectionName, content, {
          templateUsed: request.templateId || 'default',
          model: request.model || this.DEFAULT_MODEL,
          promptTokens,
          completionTokens,
          cost,
          userId: request.userId,
          processingTime,
        });
      } else {
        await this.storeGeneratedContent(request.termId, request.sectionName, content, {
          templateUsed: request.templateId || 'default',
          model: request.model || this.DEFAULT_MODEL,
          promptTokens,
          completionTokens,
          cost,
          userId: request.userId,
        });
      }

      // Log usage analytics
      await this.logUsageAnalytics({
        operation: 'generate_content',
        termId: request.termId,
        model: request.model || this.DEFAULT_MODEL,
        userId: request.userId,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        cost,
        latency: processingTime,
        success: true,
      });

      // Create AI content verification record
      await this.createVerificationRecord(request.termId, request.userId);

      const response: ContentGenerationResponse = {
        success: true,
        content,
        metadata: {
          termId: request.termId,
          termName: termData.name,
          sectionName: request.sectionName,
          templateUsed: request.templateId || 'default',
          model: request.model || this.DEFAULT_MODEL,
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
          generatedAt: new Date(),
          processingTime,
        },
      };

      logger.info(`✅ Generated content for ${termData.name} - ${request.sectionName}`, {
        tokens: totalTokens,
        cost,
        processingTime,
      });

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Log failed usage
      await this.logUsageAnalytics({
        operation: 'generate_content',
        termId: request.termId,
        model: request.model || this.DEFAULT_MODEL,
        userId: request.userId,
        latency: processingTime,
        success: false,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error('Error generating content:', {
        error: error instanceof Error ? error.message : String(error),
        termId: request.termId,
        sectionName: request.sectionName,
        processingTime,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate content using multiple models for comparison
   */
  async generateMultiModelContent(request: MultiModelGenerationRequest): Promise<{
    success: boolean;
    versions: ModelVersionResponse[];
    summary: {
      totalModels: number;
      successCount: number;
      failureCount: number;
      totalCost: number;
      totalTokens: number;
      processingTime: number;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    const versions: ModelVersionResponse[] = [];
    let totalCost = 0;
    let totalTokens = 0;
    let successCount = 0;
    let failureCount = 0;

    logger.info(`Starting multi-model generation for ${request.models.length} models`);

    try {
      // Generate content with each model
      for (const model of request.models) {
        try {
          const modelResult = await this.generateContent({
            termId: request.termId,
            sectionName: request.sectionName,
            templateId: request.templateId,
            model,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            userId: request.userId,
            regenerate: true, // Always regenerate for comparison
            storeAsVersion: true, // Store as version for comparison
          });

          if (modelResult.success && modelResult.metadata) {
            const versionData = await this.getLatestModelVersion(
              request.termId,
              request.sectionName,
              model
            );
            if (versionData) {
              versions.push(versionData);
              successCount++;
              totalCost += modelResult.metadata.cost;
              totalTokens += modelResult.metadata.totalTokens;
            }
          } else {
            failureCount++;
            logger.error(`Failed to generate content with model ${model}:`, {
              error: modelResult.error,
            });
          }

          // Add delay between requests to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          failureCount++;
          logger.error(`Error generating content with model ${model}:`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        success: successCount > 0,
        versions,
        summary: {
          totalModels: request.models.length,
          successCount,
          failureCount,
          totalCost,
          totalTokens,
          processingTime,
        },
      };
    } catch (error) {
      logger.error('Error in multi-model generation:', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        versions: [],
        summary: {
          totalModels: request.models.length,
          successCount: 0,
          failureCount: request.models.length,
          totalCost: 0,
          totalTokens: 0,
          processingTime: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate content for multiple sections of a term
   */
  async generateBulkContent(request: BulkGenerationRequest): Promise<BulkGenerationResponse> {
    const startTime = Date.now();
    const results: ContentGenerationResponse[] = [];
    let totalCost = 0;
    let totalTokens = 0;
    let successCount = 0;
    let failureCount = 0;

    logger.info(`Starting bulk generation for ${request.sectionNames.length} sections`);

    // Process each section
    for (const sectionName of request.sectionNames) {
      try {
        const sectionResult = await this.generateContent({
          termId: request.termId,
          sectionName,
          templateId: request.templateId,
          model: request.model,
          userId: request.userId,
          regenerate: request.regenerate,
        });

        results.push(sectionResult);

        if (sectionResult.success) {
          successCount++;
          if (sectionResult.metadata) {
            totalCost += sectionResult.metadata.cost;
            totalTokens += sectionResult.metadata.totalTokens;
          }
        } else {
          failureCount++;
        }

        // Add small delay between requests to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        failureCount++;
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        logger.error(`Error in bulk generation for section ${sectionName}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info(`Bulk generation completed`, {
      totalSections: request.sectionNames.length,
      successCount,
      failureCount,
      totalCost,
      totalTokens,
      processingTime,
    });

    return {
      success: successCount > 0,
      results,
      summary: {
        totalSections: request.sectionNames.length,
        successCount,
        failureCount,
        totalCost,
        totalTokens,
        processingTime,
      },
    };
  }

  /**
   * Get existing content for a term section
   */
  private async getExistingContent(termId: string, sectionName: string) {
    try {
      // First get the section
      const sectionData = await db
        .select()
        .from(sections)
        .where(and(eq(sections.termId, termId), eq(sections.name, sectionName)))
        .limit(1);

      if (sectionData.length === 0) {
        return null;
      }

      // Get the section items
      const sectionItemData = await db
        .select()
        .from(sectionItems)
        .where(
          and(eq(sectionItems.sectionId, sectionData[0].id), eq(sectionItems.label, sectionName))
        )
        .limit(1);

      return sectionItemData.length > 0 ? sectionItemData[0] : null;
    } catch (error) {
      logger.error('Error getting existing content:', {
        error: error instanceof Error ? error.message : String(error),
        termId,
        sectionName,
      });
      return null;
    }
  }

  /**
   * Store model version for comparison
   */
  private async storeModelVersion(
    termId: string,
    sectionName: string,
    content: string,
    metadata: {
      templateUsed: string;
      model: string;
      promptTokens: number;
      completionTokens: number;
      cost: number;
      userId?: string;
      processingTime: number;
    }
  ) {
    try {
      await db.insert(modelContentVersions).values({
        termId,
        sectionName,
        model: metadata.model,
        content,
        templateId: metadata.templateUsed,
        promptTokens: metadata.promptTokens,
        completionTokens: metadata.completionTokens,
        totalTokens: metadata.promptTokens + metadata.completionTokens,
        cost: metadata.cost.toString(),
        processingTime: metadata.processingTime,
        generatedBy: metadata.userId,
        status: 'generated',
        metadata: {
          templateUsed: metadata.templateUsed,
          generatedAt: new Date().toISOString(),
        },
      });

      logger.info(`Stored model version for ${termId} - ${sectionName} - ${metadata.model}`);
    } catch (error) {
      logger.error('Error storing model version:', {
        error: error instanceof Error ? error.message : String(error),
        termId,
        sectionName,
        model: metadata.model,
      });
      throw error;
    }
  }

  /**
   * Get latest model version for a term/section/model combination
   */
  private async getLatestModelVersion(
    termId: string,
    sectionName: string,
    model: string
  ): Promise<ModelVersionResponse | null> {
    try {
      const versions = await db
        .select()
        .from(modelContentVersions)
        .where(
          and(
            eq(modelContentVersions.termId, termId),
            eq(modelContentVersions.sectionName, sectionName),
            eq(modelContentVersions.model, model)
          )
        )
        .orderBy(modelContentVersions.createdAt)
        .limit(1);

      if (versions.length === 0) return null;

      const version = versions[0];
      return {
        id: version.id,
        model: version.model || '',
        content: version.content,
        qualityScore: version.qualityScore ? parseFloat(version.qualityScore) : undefined,
        cost: parseFloat(version.cost),
        processingTime: version.processingTime || 0,
        promptTokens: version.promptTokens || 0,
        completionTokens: version.completionTokens || 0,
        totalTokens: version.totalTokens || 0,
        createdAt: version.createdAt || new Date(),
        isSelected: version.isSelected || false,
        userRating: version.userRating || undefined,
        userNotes: version.userNotes || undefined,
      };
    } catch (error) {
      logger.error('Error getting latest model version:', {
        error: error instanceof Error ? error.message : String(error),
        termId,
        sectionName,
        model,
      });
      return null;
    }
  }

  /**
   * Get all model versions for a term/section
   */
  async getModelVersions(termId: string, sectionName: string): Promise<ModelVersionResponse[]> {
    try {
      const versions = await db
        .select()
        .from(modelContentVersions)
        .where(
          and(
            eq(modelContentVersions.termId, termId),
            eq(modelContentVersions.sectionName, sectionName)
          )
        )
        .orderBy(modelContentVersions.createdAt);

      return versions.map((version) => ({
        id: version.id,
        model: version.model || '',
        content: version.content,
        qualityScore: version.qualityScore ? parseFloat(version.qualityScore) : undefined,
        cost: parseFloat(version.cost),
        processingTime: version.processingTime || 0,
        promptTokens: version.promptTokens || 0,
        completionTokens: version.completionTokens || 0,
        totalTokens: version.totalTokens || 0,
        createdAt: version.createdAt || new Date(),
        isSelected: version.isSelected || false,
        userRating: version.userRating || undefined,
        userNotes: version.userNotes || undefined,
      }));
    } catch (error) {
      logger.error('Error getting model versions:', {
        error: error instanceof Error ? error.message : String(error),
        termId,
        sectionName,
      });
      return [];
    }
  }

  /**
   * Select a model version as the chosen one
   */
  async selectModelVersion(
    versionId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the version to select
      const version = await db
        .select()
        .from(modelContentVersions)
        .where(eq(modelContentVersions.id, versionId))
        .limit(1);

      if (version.length === 0) {
        return { success: false, error: 'Version not found' };
      }

      const selectedVersion = version[0];

      // Unselect all other versions for this term/section
      await db
        .update(modelContentVersions)
        .set({ isSelected: false })
        .where(
          and(
            eq(modelContentVersions.termId, selectedVersion.termId),
            eq(modelContentVersions.sectionName, selectedVersion.sectionName)
          )
        );

      // Select the chosen version
      await db
        .update(modelContentVersions)
        .set({
          isSelected: true,
          status: 'selected',
          updatedAt: new Date(),
        })
        .where(eq(modelContentVersions.id, versionId));

      // Also update the main section item with the selected content
      await this.storeGeneratedContent(
        selectedVersion.termId,
        selectedVersion.sectionName,
        selectedVersion.content,
        {
          templateUsed: selectedVersion.templateId || 'default',
          model: selectedVersion.model,
          promptTokens: selectedVersion.promptTokens,
          completionTokens: selectedVersion.completionTokens,
          cost: parseFloat(selectedVersion.cost),
          userId,
        }
      );

      logger.info(
        `Selected model version ${versionId} for ${selectedVersion.termId} - ${selectedVersion.sectionName}`
      );
      return { success: true };
    } catch (error) {
      logger.error('Error selecting model version:', {
        error: error instanceof Error ? error.message : String(error),
        versionId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Rate a model version
   */
  async rateModelVersion(
    versionId: string,
    rating: number,
    notes?: string,
    _userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }

      await db
        .update(modelContentVersions)
        .set({
          userRating: rating,
          userNotes: notes,
          updatedAt: new Date(),
        })
        .where(eq(modelContentVersions.id, versionId));

      logger.info(`Rated model version ${versionId} with ${rating} stars`);
      return { success: true };
    } catch (error) {
      logger.error('Error rating model version:', {
        error: error instanceof Error ? error.message : String(error),
        versionId,
        rating,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Store generated content in database
   */
  private async storeGeneratedContent(
    termId: string,
    sectionName: string,
    content: string,
    metadata: {
      templateUsed: string;
      model: string;
      promptTokens: number;
      completionTokens: number;
      cost: number;
      userId?: string;
    }
  ) {
    try {
      // Get or create section
      const sectionData = await db
        .select()
        .from(sections)
        .where(and(eq(sections.termId, termId), eq(sections.name, sectionName)))
        .limit(1);

      let sectionId: number;
      if (sectionData.length === 0) {
        // Create new section
        const newSection = await db
          .insert(sections)
          .values({
            termId,
            name: sectionName,
            displayOrder: 0,
            isCompleted: true,
          })
          .returning();
        sectionId = newSection[0].id;
      } else {
        sectionId = sectionData[0].id;
      }

      // Check if section item exists
      const existingItem = await db
        .select()
        .from(sectionItems)
        .where(and(eq(sectionItems.sectionId, sectionId), eq(sectionItems.label, sectionName)))
        .limit(1);

      const itemData = {
        sectionId,
        label: sectionName,
        content,
        contentType: 'markdown',
        displayOrder: 0,
        isAiGenerated: true,
        verificationStatus: 'unverified',
        metadata: {
          templateUsed: metadata.templateUsed,
          model: metadata.model,
          promptTokens: metadata.promptTokens,
          completionTokens: metadata.completionTokens,
          cost: metadata.cost,
          generatedAt: new Date().toISOString(),
          generatedBy: metadata.userId,
        },
      };

      if (existingItem.length > 0) {
        // Update existing item
        await db.update(sectionItems).set(itemData).where(eq(sectionItems.id, existingItem[0].id));
      } else {
        // Create new item
        await db.insert(sectionItems).values(itemData);
      }

      logger.info(`Stored generated content for ${termId} - ${sectionName}`);
    } catch (error) {
      logger.error('Error storing generated content:', {
        error: error instanceof Error ? error.message : String(error),
        termId,
        sectionName,
      });
      throw error;
    }
  }

  /**
   * Create AI content verification record
   */
  private async createVerificationRecord(termId: string, userId?: string) {
    try {
      // Check if verification record exists
      const existing = await db
        .select()
        .from(aiContentVerification)
        .where(eq(aiContentVerification.termId, termId))
        .limit(1);

      if (existing.length === 0) {
        // Create new verification record
        await db.insert(aiContentVerification).values({
          termId,
          isAiGenerated: true,
          aiModel: this.DEFAULT_MODEL,
          generatedAt: new Date(),
          generatedBy: userId,
          verificationStatus: 'unverified',
          confidenceLevel: 'medium',
        });
      } else {
        // Update existing record
        await db
          .update(aiContentVerification)
          .set({
            isAiGenerated: true,
            aiModel: this.DEFAULT_MODEL,
            generatedAt: new Date(),
            generatedBy: userId,
            verificationStatus: 'unverified',
            lastReviewedAt: new Date(),
          })
          .where(eq(aiContentVerification.id, existing[0].id));
      }
    } catch (error) {
      logger.error('Error creating verification record:', {
        error: error instanceof Error ? error.message : String(error),
        termId,
        userId,
      });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Log usage analytics
   */
  private async logUsageAnalytics(data: {
    operation: string;
    termId: string;
    model: string;
    userId?: string;
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
    latency: number;
    success: boolean;
    errorType?: string;
    errorMessage?: string;
  }) {
    try {
      await db.insert(aiUsageAnalytics).values({
        operation: data.operation,
        model: data.model,
        userId: data.userId,
        termId: data.termId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        latency: data.latency,
        cost: data.cost?.toString(),
        success: data.success,
        errorType: data.errorType,
        errorMessage: data.errorMessage,
      });
    } catch (error) {
      logger.error('Error logging usage analytics:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get term data from database
   */
  private async getTermData(termId: string) {
    try {
      const termData = await db
        .select()
        .from(enhancedTerms)
        .where(eq(enhancedTerms.id, termId))
        .limit(1);

      return termData.length > 0 ? termData[0] : null;
    } catch (error) {
      logger.error('Error getting term data:', {
        error: error instanceof Error ? error.message : String(error),
        termId,
      });
      return null;
    }
  }

  /**
   * Calculate API cost based on model and tokens
   */
  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS];
    if (!costs) {
      logger.warn(`Unknown model for cost calculation: ${model}`);
      return 0;
    }

    return (promptTokens / 1000) * costs.input + (completionTokens / 1000) * costs.output;
  }

  /**
   * Validate generation request
   */
  private async validateRequest(request: ContentGenerationRequest) {
    if (!request.termId || !request.sectionName) {
      throw new Error('termId and sectionName are required');
    }

    // Validate model if provided
    if (request.model && !this.MODEL_COSTS[request.model as keyof typeof this.MODEL_COSTS]) {
      throw new Error(`Unsupported model: ${request.model}`);
    }

    // Validate temperature
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    // Validate max tokens
    if (request.maxTokens !== undefined && (request.maxTokens < 1 || request.maxTokens > 4000)) {
      throw new Error('Max tokens must be between 1 and 4000');
    }
  }

  /**
   * Get system prompt for AI content generation
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
- Include code examples where appropriate (with proper syntax)
- Structure content for easy reading and comprehension

Your content will be marked as AI-generated and subject to expert review. Prioritize accuracy and educational value over completeness.`;
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(_termId?: string): Promise<{
    totalGenerations: number;
    successRate: number;
    totalCost: number;
    averageCost: number;
    averageTokens: number;
    modelUsage: { [model: string]: number };
  }> {
    try {
      // This would require a complex query, for now return basic stats
      // In a real implementation, you'd query the aiUsageAnalytics table
      return {
        totalGenerations: 0,
        successRate: 0,
        totalCost: 0,
        averageCost: 0,
        averageTokens: 0,
        modelUsage: {},
      };
    } catch (error) {
      logger.error('Error getting generation stats:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const aiContentGenerationService = new AIContentGenerationService();
export default aiContentGenerationService;
