import type { Meta, StoryObj } from '@storybook/react';
import RecommendedTerms from './RecommendedTerms';
import { ITerm } from '@/interfaces/interfaces';

// Mock TermCard component
jest.mock('@/components/TermCard', () => {
  return function MockTermCard({ term, variant, isFavorite }: any) {
    return (
      <div className={`p-4 border rounded-lg ${variant === 'compact' ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{term.term}</h3>
          {isFavorite && <span className="text-red-500">❤️</span>}
        </div>
        <p className="text-gray-600 text-sm mb-2">{term.definition}</p>
        {term.category && (
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {term.category}
          </span>
        )}
      </div>
    );
  };
});

// Mock wouter Link component
jest.mock('wouter', () => ({
  Link: ({ href, children }: any) => (
    <a href={href} className="text-primary-600 hover:text-primary-700">
      {children}
    </a>
  ),
}));

const sampleTerms: ITerm[] = [
  {
    id: '1',
    term: 'Machine Learning',
    definition: 'A subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.',
    category: 'Core Concepts',
    isFavorite: false,
  },
  {
    id: '2',
    term: 'Neural Network',
    definition: 'A computing system inspired by biological neural networks that can learn to recognize patterns and make decisions.',
    category: 'Deep Learning',
    isFavorite: true,
  },
  {
    id: '3',
    term: 'Gradient Descent',
    definition: 'An optimization algorithm used to minimize the cost function in machine learning by iteratively moving in the direction of steepest descent.',
    category: 'Optimization',
    isFavorite: false,
  },
  {
    id: '4',
    term: 'Natural Language Processing',
    definition: 'A branch of AI that helps computers understand, interpret and manipulate human language.',
    category: 'NLP',
    isFavorite: false,
  },
  {
    id: '5',
    term: 'Computer Vision',
    definition: 'A field of artificial intelligence that trains computers to interpret and understand the visual world.',
    category: 'Computer Vision',
    isFavorite: true,
  },
  {
    id: '6',
    term: 'Reinforcement Learning',
    definition: 'A type of machine learning where an agent learns to behave in an environment by performing actions and seeing the results.',
    category: 'Learning Types',
    isFavorite: false,
  },
];

const meta: Meta<typeof RecommendedTerms> = {
  title: 'Term/RecommendedTerms',
  component: RecommendedTerms,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component that displays recommended terms in a grid layout with a "See all" link.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-6xl">
        <Story />
      </div>
    ),
  ],
  args: {
    recommended: sampleTerms.slice(0, 3),
  },
  argTypes: {
    recommended: {
      control: { type: 'object' },
      description: 'Array of recommended terms to display',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    recommended: sampleTerms.slice(0, 3),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default display with 3 recommended terms in a grid layout.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    recommended: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Component renders nothing when no recommendations are available.',
      },
    },
  },
};

export const SingleTerm: Story = {
  args: {
    recommended: [sampleTerms[0]],
  },
  parameters: {
    docs: {
      description: {
        story: 'Display with only one recommended term.',
      },
    },
  },
};

export const TwoTerms: Story = {
  args: {
    recommended: sampleTerms.slice(0, 2),
  },
  parameters: {
    docs: {
      description: {
        story: 'Display with two recommended terms.',
      },
    },
  },
};

export const ManyTerms: Story = {
  args: {
    recommended: sampleTerms,
  },
  parameters: {
    docs: {
      description: {
        story: 'Display with six recommended terms showing grid layout behavior.',
      },
    },
  },
};

export const WithFavorites: Story = {
  args: {
    recommended: sampleTerms.filter(term => term.isFavorite),
  },
  parameters: {
    docs: {
      description: {
        story: 'Display showing only favorited terms with heart icons.',
      },
    },
  },
};

export const LongDefinitions: Story = {
  args: {
    recommended: [
      {
        id: '1',
        term: 'Transformer Architecture',
        definition: 'A neural network architecture that relies entirely on self-attention mechanisms to draw global dependencies between input and output, revolutionizing natural language processing and forming the foundation for models like BERT, GPT, and T5.',
        category: 'Deep Learning',
        isFavorite: false,
      },
      {
        id: '2',
        term: 'Generative Adversarial Networks',
        definition: 'A class of machine learning frameworks where two neural networks contest with each other in a game-theoretic scenario, consisting of a generator that creates fake data and a discriminator that tries to detect the fake data.',
        category: 'Generative Models',
        isFavorite: true,
      },
      {
        id: '3',
        term: 'Convolutional Neural Networks',
        definition: 'A deep learning algorithm particularly powerful for analyzing visual imagery, using a mathematical operation called convolution to detect features like edges, textures, and patterns in images.',
        category: 'Computer Vision',
        isFavorite: false,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Terms with longer definitions to test text handling and layout.',
      },
    },
  },
};

export const DifferentCategories: Story = {
  args: {
    recommended: [
      {
        id: '1',
        term: 'Supervised Learning',
        definition: 'A type of machine learning where the algorithm learns from labeled training data.',
        category: 'Learning Types',
        isFavorite: false,
      },
      {
        id: '2',
        term: 'LSTM',
        definition: 'Long Short-Term Memory networks, a special kind of RNN capable of learning long-term dependencies.',
        category: 'Neural Networks',
        isFavorite: true,
      },
      {
        id: '3',
        term: 'Precision',
        definition: 'A metric that measures the accuracy of positive predictions in classification tasks.',
        category: 'Evaluation Metrics',
        isFavorite: false,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Terms from different categories showing variety in recommendations.',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    recommended: sampleTerms.slice(0, 4),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Recommended terms on mobile devices - should stack in single column.',
      },
    },
  },
};

export const TabletView: Story = {
  args: {
    recommended: sampleTerms.slice(0, 4),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Recommended terms on tablet devices - should show 2 columns.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    
    const categories = ['all', 'Core Concepts', 'Deep Learning', 'NLP', 'Computer Vision', 'Optimization'];
    
    const filteredTerms = selectedCategory === 'all' 
      ? sampleTerms 
      : sampleTerms.filter(term => term.category === selectedCategory);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <label className="font-medium">Filter by category:</label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            ({filteredTerms.length} terms)
          </span>
        </div>
        
        <RecommendedTerms recommended={filteredTerms} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with category filtering to show dynamic content.',
      },
    },
  },
};

export const CustomLayout: Story = {
  render: () => {
    const CustomRecommendedTerms = ({ recommended }: { recommended: ITerm[] }) => {
      if (!recommended || recommended.length === 0) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">No recommendations available at the moment.</p>
            <button className="mt-2 text-blue-600 hover:underline">
              Explore all terms
            </button>
          </div>
        );
      }

      return (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Recommended for You</h2>
              <p className="text-gray-600">Based on your learning progress</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{recommended.length} terms</span>
              <a href="/recommendations" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                View All
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommended.map((term: any) => (
              <div key={term.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-900">{term.term}</h3>
                  {term.isFavorite && <span className="text-red-500 text-xl">♥</span>}
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">{term.definition}</p>
                <div className="flex justify-between items-center">
                  {term.category && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      {term.category}
                    </span>
                  )}
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Learn more →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    return <CustomRecommendedTerms recommended={sampleTerms.slice(0, 3)} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom styled version with enhanced layout and different visual design.',
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => {
    const LoadingRecommendedTerms = () => {
      return (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recommended for You</h2>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-4/6"></div>
                  </div>
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    return <LoadingRecommendedTerms />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with skeleton placeholders while recommendations are being fetched.',
      },
    },
  },
};

export const ErrorState: Story = {
  render: () => {
    const ErrorRecommendedTerms = () => {
      return (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recommended for You</h2>
          </div>
          
          <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Load Recommendations
            </h3>
            <p className="text-red-600 mb-4">
              There was an error loading your personalized recommendations.
            </p>
            <div className="space-x-2">
              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Try Again
              </button>
              <button className="text-red-600 hover:text-red-800">
                Browse All Terms
              </button>
            </div>
          </div>
        </div>
      );
    };
    
    return <ErrorRecommendedTerms />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state when recommendations fail to load.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    recommended: sampleTerms.slice(0, 3),
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Recommended terms in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-6xl dark">
        <Story />
      </div>
    ),
  ],
};
