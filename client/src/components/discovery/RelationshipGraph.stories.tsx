import type { Meta, StoryObj } from '@storybook/react';
import { RelationshipGraph } from './RelationshipGraph';

const meta = {
  title: 'Components/RelationshipGraph',
  component: RelationshipGraph,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RelationshipGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    centralNodeId: 'machine-learning',
    nodes: [
      { id: 'machine-learning', name: 'Machine Learning', type: 'term', category: 'ai' },
      { id: 'neural-networks', name: 'Neural Networks', type: 'term', category: 'ai' },
      { id: 'supervised-learning', name: 'Supervised Learning', type: 'term', category: 'ai' },
    ],
    links: [
      { source: 'machine-learning', target: 'neural-networks', type: 'related', strength: 0.8 },
      { source: 'machine-learning', target: 'supervised-learning', type: 'extends', strength: 0.9 },
    ],
  },
};

export const WithProps: Story = {
  args: {
    centralNodeId: 'deep-learning',
    nodes: [
      { id: 'deep-learning', name: 'Deep Learning', type: 'term', category: 'ai' },
      { id: 'neural-networks', name: 'Neural Networks', type: 'term', category: 'ai' },
      { id: 'machine-learning', name: 'Machine Learning', type: 'term', category: 'ai' },
      { id: 'cnn', name: 'CNN', type: 'term', category: 'ai' },
      { id: 'rnn', name: 'RNN', type: 'term', category: 'ai' },
    ],
    links: [
      { source: 'deep-learning', target: 'neural-networks', type: 'extends', strength: 0.9 },
      { source: 'deep-learning', target: 'machine-learning', type: 'prerequisite', strength: 0.7 },
      { source: 'deep-learning', target: 'cnn', type: 'related', strength: 0.8 },
      { source: 'deep-learning', target: 'rnn', type: 'related', strength: 0.8 },
    ],
    onNodeClick: node => console.log('Node clicked:', node),
    selectedFilters: {
      relationshipTypes: ['extends', 'related'],
      nodeTypes: ['term'],
      minStrength: 0.5,
    },
  },
};
