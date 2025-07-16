import type { Meta, StoryObj } from '@storybook/react';
import { ContentPreview } from './ContentPreview';

const meta: Meta<typeof ContentPreview> = {
  title: 'Landing/ContentPreview',
  component: ContentPreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Content preview component showcasing the quality and breadth of AI/ML terminology with interactive samples.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTerms = [
  {
    id: '1',
    name: 'Neural Network',
    definition:
      'A computational model inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information through weighted connections.',
    category: 'Deep Learning',
    difficulty: 'intermediate',
    enhanced: true,
    sections: {
      overview: 'Neural networks are the foundation of modern AI...',
      implementation:
        'class NeuralNetwork:\n    def __init__(self, layers):\n        self.layers = layers',
      examples: ['Image classification', 'Natural language processing'],
      interactive: true,
    },
  },
  {
    id: '2',
    name: 'Gradient Descent',
    definition:
      'An optimization algorithm used to minimize the cost function in machine learning by iteratively moving toward the steepest descent.',
    category: 'Optimization',
    difficulty: 'intermediate',
    enhanced: true,
    sections: {
      overview: 'Gradient descent is fundamental to training ML models...',
      mathematics: 'θ = θ - α∇J(θ)',
      variants: ['SGD', 'Adam', 'RMSprop'],
    },
  },
  {
    id: '3',
    name: 'Transformer',
    definition:
      'A neural network architecture that relies entirely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    category: 'Natural Language Processing',
    difficulty: 'advanced',
    enhanced: true,
    trending: true,
    sections: {
      overview: 'Transformers revolutionized NLP with attention...',
      architecture: 'Multi-head attention, position encoding, feed-forward layers',
      applications: ['BERT', 'GPT', 'T5'],
    },
  },
];

const sampleCategories = [
  {
    id: '1',
    name: 'Machine Learning',
    description: 'Fundamental concepts and algorithms in machine learning',
    termCount: 1247,
    icon: '🤖',
    color: '#3B82F6',
  },
  {
    id: '2',
    name: 'Deep Learning',
    description: 'Neural networks and deep learning architectures',
    termCount: 892,
    icon: '🧠',
    color: '#8B5CF6',
  },
  {
    id: '3',
    name: 'Natural Language Processing',
    description: 'Language understanding and text processing',
    termCount: 634,
    icon: '💬',
    color: '#10B981',
  },
  {
    id: '4',
    name: 'Computer Vision',
    description: 'Image and video analysis techniques',
    termCount: 567,
    icon: '👁️',
    color: '#F59E0B',
  },
];

export const Default: Story = {
  args: {
    sampleTerms: sampleTerms.slice(0, 2),
    sampleCategories: sampleCategories.slice(0, 3),
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
};

export const WithInteractiveDemo: Story = {
  args: {
    sampleTerms,
    sampleCategories,
    showInteractiveDemo: true,
    interactiveFeatures: [
      'AI-powered semantic search',
      'Interactive code examples',
      'Visual diagrams and explanations',
      'Progress tracking',
      'Personalized recommendations',
    ],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
    onTryDemo: () => console.log('Try demo clicked'),
  },
};

export const ShowcaseView: Story = {
  args: {
    sampleTerms,
    sampleCategories,
    layout: 'showcase',
    showQualityIndicators: true,
    qualityMetrics: {
      totalTerms: 12543,
      enhancedTerms: 8921,
      codeExamples: 4567,
      interactiveContent: 2134,
      aiGenerated: 6789,
    },
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
};

export const WithSearchDemo: Story = {
  args: {
    sampleTerms,
    sampleCategories,
    showSearchDemo: true,
    searchExamples: [
      'how do neural networks learn',
      'optimization algorithms for deep learning',
      'transformer architecture explanation',
      'computer vision for medical imaging',
    ],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onSearchDemo: (query: string) => console.log('Search demo:', query),
  },
};

export const ComparisonView: Story = {
  args: {
    sampleTerms,
    showComparison: true,
    comparisonData: {
      before: {
        title: 'Traditional Glossaries',
        features: ['Static definitions', 'Limited search', 'No examples', 'Outdated content'],
        color: '#EF4444',
      },
      after: {
        title: 'AI Glossary Pro',
        features: [
          'AI-enhanced definitions',
          'Semantic search',
          'Interactive examples',
          'Real-time updates',
          'Personalized learning',
        ],
        color: '#10B981',
      },
    },
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithTestimonials: Story = {
  args: {
    sampleTerms: sampleTerms.slice(0, 2),
    showTestimonials: true,
    testimonials: [
      {
        id: '1',
        author: 'Dr. Sarah Chen',
        role: 'ML Research Scientist at Google',
        content:
          "The most comprehensive AI glossary I've ever used. The interactive examples make complex concepts crystal clear.",
        rating: 5,
        avatar: '👩‍🔬',
      },
      {
        id: '2',
        author: 'Marcus Johnson',
        role: 'Data Science Student',
        content:
          'This glossary transformed my understanding of machine learning. The progressive difficulty levels are perfect for learning.',
        rating: 5,
        avatar: '👨‍🎓',
      },
      {
        id: '3',
        author: 'Elena Rodriguez',
        role: 'AI Product Manager',
        content:
          'Essential for anyone working in AI. The semantic search finds exactly what I need, even with vague queries.',
        rating: 5,
        avatar: '👩‍💼',
      },
    ],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const FeatureHighlight: Story = {
  args: {
    sampleTerms,
    layout: 'feature-highlight',
    highlightedFeatures: [
      {
        id: 'ai-search',
        title: 'AI-Powered Search',
        description: 'Find terms using natural language queries',
        icon: '🔍',
        demo: true,
      },
      {
        id: 'interactive',
        title: 'Interactive Content',
        description: 'Code examples, diagrams, and visualizations',
        icon: '⚡',
        demo: true,
      },
      {
        id: 'learning-paths',
        title: 'Learning Paths',
        description: 'Structured courses from beginner to expert',
        icon: '🎯',
        demo: false,
      },
      {
        id: 'real-time',
        title: 'Real-time Updates',
        description: 'Content stays current with latest research',
        icon: '🔄',
        demo: false,
      },
    ],
    onFeatureDemo: (featureId: string) => console.log('Feature demo:', featureId),
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const WithStats: Story = {
  args: {
    sampleTerms: sampleTerms.slice(0, 2),
    showStats: true,
    stats: [
      { label: 'Total Terms', value: '12,543', icon: '📚' },
      { label: 'AI-Enhanced', value: '8,921', icon: '🤖' },
      { label: 'Code Examples', value: '4,567', icon: '💻' },
      { label: 'Interactive', value: '2,134', icon: '⚡' },
      { label: 'Languages', value: '15', icon: '🌍' },
      { label: 'Daily Users', value: '50K+', icon: '👥' },
    ],
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    skeletonCount: 6,
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to load content preview',
    onRetry: () => console.log('Retry clicked'),
  },
};

export const MobileOptimized: Story = {
  args: {
    sampleTerms: sampleTerms.slice(0, 2),
    sampleCategories: sampleCategories.slice(0, 2),
    mobileOptimized: true,
    swipeEnabled: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const WithAnimation: Story = {
  args: {
    sampleTerms,
    sampleCategories: sampleCategories.slice(0, 3),
    animated: true,
    animationDelay: 200,
    showProgressiveReveal: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
};

export const CustomTheme: Story = {
  args: {
    sampleTerms: sampleTerms.slice(0, 2),
    sampleCategories: sampleCategories.slice(0, 3),
    theme: {
      primaryColor: '#6366F1',
      backgroundColor: '#F8FAFC',
      textColor: '#1E293B',
      borderRadius: '12px',
      fontFamily: 'Inter',
    },
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
};

export const DarkMode: Story = {
  args: {
    sampleTerms,
    sampleCategories,
    theme: 'dark',
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const WithCallToAction: Story = {
  args: {
    sampleTerms: sampleTerms.slice(0, 2),
    sampleCategories: sampleCategories.slice(0, 3),
    showCTA: true,
    ctaText: 'Start Learning Today',
    ctaSecondaryText: 'Free trial • No credit card required',
    onCTAClick: () => console.log('CTA clicked'),
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
};

export const AccessibleVersion: Story = {
  args: {
    sampleTerms: sampleTerms.slice(0, 2),
    sampleCategories: sampleCategories.slice(0, 3),
    accessibilityFeatures: {
      highContrast: false,
      reducedMotion: false,
      screenReaderOptimized: true,
      keyboardNavigation: true,
    },
    announceChanges: true,
    onTermClick: (termId: string) => console.log('Term clicked:', termId),
    onCategoryClick: (categoryId: string) => console.log('Category clicked:', categoryId),
  },
};
