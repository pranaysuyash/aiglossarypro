/**
 * AI Content Generation Job Processor
 * Handles AI-powered content generation for terms
 */

import { Job } from 'bullmq';
import { 
  AIContentGenerationJobData, 
  AIContentGenerationJobResult,
  JobProgressUpdate 
} from '../types';
import { aiService } from '../../aiService';
import { enhancedStorage } from '../../enhancedStorage';
import { log as logger } from '../../utils/logger';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Content generation templates for different sections
const SECTION_PROMPTS = {
  'Practical Examples': 'Generate 3-5 practical, real-world examples of {term} in AI/ML applications. Format as a list with brief explanations.',
  'Common Pitfalls': 'List 3-5 common mistakes or pitfalls when working with {term} in AI/ML. Include brief advice on how to avoid each.',
  'Best Practices': 'Provide 4-6 best practices for implementing or using {term} effectively in AI/ML projects.',
  'Industry Applications': 'Describe 3-5 specific industry applications or use cases where {term} is particularly valuable.',
  'Technical Deep Dive': 'Provide a technical explanation of {term} including mathematical foundations, algorithms, or implementation details where relevant.',
  'Related Technologies': 'List and briefly describe 4-6 technologies, frameworks, or tools closely related to {term}.',
  'Learning Path': 'Create a structured learning path for mastering {term}, including prerequisites, key concepts, and recommended resources.',
  'Interview Questions': 'Generate 5-7 common interview questions about {term} with brief answer guidelines.',
  'Code Examples': 'Provide 2-3 code examples demonstrating {term} in Python, with brief explanations.',
  'Research Papers': 'List 3-5 influential research papers related to {term} with brief summaries of their contributions.',
};

export async function aiContentGenerationProcessor(
  job: Job<AIContentGenerationJobData>
): Promise<AIContentGenerationJobResult> {
  const startTime = Date.now();
  const { 
    termId, 
    termName, 
    sections, 
    model = 'gpt-4-turbo-preview',
    temperature = 0.7,
    maxRetries = 3,
  } = job.data;

  logger.info(`Starting AI content generation job ${job.id} for term: ${termName}`);

  const result: AIContentGenerationJobResult = {
    termId,
    generatedSections: {},
    tokensUsed: 0,
    cost: 0,
    duration: 0,
  };

  try {
    // Get existing term data for context
    await job.updateProgress({
      progress: 5,
      message: 'Fetching term context',
      stage: 'initialization',
    } as JobProgressUpdate);

    const existingTerm = await enhancedStorage.getTermById(termId);
    if (!existingTerm) {
      throw new Error(`Term not found: ${termId}`);
    }

    // Generate content for each requested section
    const totalSections = sections.length;
    let processedSections = 0;

    for (const section of sections) {
      try {
        await job.updateProgress({
          progress: 5 + (processedSections / totalSections) * 90,
          message: `Generating content for section: ${section}`,
          stage: 'generation',
          details: {
            currentSection: section,
            processedSections,
            totalSections,
          },
        } as JobProgressUpdate);

        // Get the prompt template
        const promptTemplate = SECTION_PROMPTS[section as keyof typeof SECTION_PROMPTS];
        if (!promptTemplate) {
          logger.warn(`No prompt template found for section: ${section}`);
          continue;
        }

        // Build the prompt with context
        const prompt = buildPrompt(promptTemplate, termName, existingTerm);

        // Generate content with retry logic
        let attempts = 0;
        let content = null;
        let sectionTokens = 0;

        while (attempts < maxRetries && !content) {
          try {
            const response = await openai.chat.completions.create({
              model,
              messages: [
                {
                  role: 'system',
                  content: 'You are an AI/ML expert assistant. Generate clear, accurate, and practical content for glossary terms. Focus on real-world applications and examples.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              temperature,
              max_tokens: 1000,
            });

            content = response.choices[0].message.content;
            sectionTokens = response.usage?.total_tokens || 0;
            result.tokensUsed += sectionTokens;

            // Parse and structure the content
            const structuredContent = parseGeneratedContent(section, content);
            result.generatedSections[section] = structuredContent;

            logger.info(`Generated content for section ${section} of term ${termName}`);
          } catch (error) {
            attempts++;
            logger.error(`Attempt ${attempts} failed for section ${section}:`, error);
            
            if (attempts >= maxRetries) {
              throw error;
            }
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }

        processedSections++;
      } catch (sectionError) {
        logger.error(`Failed to generate content for section ${section}:`, sectionError);
        result.generatedSections[section] = {
          error: sectionError instanceof Error ? sectionError.message : 'Generation failed',
        };
      }
    }

    // Calculate cost (approximate based on GPT-4 pricing)
    result.cost = calculateCost(result.tokensUsed, model);

    // Save generated content to database
    await job.updateProgress({
      progress: 95,
      message: 'Saving generated content',
      stage: 'saving',
    } as JobProgressUpdate);

    await enhancedStorage.updateTermSections(termId, result.generatedSections);

    result.duration = Date.now() - startTime;

    await job.updateProgress({
      progress: 100,
      message: 'Content generation completed',
      stage: 'completed',
      details: {
        sectionsGenerated: Object.keys(result.generatedSections).length,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        duration: result.duration,
      },
    } as JobProgressUpdate);

    logger.info(`AI content generation job ${job.id} completed`, {
      termId,
      sectionsGenerated: Object.keys(result.generatedSections).length,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
    });

    return result;

  } catch (error) {
    logger.error(`AI content generation job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * Build a contextualized prompt
 */
function buildPrompt(template: string, termName: string, termData: any): string {
  let prompt = template.replace(/{term}/g, termName);

  // Add context from existing term data
  const context = [];
  
  if (termData.definition) {
    context.push(`Definition: ${termData.definition}`);
  }
  
  if (termData.categories?.length > 0) {
    context.push(`Categories: ${termData.categories.join(', ')}`);
  }
  
  if (termData.key_concepts?.length > 0) {
    context.push(`Key concepts: ${termData.key_concepts.join(', ')}`);
  }

  if (context.length > 0) {
    prompt = `Context:\n${context.join('\n')}\n\n${prompt}`;
  }

  return prompt;
}

/**
 * Parse and structure generated content based on section type
 */
function parseGeneratedContent(section: string, content: string): any {
  // Remove any markdown formatting for consistent structure
  const cleanContent = content.trim();

  // Parse based on section type
  switch (section) {
    case 'Practical Examples':
    case 'Common Pitfalls':
    case 'Best Practices':
    case 'Industry Applications':
    case 'Related Technologies':
    case 'Interview Questions':
      // Parse as list items
      const items = cleanContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(line => line.length > 0);
      return { items };

    case 'Code Examples':
      // Extract code blocks
      const codeBlocks = [];
      const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;
      
      while ((match = codeRegex.exec(cleanContent)) !== null) {
        codeBlocks.push({
          language: match[1] || 'python',
          code: match[2].trim(),
        });
      }
      
      // Also extract any inline explanations
      const explanations = cleanContent
        .replace(codeRegex, '')
        .split('\n')
        .filter(line => line.trim())
        .join('\n');
      
      return { codeBlocks, explanations };

    case 'Research Papers':
      // Parse paper entries
      const papers = cleanContent
        .split('\n\n')
        .filter(entry => entry.trim())
        .map(entry => {
          const lines = entry.split('\n');
          const title = lines[0]?.replace(/^[-*•]\s*/, '').trim();
          const summary = lines.slice(1).join(' ').trim();
          return { title, summary };
        });
      return { papers };

    case 'Learning Path':
      // Parse as structured learning steps
      const steps = cleanContent
        .split(/\d+\.\s+/)
        .filter(step => step.trim())
        .map((step, index) => ({
          order: index + 1,
          content: step.trim(),
        }));
      return { steps };

    case 'Technical Deep Dive':
    default:
      // Return as formatted text
      return { content: cleanContent };
  }
}

/**
 * Calculate approximate cost based on token usage
 */
function calculateCost(tokens: number, model: string): number {
  // Approximate pricing per 1K tokens (as of 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  };

  const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
  
  // Assume roughly 2/3 input tokens, 1/3 output tokens
  const inputTokens = Math.floor(tokens * 0.67);
  const outputTokens = tokens - inputTokens;
  
  const cost = (inputTokens / 1000) * modelPricing.input + 
                (outputTokens / 1000) * modelPricing.output;
  
  return Math.round(cost * 10000) / 10000; // Round to 4 decimal places
}