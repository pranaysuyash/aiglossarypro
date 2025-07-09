import { z } from 'zod';
import { log } from './logger';

// Content accessibility scoring and improvement utilities

interface AccessibilityScore {
  score: number; // 0-100
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  improvements: string[];
  readabilityMetrics: {
    averageWordsPerSentence: number;
    averageSentencesPerParagraph: number;
    complexTermsCount: number;
    readingLevel: string;
  };
}

interface SimplificationSuggestion {
  originalText: string;
  simplifiedText: string;
  explanation: string;
  technicalTerms: string[];
  prerequisites: string[];
}

// Complex technical terms that need simplification
const COMPLEX_TERMS: Record<string, { simple: string; explanation: string }> = {
  hyperparameter: {
    simple: 'tuning setting',
    explanation:
      'A setting that controls how a machine learning model learns, like adjusting the speed of learning',
  },
  backpropagation: {
    simple: 'error correction method',
    explanation:
      'A technique where neural networks learn by working backwards from mistakes to improve their performance',
  },
  overfitting: {
    simple: 'memorizing too specifically',
    explanation:
      'When a model learns the training data so well that it cannot handle new, unseen data effectively',
  },
  'gradient descent': {
    simple: 'optimization method',
    explanation:
      'A mathematical technique to find the best solution by gradually improving guesses, like rolling a ball downhill to find the bottom',
  },
  'convolutional neural network': {
    simple: 'image recognition AI',
    explanation:
      'A type of artificial intelligence specifically designed to understand and analyze images by detecting patterns and features',
  },
  'natural language processing': {
    simple: 'language understanding AI',
    explanation:
      'Technology that helps computers understand, interpret, and work with human language, like text and speech',
  },
  'reinforcement learning': {
    simple: 'learning through trial and error',
    explanation:
      'A learning method where AI improves by trying actions and getting rewards or penalties, similar to how we learn from experience',
  },
  'transformer architecture': {
    simple: 'attention-based AI model',
    explanation:
      'A powerful AI design that processes information by paying attention to relevant parts, enabling better understanding of context',
  },
  'unsupervised learning': {
    simple: 'pattern discovery without examples',
    explanation:
      'A learning approach where AI finds hidden patterns in data without being given specific examples of what to look for',
  },
  'dimensionality reduction': {
    simple: 'data simplification',
    explanation:
      'A technique to reduce complex data to simpler forms while keeping the most important information',
  },
};

// Reading level thresholds based on sentence complexity
const READING_LEVELS = {
  ELEMENTARY: { maxWordsPerSentence: 12, maxSentencesPerParagraph: 4 },
  MIDDLE_SCHOOL: { maxWordsPerSentence: 18, maxSentencesPerParagraph: 6 },
  HIGH_SCHOOL: { maxWordsPerSentence: 25, maxSentencesPerParagraph: 8 },
  COLLEGE: { maxWordsPerSentence: 35, maxSentencesPerParagraph: 10 },
  GRADUATE: { maxWordsPerSentence: 50, maxSentencesPerParagraph: 15 },
};

/**
 * Calculate accessibility score for content
 */
export function calculateAccessibilityScore(content: string): AccessibilityScore {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);

  // Calculate basic metrics
  const averageWordsPerSentence = words.length / sentences.length;
  const averageSentencesPerParagraph = sentences.length / Math.max(paragraphs.length, 1);

  // Count complex terms
  const complexTermsCount = Object.keys(COMPLEX_TERMS).reduce((count, term) => {
    const regex = new RegExp(term, 'gi');
    return count + (content.match(regex) || []).length;
  }, 0);

  // Determine reading level
  let readingLevel = 'GRADUATE';
  if (
    averageWordsPerSentence <= READING_LEVELS.ELEMENTARY.maxWordsPerSentence &&
    averageSentencesPerParagraph <= READING_LEVELS.ELEMENTARY.maxSentencesPerParagraph
  ) {
    readingLevel = 'ELEMENTARY';
  } else if (averageWordsPerSentence <= READING_LEVELS.MIDDLE_SCHOOL.maxWordsPerSentence) {
    readingLevel = 'MIDDLE_SCHOOL';
  } else if (averageWordsPerSentence <= READING_LEVELS.HIGH_SCHOOL.maxWordsPerSentence) {
    readingLevel = 'HIGH_SCHOOL';
  } else if (averageWordsPerSentence <= READING_LEVELS.COLLEGE.maxWordsPerSentence) {
    readingLevel = 'COLLEGE';
  }

  // Calculate score (0-100)
  let score = 100;

  // Penalize long sentences
  if (averageWordsPerSentence > 20) {
    score -= Math.min(30, (averageWordsPerSentence - 20) * 2);
  }

  // Penalize complex terms
  score -= Math.min(25, complexTermsCount * 3);

  // Penalize long paragraphs
  if (averageSentencesPerParagraph > 6) {
    score -= Math.min(15, (averageSentencesPerParagraph - 6) * 2);
  }

  // Determine accessibility level
  let level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  if (score >= 80) level = 'beginner';
  else if (score >= 60) level = 'intermediate';
  else if (score >= 40) level = 'advanced';
  else level = 'expert';

  // Generate improvement suggestions
  const improvements: string[] = [];

  if (averageWordsPerSentence > 20) {
    improvements.push('Break down long sentences into shorter, clearer statements');
  }

  if (complexTermsCount > 0) {
    improvements.push('Add simple explanations for technical terms');
  }

  if (averageSentencesPerParagraph > 6) {
    improvements.push('Split long paragraphs into smaller, digestible sections');
  }

  if (readingLevel === 'GRADUATE' || readingLevel === 'COLLEGE') {
    improvements.push('Simplify language for broader accessibility');
  }

  if (!content.includes('example') && !content.includes('for instance')) {
    improvements.push('Add concrete examples to illustrate concepts');
  }

  return {
    score: Math.max(0, Math.round(score)),
    level,
    improvements,
    readabilityMetrics: {
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
      averageSentencesPerParagraph: Math.round(averageSentencesPerParagraph * 10) / 10,
      complexTermsCount,
      readingLevel,
    },
  };
}

/**
 * Generate simplified version of content
 */
export function generateSimplificationSuggestion(content: string): SimplificationSuggestion {
  let simplifiedText = content;
  const technicalTerms: string[] = [];
  const prerequisites: string[] = [];

  // Replace complex terms with simpler alternatives
  Object.entries(COMPLEX_TERMS).forEach(([term, replacement]) => {
    const regex = new RegExp(term, 'gi');
    if (content.match(regex)) {
      technicalTerms.push(term);
      simplifiedText = simplifiedText.replace(regex, replacement.simple);
    }
  });

  // Break down long sentences
  const sentences = simplifiedText.split(/[.!?]+/);
  const improvedSentences = sentences.map((sentence) => {
    const words = sentence.trim().split(/\s+/);
    if (words.length > 20) {
      // Try to split at conjunctions
      const conjunctions = ['and', 'but', 'or', 'because', 'since', 'while', 'although'];
      for (const conjunction of conjunctions) {
        const conjunctionIndex = words.findIndex((word) =>
          word.toLowerCase().includes(conjunction)
        );
        if (conjunctionIndex > 5 && conjunctionIndex < words.length - 5) {
          const firstPart = words.slice(0, conjunctionIndex).join(' ');
          const secondPart = words.slice(conjunctionIndex).join(' ');
          return `${firstPart}. ${secondPart.charAt(0).toUpperCase() + secondPart.slice(1)}`;
        }
      }
    }
    return sentence;
  });

  simplifiedText = improvedSentences.join('. ').replace(/\. \./g, '.');

  // Add explanations for technical terms
  technicalTerms.forEach((term) => {
    if (COMPLEX_TERMS[term]) {
      simplifiedText += `\n\n**${term}**: ${COMPLEX_TERMS[term].explanation}`;
    }
  });

  return {
    originalText: content,
    simplifiedText,
    explanation: 'Simplified version with clearer language and explanations for technical terms',
    technicalTerms,
    prerequisites: prerequisites,
  };
}

/**
 * Add beginner-friendly context to a term definition
 */
export function addBeginnerContext(definition: string, termName: string): string {
  const score = calculateAccessibilityScore(definition);

  if (score.level === 'beginner') {
    return definition; // Already accessible
  }

  let enhancedDefinition = definition;

  // Add simple introduction
  const introductions = {
    'neural network': 'Think of this as a computer system inspired by how the human brain works.',
    'machine learning':
      'This is a way for computers to learn and improve from experience, just like humans do.',
    algorithm:
      'An algorithm is like a recipe - a set of step-by-step instructions to solve a problem.',
    'artificial intelligence':
      'AI is technology that enables machines to think and make decisions like humans.',
    data: 'Data is information that computers can process, like numbers, text, or images.',
  };

  // Find matching introduction
  const matchingIntro = Object.entries(introductions).find(([key, _]) =>
    termName.toLowerCase().includes(key)
  );

  if (matchingIntro) {
    enhancedDefinition = `${matchingIntro[1]}\n\n${enhancedDefinition}`;
  }

  // Add practical example if missing
  if (
    !definition.toLowerCase().includes('example') &&
    !definition.toLowerCase().includes('for instance')
  ) {
    const examples = {
      'supervised learning':
        'For example, teaching a computer to recognize cats by showing it thousands of labeled cat photos.',
      clustering:
        'For instance, grouping customers by their shopping habits to create targeted marketing campaigns.',
      classification: 'Like sorting emails into spam and non-spam categories automatically.',
      regression: 'Such as predicting house prices based on location, size, and features.',
    };

    const matchingExample = Object.entries(examples).find(
      ([key, _]) => termName.toLowerCase().includes(key) || definition.toLowerCase().includes(key)
    );

    if (matchingExample) {
      enhancedDefinition += `\n\n${matchingExample[1]}`;
    }
  }

  return enhancedDefinition;
}

/**
 * Validate content accessibility requirements
 */
export const accessibilityContentSchema = z.object({
  definition: z.string().min(50, 'Definition should be at least 50 characters'),
  simplifiedDefinition: z.string().optional(),
  examples: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  targetAudience: z.array(z.string()).optional(),
});

/**
 * Batch process terms for accessibility improvements
 */
export async function processTermsForAccessibility(
  terms: Array<{ id: string; name: string; definition: string }>
) {
  const results = [];

  for (const term of terms) {
    try {
      const score = calculateAccessibilityScore(term.definition);
      const suggestion =
        score.level !== 'beginner' ? generateSimplificationSuggestion(term.definition) : null;
      const enhancedDefinition = addBeginnerContext(term.definition, term.name);

      results.push({
        termId: term.id,
        termName: term.name,
        originalDefinition: term.definition,
        accessibilityScore: score,
        simplificationSuggestion: suggestion,
        enhancedDefinition,
        needsImprovement: score.score < 70,
      });

      log.info('Processed term for accessibility', {
        termId: term.id,
        termName: term.name,
        score: score.score,
        level: score.level,
      });
    } catch (error) {
      log.error('Error processing term for accessibility', {
        termId: term.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Generate accessibility report for the entire glossary
 */
export function generateAccessibilityReport(
  terms: Array<{ score: AccessibilityScore; termName: string }>
) {
  const totalTerms = terms.length;
  const levelCounts = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    expert: 0,
  };

  let totalScore = 0;
  const improvements = new Set<string>();

  terms.forEach(({ score }) => {
    levelCounts[score.level]++;
    totalScore += score.score;
    score.improvements.forEach((improvement) => improvements.add(improvement));
  });

  const averageScore = Math.round(totalScore / totalTerms);
  const beginnerPercentage = Math.round((levelCounts.beginner / totalTerms) * 100);

  return {
    summary: {
      totalTerms,
      averageScore,
      beginnerPercentage,
      levelDistribution: levelCounts,
    },
    recommendations: {
      priority: averageScore < 60 ? 'High' : averageScore < 80 ? 'Medium' : 'Low',
      commonImprovements: Array.from(improvements).slice(0, 5),
      targetBeginnerPercentage: 60, // Goal: 60% of terms should be beginner-friendly
      currentGap: Math.max(0, 60 - beginnerPercentage),
    },
    metrics: {
      termsNeedingImprovement: terms.filter((t) => t.score.score < 70).length,
      highComplexityTerms: terms.filter((t) => t.score.level === 'expert').length,
      wellOptimizedTerms: terms.filter((t) => t.score.score >= 80).length,
    },
  };
}
