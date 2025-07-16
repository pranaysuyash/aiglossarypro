import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Create a mock query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock ProgressTracker component for Storybook
interface MockProgressTrackerProps {
  termId: string;
  isLearned: boolean;
}

const MockProgressTracker = ({ termId, isLearned: initialIsLearned }: MockProgressTrackerProps) => {
  const [isLearned, setIsLearned] = React.useState(initialIsLearned);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAuthenticated] = React.useState(true); // Mock authenticated state

  const handleMarkAsLearned = async () => {
    if (!isAuthenticated) {
      alert('Please log in to track progress');
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLearned(!isLearned);
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-3">
            <Check className={`h-5 w-5 ${isLearned ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Track Progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLearned ? 'You have learned this term!' : 'Mark as learned to track your progress'}
            </p>
          </div>
        </div>

        <Button
          variant={isLearned ? 'outline' : 'default'}
          onClick={handleMarkAsLearned}
          disabled={isLoading}
          className={isLearned ? 'border-green-500 text-green-600' : ''}
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              Processing...
            </span>
          ) : isLearned ? (
            'Mark as Unlearned'
          ) : (
            'Mark as Learned'
          )}
        </Button>
      </div>
    </div>
  );
};

const meta: Meta<typeof MockProgressTracker> = {
  title: 'Components/ProgressTracker',
  component: MockProgressTracker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A component that allows users to track their learning progress by marking terms as learned or unlearned.',
      },
    },
  },
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className="w-full max-w-2xl">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  args: {
    termId: 'sample-term-id',
  },

  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NotLearned: Story = {
  args: {
    termId: 'term-1',
    isLearned: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress tracker showing a term that has not been marked as learned yet.',
      },
    },
  },
};

export const Learned: Story = {
  args: {
    termId: 'term-2',
    isLearned: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress tracker showing a term that has been marked as learned.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Machine Learning</h3>
          <p className="text-gray-600 mb-4">
            A subset of artificial intelligence that enables computers to learn and improve from
            experience without being explicitly programmed.
          </p>
          <MockProgressTracker termId="interactive-term" isLearned={false} />
        </div>
        <div className="text-sm text-gray-500">
          <p>Click the button above to toggle the learned state and see the component in action.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive progress tracker that you can click to toggle between learned and unlearned states.',
      },
    },
  },
};

export const UnauthenticatedUser: Story = {
  render: () => {
    const UnauthProgressTracker = ({ termId, isLearned }: MockProgressTrackerProps) => {
      const [isAuthenticated] = React.useState(false);

      const handleMarkAsLearned = () => {
        if (!isAuthenticated) {
          alert('Authentication required! Please log in to track your progress.');
          return;
        }
      };

      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="mr-3">
                <Check className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Track Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mark as learned to track your progress
                </p>
              </div>
            </div>

            <Button variant="default" onClick={handleMarkAsLearned}>
              Mark as Learned
            </Button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Neural Networks</h3>
          <p className="text-gray-600 mb-4">
            Computing systems inspired by biological neural networks that can learn and recognize
            patterns.
          </p>
          <UnauthProgressTracker termId="unauth-term" isLearned={false} />
        </div>
        <div className="text-sm text-gray-500">
          <p>
            When clicked, this will show an authentication required message since the user is not
            logged in.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Progress tracker behavior when user is not authenticated - shows auth required message.',
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => {
    const LoadingProgressTracker = ({
      termId,
      isLearned: initialIsLearned,
    }: MockProgressTrackerProps) => {
      const [isLearned, setIsLearned] = React.useState(initialIsLearned);
      const [isLoading, setIsLoading] = React.useState(false);

      const handleMarkAsLearned = async () => {
        setIsLoading(true);

        // Simulate longer API delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsLearned(!isLearned);
        setIsLoading(false);
      };

      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="mr-3">
                <Check className={`h-5 w-5 ${isLearned ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Track Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isLearned
                    ? 'You have learned this term!'
                    : 'Mark as learned to track your progress'}
                </p>
              </div>
            </div>

            <Button
              variant={isLearned ? 'outline' : 'default'}
              onClick={handleMarkAsLearned}
              disabled={isLoading}
              className={isLearned ? 'border-green-500 text-green-600' : ''}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  Processing...
                </span>
              ) : isLearned ? (
                'Mark as Unlearned'
              ) : (
                'Mark as Learned'
              )}
            </Button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Deep Learning</h3>
          <p className="text-gray-600 mb-4">
            A subset of machine learning that uses neural networks with multiple layers to learn
            complex patterns.
          </p>
          <LoadingProgressTracker termId="loading-term" isLearned={false} />
        </div>
        <div className="text-sm text-gray-500">
          <p>Click the button to see the loading state with a 2-second delay.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress tracker showing loading state while the API request is being processed.',
      },
    },
  },
};

export const ErrorState: Story = {
  render: () => {
    const ErrorProgressTracker = ({
      termId,
      isLearned: initialIsLearned,
    }: MockProgressTrackerProps) => {
      const [isLearned, _setIsLearned] = React.useState(initialIsLearned);
      const [isLoading, setIsLoading] = React.useState(false);

      const handleMarkAsLearned = async () => {
        setIsLoading(true);

        try {
          // Simulate API delay then error
          await new Promise(resolve => setTimeout(resolve, 1000));
          throw new Error('Failed to update progress');
        } catch (_error) {
          alert('Error: Failed to update progress. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="mr-3">
                <Check className={`h-5 w-5 ${isLearned ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Track Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isLearned
                    ? 'You have learned this term!'
                    : 'Mark as learned to track your progress'}
                </p>
              </div>
            </div>

            <Button
              variant={isLearned ? 'outline' : 'default'}
              onClick={handleMarkAsLearned}
              disabled={isLoading}
              className={isLearned ? 'border-green-500 text-green-600' : ''}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  Processing...
                </span>
              ) : isLearned ? (
                'Mark as Unlearned'
              ) : (
                'Mark as Learned'
              )}
            </Button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Computer Vision</h3>
          <p className="text-gray-600 mb-4">
            A field of AI that enables computers to interpret and understand visual information from
            the world.
          </p>
          <ErrorProgressTracker termId="error-term" isLearned={false} />
        </div>
        <div className="text-sm text-gray-500">
          <p>Click the button to simulate an API error and see the error handling.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress tracker behavior when API request fails - shows error toast.',
      },
    },
  },
};

export const InTermCard: Story = {
  render: () => {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Artificial Intelligence</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              AI/ML
            </span>
          </div>

          <p className="text-gray-600 mb-4">
            The simulation of human intelligence in machines that are programmed to think and learn
            like humans. It encompasses various subfields including machine learning, natural
            language processing, and computer vision.
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                Machine Learning
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                Neural Networks
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                Algorithms
              </span>
            </div>

            <div className="text-sm text-gray-500">
              <p>
                <strong>Applications:</strong> Image recognition, speech processing, recommendation
                systems
              </p>
              <p>
                <strong>Key Concepts:</strong> Training data, model accuracy, feature engineering
              </p>
            </div>
          </div>
        </div>

        <MockProgressTracker termId="ai-term" isLearned={false} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress tracker as it would appear in a term card or detailed view.',
      },
    },
  },
};

export const MultipleTerms: Story = {
  render: () => {
    const terms = [
      {
        id: 'ml',
        title: 'Machine Learning',
        description: 'Algorithms that improve through experience.',
        isLearned: false,
      },
      {
        id: 'dl',
        title: 'Deep Learning',
        description: 'Neural networks with multiple layers.',
        isLearned: true,
      },
      {
        id: 'nlp',
        title: 'Natural Language Processing',
        description: 'AI that understands human language.',
        isLearned: false,
      },
      {
        id: 'cv',
        title: 'Computer Vision',
        description: 'AI that interprets visual information.',
        isLearned: true,
      },
    ];

    const learnedCount = terms.filter(term => term.isLearned).length;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Learning Progress</h3>
        <div className="grid gap-4">
          {terms.map(term => (
            <div key={term.id} className="border rounded-lg overflow-hidden">
              <div className="p-4">
                <h4 className="font-semibold mb-1">{term.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{term.description}</p>
              </div>
              <MockProgressTracker termId={term.id} isLearned={term.isLearned} />
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-500">
          <p>
            Progress: {learnedCount} of {terms.length} terms learned
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple progress trackers showing different terms and their learning states.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    termId: 'dark-term',
    isLearned: false,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Progress tracker in dark mode theme.',
      },
    },
  },
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <div className="w-full max-w-2xl dark">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
