import type { Meta, StoryObj } from '@storybook/react';
import { SampleTermPage } from './SampleTermPage';

const meta: Meta<typeof SampleTermPage> = {
  title: 'Components/SampleTermPage',
  component: SampleTermPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'SEO-optimized sample term page with signup wall for organic discovery',
      },
    },
  },
  argTypes: {
    onSignupWall: { action: 'signup wall triggered' },
  },
};

export default meta;
type Story = StoryObj<typeof SampleTermPage>;

const sampleTerm = {
  id: 'neural-network',
  title: 'Neural Network',
  definition:
    'A neural network is a computing system inspired by biological neural networks that constitute animal brains. It consists of interconnected nodes (neurons) organized in layers that process information through weighted connections, enabling pattern recognition, learning, and decision-making capabilities.',
  category: 'Deep Learning',
  complexity: 'Intermediate' as const,
  tags: [
    'Deep Learning',
    'Machine Learning',
    'AI',
    'Pattern Recognition',
    'Artificial Intelligence',
  ],
  relatedTerms: [
    { id: 'deep-learning', title: 'Deep Learning', category: 'Deep Learning', locked: true },
    { id: 'backpropagation', title: 'Backpropagation', category: 'Deep Learning', locked: true },
    {
      id: 'activation-function',
      title: 'Activation Function',
      category: 'Deep Learning',
      locked: true,
    },
    { id: 'gradient-descent', title: 'Gradient Descent', category: 'Optimization', locked: true },
    {
      id: 'convolutional-neural-network',
      title: 'Convolutional Neural Network',
      category: 'Deep Learning',
      locked: true,
    },
    {
      id: 'recurrent-neural-network',
      title: 'Recurrent Neural Network',
      category: 'Deep Learning',
      locked: true,
    },
    {
      id: 'artificial-neuron',
      title: 'Artificial Neuron',
      category: 'Deep Learning',
      locked: true,
    },
    {
      id: 'multilayer-perceptron',
      title: 'Multilayer Perceptron',
      category: 'Deep Learning',
      locked: true,
    },
    {
      id: 'neural-network-architecture',
      title: 'Neural Network Architecture',
      category: 'Deep Learning',
      locked: true,
    },
    { id: 'training-data', title: 'Training Data', category: 'Machine Learning', locked: true },
  ],
  examples: [
    'Image recognition systems that can identify objects, faces, and scenes in photographs',
    'Natural language processing models like ChatGPT that understand and generate human-like text',
    'Recommendation engines on platforms like Netflix and Amazon that suggest relevant content',
    'Autonomous vehicle systems that process sensor data to make driving decisions',
    'Medical diagnosis tools that analyze X-rays, MRIs, and other medical imaging data',
  ],
  useCases: [
    'Computer vision applications for automated quality control in manufacturing',
    'Financial fraud detection systems analyzing transaction patterns',
    'Voice recognition and speech-to-text conversion systems',
    'Predictive maintenance in industrial equipment monitoring',
    'Drug discovery and molecular analysis in pharmaceutical research',
  ],
};

export const Default: Story = {
  args: {
    term: sampleTerm,
  },
};

export const BeginnerLevel: Story = {
  args: {
    term: {
      ...sampleTerm,
      id: 'artificial-intelligence',
      title: 'Artificial Intelligence',
      complexity: 'Beginner',
      definition:
        'Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence, such as learning, reasoning, problem-solving, and understanding language. AI enables machines to mimic cognitive functions and adapt to new situations.',
      category: 'AI Fundamentals',
      tags: ['AI', 'Machine Learning', 'Automation', 'Intelligence', 'Technology'],
      examples: [
        'Virtual assistants like Siri, Alexa, and Google Assistant',
        'Recommendation systems on streaming platforms and e-commerce sites',
        'Navigation apps that find optimal routes and avoid traffic',
        'Email spam filters that automatically sort unwanted messages',
        'Language translation tools like Google Translate',
      ],
      useCases: [
        'Customer service chatbots for 24/7 support',
        'Content moderation on social media platforms',
        'Smart home automation and IoT device management',
        'Personalized learning platforms for education',
        'Automated scheduling and calendar management',
      ],
    },
  },
};

export const AdvancedLevel: Story = {
  args: {
    term: {
      ...sampleTerm,
      id: 'transformer-architecture',
      title: 'Transformer Architecture',
      complexity: 'Advanced',
      definition:
        'The Transformer is a neural network architecture that revolutionized natural language processing by using self-attention mechanisms instead of recurrence or convolution. It enables parallel processing of sequences and has become the foundation for large language models like GPT and BERT.',
      category: 'Deep Learning Architecture',
      tags: [
        'Transformers',
        'Self-Attention',
        'NLP',
        'Deep Learning',
        'BERT',
        'GPT',
        'Sequence Modeling',
      ],
      examples: [
        'GPT models powering ChatGPT and other conversational AI systems',
        'BERT models used for search engine query understanding',
        "Machine translation systems like Google Translate's neural engine",
        'Code generation tools like GitHub Copilot and CodeT5',
        'Vision Transformers (ViTs) for image classification and analysis',
      ],
      useCases: [
        'Large-scale language model training for conversational AI',
        'Document summarization and content generation systems',
        'Multilingual text analysis and cross-language information retrieval',
        'Protein folding prediction in computational biology',
        'Multi-modal AI systems combining text, image, and audio processing',
      ],
    },
  },
};

export const WithSignupWall: Story = {
  args: {
    term: sampleTerm,
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking on a locked related term to trigger signup wall
    const lockedTerms = canvasElement.querySelectorAll('[data-testid="locked-term"]');
    if (lockedTerms.length > 0) {
      (lockedTerms[0] as HTMLElement).click();
    }
  },
};

export const MobileView: Story = {
  args: {
    term: sampleTerm,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const DarkMode: Story = {
  args: {
    term: sampleTerm,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};
