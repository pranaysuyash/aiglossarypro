import { db } from '../db';
import { enhancedTerms, sectionItems } from '../../shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';
import { log as logger } from '../utils/logger';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariables {
  termName: string;
  termDefinition?: string;
  sectionName: string;
  sectionType?: string;
  context?: string;
  previousContent?: string;
  relatedTerms?: string[];
  category?: string;
  difficultyLevel?: string;
  [key: string]: any;
}

export interface GenerationRequest {
  termId: string;
  sectionName: string;
  templateId?: string;
  variables?: Partial<PromptVariables>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerationResponse {
  content: string;
  metadata: {
    templateUsed: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    generatedAt: Date;
  };
}

/**
 * Service for managing AI prompt templates for content generation
 */
export class PromptTemplateService {
  private templates: Map<string, PromptTemplate> = new Map();
  private defaultTemplates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default prompt templates for common content generation scenarios
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates = [
      {
        id: 'definition',
        name: 'Basic Definition',
        description: 'Generate comprehensive definition for AI/ML terms',
        template: `You are an AI/ML expert creating educational content. Generate a comprehensive definition for the term "{{termName}}"{{#if category}} in the {{category}} category{{/if}}.

{{#if termDefinition}}
Current definition: {{termDefinition}}
{{/if}}

{{#if context}}
Context: {{context}}
{{/if}}

Please provide:
1. A clear, concise definition
2. Key characteristics
3. Real-world applications
4. Related concepts

Requirements:
- Focus on technical accuracy
- Make it accessible to {{difficultyLevel}} learners
- Include practical examples
- Do not fabricate sources or citations
- Keep content factual and verifiable

Return the content as clear, well-structured text suitable for educational purposes.`,
        variables: ['termName', 'category', 'termDefinition', 'context', 'difficultyLevel'],
        category: 'definition',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'implementation',
        name: 'Implementation Guide',
        description: 'Generate implementation examples and code snippets',
        template: `You are an AI/ML implementation expert. Create practical implementation guidance for "{{termName}}"{{#if category}} in {{category}}{{/if}}.

{{#if termDefinition}}
Term definition: {{termDefinition}}
{{/if}}

{{#if previousContent}}
Previous content: {{previousContent}}
{{/if}}

Generate implementation guidance including:
1. Step-by-step implementation approach
2. Code examples in Python (preferred) or relevant languages
3. Common libraries and frameworks
4. Best practices and common pitfalls
5. Performance considerations

Requirements:
- Focus on practical, working examples
- Use widely-adopted libraries
- Include error handling
- Explain code logic clearly
- Target {{difficultyLevel}} developers

Provide clear, executable code examples with explanations.`,
        variables: ['termName', 'category', 'termDefinition', 'previousContent', 'difficultyLevel'],
        category: 'implementation',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'applications',
        name: 'Real-world Applications',
        description: 'Generate practical applications and use cases',
        template: `You are an AI/ML applications expert. Generate real-world applications and use cases for "{{termName}}"{{#if category}} in {{category}}{{/if}}.

{{#if termDefinition}}
Term definition: {{termDefinition}}
{{/if}}

{{#if relatedTerms}}
Related terms: {{join relatedTerms ", "}}
{{/if}}

Create comprehensive applications content including:
1. Industry use cases with specific examples
2. Business impact and value propositions
3. Success stories and case studies
4. Current market applications
5. Future potential and trends

Requirements:
- Focus on real, documented applications
- Include specific industry examples
- Mention company names only if publicly known
- Avoid speculation or unverified claims
- Make it relevant to {{difficultyLevel}} audience

Provide concrete, verifiable examples of practical applications.`,
        variables: ['termName', 'category', 'termDefinition', 'relatedTerms', 'difficultyLevel'],
        category: 'applications',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mathematical',
        name: 'Mathematical Foundation',
        description: 'Generate mathematical formulations and theoretical background',
        template: `You are an AI/ML mathematics expert. Generate mathematical foundations and theoretical background for "{{termName}}"{{#if category}} in {{category}}{{/if}}.

{{#if termDefinition}}
Term definition: {{termDefinition}}
{{/if}}

Create mathematical content including:
1. Core mathematical formulation
2. Key equations and notation
3. Mathematical intuition and explanation
4. Derivation steps (if appropriate)
5. Computational complexity considerations

Requirements:
- Use standard mathematical notation
- Provide clear explanations alongside formulas
- Include intuitive explanations
- Verify mathematical accuracy
- Target {{difficultyLevel}} mathematical background
- Use LaTeX formatting for equations where appropriate

Present mathematical concepts with clear explanations and proper notation.`,
        variables: ['termName', 'category', 'termDefinition', 'difficultyLevel'],
        category: 'mathematical',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'prerequisites',
        name: 'Prerequisites and Background',
        description: 'Generate prerequisite knowledge and background information',
        template: `You are an AI/ML education expert. Generate prerequisite knowledge and background information for understanding "{{termName}}"{{#if category}} in {{category}}{{/if}}.

{{#if termDefinition}}
Term definition: {{termDefinition}}
{{/if}}

{{#if relatedTerms}}
Related terms: {{join relatedTerms ", "}}
{{/if}}

Create prerequisites content including:
1. Required mathematical background
2. Prerequisite concepts and terms
3. Recommended prior knowledge
4. Learning path suggestions
5. Foundational resources

Requirements:
- Structure from basic to advanced
- Link to fundamental concepts
- Provide learning sequence
- Consider {{difficultyLevel}} starting point
- Include self-assessment guidance

Structure the prerequisites logically from foundational to advanced concepts.`,
        variables: ['termName', 'category', 'termDefinition', 'relatedTerms', 'difficultyLevel'],
        category: 'prerequisites',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'evaluation',
        name: 'Evaluation and Metrics',
        description: 'Generate evaluation methods and performance metrics',
        template: `You are an AI/ML evaluation expert. Generate evaluation methods and performance metrics for "{{termName}}"{{#if category}} in {{category}}{{/if}}.

{{#if termDefinition}}
Term definition: {{termDefinition}}
{{/if}}

Create evaluation content including:
1. Key performance metrics
2. Evaluation methodologies
3. Benchmarking approaches
4. Common evaluation pitfalls
5. Industry standards and practices

Requirements:
- Focus on practical evaluation methods
- Include both quantitative and qualitative metrics
- Explain metric interpretation
- Mention standard benchmarks
- Consider {{difficultyLevel}} evaluation needs
- Include code examples for metric calculation

Provide comprehensive guidance on measuring and evaluating performance.`,
        variables: ['termName', 'category', 'termDefinition', 'difficultyLevel'],
        category: 'evaluation',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Load default templates
    defaultTemplates.forEach(template => {
      this.defaultTemplates.set(template.id, template as PromptTemplate);
      this.templates.set(template.id, template as PromptTemplate);
    });

    logger.info(`✅ Loaded ${defaultTemplates.length} default prompt templates`);
  }

  /**
   * Get a prompt template by ID
   */
  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Get the default template for a section/category
   */
  getDefaultTemplate(sectionName: string): PromptTemplate | undefined {
    // Map section names to template categories
    const sectionTemplateMap: { [key: string]: string } = {
      'definition': 'definition',
      'overview': 'definition',
      'introduction': 'definition',
      'implementation': 'implementation',
      'code_examples': 'implementation',
      'python_implementation': 'implementation',
      'applications': 'applications',
      'use_cases': 'applications',
      'industry_applications': 'applications',
      'mathematical_foundation': 'mathematical',
      'theory': 'mathematical',
      'mathematics': 'mathematical',
      'prerequisites': 'prerequisites',
      'background': 'prerequisites',
      'evaluation': 'evaluation',
      'metrics': 'evaluation',
      'benchmarks': 'evaluation'
    };

    const templateCategory = sectionTemplateMap[sectionName.toLowerCase()] || 'definition';
    return this.defaultTemplates.get(templateCategory);
  }

  /**
   * Render a template with variables using simple template engine
   */
  renderTemplate(template: PromptTemplate, variables: PromptVariables): string {
    let rendered = template.template;

    // Simple variable substitution
    Object.entries(variables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const valueStr = Array.isArray(value) ? value.join(', ') : String(value);
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), valueStr);
      }
    });

    // Handle conditional blocks (basic implementation)
    rendered = rendered.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    // Handle array joins
    rendered = rendered.replace(/{{join\s+(\w+)\s+"([^"]+)"}}/g, (match, arrayName, separator) => {
      const array = variables[arrayName];
      return Array.isArray(array) ? array.join(separator) : '';
    });

    // Clean up any remaining template syntax
    rendered = rendered.replace(/{{[^}]+}}/g, '');

    return rendered.trim();
  }

  /**
   * Generate content using a specific template
   */
  async generateContent(request: GenerationRequest): Promise<string> {
    try {
      // Get term data from database
      const termData = await db.select()
        .from(enhancedTerms)
        .where(eq(enhancedTerms.id, request.termId))
        .limit(1);

      if (termData.length === 0) {
        throw new Error(`Term with ID ${request.termId} not found`);
      }

      const term = termData[0];

      // Get template
      const template = request.templateId 
        ? this.getTemplate(request.templateId)
        : this.getDefaultTemplate(request.sectionName);

      if (!template) {
        throw new Error(`Template not found: ${request.templateId || request.sectionName}`);
      }

      // Prepare variables
      const variables: PromptVariables = {
        termName: term.name,
        termDefinition: term.fullDefinition,
        sectionName: request.sectionName,
        category: term.mainCategories?.[0] || 'General',
        difficultyLevel: term.difficultyLevel || 'intermediate',
        relatedTerms: term.relatedConcepts || [],
        ...request.variables
      };

      // Check if we have previous content for this section
      const existingContent = await db.select()
        .from(sectionItems)
        .where(
          and(
            eq(sectionItems.label, request.sectionName),
            // Note: we'll need to join with sections table to get termId
            // For now, we'll skip this and assume no previous content
          )
        )
        .limit(1);

      if (existingContent.length > 0) {
        variables.previousContent = existingContent[0].content || undefined;
      }

      // Render the template
      const renderedPrompt = this.renderTemplate(template, variables);

      logger.info(`Generated prompt for ${term.name} - ${request.sectionName}`, {
        templateId: template.id,
        promptLength: renderedPrompt.length,
        variableCount: Object.keys(variables).length
      });

      return renderedPrompt;

    } catch (error) {
      logger.error('Error generating content with template:', {
        error: error instanceof Error ? error.message : String(error),
        termId: request.termId,
        sectionName: request.sectionName,
        templateId: request.templateId
      });
      throw error;
    }
  }

  /**
   * Add a custom template
   */
  addTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): PromptTemplate {
    const newTemplate: PromptTemplate = {
      ...template,
      id: this.generateTemplateId(template.name),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(newTemplate.id, newTemplate);
    logger.info(`Added new template: ${newTemplate.name} (${newTemplate.id})`);

    return newTemplate;
  }

  /**
   * Update an existing template
   */
  updateTemplate(templateId: string, updates: Partial<PromptTemplate>): PromptTemplate {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const updated: PromptTemplate = {
      ...existing,
      ...updates,
      id: templateId, // Preserve ID
      updatedAt: new Date()
    };

    this.templates.set(templateId, updated);
    logger.info(`Updated template: ${templateId}`);

    return updated;
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateId: string): boolean {
    if (this.defaultTemplates.has(templateId)) {
      throw new Error('Cannot delete default template');
    }

    const deleted = this.templates.delete(templateId);
    if (deleted) {
      logger.info(`Deleted template: ${templateId}`);
    }

    return deleted;
  }

  /**
   * Generate a unique template ID
   */
  private generateTemplateId(name: string): string {
    const base = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    let id = base;
    let counter = 1;
    
    while (this.templates.has(id)) {
      id = `${base}_${counter}`;
      counter++;
    }
    
    return id;
  }

  /**
   * Get template statistics
   */
  getTemplateStats(): {
    totalTemplates: number;
    defaultTemplates: number;
    customTemplates: number;
    categories: { [category: string]: number };
  } {
    const templates = Array.from(this.templates.values());
    const categories: { [category: string]: number } = {};

    templates.forEach(template => {
      categories[template.category] = (categories[template.category] || 0) + 1;
    });

    return {
      totalTemplates: templates.length,
      defaultTemplates: this.defaultTemplates.size,
      customTemplates: templates.length - this.defaultTemplates.size,
      categories
    };
  }
}

// Export singleton instance
export const promptTemplateService = new PromptTemplateService();
export default promptTemplateService;