import { Router } from 'express';
import OpenAI from 'openai';
import { authenticateFirebaseToken, requireFirebaseAdmin } from '../../middleware/firebaseAuth';
import { log as logger } from '../../utils/logger';

const router = Router();

// Use proper Firebase authentication for admin routes

// In-memory template storage for demo purposes
// In production, this would be stored in the database
const promptTemplates: any[] = [
  {
    id: 'template-1',
    name: 'Definition & Overview Template',
    description: 'Standard template for generating clear, comprehensive definitions',
    category: 'generation',
    sectionType: 'definition_overview',
    complexity: 'simple',
    generativePrompt: `Write a clear, comprehensive definition and overview for this AI/ML term.

TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

Requirements:
- Start with a concise 1-2 sentence definition
- Expand with a clear overview explaining the concept
- Use accessible language while maintaining technical accuracy
- Include the fundamental purpose and scope
- Length: 150-250 words

Focus on clarity and educational value.`,
    evaluativePrompt: `Evaluate this definition and overview for quality and educational value.

TERM: {TERM_NAME}
CONTENT: {CONTENT}

Rate from 1-10 based on:
- Clarity and accessibility
- Technical accuracy
- Completeness of explanation
- Educational value
- Appropriate length and structure

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,
    improvementPrompt: `Improve this definition and overview based on the evaluation feedback.

ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide an improved version that addresses the feedback while maintaining clarity and educational value.`,
    metadata: {
      estimatedTokens: 300,
      recommendedModel: 'gpt-4.1-nano',
      version: '1.0',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'system',
      isDefault: true,
      usageCount: 245,
    },
  },
  {
    id: 'template-2',
    name: 'Key Concepts Template',
    description: 'Template for identifying essential concepts for understanding',
    category: 'generation',
    sectionType: 'key_concepts',
    complexity: 'simple',
    generativePrompt: `Identify and explain the key concepts essential for understanding this AI/ML term.

TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

Format as a bulleted list of 4-6 key concepts, each with:
• Concept Name: Brief explanation (1-2 sentences)

Focus on the most important concepts someone needs to understand this term.`,
    evaluativePrompt: `Evaluate the key concepts for completeness and educational value.

TERM: {TERM_NAME}
CONTENT: {CONTENT}

Rate from 1-10 based on:
- Completeness of essential concepts
- Clarity of explanations
- Logical organization
- Educational progression
- Relevance to the main term

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,
    improvementPrompt: `Improve the key concepts based on the evaluation feedback.

ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide improved key concepts that address the feedback while maintaining clarity and completeness.`,
    metadata: {
      estimatedTokens: 250,
      recommendedModel: 'gpt-4.1-nano',
      version: '1.0',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'system',
      isDefault: true,
      usageCount: 189,
    },
  },
  {
    id: 'template-3',
    name: 'Mathematical Foundations Template',
    description: 'Advanced template for complex mathematical concepts',
    category: 'generation',
    sectionType: 'mathematical_foundations',
    complexity: 'complex',
    generativePrompt: `Explain the mathematical foundations underlying this AI/ML concept.

TERM: {TERM_NAME}
CONTEXT: {TERM_CONTEXT}

Requirements:
- Present the core mathematical principles
- Include key equations and formulas where relevant
- Explain the mathematical intuition
- Connect math to practical applications
- Use proper mathematical notation
- Length: 300-500 words

Maintain mathematical rigor while being educational.`,
    evaluativePrompt: `Evaluate the mathematical foundations for accuracy and clarity.

TERM: {TERM_NAME}
CONTENT: {CONTENT}

Rate from 1-10 based on:
- Mathematical accuracy
- Clarity of mathematical explanations
- Proper use of notation
- Educational value for learning
- Connection to practical applications

OUTPUT: JSON with "score" (1-10) and "feedback" explaining the rating.`,
    improvementPrompt: `Improve the mathematical foundations based on the evaluation feedback.

ORIGINAL: {ORIGINAL_CONTENT}
FEEDBACK: {EVALUATION_FEEDBACK}

Provide improved mathematical content that addresses the feedback while maintaining mathematical rigor.`,
    metadata: {
      estimatedTokens: 500,
      recommendedModel: 'o4-mini',
      version: '1.0',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'system',
      isDefault: true,
      usageCount: 67,
    },
  },
];

let templateIdCounter = 4;

/**
 * Get all prompt templates
 */
router.get('/', authenticateFirebaseToken, requireFirebaseAdmin, async (req, res) => {
  try {
    const { category, sectionType, complexity } = req.query;

    let filteredTemplates = [...promptTemplates];

    if (category) {
      filteredTemplates = filteredTemplates.filter((t) => t.category === category);
    }

    if (sectionType) {
      filteredTemplates = filteredTemplates.filter((t) => t.sectionType === sectionType);
    }

    if (complexity) {
      filteredTemplates = filteredTemplates.filter((t) => t.complexity === complexity);
    }

    // Sort by usage count descending
    filteredTemplates.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);

    res.json({ success: true, data: filteredTemplates });
  } catch (error) {
    logger.error('Error getting templates:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get a specific template by ID
 */
router.get('/:id', authenticateFirebaseToken, requireFirebaseAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const template = promptTemplates.find((t) => t.id === id);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    logger.error('Error getting template:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Create a new template
 */
router.post('/', authenticateFirebaseToken, requireFirebaseAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      sectionType,
      complexity = 'simple',
      generativePrompt,
      evaluativePrompt,
      improvementPrompt,
      estimatedTokens = 300,
      recommendedModel = 'gpt-4.1-nano',
    } = req.body;

    // Validation
    if (!name || !sectionType || !generativePrompt) {
      return res.status(400).json({
        success: false,
        error: 'name, sectionType, and generativePrompt are required',
      });
    }

    const newTemplate = {
      id: `template-${templateIdCounter++}`,
      name,
      description: description || '',
      category: 'generation',
      sectionType,
      complexity,
      generativePrompt,
      evaluativePrompt: evaluativePrompt || '',
      improvementPrompt: improvementPrompt || '',
      metadata: {
        estimatedTokens,
        recommendedModel,
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin', // Would be actual user ID in production
        isDefault: false,
        usageCount: 0,
      },
    };

    promptTemplates.push(newTemplate);

    logger.info(`Created new template: ${newTemplate.id} - ${name}`);
    res.json({ success: true, data: newTemplate });
  } catch (error) {
    logger.error('Error creating template:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Update an existing template
 */
router.put('/:id', authenticateFirebaseToken, requireFirebaseAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const templateIndex = promptTemplates.findIndex((t) => t.id === id);

    if (templateIndex === -1) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const existingTemplate = promptTemplates[templateIndex];

    // Prevent updating default templates' core structure
    if (existingTemplate.metadata.isDefault) {
      const allowedFields = [
        'description',
        'generativePrompt',
        'evaluativePrompt',
        'improvementPrompt',
      ];
      const updateFields = Object.keys(req.body);
      const invalidFields = updateFields.filter((field) => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot modify ${invalidFields.join(', ')} on default templates`,
        });
      }
    }

    const updatedTemplate = {
      ...existingTemplate,
      ...req.body,
      id, // Ensure ID doesn't change
      metadata: {
        ...existingTemplate.metadata,
        ...req.body.metadata,
        updatedAt: new Date(),
        version: existingTemplate.metadata.version, // Preserve version for now
      },
    };

    promptTemplates[templateIndex] = updatedTemplate;

    logger.info(`Updated template: ${id}`);
    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    logger.error('Error updating template:', error);
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Delete a template
 */
router.delete('/:id', authenticateFirebaseToken, requireFirebaseAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const templateIndex = promptTemplates.findIndex((t) => t.id === id);

    if (templateIndex === -1) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = promptTemplates[templateIndex];

    // Prevent deletion of default templates
    if (template.metadata.isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete default templates',
      });
    }

    promptTemplates.splice(templateIndex, 1);

    logger.info(`Deleted template: ${id}`);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Error deleting template:', error);
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Test a template with a sample term
 */
router.post('/test', authenticateFirebaseToken, requireFirebaseAdmin, async (req, res) => {
  try {
    const { templateId, termName } = req.body;

    if (!templateId || !termName) {
      return res.status(400).json({
        success: false,
        error: 'templateId and termName are required',
      });
    }

    const template = promptTemplates.find((t) => t.id === templateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured',
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const startTime = Date.now();

    try {
      // Build the prompt
      const prompt = template.generativePrompt
        .replace('{TERM_NAME}', termName)
        .replace('{TERM_CONTEXT}', `Test term: ${termName}`);

      // Generate content
      const completion = await openai.chat.completions.create({
        model: template.metadata.recommendedModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI/ML educational content expert. Generate high-quality, accurate educational content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: template.metadata.estimatedTokens * 2,
      });

      const generatedContent = completion.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error('No content generated');
      }

      let evaluationScore: number | undefined;
      let evaluationFeedback: string | undefined;

      // Test evaluation if evaluative prompt exists
      if (template.evaluativePrompt) {
        try {
          const evalPrompt = template.evaluativePrompt
            .replace('{TERM_NAME}', termName)
            .replace('{CONTENT}', generatedContent);

          const evalCompletion = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an AI content evaluator. Respond only with valid JSON containing "score" and "feedback" fields.',
              },
              {
                role: 'user',
                content: evalPrompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 200,
          });

          const evalResponse = evalCompletion.choices[0]?.message?.content;
          if (evalResponse) {
            const evaluation = JSON.parse(evalResponse);
            evaluationScore = evaluation.score;
            evaluationFeedback = evaluation.feedback;
          }
        } catch (evalError) {
          logger.warn('Error in evaluation phase of template test:', evalError);
        }
      }

      let improvedContent: string | undefined;

      // Test improvement if improvement prompt exists and score is low
      if (template.improvementPrompt && evaluationScore && evaluationScore < 7) {
        try {
          const improvementPrompt = template.improvementPrompt
            .replace('{ORIGINAL_CONTENT}', generatedContent)
            .replace('{EVALUATION_FEEDBACK}', evaluationFeedback || '');

          const improvementCompletion = await openai.chat.completions.create({
            model: template.metadata.recommendedModel,
            messages: [
              {
                role: 'system',
                content: 'You are an AI writing assistant skilled in editing technical content.',
              },
              {
                role: 'user',
                content: improvementPrompt,
              },
            ],
            temperature: 0.3,
            max_tokens: template.metadata.estimatedTokens * 2,
          });

          improvedContent = improvementCompletion.choices[0]?.message?.content;
        } catch (improvementError) {
          logger.warn('Error in improvement phase of template test:', improvementError);
        }
      }

      const processingTime = Date.now() - startTime;
      const totalTokens =
        (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);
      const cost = calculateCost(
        template.metadata.recommendedModel,
        completion.usage?.prompt_tokens || 0,
        completion.usage?.completion_tokens || 0
      );

      // Increment usage count
      template.metadata.usageCount++;

      res.json({
        success: true,
        generatedContent,
        evaluationScore,
        evaluationFeedback,
        improvedContent,
        metadata: {
          totalTokens,
          cost,
          processingTime,
        },
      });
    } catch (aiError) {
      logger.error('Error in AI processing during template test:', aiError);
      res.json({
        success: false,
        error: aiError instanceof Error ? aiError.message : 'AI processing failed',
      });
    }
  } catch (error) {
    logger.error('Error testing template:', error);
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * Get template statistics
 */
router.get(
  '/stats/overview',
  authenticateFirebaseToken,
  requireFirebaseAdmin,
  async (_req, res) => {
    try {
      const stats = {
        totalTemplates: promptTemplates.length,
        byComplexity: {
          simple: promptTemplates.filter((t) => t.complexity === 'simple').length,
          moderate: promptTemplates.filter((t) => t.complexity === 'moderate').length,
          complex: promptTemplates.filter((t) => t.complexity === 'complex').length,
        },
        byCategory: {
          generation: promptTemplates.filter((t) => t.category === 'generation').length,
          evaluation: promptTemplates.filter((t) => t.category === 'evaluation').length,
          improvement: promptTemplates.filter((t) => t.category === 'improvement').length,
        },
        totalUsage: promptTemplates.reduce((sum, t) => sum + t.metadata.usageCount, 0),
        mostUsed: promptTemplates
          .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            name: t.name,
            usageCount: t.metadata.usageCount,
            sectionType: t.sectionType,
          })),
        defaultTemplates: promptTemplates.filter((t) => t.metadata.isDefault).length,
        customTemplates: promptTemplates.filter((t) => !t.metadata.isDefault).length,
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error getting template statistics:', error);
      res
        .status(500)
        .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * Duplicate a template
 */
router.post('/:id/duplicate', authenticateFirebaseToken, requireFirebaseAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const originalTemplate = promptTemplates.find((t) => t.id === id);
    if (!originalTemplate) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const duplicatedTemplate = {
      ...originalTemplate,
      id: `template-${templateIdCounter++}`,
      name: name || `${originalTemplate.name} (Copy)`,
      metadata: {
        ...originalTemplate.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        isDefault: false,
        usageCount: 0,
        version: '1.0',
      },
    };

    promptTemplates.push(duplicatedTemplate);

    logger.info(`Duplicated template: ${id} -> ${duplicatedTemplate.id}`);
    res.json({ success: true, data: duplicatedTemplate });
  } catch (error) {
    logger.error('Error duplicating template:', error);
    res
      .status(500)
      .json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Helper function to calculate API cost
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs: { [key: string]: { input: number; output: number } } = {
    'gpt-4.1-nano': { input: 0.00005, output: 0.0002 },
    'gpt-4.1-mini': { input: 0.0002, output: 0.0008 },
    'o4-mini': { input: 0.00055, output: 0.0022 },
  };

  const modelCosts = costs[model];
  if (!modelCosts) return 0;

  return (promptTokens / 1000) * modelCosts.input + (completionTokens / 1000) * modelCosts.output;
}

export default router;
