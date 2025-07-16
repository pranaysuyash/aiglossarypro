import type { Meta, StoryObj } from '@storybook/react';
import { HierarchicalNavigator } from './HierarchicalNavigator';

const meta = {
  title: 'Components/HierarchicalNavigator',
  component: HierarchicalNavigator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof HierarchicalNavigator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sections: [
      {
        name: 'Machine Learning Fundamentals',
        slug: 'ml-fundamentals',
        subsections: [
          {
            name: 'Supervised Learning',
            slug: 'supervised-learning',
            content: 'Introduction to supervised learning...',
          },
          {
            name: 'Unsupervised Learning',
            slug: 'unsupervised-learning',
            content: 'Introduction to unsupervised learning...',
          },
        ],
      },
      {
        name: 'Deep Learning',
        slug: 'deep-learning',
        subsections: [
          {
            name: 'Neural Networks',
            slug: 'neural-networks',
            content: 'Introduction to neural networks...',
          },
        ],
      },
    ],
    onNodeClick: (path, node) => {
      console.log('Clicked node:', path, node);
    },
  },
};

export const WithProps: Story = {
  args: {
    sections: [
      {
        name: 'Advanced Topics',
        slug: 'advanced-topics',
        subsections: [
          {
            name: 'Transfer Learning',
            slug: 'transfer-learning',
            content: 'Introduction to transfer learning...',
            metadata: {
              isInteractive: true,
              displayType: 'interactive',
              estimatedReadTime: 15,
            },
          },
        ],
      },
    ],
    onNodeClick: (path, node) => {
      console.log('Clicked node:', path, node);
    },
    currentPath: 'advanced-topics/transfer-learning',
    showProgress: true,
    searchable: true,
    userProgress: {
      'advanced-topics/transfer-learning': {
        isCompleted: false,
        progress: 0.7,
        timeSpent: 10,
      },
    },
  },
};
