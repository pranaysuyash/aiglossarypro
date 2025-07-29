import type { Meta, StoryObj } from '@storybook/react';
import type { ITerm } from '@/interfaces/interfaces';
import TermCard from './TermCard';

// Mock term data for stories
const mockTerm: ITerm = {
  id: '1',
  name: 'Machine Learning',
  definition:
    'Machine Learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. ML focuses on the development of computer programs that can access data and use it to learn for themselves.',
  shortDefinition:
    'A subset of AI that enables systems to learn and improve from experience without explicit programming.',
  category: 'Artificial Intelligence',
  subcategories: ['Supervised Learning', 'Unsupervised Learning'],
  categoryId: 'ai-category',
  subcategoryIds: ['supervised', 'unsupervised'],
  characteristics: 'Data-driven, Pattern recognition, Predictive modeling',
  visualUrl: undefined,
  mathFormulation: undefined,
  viewCount: 1250,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const simpleTerm: ITerm = {
  id: '2',
  name: 'Neural Network',
  definition: 'A neural network is a computing system inspired by biological neural networks.',
  shortDefinition: 'A computing system inspired by biological neural networks.',
  category: 'Deep Learning',
  subcategories: [],
  categoryId: 'dl-category',
  subcategoryIds: [],
  characteristics: undefined,
  visualUrl: undefined,
  mathFormulation: undefined,
  viewCount: 890,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const complexTerm: ITerm = {
  id: '3',
  name: 'Transformer Architecture',
  definition:
    'The Transformer is a deep learning architecture that relies entirely on self-attention mechanisms to draw global dependencies between input and output. It was introduced in the paper "Attention Is All You Need" and has become the foundation for many state-of-the-art models in natural language processing.',
  shortDefinition:
    'A deep learning architecture based on self-attention mechanisms, fundamental to modern NLP.',
  category: 'Natural Language Processing',
  subcategories: ['Attention Mechanisms', 'Sequence-to-Sequence Models', 'BERT', 'GPT'],
  categoryId: 'nlp-category',
  subcategoryIds: ['attention', 'seq2seq', 'bert', 'gpt'],
  characteristics: 'Self-attention, Parallelizable, Positional encoding',
  visualUrl: 'https://example.com/transformer-diagram.png',
  mathFormulation: 'Attention(Q,K,V) = softmax(QK^T/√d_k)V',
  viewCount: 2100,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const meta: Meta<typeof TermCard> = {
  title: 'Components/TermCard',
  component: TermCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isFavorite: {
      control: { type: 'boolean' },
    },
  },
  decorators: [
    Story => (
      <div className="w-[350px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    term: mockTerm,
    isFavorite: false,
  },
};

export const Favorited: Story = {
  args: {
    term: mockTerm,
    isFavorite: true,
  },
};

export const SimpleTerm: Story = {
  args: {
    term: simpleTerm,
    isFavorite: false,
  },
};

export const ComplexTerm: Story = {
  args: {
    term: complexTerm,
    isFavorite: false,
  },
};

export const LongTitle: Story = {
  args: {
    term: {
      ...mockTerm,
      name: 'Bidirectional Encoder Representations from Transformers (BERT)',
    },
    isFavorite: false,
  },
};

export const NoSubcategories: Story = {
  args: {
    term: {
      ...mockTerm,
      subcategories: [],
    },
    isFavorite: false,
  },
};

export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
      <TermCard term={mockTerm} isFavorite={false} />
      <TermCard term={simpleTerm} isFavorite={true} />
      <TermCard term={complexTerm} isFavorite={false} />
      <TermCard term={{ ...mockTerm, id: '4', name: 'Gradient Descent' }} isFavorite={true} />
      <TermCard term={{ ...simpleTerm, id: '5', name: 'Backpropagation' }} isFavorite={false} />
      <TermCard
        term={{ ...complexTerm, id: '6', name: 'Convolutional Neural Network' }}
        isFavorite={false}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
