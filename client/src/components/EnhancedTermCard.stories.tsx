import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  name: 'Machine Learning',
  slug: 'machine-learning',
  definition: 'A subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.',
  shortDefinition: 'A subset of AI that enables systems to learn and improve from experience without explicit programming.',
  category: 'Core Concepts',
  mainCategories: ['Artificial Intelligence'],
  subCategories: ['Supervised Learning', 'Unsupervised Learning'],
  relatedConcepts: ['Artificial Intelligence', 'Deep Learning', 'Neural Networks'],
  applicationDomains: ['Healthcare', 'Finance', 'Autonomous Vehicles'],
  techniques: ['Classification', 'Regression', 'Clustering'],
  difficultyLevel: 'Intermediate',
  hasImplementation: true,
  hasInteractiveElements: false,
  hasCaseStudies: true,
  hasCodeExamples: true,
  keywords: ['AI', 'Algorithms', 'Data Science'],
  viewCount: 1250,
  createdAt: new Date(),
  updatedAt: new Date()
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
        <div className="w-full max-w-md p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    term: mockEnhancedTerm,
    isFavorite: false,
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
      difficultyLevel: 'Beginner',
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
      difficultyLevel: 'Advanced',
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
        <div className="w-full max-w-md p-4 dark">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
}; 