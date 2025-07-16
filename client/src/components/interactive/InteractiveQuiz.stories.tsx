import type { Meta, StoryObj } from '@storybook/react';
import InteractiveQuiz from './InteractiveQuiz';

const meta: Meta<typeof InteractiveQuiz> = {
  title: 'Interactive/InteractiveQuiz',
  component: InteractiveQuiz,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Interactive quiz component for testing understanding of AI/ML concepts with various question types and immediate feedback.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicQuizData = {
  id: 'neural-networks-basics',
  title: 'Neural Networks Fundamentals',
  description: 'Test your understanding of basic neural network concepts',
  questions: [
    {
      id: '1',
      type: 'multiple-choice' as const,
      question: 'What is the primary function of an activation function in a neural network?',
      options: [
        'To initialize weights',
        'To introduce non-linearity',
        'To prevent overfitting',
        'To normalize inputs',
      ],
      correctAnswer: 1,
      explanation:
        'Activation functions introduce non-linearity into the network, allowing it to learn complex patterns and relationships in the data.',
      points: 10,
    },
    {
      id: '2',
      type: 'true-false' as const,
      question: 'Gradient descent always finds the global minimum of a loss function.',
      options: ['True', 'False'],
      correctAnswer: 1,
      explanation:
        'Gradient descent can get stuck in local minima, especially in non-convex optimization landscapes common in deep learning.',
      points: 15,
    },
    {
      id: '3',
      type: 'fill-blank' as const,
      question:
        'The process of adjusting weights in a neural network based on the error is called ___.',
      correctAnswer: 'backpropagation',
      explanation:
        'Backpropagation is the algorithm used to calculate gradients and update weights in neural networks.',
      points: 15,
    },
  ],
  timeLimit: 300, // 5 minutes
  passingScore: 70,
};

const advancedQuizData = {
  id: 'deep-learning-advanced',
  title: 'Advanced Deep Learning Concepts',
  description: 'Challenge yourself with advanced deep learning topics',
  questions: [
    {
      id: '1',
      type: 'multiple-choice' as const,
      question:
        'Which technique is most effective for preventing overfitting in deep neural networks?',
      options: [
        'Increasing learning rate',
        'Adding more layers',
        'Dropout regularization',
        'Using smaller batch sizes',
      ],
      correctAnswer: 2,
      explanation:
        'Dropout randomly sets some neurons to zero during training, preventing the network from becoming too dependent on specific neurons.',
      points: 20,
    },
    {
      id: '2',
      type: 'multiple-select' as const,
      question: 'Which of the following are advantages of using batch normalization?',
      options: [
        'Faster training convergence',
        'Reduced sensitivity to initialization',
        'Acts as a form of regularization',
        'Eliminates the need for activation functions',
      ],
      correctAnswer: ['0', '1', '2'],
      explanation:
        "Batch normalization provides faster convergence, reduces initialization sensitivity, and has regularization effects, but doesn't eliminate the need for activation functions.",
      points: 25,
    },
    {
      id: '3',
      type: 'multiple-choice' as const,
      question: 'In transformer attention mechanism, what is computed first?',
      options: [
        'Apply softmax to attention scores',
        'Compute query, key, and value matrices',
        'Calculate attention scores (Q·K^T)',
        'Apply attention weights to values',
      ],
      correctAnswer: 1,
      explanation: 'The attention mechanism starts by computing Q, K, V matrices from the input.',
      points: 30,
    },
  ],
  timeLimit: 600, // 10 minutes
  passingScore: 80,
};

const mathQuizData = {
  id: 'ml-mathematics',
  title: 'Machine Learning Mathematics',
  description: 'Test your mathematical foundations for ML',
  questions: [
    {
      id: '1',
      type: 'fill-blank' as const,
      question:
        'If a dataset has 1000 samples and we use 80% for training, how many samples are in the test set?',
      correctAnswer: '200',
      explanation:
        'With 80% for training (800 samples), the remaining 20% (200 samples) are used for testing.',
      points: 10,
    },
    {
      id: '2',
      type: 'fill-blank' as const,
      question: 'What does MSE stand for in machine learning?',
      correctAnswer: 'Mean Squared Error',
      explanation:
        'MSE calculates the average of squared differences between actual and predicted values.',
      points: 20,
    },
  ],
  timeLimit: 240, // 4 minutes
  passingScore: 75,
};

export const Default: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    description: basicQuizData.description,
    timeLimit: basicQuizData.timeLimit,
    onComplete: (results: any) => console.log('Quiz completed:', results),
  },
};

export const AdvancedQuiz: Story = {
  args: {
    questions: advancedQuizData.questions,
    title: advancedQuizData.title,
    description: advancedQuizData.description,
    timeLimit: advancedQuizData.timeLimit,
    onComplete: (results: any) => console.log('Advanced quiz completed:', results),
    showExplanations: true,
  },
};

export const MathematicsQuiz: Story = {
  args: {
    questions: mathQuizData.questions,
    title: mathQuizData.title,
    description: mathQuizData.description,
    timeLimit: mathQuizData.timeLimit,
    onComplete: (results: any) => console.log('Math quiz completed:', results),
    showExplanations: true,
  },
};

export const TimedQuiz: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    timeLimit: basicQuizData.timeLimit,
    onComplete: (results: any) => console.log('Timed quiz completed:', results),
  },
};

export const PracticeMode: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Practice completed:', results),
    showExplanations: true,
    allowRetry: true,
  },
};

export const AssessmentMode: Story = {
  args: {
    questions: advancedQuizData.questions,
    title: advancedQuizData.title,
    onComplete: (results: any) => console.log('Assessment completed:', results),
    showExplanations: false,
    allowRetry: false,
  },
};

export const WithProgress: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Quiz completed:', results),
  },
};

export const CustomStyling: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Styled quiz completed:', results),
    className: 'bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white',
  },
};

export const AdaptiveQuiz: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Adaptive quiz completed:', results),
    showExplanations: true,
  },
};

export const MultipleAttempts: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Quiz attempt completed:', results),
    allowRetry: true,
  },
};

export const WithHints: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Quiz with hints completed:', results),
    showExplanations: true,
  },
};

export const LoadingState: Story = {
  args: {
    questions: [],
    title: 'Loading Quiz...',
    onComplete: (results: any) => console.log('Quiz completed:', results),
  },
};

export const ErrorState: Story = {
  args: {
    questions: [],
    title: 'Quiz Error',
    onComplete: (results: any) => console.log('Quiz completed:', results),
  },
};

export const CompletedState: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Quiz completed:', results),
    showExplanations: true,
  },
};

export const DarkMode: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Quiz completed:', results),
    className: 'bg-gray-900 text-white',
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Quiz completed:', results),
    className: 'max-w-sm mx-auto',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const AccessibleQuiz: Story = {
  args: {
    questions: basicQuizData.questions,
    title: basicQuizData.title,
    onComplete: (results: any) => console.log('Accessible quiz completed:', results),
    showExplanations: true,
  },
};
