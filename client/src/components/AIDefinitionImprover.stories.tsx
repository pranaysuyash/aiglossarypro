import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIDefinitionImprover } from './AIDefinitionImprover';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof AIDefinitionImprover> = {
  title: 'AI/AIDefinitionImprover',
  component: AIDefinitionImprover,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-4xl mx-auto p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'AI-powered component for improving existing definitions with enhanced clarity, examples, and technical accuracy.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleDefinition = `Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.`;

const improvedDefinition = `Machine learning is a subset of artificial intelligence (AI) that enables computer systems to automatically learn, adapt, and improve their performance on a specific task through experience, without being explicitly programmed for every scenario.

**Core Concept:**
Machine learning algorithms build mathematical models based on training data to make predictions or decisions on new, unseen data. The system identifies patterns and relationships in data to generalize and apply this knowledge to future instances.

**Key Characteristics:**
- **Automated Learning**: Systems improve performance through exposure to data
- **Pattern Recognition**: Identifies complex relationships in large datasets  
- **Generalization**: Applies learned patterns to new, unseen data
- **Iterative Improvement**: Performance enhances with more training data

**Common Types:**
- **Supervised Learning**: Learns from labeled training data (e.g., email spam detection)
- **Unsupervised Learning**: Finds hidden patterns in unlabeled data (e.g., customer segmentation)
- **Reinforcement Learning**: Learns through interaction and feedback (e.g., game playing AI)

**Real-World Applications:**
- Recommendation systems (Netflix, Amazon)
- Image recognition (medical diagnosis, autonomous vehicles)
- Natural language processing (chatbots, translation)
- Fraud detection in financial services
- Predictive maintenance in manufacturing

**Technical Foundation:**
Machine learning relies on statistical algorithms, linear algebra, and computational optimization to process data and extract meaningful insights that enable intelligent decision-making.`;

export const Default: Story = {
  args: {
    term: {
      id: 'ml-1',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 100,
      isAiGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

export const WithLongDefinition: Story = {
  args: {
    term: {
      id: 'nn-1',
      name: 'Neural Networks',
      definition: `Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes called neurons that process information. Each neuron receives inputs, processes them using an activation function, and produces an output. Neural networks can learn to recognize patterns and make predictions through training on data.`,
      category: 'Deep Learning',
      viewCount: 250,
      isAiGenerated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

export const ImprovingState: Story = {
  args: {
    term: {
      id: 'ml-improving',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 180,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(),
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/improve-definition',
        method: 'POST',
        status: 200,
        response: { improving: true, progress: 65 },
        delay: 2000,
      },
    ],
  },
};

export const WithImprovements: Story = {
  args: {
    term: {
      id: 'ml-improvements',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 350,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      updatedAt: new Date(),
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/improve-definition',
        method: 'POST',
        status: 200,
        response: {
          improvedDefinition,
          improvements: [
            {
              type: 'clarity',
              description: 'Added more precise technical language and structure',
              impact: 'high',
            },
            {
              type: 'examples',
              description: 'Included real-world applications and use cases',
              impact: 'high',
            },
            {
              type: 'completeness',
              description: 'Added key characteristics and technical foundation',
              impact: 'medium',
            },
            {
              type: 'organization',
              description: 'Structured content with clear sections and bullet points',
              impact: 'medium',
            },
          ],
          confidenceScore: 0.94,
          readabilityScore: {
            original: 12.5,
            improved: 14.2,
            grade: 'College Level',
          },
        },
      },
    ],
  },
};

export const WithCustomImprovementTypes: Story = {
  args: {
    term: {
      id: 'dl-custom',
      name: 'Deep Learning',
      definition: `Deep learning uses neural networks with multiple layers to learn complex patterns in data.`,
      category: 'Deep Learning',
      viewCount: 420,
      isAiGenerated: false,
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
      updatedAt: new Date(Date.now() - 86400000), // 1 day ago
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
};

export const ComparisonMode: Story = {
  args: {
    term: {
      id: 'ml-comparison',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 290,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 345600000), // 4 days ago
      updatedAt: new Date(Date.now() - 43200000), // 12 hours ago
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/improve-definition',
        method: 'POST',
        status: 200,
        response: {
          improvedDefinition,
          improvements: [
            {
              type: 'clarity',
              description: 'Enhanced technical precision and readability',
              impact: 'high',
            },
            {
              type: 'structure',
              description: 'Organized content into logical sections',
              impact: 'high',
            },
          ],
          confidenceScore: 0.92,
        },
      },
    ],
  },
};

export const MultipleVersions: Story = {
  args: {
    term: {
      id: 'ml-versions',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 520,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 432000000), // 5 days ago
      updatedAt: new Date(Date.now() - 21600000), // 6 hours ago
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/improve-definition',
        method: 'POST',
        status: 200,
        response: {
          versions: [
            {
              id: 'beginner',
              title: 'Beginner-Friendly',
              definition: `Machine learning is like teaching a computer to recognize patterns and make decisions, similar to how humans learn from experience. Instead of programming every possible scenario, we show the computer lots of examples so it can learn to handle new situations on its own.`,
              targetAudience: 'beginners',
              readabilityGrade: 6,
            },
            {
              id: 'technical',
              title: 'Technical/Academic',
              definition: improvedDefinition,
              targetAudience: 'professionals',
              readabilityGrade: 14,
            },
            {
              id: 'business',
              title: 'Business-Focused',
              definition: `Machine learning is a technology that enables computers to automatically improve their performance by learning from data, without manual programming. This drives business value through automated insights, predictive analytics, and intelligent decision-making systems that can process vast amounts of information faster and more accurately than human analysts.`,
              targetAudience: 'business',
              readabilityGrade: 12,
            },
          ],
          recommendedVersion: 'technical',
        },
      },
    ],
  },
};

export const ErrorState: Story = {
  args: {
    term: {
      id: 'ml-error',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 95,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 518400000), // 6 days ago
      updatedAt: new Date(Date.now() - 172800000), // 2 days ago
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/improve-definition',
        method: 'POST',
        status: 500,
        response: { error: 'AI improvement service is temporarily unavailable' },
      },
    ],
  },
};

export const WithFeedback: Story = {
  args: {
    term: {
      id: 'ml-feedback',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 240,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 604800000), // 7 days ago
      updatedAt: new Date(Date.now() - 10800000), // 3 hours ago
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/improve-definition',
        method: 'POST',
        status: 200,
        response: {
          improvedDefinition,
          improvements: [
            {
              type: 'clarity',
              description: 'Enhanced technical precision',
              impact: 'high',
            },
          ],
          confidenceScore: 0.89,
        },
      },
    ],
  },
};

export const DarkMode: Story = {
  args: {
    term: {
      id: 'ml-dark',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 160,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 691200000), // 8 days ago
      updatedAt: new Date(Date.now() - 7200000), // 2 hours ago
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  args: {
    term: {
      id: 'ml-mobile',
      name: 'Machine Learning',
      definition: sampleDefinition,
      category: 'AI',
      viewCount: 210,
      isAiGenerated: true,
      createdAt: new Date(Date.now() - 777600000), // 9 days ago
      updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
    onImprovementApplied: (improvedTerm: any) => console.log('Accepted improvement:', improvedTerm),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
