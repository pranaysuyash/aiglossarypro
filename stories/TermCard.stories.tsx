import type { Meta, StoryObj } from '@storybook/react';
import TermCard from '../client/src/components/TermCard';
import { ITerm } from '../client/src/interfaces/interfaces';

const mockTerm: ITerm = {
  id: '1',
  name: 'Machine Learning',
  shortDefinition: 'A subset of artificial intelligence that enables systems to automatically learn and improve from experience without being explicitly programmed.',
  definition: 'Machine Learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.',
  category: 'AI/ML',
  subcategories: ['Supervised Learning', 'Unsupervised Learning'],
  characteristics: ['Data-driven', 'Pattern recognition', 'Predictive modeling'],
  visualUrl: null,
  visualCaption: null,
  mathFormulation: null,
  applications: ['Image Recognition', 'Natural Language Processing'],
  references: ['Pattern Recognition and Machine Learning', 'The Elements of Statistical Learning'],
  viewCount: 1250,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15')
};

const meta: Meta<typeof TermCard> = {
  title: 'Components/TermCard',
  component: TermCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'minimal'],
      description: 'Visual variant of the card',
    },
    showActions: {
      control: 'boolean',
      description: 'Whether to show action buttons',
    },
    isFavorite: {
      control: 'boolean',
      description: 'Whether the term is favorited',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    term: mockTerm,
    variant: 'default',
    showActions: true,
    isFavorite: false,
  },
};

export const Compact: Story = {
  args: {
    term: mockTerm,
    variant: 'compact',
    showActions: true,
    isFavorite: false,
  },
};

export const Minimal: Story = {
  args: {
    term: mockTerm,
    variant: 'minimal',
    showActions: true,
    isFavorite: false,
  },
};

export const Favorited: Story = {
  args: {
    term: mockTerm,
    variant: 'default',
    showActions: true,
    isFavorite: true,
  },
};

export const NoActions: Story = {
  args: {
    term: mockTerm,
    variant: 'default',
    showActions: false,
    isFavorite: false,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Default Variant</h3>
        <div className="max-w-sm">
          <TermCard term={mockTerm} variant="default" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Compact Variant</h3>
        <div className="max-w-sm">
          <TermCard term={mockTerm} variant="compact" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Minimal Variant</h3>
        <div className="max-w-sm">
          <TermCard term={mockTerm} variant="minimal" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Grid Layout (Compact)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TermCard term={mockTerm} variant="compact" />
          <TermCard term={{...mockTerm, name: 'Deep Learning', id: '2'}} variant="compact" />
          <TermCard term={{...mockTerm, name: 'Neural Networks', id: '3'}} variant="compact" />
        </div>
      </div>
    </div>
  ),
};

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <TermCard term={mockTerm} variant="compact" />
      <TermCard term={{...mockTerm, name: 'Deep Learning', id: '2'}} variant="compact" />
      <TermCard term={{...mockTerm, name: 'Neural Networks', id: '3'}} variant="compact" />
      <TermCard term={{...mockTerm, name: 'Reinforcement Learning', id: '4'}} variant="compact" />
      <TermCard term={{...mockTerm, name: 'Computer Vision', id: '5'}} variant="compact" />
      <TermCard term={{...mockTerm, name: 'Natural Language Processing', id: '6'}} variant="compact" />
    </div>
  ),
};