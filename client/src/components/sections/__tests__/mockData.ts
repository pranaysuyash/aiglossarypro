import { ContentNode } from '@/types/content-structure';

export const mockContentNode: ContentNode = {
  name: 'Introduction to AI',
  slug: 'introduction-to-ai',
  content: 'This is an introduction to artificial intelligence.',
  contentType: 'markdown',
  metadata: {
    isInteractive: false,
    displayType: 'main',
    parseType: 'simple',
    priority: 'high',
    estimatedReadTime: 5,
    prerequisites: ['Basic Programming'],
    relatedTopics: ['Machine Learning', 'Deep Learning']
  },
  isCompleted: false,
  progress: 0,
  subsections: [
    {
      name: 'What is AI?',
      slug: 'what-is-ai',
      content: 'AI definition and overview.',
      contentType: 'markdown',
      metadata: {
        isInteractive: true,
        displayType: 'card',
        parseType: 'simple',
        priority: 'medium',
        estimatedReadTime: 3,
        prerequisites: [],
        relatedTopics: ['AI History']
      },
      isCompleted: true,
      progress: 100,
      subsections: [
        {
          name: 'Types of AI',
          slug: 'types-of-ai',
          content: 'Different types of artificial intelligence.',
          contentType: 'interactive',
          metadata: {
            isInteractive: true,
            displayType: 'interactive',
            parseType: 'structured',
            priority: 'high',
            estimatedReadTime: 7,
            prerequisites: ['What is AI?'],
            relatedTopics: ['AI Applications']
          },
          isCompleted: false,
          progress: 25
        },
        {
          name: 'AI Applications',
          slug: 'ai-applications',
          content: 'Real-world applications of AI.',
          contentType: 'markdown',
          metadata: {
            isInteractive: false,
            displayType: 'main',
            parseType: 'list',
            priority: 'medium',
            estimatedReadTime: 5,
            prerequisites: ['Types of AI'],
            relatedTopics: ['Machine Learning Applications']
          },
          isCompleted: false,
          progress: 0
        }
      ]
    },
    {
      name: 'History of AI',
      slug: 'history-of-ai',
      content: 'The historical development of AI.',
      contentType: 'markdown',
      metadata: {
        isInteractive: false,
        displayType: 'main',
        parseType: 'list',
        priority: 'low',
        estimatedReadTime: 10,
        prerequisites: [],
        relatedTopics: ['AI Timeline', 'AI Pioneers']
      },
      isCompleted: false,
      progress: 0,
      subsections: [
        {
          name: 'Early AI Research',
          slug: 'early-ai-research',
          content: 'The beginnings of AI research.',
          contentType: 'markdown',
          metadata: {
            isInteractive: false,
            displayType: 'main',
            parseType: 'simple',
            priority: 'low',
            estimatedReadTime: 6,
            prerequisites: [],
            relatedTopics: ['AI Pioneers']
          },
          isCompleted: false,
          progress: 0
        }
      ]
    }
  ]
};

export const mockSectionsArray: ContentNode[] = [
  mockContentNode,
  {
    name: 'Machine Learning Basics',
    slug: 'machine-learning-basics',
    content: 'Introduction to machine learning concepts.',
    contentType: 'code',
    metadata: {
      isInteractive: false,
      displayType: 'main',
      parseType: 'structured',
      priority: 'high',
      estimatedReadTime: 15,
      prerequisites: ['Introduction to AI'],
      relatedTopics: ['Supervised Learning', 'Unsupervised Learning']
    },
    isCompleted: false,
    progress: 50,
    subsections: [
      {
        name: 'Supervised Learning',
        slug: 'supervised-learning',
        content: 'Overview of supervised learning algorithms.',
        contentType: 'mermaid',
        metadata: {
          isInteractive: true,
          displayType: 'interactive',
          parseType: 'ai_parse',
          priority: 'medium',
          estimatedReadTime: 8,
          prerequisites: ['Machine Learning Basics'],
          relatedTopics: ['Classification', 'Regression']
        },
        isCompleted: true,
        progress: 100
      },
      {
        name: 'Unsupervised Learning',
        slug: 'unsupervised-learning',
        content: 'Overview of unsupervised learning techniques.',
        contentType: 'code',
        metadata: {
          isInteractive: false,
          displayType: 'main',
          parseType: 'structured',
          priority: 'medium',
          estimatedReadTime: 10,
          prerequisites: ['Machine Learning Basics'],
          relatedTopics: ['Clustering', 'Dimensionality Reduction']
        },
        isCompleted: false,
        progress: 30
      }
    ]
  },
  {
    name: 'Deep Learning',
    slug: 'deep-learning',
    content: 'Advanced neural network concepts and architectures.',
    contentType: 'json',
    metadata: {
      isInteractive: false,
      displayType: 'sidebar',
      parseType: 'structured',
      priority: 'high',
      estimatedReadTime: 20,
      prerequisites: ['Machine Learning Basics'],
      relatedTopics: ['Neural Networks', 'CNN', 'RNN']
    },
    isCompleted: false,
    progress: 0,
    subsections: [
      {
        name: 'Neural Networks',
        slug: 'neural-networks',
        content: 'Introduction to neural network architectures.',
        contentType: 'interactive',
        metadata: {
          isInteractive: true,
          displayType: 'interactive',
          parseType: 'ai_parse',
          priority: 'high',
          estimatedReadTime: 12,
          prerequisites: ['Deep Learning'],
          relatedTopics: ['Perceptron', 'Backpropagation']
        },
        isCompleted: false,
        progress: 0
      }
    ]
  }
];

export const mockUserProgress = {
  '0': {
    isCompleted: false,
    progress: 25,
    timeSpent: 300
  },
  '0.0': {
    isCompleted: true,
    progress: 100,
    timeSpent: 180
  },
  '0.0.0': {
    isCompleted: false,
    progress: 25,
    timeSpent: 60
  },
  '0.0.1': {
    isCompleted: false,
    progress: 0,
    timeSpent: 0
  },
  '0.1': {
    isCompleted: false,
    progress: 0,
    timeSpent: 0
  },
  '0.1.0': {
    isCompleted: false,
    progress: 0,
    timeSpent: 0
  },
  '1': {
    isCompleted: false,
    progress: 50,
    timeSpent: 600
  },
  '1.0': {
    isCompleted: true,
    progress: 100,
    timeSpent: 240
  },
  '1.1': {
    isCompleted: false,
    progress: 30,
    timeSpent: 120
  },
  '2': {
    isCompleted: false,
    progress: 0,
    timeSpent: 0
  },
  '2.0': {
    isCompleted: false,
    progress: 0,
    timeSpent: 0
  }
};

export const mockSingleSection: ContentNode = {
  name: 'Simple Section',
  slug: 'simple-section',
  content: 'A simple section with no subsections.',
  contentType: 'markdown',
  metadata: {
    isInteractive: false,
    displayType: 'main',
    parseType: 'simple',
    priority: 'medium',
    estimatedReadTime: 3,
    prerequisites: [],
    relatedTopics: []
  },
  isCompleted: true,
  progress: 100
};

export const mockEmptySection: ContentNode = {
  name: 'Empty Section',
  slug: 'empty-section',
  content: '',
  contentType: 'markdown',
  metadata: {
    isInteractive: false,
    displayType: 'main',
    parseType: 'simple',
    priority: 'low',
    estimatedReadTime: 0,
    prerequisites: [],
    relatedTopics: []
  },
  isCompleted: false,
  progress: 0,
  subsections: []
};

export const mockInteractiveSection: ContentNode = {
  name: 'Interactive Demo',
  slug: 'interactive-demo',
  content: 'An interactive demonstration of AI concepts.',
  contentType: 'interactive',
  metadata: {
    isInteractive: true,
    displayType: 'interactive',
    parseType: 'ai_parse',
    priority: 'high',
    estimatedReadTime: 15,
    prerequisites: ['Basic AI Knowledge'],
    relatedTopics: ['AI Demos', 'Interactive Learning']
  },
  isCompleted: false,
  progress: 75,
  subsections: [
    {
      name: 'Interactive Element 1',
      slug: 'interactive-element-1',
      content: 'First interactive element.',
      contentType: 'interactive',
      metadata: {
        isInteractive: true,
        displayType: 'interactive',
        parseType: 'simple',
        priority: 'high',
        estimatedReadTime: 5,
        prerequisites: [],
        relatedTopics: []
      },
      isCompleted: true,
      progress: 100
    },
    {
      name: 'Interactive Element 2',
      slug: 'interactive-element-2',
      content: 'Second interactive element.',
      contentType: 'interactive',
      metadata: {
        isInteractive: true,
        displayType: 'interactive',
        parseType: 'simple',
        priority: 'medium',
        estimatedReadTime: 10,
        prerequisites: ['Interactive Element 1'],
        relatedTopics: []
      },
      isCompleted: false,
      progress: 50
    }
  ]
};

export const mockSearchableContent: ContentNode[] = [
  {
    name: 'Neural Networks',
    slug: 'neural-networks',
    content: 'Introduction to neural network architectures.',
    contentType: 'markdown',
    metadata: {
      isInteractive: false,
      displayType: 'main',
      parseType: 'simple',
      priority: 'high',
      estimatedReadTime: 10,
      prerequisites: [],
      relatedTopics: []
    },
    isCompleted: false,
    progress: 0,
    subsections: [
      {
        name: 'Network Architecture',
        slug: 'network-architecture',
        content: 'Details about neural network architecture.',
        contentType: 'markdown',
        metadata: {
          isInteractive: false,
          displayType: 'main',
          parseType: 'simple',
          priority: 'medium',
          estimatedReadTime: 5,
          prerequisites: [],
          relatedTopics: []
        },
        isCompleted: false,
        progress: 0
      }
    ]
  },
  {
    name: 'Machine Learning',
    slug: 'machine-learning',
    content: 'Basics of machine learning.',
    contentType: 'markdown',
    metadata: {
      isInteractive: false,
      displayType: 'main',
      parseType: 'simple',
      priority: 'high',
      estimatedReadTime: 15,
      prerequisites: [],
      relatedTopics: []
    },
    isCompleted: false,
    progress: 0,
    subsections: [
      {
        name: 'Learning Algorithms',
        slug: 'learning-algorithms',
        content: 'Different types of learning algorithms.',
        contentType: 'markdown',
        metadata: {
          isInteractive: false,
          displayType: 'main',
          parseType: 'simple',
          priority: 'medium',
          estimatedReadTime: 8,
          prerequisites: [],
          relatedTopics: []
        },
        isCompleted: false,
        progress: 0
      }
    ]
  },
  {
    name: 'Deep Learning',
    slug: 'deep-learning',
    content: 'Advanced deep learning concepts.',
    contentType: 'markdown',
    metadata: {
      isInteractive: false,
      displayType: 'main',
      parseType: 'simple',
      priority: 'high',
      estimatedReadTime: 20,
      prerequisites: [],
      relatedTopics: []
    },
    isCompleted: false,
    progress: 0
  }
];

export const mockLargeDataset: ContentNode[] = Array.from({ length: 100 }, (_, i) => {
  const contentType: ContentNode['contentType'] = 'markdown';
  const displayType: NonNullable<ContentNode['metadata']>['displayType'] = 'main';
  const parseType: NonNullable<ContentNode['metadata']>['parseType'] = 'simple';
  const priority: NonNullable<ContentNode['metadata']>['priority'] = i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low';
  
  return {
    name: `Section ${i + 1}`,
    slug: `section-${i + 1}`,
    content: `Content for section ${i + 1}`,
    contentType: contentType,
    metadata: {
      isInteractive: i % 5 === 0,
      displayType: displayType,
      parseType: parseType,
      priority: priority,
      estimatedReadTime: Math.floor(Math.random() * 20) + 1,
      prerequisites: [],
      relatedTopics: []
    },
    isCompleted: i % 4 === 0,
    progress: Math.floor(Math.random() * 100),
    subsections: i % 10 === 0 ? [
      {
        name: `Subsection ${i + 1}.1`,
        slug: `subsection-${i + 1}-1`,
        content: `Subsection content for ${i + 1}.1`,
        contentType: 'markdown',
        metadata: {
          isInteractive: false,
          displayType: 'main',
          parseType: 'simple',
          priority: 'medium',
          estimatedReadTime: 5,
          prerequisites: [],
          relatedTopics: []
        },
        isCompleted: false,
        progress: 0
      }
    ] : undefined
  };
});