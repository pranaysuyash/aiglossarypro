import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BulkTermEditor } from './BulkTermEditor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof BulkTermEditor> = {
  title: 'Admin/BulkTermEditor',
  component: BulkTermEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Bulk term editor for efficiently editing multiple terms with AI assistance, bulk operations, and batch processing.',
      },
    },
  },
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 p-6">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BulkTermEditor>;

// Sample terms data
const sampleTerms = [
  {
    id: '1',
    name: 'Machine Learning',
    shortDefinition: 'A subset of AI that enables systems to learn and improve from experience.',
    definition:
      'Machine Learning is a method of data analysis that automates analytical model building.',
    category: 'Core ML',
    subcategory: 'Foundations',
    characteristics: ['Pattern Recognition', 'Automated Learning', 'Data-Driven'],
    applications: [
      { name: 'Image Recognition', description: 'Identifying objects in images' },
      { name: 'Natural Language Processing', description: 'Understanding human language' },
    ],
    mathFormulation: 'f(x) = θ₀ + θ₁x₁ + θ₂x₂ + ... + θₙxₙ',
    relatedTerms: ['Deep Learning', 'Neural Networks', 'Supervised Learning'],
    aiGenerated: true,
    verificationStatus: 'verified' as const,
    qualityScore: 92,
  },
  {
    id: '2',
    name: 'Deep Learning',
    shortDefinition: 'A subset of ML using neural networks with multiple layers.',
    definition:
      'Deep Learning uses artificial neural networks with multiple layers to model complex patterns.',
    category: 'Neural Networks',
    subcategory: 'Deep Learning',
    characteristics: ['Multi-layer Networks', 'Feature Learning', 'Hierarchical Representations'],
    applications: [
      { name: 'Computer Vision', description: 'Advanced image and video analysis' },
      { name: 'Speech Recognition', description: 'Converting speech to text' },
    ],
    mathFormulation: 'y = f(W₃f(W₂f(W₁x + b₁) + b₂) + b₃)',
    relatedTerms: ['Neural Networks', 'Convolutional Networks', 'Backpropagation'],
    aiGenerated: false,
    verificationStatus: 'unverified' as const,
    qualityScore: 85,
  },
  {
    id: '3',
    name: 'Reinforcement Learning',
    shortDefinition:
      'Learning through interaction with an environment using rewards and penalties.',
    definition:
      'Reinforcement Learning is a type of machine learning where an agent learns to make decisions.',
    category: 'Learning Paradigms',
    subcategory: 'Reinforcement Learning',
    characteristics: ['Trial and Error', 'Reward Maximization', 'Sequential Decision Making'],
    applications: [
      { name: 'Game Playing', description: 'AI agents learning to play games' },
      { name: 'Robotics', description: 'Robot control and navigation' },
    ],
    mathFormulation: "Q(s,a) = r + γ max Q(s',a')",
    relatedTerms: ['Q-Learning', 'Policy Gradient', 'Value Functions'],
    aiGenerated: true,
    verificationStatus: 'flagged' as const,
    qualityScore: 78,
  },
  {
    id: '4',
    name: 'Supervised Learning',
    shortDefinition: 'Learning with labeled training data.',
    definition:
      'Supervised Learning is a type of machine learning where the model learns from labeled examples.',
    category: 'Learning Paradigms',
    subcategory: 'Supervised Learning',
    characteristics: ['Labeled Data', 'Prediction', 'Error Minimization'],
    applications: [
      { name: 'Classification', description: 'Categorizing data into classes' },
      { name: 'Regression', description: 'Predicting continuous values' },
    ],
    mathFormulation: 'y = f(x; θ)',
    relatedTerms: ['Classification', 'Regression', 'Training Data'],
    aiGenerated: false,
    verificationStatus: 'verified' as const,
    qualityScore: 88,
  },
  {
    id: '5',
    name: 'Unsupervised Learning',
    shortDefinition: 'Learning from data without labeled examples.',
    definition:
      'Unsupervised Learning is a type of machine learning that finds patterns in data without labels.',
    category: 'Learning Paradigms',
    subcategory: 'Unsupervised Learning',
    characteristics: ['Pattern Discovery', 'Unlabeled Data', 'Structure Finding'],
    applications: [
      { name: 'Clustering', description: 'Grouping similar data points' },
      { name: 'Dimensionality Reduction', description: 'Reducing feature space' },
    ],
    mathFormulation: 'z = g(x; φ)',
    relatedTerms: ['Clustering', 'PCA', 'Anomaly Detection'],
    aiGenerated: true,
    verificationStatus: 'unverified' as const,
    qualityScore: 82,
  },
];

// Mock fetch for Storybook
const mockFetch = (url: string) => {
  if (url.includes('/api/admin/terms/bulk-update')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          updatedCount: 3,
          success: true,
        }),
    });
  }

  if (url.includes('/api/ai/improve-definition')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            shortDefinition: 'Enhanced definition with AI improvements',
            definition: 'This is an AI-improved definition with better clarity and completeness.',
            characteristics: ['Enhanced Feature 1', 'Enhanced Feature 2', 'Enhanced Feature 3'],
            applications: [
              { name: 'Enhanced Application 1', description: 'Improved application description' },
              { name: 'Enhanced Application 2', description: 'Another improved application' },
            ],
            mathFormulation: 'Enhanced mathematical formulation',
          },
        }),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
};

// Override fetch for Storybook
global.fetch = mockFetch as any;

export const Default: Story = {
  args: {
    terms: sampleTerms,
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default view of the BulkTermEditor with sample terms ready for editing.',
      },
    },
  },
};

export const WithSelectedTerms: Story = {
  args: {
    terms: sampleTerms.map((term, index) => ({
      ...term,
      selected: index < 2, // Pre-select first 2 terms
    })),
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story: 'BulkTermEditor with some terms pre-selected, showing bulk action options.',
      },
    },
  },
};

export const WithModifiedTerms: Story = {
  args: {
    terms: sampleTerms.map((term, index) => ({
      ...term,
      modified: index % 2 === 0, // Mark every other term as modified
      shortDefinition: index % 2 === 0 ? 'Modified definition' : term.shortDefinition,
    })),
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'BulkTermEditor showing terms with pending modifications, highlighting changed content.',
      },
    },
  },
};

export const FilteredTerms: Story = {
  args: {
    terms: sampleTerms.filter(term => term.category === 'Learning Paradigms'),
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story: 'BulkTermEditor with filtered terms showing only terms from a specific category.',
      },
    },
  },
};

export const UnverifiedTerms: Story = {
  args: {
    terms: sampleTerms.filter(term => term.verificationStatus === 'unverified'),
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story: 'BulkTermEditor showing only unverified terms that need review.',
      },
    },
  },
};

export const AIGeneratedTerms: Story = {
  args: {
    terms: sampleTerms.filter(term => term.aiGenerated),
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story: 'BulkTermEditor showing only AI-generated terms for quality review.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    terms: [],
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story: 'BulkTermEditor in empty state when no terms match the current filters.',
      },
    },
  },
};

export const SingleTerm: Story = {
  args: {
    terms: [sampleTerms[0]],
    onTermsUpdated: () => console.log('Terms updated'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'BulkTermEditor with a single term, showing the interface can handle any number of terms.',
      },
    },
  },
};
