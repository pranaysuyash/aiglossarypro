import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIDefinitionGenerator } from './AIDefinitionGenerator';

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
    Story => (
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
          'AI-powered component for generating comprehensive definitions and explanations of technical terms.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialTerm: '',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
  },
};

export const WithPrefilledTerm: Story = {
  args: {
    initialTerm: 'Transformer Architecture',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
  },
};

export const GeneratingState: Story = {
  args: {
    initialTerm: 'Attention Mechanism',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
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
    initialTerm: 'Convolutional Neural Network',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
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
    initialTerm: 'Gradient Descent',
    initialCategory: 'Machine Learning',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
  },
};

export const ErrorState: Story = {
  args: {
    initialTerm: 'Invalid Term',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
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

export const WithCategory: Story = {
  args: {
    initialTerm: 'Random Forest',
    initialCategory: 'Machine Learning',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
  },
};

export const ReinforcementLearning: Story = {
  args: {
    initialTerm: 'Reinforcement Learning',
    initialCategory: 'Artificial Intelligence',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
  },
};

export const DarkMode: Story = {
  args: {
    initialTerm: 'Natural Language Processing',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  args: {
    initialTerm: 'Computer Vision',
    onDefinitionGenerated: (definition: any) => console.log('Generated:', definition),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
