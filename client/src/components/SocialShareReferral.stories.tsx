import type { Meta, StoryObj } from '@storybook/react';
import { SocialShareReferral } from './SocialShareReferral';

const meta: Meta<typeof SocialShareReferral> = {
  title: 'Components/SocialShareReferral',
  component: SocialShareReferral,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Social sharing component with referral tracking for Pro users to earn commission on purchases',
      },
    },
  },
  decorators: [
    Story => (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SocialShareReferral>;

export const Default: Story = {
  args: {
    termId: 'neural-network',
    termTitle: 'Neural Network',
    termDefinition:
      'A neural network is a computing system inspired by biological neural networks that constitute animal brains. It consists of interconnected nodes (neurons) organized in layers that process information through weighted connections.',
    showInline: false,
  },
};

export const InlineMode: Story = {
  args: {
    termId: 'machine-learning',
    termTitle: 'Machine Learning',
    termDefinition:
      'A subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.',
    showInline: true,
  },
  decorators: [
    Story => (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4">Machine Learning</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          A subset of artificial intelligence that enables computers to learn and improve from
          experience without being explicitly programmed.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Share this term:</span>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const GeneralSiteShare: Story = {
  args: {
    // No termId - sharing the general site
    showInline: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sharing the general AI Glossary Pro site without a specific term',
      },
    },
  },
};

export const LongDefinition: Story = {
  args: {
    termId: 'transformer-architecture',
    termTitle: 'Transformer Architecture',
    termDefinition:
      'The Transformer is a neural network architecture that revolutionized natural language processing by using self-attention mechanisms instead of recurrence or convolution. It enables parallel processing of sequences and has become the foundation for large language models like GPT and BERT. The architecture consists of an encoder-decoder structure with multi-head attention layers.',
    showInline: false,
  },
};

export const MobileView: Story = {
  args: {
    termId: 'deep-learning',
    termTitle: 'Deep Learning',
    termDefinition:
      'A subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns in data.',
    showInline: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    termId: 'artificial-intelligence',
    termTitle: 'Artificial Intelligence',
    termDefinition:
      'Computer systems that can perform tasks typically requiring human intelligence, such as learning, reasoning, and problem-solving.',
    showInline: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const DarkMode: Story = {
  args: {
    termId: 'computer-vision',
    termTitle: 'Computer Vision',
    termDefinition:
      'A field of artificial intelligence that trains computers to interpret and understand visual information from the world.',
    showInline: false,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const HighEarnings: Story = {
  args: {
    termId: 'gradient-descent',
    termTitle: 'Gradient Descent',
    termDefinition:
      'An optimization algorithm used to minimize the loss function in machine learning models.',
    showInline: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with high referral earnings and conversion stats',
      },
    },
  },
};

export const ZeroStats: Story = {
  args: {
    termId: 'reinforcement-learning',
    termTitle: 'Reinforcement Learning',
    termDefinition:
      'A machine learning paradigm where agents learn to make decisions by taking actions in an environment to maximize rewards.',
    showInline: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example for a new user with no referral stats yet',
      },
    },
  },
};
