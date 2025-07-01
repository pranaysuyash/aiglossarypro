import type { Meta, StoryObj } from '@storybook/react';
import { AIDefinitionGenerator } from './AIDefinitionGenerator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof AIDefinitionGenerator> = {
  title: 'AI/AIDefinitionGenerator',
  component: AIDefinitionGenerator,
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
        component: 'AI-powered component for generating comprehensive definitions and explanations of technical terms.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    termName: '',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
  },
};

export const WithPrefilledTerm: Story = {
  args: {
    termName: 'Transformer Architecture',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
  },
};

export const GeneratingState: Story = {
  args: {
    termName: 'Attention Mechanism',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/generate-definition',
        method: 'POST',
        status: 200,
        response: { generating: true },
        delay: 3000,
      },
    ],
  },
};

export const SuccessfulGeneration: Story = {
  args: {
    termName: 'Convolutional Neural Network',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/generate-definition',
        method: 'POST',
        status: 200,
        response: {
          definition: `A Convolutional Neural Network (CNN) is a deep learning architecture specifically designed for processing grid-like data such as images. CNNs use convolutional layers that apply filters to detect local features, pooling layers to reduce spatial dimensions, and fully connected layers for classification.

**Key Components:**
- **Convolutional Layers**: Apply learnable filters to detect features
- **Pooling Layers**: Reduce spatial dimensions while preserving important information
- **Activation Functions**: Introduce non-linearity (typically ReLU)
- **Fully Connected Layers**: Perform final classification or regression

**Applications:**
- Image classification and recognition
- Object detection and segmentation
- Medical image analysis
- Computer vision tasks

**Advantages:**
- Translation invariance through weight sharing
- Hierarchical feature learning
- Reduced number of parameters compared to fully connected networks
- Effective for spatial data processing`,
          confidence: 0.92,
          sources: ['Deep Learning textbook', 'Computer Vision research papers'],
          generatedAt: new Date().toISOString(),
        },
      },
    ],
  },
};

export const WithCustomizationOptions: Story = {
  args: {
    termName: 'Gradient Descent',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
    options: {
      complexity: 'intermediate',
      includeExamples: true,
      includeCode: true,
      targetAudience: 'students',
    },
  },
};

export const ErrorState: Story = {
  args: {
    termName: 'Invalid Term',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
  },
  parameters: {
    mockData: [
      {
        url: '/api/ai/generate-definition',
        method: 'POST',
        status: 429,
        response: { error: 'Rate limit exceeded. Please try again in a few minutes.' },
      },
    ],
  },
};

export const WithHistory: Story = {
  args: {
    termName: 'Random Forest',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
    showHistory: true,
    recentGenerations: [
      {
        term: 'Decision Tree',
        timestamp: '2024-01-15T10:30:00Z',
        preview: 'A decision tree is a flowchart-like structure...',
      },
      {
        term: 'Support Vector Machine',
        timestamp: '2024-01-15T09:15:00Z',
        preview: 'Support Vector Machines are supervised learning models...',
      },
      {
        term: 'K-Means Clustering',
        timestamp: '2024-01-14T16:45:00Z',
        preview: 'K-Means is an unsupervised learning algorithm...',
      },
    ],
  },
};

export const AdminMode: Story = {
  args: {
    termName: 'Reinforcement Learning',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
    adminMode: true,
    showAdvancedOptions: true,
  },
};

export const DarkMode: Story = {
  args: {
    termName: 'Natural Language Processing',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  args: {
    termName: 'Computer Vision',
    onDefinitionGenerated: (definition: string) => console.log('Generated:', definition),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
