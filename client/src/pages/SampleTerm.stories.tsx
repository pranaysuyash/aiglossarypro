import type { Meta, StoryObj } from '@storybook/react';
import SampleTerm from './SampleTerm';

const meta: Meta<typeof SampleTerm> = {
  title: 'Pages/SampleTerm',
  component: SampleTerm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Individual sample term page with SEO optimization and signup wall triggers',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SampleTerm>;

export const NeuralNetwork: Story = {
  parameters: {
    wouter: {
      path: '/sample/:slug',
      route: '/sample/neural-network',
    },
    docs: {
      description: {
        story: 'Neural Network sample term page with intermediate complexity',
      },
    },
  },
};

export const MachineLearning: Story = {
  parameters: {
    wouter: {
      path: '/sample/:slug',
      route: '/sample/machine-learning',
    },
    docs: {
      description: {
        story: 'Machine Learning sample term page with beginner complexity',
      },
    },
  },
};

export const TransformerArchitecture: Story = {
  parameters: {
    wouter: {
      path: '/sample/:slug',
      route: '/sample/transformer-architecture',
    },
    docs: {
      description: {
        story: 'Transformer Architecture sample term page with advanced complexity',
      },
    },
  },
};

export const NotFound: Story = {
  parameters: {
    wouter: {
      path: '/sample/:slug',
      route: '/sample/non-existent-term',
    },
    docs: {
      description: {
        story: 'Sample term not found page with suggested alternatives',
      },
    },
  },
};

export const LoadingState: Story = {
  parameters: {
    wouter: {
      path: '/sample/:slug',
      route: '/sample/neural-network',
    },
    docs: {
      description: {
        story: 'Loading state while fetching sample term data',
      },
    },
  },
};

export const MobileView: Story = {
  parameters: {
    wouter: {
      path: '/sample/:slug',
      route: '/sample/artificial-intelligence',
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    wouter: {
      path: '/sample/:slug',
      route: '/sample/deep-learning',
    },
    backgrounds: {
      default: 'dark',
    },
  },
};