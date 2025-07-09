import type { ContentNode, ContentOutline } from '@/types/content-structure';
import { contentOutline } from './content-outline';

// Mock progress data generator
const generateMockProgress = (): { isCompleted: boolean; progress: number } => {
  const random = Math.random();
  if (random < 0.3) {
    return { isCompleted: true, progress: 100 };
  } else if (random < 0.6) {
    return { isCompleted: false, progress: Math.floor(Math.random() * 100) };
  } else {
    return { isCompleted: false, progress: 0 };
  }
};

// Add mock content to nodes
const addMockContent = (node: ContentNode): ContentNode => {
  const mockContent = {
    ...node,
    ...generateMockProgress(),
    content: `Mock content for ${node.name}. This is a comprehensive explanation of the topic covering all essential aspects and providing detailed insights.`,
    metadata: {
      ...node.metadata,
      estimatedReadTime: Math.floor(Math.random() * 15) + 1, // 1-15 minutes
      prerequisites: generateMockPrerequisites(),
      relatedTopics: generateMockRelatedTopics(),
    },
  };

  if (node.subsections) {
    mockContent.subsections = node.subsections.map(addMockContent);
  }

  return mockContent;
};

const generateMockPrerequisites = (): string[] => {
  const prerequisites = [
    'Basic mathematics',
    'Linear algebra',
    'Statistics and probability',
    'Programming fundamentals',
    'Machine learning basics',
    'Data structures',
    'Algorithms',
    'Calculus',
    'Python programming',
    'Deep learning concepts',
  ];

  const count = Math.floor(Math.random() * 4);
  return prerequisites.sort(() => 0.5 - Math.random()).slice(0, count);
};

const generateMockRelatedTopics = (): string[] => {
  const topics = [
    'Neural networks',
    'Supervised learning',
    'Unsupervised learning',
    'Reinforcement learning',
    'Computer vision',
    'Natural language processing',
    'Feature engineering',
    'Model optimization',
    'Data preprocessing',
    'Evaluation metrics',
    'Cross-validation',
    'Hyperparameter tuning',
    'Ensemble methods',
    'Transfer learning',
    'Generative models',
  ];

  const count = Math.floor(Math.random() * 6) + 1;
  return topics.sort(() => 0.5 - Math.random()).slice(0, count);
};

// Create test dataset with all 295 subsections and mock data
export const createTestDataset = (): ContentOutline => {
  const testOutline: ContentOutline = {
    ...contentOutline,
    sections: contentOutline.sections.map(addMockContent),
  };

  return testOutline;
};

// Performance test data with specific scenarios
export const performanceTestData = {
  smallDataset: {
    sections: contentOutline.sections.slice(0, 5).map(addMockContent),
  },
  mediumDataset: {
    sections: contentOutline.sections.slice(0, 20).map(addMockContent),
  },
  fullDataset: {
    sections: contentOutline.sections.map(addMockContent),
  },
  deeplyNestedDataset: {
    sections: contentOutline.sections.map((section) => ({
      ...addMockContent(section),
      subsections: section.subsections?.map((sub) => ({
        ...addMockContent(sub),
        subsections: sub.subsections?.map((deepSub) => ({
          ...addMockContent(deepSub),
          subsections: Array.from({ length: 10 }, (_, i) => ({
            name: `Deep Nested Item ${i + 1}`,
            slug: `deep-nested-item-${i + 1}`,
            ...generateMockProgress(),
            content: `Deep nested content item ${i + 1}`,
            metadata: {
              displayType: 'main' as const,
              parseType: 'structured' as const,
              priority: 'low' as const,
              estimatedReadTime: Math.floor(Math.random() * 5) + 1,
              prerequisites: generateMockPrerequisites(),
              relatedTopics: generateMockRelatedTopics(),
            },
          })),
        })),
      })),
    })),
  },
};

// Interactive elements test data
export const interactiveElementsData = contentOutline.sections
  .flatMap((section) => section.subsections?.filter((sub) => sub.metadata?.isInteractive))
  .filter((item): item is NonNullable<typeof item> => Boolean(item))
  .map(addMockContent);

// Search test scenarios
export const searchTestScenarios = [
  {
    name: 'Common terms',
    queries: ['machine', 'learning', 'neural', 'algorithm', 'data'],
    expectedMinResults: 5,
  },
  {
    name: 'Specific concepts',
    queries: ['optimization', 'evaluation', 'implementation', 'security', 'ethics'],
    expectedMinResults: 3,
  },
  {
    name: 'Interactive elements',
    queries: ['interactive', 'mermaid', 'diagram', 'visualization', 'calculator'],
    expectedMinResults: 10,
  },
  {
    name: 'Edge cases',
    queries: ['', 'xyz123', 'a', 'very-long-query-that-should-not-match-anything'],
    expectedMinResults: 0,
  },
];

// Filter test scenarios
export const filterTestScenarios = [
  {
    name: 'Display types',
    filters: ['main', 'sidebar', 'interactive', 'card', 'filter', 'metadata'],
    expectedBehavior: 'Should show only items matching the display type',
  },
  {
    name: 'Priority levels',
    filters: ['high', 'medium', 'low'],
    expectedBehavior: 'Should show only items matching the priority level',
  },
  {
    name: 'Interactive elements',
    filters: ['interactive'],
    expectedBehavior: 'Should show only interactive elements',
  },
];

// Performance benchmarking utilities
export const createLargeDataset = (multiplier: number = 10): ContentOutline => {
  const baseOutline = createTestDataset();
  const enlargedSections: ContentNode[] = [];

  for (let i = 0; i < multiplier; i++) {
    baseOutline.sections.forEach((section, _index) => {
      enlargedSections.push({
        ...section,
        name: `${section.name} (Copy ${i + 1})`,
        slug: `${section.slug}-copy-${i + 1}`,
        subsections: section.subsections?.map((sub, _subIndex) => ({
          ...sub,
          name: `${sub.name} (Copy ${i + 1})`,
          slug: `${sub.slug}-copy-${i + 1}`,
          subsections: sub.subsections?.map((deepSub, _deepIndex) => ({
            ...deepSub,
            name: `${deepSub.name} (Copy ${i + 1})`,
            slug: `${deepSub.slug}-copy-${i + 1}`,
          })),
        })),
      });
    });
  }

  return {
    ...baseOutline,
    totalSections: baseOutline.totalSections * multiplier,
    totalSubsections: baseOutline.totalSubsections * multiplier,
    sections: enlargedSections,
  };
};

// Memory usage test data
export const memoryTestData = {
  baseline: createTestDataset(),
  heavy: createLargeDataset(5),
  extreme: createLargeDataset(20),
};

// Navigation state scenarios for testing
export const navigationStateScenarios = [
  {
    name: 'All collapsed',
    expandedNodes: new Set<string>(),
    description: 'Test performance with minimal expanded state',
  },
  {
    name: 'Top level expanded',
    expandedNodes: new Set(contentOutline.sections.map((_, i) => `section-${i}`)),
    description: 'Test with only top-level sections expanded',
  },
  {
    name: 'Fully expanded',
    expandedNodes: new Set(['all']), // Special marker for all expanded
    description: 'Test with all nodes expanded - worst case scenario',
  },
  {
    name: 'Partial expansion',
    expandedNodes: new Set(['section-0', 'section-1', 'section-5', 'section-10']),
    description: 'Test with realistic partial expansion',
  },
];

// Export default test dataset
export default createTestDataset();
