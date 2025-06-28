import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import EnhancedTermCard from './EnhancedTermCard';
import { IEnhancedTerm } from '@/interfaces/interfaces';

// Mock function for actions
const fn = () => () => {};

// Create a mock query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock enhanced term data
const mockEnhancedTerm: IEnhancedTerm = {
  id: '1',
  name: 'Neural Network',
  slug: 'neural-network',
  shortDefinition: 'A computing system inspired by biological neural networks.',
  definition: 'A neural network is a computing system inspired by the biological neural networks that constitute animal brains. It consists of interconnected nodes (neurons) that process information using a connectionist approach to computation.',
  fullDefinition: 'Neural networks are a fundamental concept in machine learning and artificial intelligence, consisting of layers of interconnected nodes that can learn complex patterns from data through training.',
  mainCategories: ['Machine Learning', 'Artificial Intelligence'],
  subCategories: ['Supervised Learning', 'Neural Networks'],
  relatedConcepts: ['Deep Learning', 'Backpropagation', 'Perceptron'],
  applicationDomains: ['Computer Vision', 'Natural Language Processing', 'Predictive Analytics'],
  techniques: ['Feedforward', 'Backpropagation', 'Gradient Descent'],
  difficultyLevel: 'Intermediate' as const,
  hasImplementation: true,
  hasInteractiveElements: true,
  hasCaseStudies: true,
  hasCodeExamples: true,
  isAiGenerated: false,
  verificationStatus: 'verified' as const,
  searchText: 'neural network machine learning artificial intelligence',
  keywords: ['neural', 'network', 'machine learning', 'AI', 'deep learning'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

const meta: Meta<typeof EnhancedTermCard> = {
  title: 'Components/EnhancedTermCard',
  component: EnhancedTermCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An enhanced term card displaying comprehensive information about AI/ML terms with interactive features.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="w-full max-w-md p-4">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
  args: {
    term: mockEnhancedTerm,
    onFavorite: fn(),
    onShare: fn(),
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default enhanced term card with all features enabled.',
      },
    },
  },
};

export const Beginner: Story = {
  args: {
    term: {
      ...mockEnhancedTerm,
      name: 'Machine Learning',
      difficultyLevel: 'beginner',
      shortDefinition: 'A method of data analysis that automates analytical model building.',
      hasImplementation: false,
      hasCodeExamples: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Term card for beginner-level concepts without implementation details.',
      },
    },
  },
};

export const Advanced: Story = {
  args: {
    term: {
      ...mockEnhancedTerm,
      name: 'Transformer Architecture',
      difficultyLevel: 'advanced',
      shortDefinition: 'A neural network architecture that relies entirely on attention mechanisms.',
      hasImplementation: true,
      hasCodeExamples: true,
      isAiGenerated: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Term card for advanced concepts with AI-generated content indicator.',
      },
    },
  },
};

export const WithoutCodeExamples: Story = {
  args: {
    term: {
      ...mockEnhancedTerm,
      hasCodeExamples: false,
      hasImplementation: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Term card without code examples or implementation details.',
      },
    },
  },
};

export const AIGenerated: Story = {
  args: {
    term: {
      ...mockEnhancedTerm,
      isAiGenerated: true,
      verificationStatus: 'pending',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Term card with AI-generated content that is pending verification.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    term: mockEnhancedTerm,
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact version of the term card for dense layouts.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Term card optimized for mobile devices.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Term card in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="w-full max-w-md p-4 dark">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
}; 