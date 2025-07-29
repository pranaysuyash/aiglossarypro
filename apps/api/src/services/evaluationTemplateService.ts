import { log as logger } from '../utils/logger';

export interface EvaluationTemplate {
  id: string;
  name: string;
  description: string;
  contentType: string;
  targetAudience: string[];
  evaluationCriteria: {
    dimension: string;
    weight: number;
    criteria: string[];
    examples: {
      good: string[];
      bad: string[];
    };
  }[];
  prompts: {
    system: string;
    evaluation: string;
    scoring: string;
  };
  metadata: {
    version: string;
    lastUpdated: Date;
    author: string;
    tags: string[];
  };
}

/**
 * Service for managing evaluation templates for different content types
 */
export class EvaluationTemplateService {
  private templates: Map<string, EvaluationTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default evaluation templates
   */
  private initializeDefaultTemplates() {
    // Technical Definition Template
    this.templates.set('technical-definition', {
      id: 'technical-definition',
      name: 'Technical Definition Evaluation',
      description: 'Evaluate technical definitions and explanations for AI/ML terms',
      contentType: 'definition',
      targetAudience: ['intermediate', 'advanced', 'expert'],
      evaluationCriteria: [
        {
          dimension: 'accuracy',
          weight: 0.35,
          criteria: [
            'Technical terminology is used correctly',
            'Mathematical notation is accurate',
            'Concepts are technically sound',
            'No factual errors or misconceptions',
          ],
          examples: {
            good: [
              'Uses precise technical terminology consistently',
              'Mathematical formulas are correctly formatted and explained',
            ],
            bad: [
              'Confuses similar but distinct concepts',
              'Contains mathematical errors or typos',
            ],
          },
        },
        {
          dimension: 'clarity',
          weight: 0.25,
          criteria: [
            'Complex concepts are broken down effectively',
            'Logical flow from simple to complex',
            'Clear relationship between concepts',
            'Appropriate use of examples',
          ],
          examples: {
            good: [
              'Starts with intuitive explanation before technical details',
              'Uses analogies to clarify complex concepts',
            ],
            bad: [
              'Jumps directly into complex mathematics without context',
              'Uses jargon without explanation',
            ],
          },
        },
        {
          dimension: 'completeness',
          weight: 0.2,
          criteria: [
            'Covers all essential aspects of the concept',
            'Includes necessary mathematical foundations',
            'Addresses common variations or special cases',
            'Provides sufficient depth for target audience',
          ],
          examples: {
            good: [
              'Includes both intuitive and formal definitions',
              'Covers edge cases and limitations',
            ],
            bad: [
              'Only provides surface-level explanation',
              'Misses critical components of the concept',
            ],
          },
        },
      ],
      prompts: {
        system: 'You are an expert technical evaluator for AI/ML educational content.',
        evaluation:
          'Evaluate this technical definition based on accuracy, clarity, and completeness.',
        scoring: 'Provide detailed scores and actionable feedback for improvement.',
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        author: 'AI Glossary Pro',
        tags: ['technical', 'definition', 'ai-ml'],
      },
    });

    // Practical Application Template
    this.templates.set('practical-application', {
      id: 'practical-application',
      name: 'Practical Application Evaluation',
      description: 'Evaluate practical applications and use cases',
      contentType: 'application',
      targetAudience: ['beginner', 'intermediate', 'advanced'],
      evaluationCriteria: [
        {
          dimension: 'relevance',
          weight: 0.3,
          criteria: [
            'Examples are industry-relevant',
            'Use cases are realistic and current',
            'Applications demonstrate practical value',
            'Covers diverse domains appropriately',
          ],
          examples: {
            good: [
              'Includes real-world case studies from major companies',
              'Shows practical implementation challenges and solutions',
            ],
            bad: ['Only theoretical or academic examples', 'Outdated or irrelevant use cases'],
          },
        },
        {
          dimension: 'completeness',
          weight: 0.25,
          criteria: [
            'Covers implementation details',
            'Includes performance considerations',
            'Addresses common pitfalls',
            'Provides actionable insights',
          ],
          examples: {
            good: [
              'Includes code snippets or implementation guidelines',
              'Discusses trade-offs and decision criteria',
            ],
            bad: [
              'Only high-level overview without details',
              'Missing critical implementation considerations',
            ],
          },
        },
        {
          dimension: 'engagement',
          weight: 0.2,
          criteria: [
            'Examples are compelling and interesting',
            'Content motivates further exploration',
            'Includes interactive elements or exercises',
            "Connects to reader's potential use cases",
          ],
          examples: {
            good: [
              'Includes "try it yourself" sections',
              'Relates to trending technologies or problems',
            ],
            bad: ['Dry, abstract examples only', "No connection to reader's context"],
          },
        },
      ],
      prompts: {
        system: 'You are an expert in evaluating practical AI/ML applications and use cases.',
        evaluation:
          'Evaluate this practical application content for relevance, completeness, and engagement.',
        scoring: 'Focus on real-world applicability and actionable insights.',
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        author: 'AI Glossary Pro',
        tags: ['practical', 'application', 'use-case'],
      },
    });

    // Implementation Guide Template
    this.templates.set('implementation-guide', {
      id: 'implementation-guide',
      name: 'Implementation Guide Evaluation',
      description: 'Evaluate step-by-step implementation guides and tutorials',
      contentType: 'tutorial',
      targetAudience: ['intermediate', 'advanced'],
      evaluationCriteria: [
        {
          dimension: 'clarity',
          weight: 0.3,
          criteria: [
            'Steps are clearly defined and numbered',
            'Prerequisites are explicitly stated',
            'Code examples are well-commented',
            'Expected outcomes are clear',
          ],
          examples: {
            good: [
              'Each step has clear input/output expectations',
              'Includes troubleshooting tips for common errors',
            ],
            bad: [
              'Vague instructions like "implement the algorithm"',
              'Missing critical setup or configuration steps',
            ],
          },
        },
        {
          dimension: 'completeness',
          weight: 0.3,
          criteria: [
            'All necessary steps are included',
            'Environment setup is covered',
            'Error handling is addressed',
            'Testing and validation included',
          ],
          examples: {
            good: ['Includes full working code examples', 'Covers edge cases and error scenarios'],
            bad: ['Assumes too much prior knowledge', 'Skips important configuration steps'],
          },
        },
        {
          dimension: 'accuracy',
          weight: 0.25,
          criteria: [
            'Code examples run without errors',
            'Technical instructions are correct',
            'Version compatibility is specified',
            'Best practices are followed',
          ],
          examples: {
            good: [
              'Specifies exact library versions used',
              'Code follows language conventions and best practices',
            ],
            bad: ['Syntax errors in code examples', 'Deprecated methods or outdated practices'],
          },
        },
      ],
      prompts: {
        system: 'You are an expert in evaluating technical implementation guides and tutorials.',
        evaluation:
          'Evaluate this implementation guide for clarity, completeness, and technical accuracy.',
        scoring: 'Focus on whether a developer could successfully follow these instructions.',
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        author: 'AI Glossary Pro',
        tags: ['implementation', 'tutorial', 'guide'],
      },
    });

    // Mathematical Formulation Template
    this.templates.set('mathematical-formulation', {
      id: 'mathematical-formulation',
      name: 'Mathematical Formulation Evaluation',
      description: 'Evaluate mathematical formulations and proofs',
      contentType: 'theory',
      targetAudience: ['advanced', 'expert'],
      evaluationCriteria: [
        {
          dimension: 'accuracy',
          weight: 0.4,
          criteria: [
            'Mathematical notation is correct',
            'Formulas are properly derived',
            'Proofs are logically sound',
            'Assumptions are clearly stated',
          ],
          examples: {
            good: [
              'Uses standard mathematical notation consistently',
              'Each step in derivation is justified',
            ],
            bad: [
              'Notation conflicts with standard conventions',
              'Logical gaps in proofs or derivations',
            ],
          },
        },
        {
          dimension: 'clarity',
          weight: 0.25,
          criteria: [
            'Notation is defined before use',
            'Complex equations are broken down',
            'Intuition is provided alongside formulas',
            'Visual aids complement equations',
          ],
          examples: {
            good: [
              'Includes intuitive explanation before formal proof',
              'Uses diagrams to illustrate mathematical concepts',
            ],
            bad: ['Wall of equations without explanation', 'Undefined symbols or notation'],
          },
        },
        {
          dimension: 'completeness',
          weight: 0.2,
          criteria: [
            'All necessary definitions provided',
            'Key theorems and lemmas included',
            'Boundary conditions addressed',
            'Computational complexity discussed',
          ],
          examples: {
            good: [
              'Includes convergence conditions and guarantees',
              'Discusses computational implications',
            ],
            bad: [
              'Missing critical assumptions or conditions',
              'No discussion of practical limitations',
            ],
          },
        },
      ],
      prompts: {
        system: 'You are an expert mathematician specializing in ML/AI theory evaluation.',
        evaluation:
          'Evaluate this mathematical content for correctness, clarity, and completeness.',
        scoring: 'Pay special attention to mathematical rigor and accessibility.',
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        author: 'AI Glossary Pro',
        tags: ['mathematical', 'theory', 'formal'],
      },
    });

    // Prerequisites and Learning Path Template
    this.templates.set('learning-path', {
      id: 'learning-path',
      name: 'Learning Path Evaluation',
      description: 'Evaluate prerequisites and learning path content',
      contentType: 'learning-path',
      targetAudience: ['beginner', 'intermediate'],
      evaluationCriteria: [
        {
          dimension: 'relevance',
          weight: 0.3,
          criteria: [
            'Prerequisites are actually necessary',
            'Learning sequence is logical',
            'Difficulty progression is appropriate',
            'Resources are current and accessible',
          ],
          examples: {
            good: [
              'Clear progression from basic to advanced concepts',
              'Each prerequisite directly supports the main topic',
            ],
            bad: [
              'Includes unnecessary or tangential prerequisites',
              'Jumps in difficulty without intermediate steps',
            ],
          },
        },
        {
          dimension: 'completeness',
          weight: 0.3,
          criteria: [
            'All essential prerequisites listed',
            'Alternative learning paths provided',
            'Time estimates are realistic',
            'Resources cover all prerequisites',
          ],
          examples: {
            good: [
              'Includes both required and recommended prerequisites',
              'Provides multiple resource options for each topic',
            ],
            bad: ['Missing critical foundational concepts', 'Only one rigid path provided'],
          },
        },
        {
          dimension: 'engagement',
          weight: 0.2,
          criteria: [
            'Motivates the learning journey',
            'Includes progress checkpoints',
            'Provides practical milestones',
            'Encourages active learning',
          ],
          examples: {
            good: [
              'Includes mini-projects at each milestone',
              'Shows clear benefits of completing each step',
            ],
            bad: ['Just a list of topics without context', 'No way to measure progress'],
          },
        },
      ],
      prompts: {
        system: 'You are an expert in curriculum design and learning path evaluation.',
        evaluation: 'Evaluate this learning path for effectiveness and completeness.',
        scoring: 'Consider learner motivation and practical progression.',
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        author: 'AI Glossary Pro',
        tags: ['learning', 'prerequisites', 'curriculum'],
      },
    });

    // Industry Use Case Template
    this.templates.set('industry-use-case', {
      id: 'industry-use-case',
      name: 'Industry Use Case Evaluation',
      description: 'Evaluate industry-specific use cases and case studies',
      contentType: 'case-study',
      targetAudience: ['intermediate', 'advanced', 'expert'],
      evaluationCriteria: [
        {
          dimension: 'relevance',
          weight: 0.35,
          criteria: [
            'Use case is current and industry-relevant',
            'Addresses real business problems',
            'Includes measurable outcomes',
            'Applicable to multiple contexts',
          ],
          examples: {
            good: [
              'Includes specific metrics and ROI',
              'References actual company implementations',
            ],
            bad: [
              'Hypothetical scenarios without real examples',
              'Outdated technology or approaches',
            ],
          },
        },
        {
          dimension: 'completeness',
          weight: 0.25,
          criteria: [
            'Covers problem, solution, and results',
            'Includes implementation challenges',
            'Discusses lessons learned',
            'Provides technical architecture',
          ],
          examples: {
            good: [
              'Full case study from problem to solution',
              'Includes architecture diagrams and tech stack',
            ],
            bad: [
              'Only success stories without challenges',
              'Missing technical implementation details',
            ],
          },
        },
        {
          dimension: 'accuracy',
          weight: 0.25,
          criteria: [
            'Facts and figures are verifiable',
            'Technical details are correct',
            'Timeline is realistic',
            'Claims are substantiated',
          ],
          examples: {
            good: [
              'Cites sources for statistics and claims',
              'Technical details match industry standards',
            ],
            bad: [
              'Exaggerated or unverifiable claims',
              'Technical inaccuracies or impossibilities',
            ],
          },
        },
      ],
      prompts: {
        system: 'You are an expert in evaluating industry case studies and business applications.',
        evaluation: 'Evaluate this case study for business relevance and technical accuracy.',
        scoring: 'Focus on practical value and implementation insights.',
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        author: 'AI Glossary Pro',
        tags: ['industry', 'case-study', 'business'],
      },
    });

    logger.info(`Initialized ${this.templates.size} evaluation templates`);
  }

  /**
   * Get evaluation template by ID
   */
  getTemplate(templateId: string): EvaluationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): EvaluationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by content type
   */
  getTemplatesByContentType(contentType: string): EvaluationTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.contentType === contentType
    );
  }

  /**
   * Get templates by target audience
   */
  getTemplatesByAudience(audience: string): EvaluationTemplate[] {
    return Array.from(this.templates.values()).filter(template =>
      template.targetAudience.includes(audience)
    );
  }

  /**
   * Get template recommendation based on content
   */
  recommendTemplate(
    contentType: string,
    targetAudience?: string,
    tags?: string[]
  ): EvaluationTemplate | undefined {
    let candidates = this.getTemplatesByContentType(contentType);

    if (targetAudience) {
      candidates = candidates.filter(t => t.targetAudience.includes(targetAudience));
    }

    if (tags && tags.length > 0) {
      candidates = candidates.filter(t => tags.some(tag => t.metadata.tags.includes(tag)));
    }

    // Return the first matching template or the most general one
    return candidates.length > 0 ? candidates[0] : this.templates.get('technical-definition');
  }

  /**
   * Create custom template
   */
  createCustomTemplate(template: EvaluationTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template with ID ${template.id} already exists`);
    }

    this.templates.set(template.id, {
      ...template,
      metadata: {
        ...template.metadata,
        lastUpdated: new Date(),
      },
    });

    logger.info(`Created custom evaluation template: ${template.id}`);
  }

  /**
   * Update existing template
   */
  updateTemplate(templateId: string, updates: Partial<EvaluationTemplate>): void {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    this.templates.set(templateId, {
      ...existing,
      ...updates,
      id: templateId, // Ensure ID doesn't change
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        lastUpdated: new Date(),
      },
    });

    logger.info(`Updated evaluation template: ${templateId}`);
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const result = this.templates.delete(templateId);
    if (result) {
      logger.info(`Deleted evaluation template: ${templateId}`);
    }
    return result;
  }

  /**
   * Export templates for backup
   */
  exportTemplates(): string {
    const templates = Array.from(this.templates.values());
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates from backup
   */
  importTemplates(jsonData: string): number {
    try {
      const templates = JSON.parse(jsonData) as EvaluationTemplate[];
      let imported = 0;

      for (const template of templates) {
        if (!this.templates.has(template.id)) {
          this.templates.set(template.id, template);
          imported++;
        }
      }

      logger.info(`Imported ${imported} evaluation templates`);
      return imported;
    } catch (error) {
      logger.error('Error importing templates:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const evaluationTemplateService = new EvaluationTemplateService();
export default evaluationTemplateService;
