import type { Meta, StoryObj } from '@storybook/react';
import InteractiveQuiz from './InteractiveQuiz';

const meta: Meta<typeof InteractiveQuiz> = {
  title: 'Interactive/InteractiveQuiz',
  component: InteractiveQuiz,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive quiz component for testing understanding of AI/ML concepts with various question types and immediate feedback.',
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
      explanation: 'Activation functions introduce non-linearity into the network, allowing it to learn complex patterns and relationships in the data.',
      difficulty: 'beginner' as const,
      points: 10,
    },
    {
      id: '2',
      type: 'true-false' as const,
      question: 'Gradient descent always finds the global minimum of a loss function.',
      correctAnswer: false,
      explanation: 'Gradient descent can get stuck in local minima, especially in non-convex optimization landscapes common in deep learning.',
      difficulty: 'intermediate' as const,
      points: 15,
    },
    {
      id: '3',
      type: 'fill-in-blank' as const,
      question: 'The process of adjusting weights in a neural network based on the error is called ___.',
      correctAnswer: 'backpropagation',
      acceptableAnswers: ['backpropagation', 'back propagation', 'back-propagation'],
      explanation: 'Backpropagation is the algorithm used to calculate gradients and update weights in neural networks.',
      difficulty: 'intermediate' as const,
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
      question: 'Which technique is most effective for preventing overfitting in deep neural networks?',
      options: [
        'Increasing learning rate',
        'Adding more layers',
        'Dropout regularization',
        'Using smaller batch sizes',
      ],
      correctAnswer: 2,
      explanation: 'Dropout randomly sets some neurons to zero during training, preventing the network from becoming too dependent on specific neurons.',
      difficulty: 'advanced' as const,
      points: 20,
      tags: ['regularization', 'overfitting'],
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
      correctAnswers: [0, 1, 2],
      explanation: 'Batch normalization provides faster convergence, reduces initialization sensitivity, and has regularization effects, but doesn\'t eliminate the need for activation functions.',
      difficulty: 'advanced' as const,
      points: 25,
    },
    {
      id: '3',
      type: 'ordering' as const,
      question: 'Order the following steps in the transformer attention mechanism:',
      items: [
        'Apply softmax to attention scores',
        'Compute query, key, and value matrices',
        'Calculate attention scores (Q·K^T)',
        'Apply attention weights to values',
      ],
      correctOrder: [1, 2, 0, 3],
      explanation: 'The attention mechanism follows: 1) Compute Q,K,V matrices, 2) Calculate attention scores, 3) Apply softmax, 4) Weight the values.',
      difficulty: 'advanced' as const,
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
      type: 'numerical' as const,
      question: 'If a dataset has 1000 samples and we use 80% for training, how many samples are in the test set?',
      correctAnswer: 200,
      tolerance: 0,
      explanation: 'With 80% for training (800 samples), the remaining 20% (200 samples) are used for testing.',
      difficulty: 'beginner' as const,
      points: 10,
    },
    {
      id: '2',
      type: 'formula' as const,
      question: 'What is the formula for Mean Squared Error (MSE)?',
      correctAnswer: '(1/n) * Σ(yi - ŷi)²',
      acceptableAnswers: [
        '(1/n) * Σ(yi - ŷi)²',
        '(1/n) * sum((yi - ŷi)²)',
        'mean((y - ŷ)²)',
      ],
      explanation: 'MSE calculates the average of squared differences between actual and predicted values.',
      difficulty: 'intermediate' as const,
      points: 20,
      showFormula: true,
    },
  ],
  timeLimit: 240, // 4 minutes
  passingScore: 75,
};

export const Default: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Quiz completed:', results),
    onProgress: (progress) => console.log('Progress:', progress),
  },
};

export const AdvancedQuiz: Story = {
  args: {
    quizData: advancedQuizData,
    onComplete: (results) => console.log('Advanced quiz completed:', results),
    onProgress: (progress) => console.log('Progress:', progress),
    showHints: true,
  },
};

export const MathematicsQuiz: Story = {
  args: {
    quizData: mathQuizData,
    onComplete: (results) => console.log('Math quiz completed:', results),
    allowCalculator: true,
    showFormulas: true,
  },
};

export const TimedQuiz: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Timed quiz completed:', results),
    showTimer: true,
    strictTiming: true,
    onTimeUp: () => console.log('Time is up!'),
  },
};

export const PracticeMode: Story = {
  args: {
    quizData: basicQuizData,
    mode: 'practice',
    onComplete: (results) => console.log('Practice completed:', results),
    showCorrectAnswers: true,
    allowRetries: true,
    immediateAnswerFeedback: true,
  },
};

export const AssessmentMode: Story = {
  args: {
    quizData: advancedQuizData,
    mode: 'assessment',
    onComplete: (results) => console.log('Assessment completed:', results),
    showCorrectAnswers: false,
    allowRetries: false,
    randomizeQuestions: true,
    randomizeOptions: true,
  },
};

export const WithProgress: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Quiz completed:', results),
    showProgress: true,
    showQuestionNumbers: true,
    allowNavigation: true,
  },
};

export const CustomStyling: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Styled quiz completed:', results),
    theme: 'gradient',
    accentColor: '#6366f1',
    showAnimations: true,
  },
};

export const AdaptiveQuiz: Story = {
  args: {
    quizData: {
      ...basicQuizData,
      adaptive: true,
      adaptiveSettings: {
        startingDifficulty: 'intermediate',
        adjustmentFactor: 0.3,
        minQuestions: 5,
        maxQuestions: 15,
        targetAccuracy: 0.75,
      },
    },
    onComplete: (results) => console.log('Adaptive quiz completed:', results),
    onDifficultyAdjust: (newDifficulty) => console.log('Difficulty adjusted to:', newDifficulty),
  },
};

export const MultipleAttempts: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Quiz attempt completed:', results),
    maxAttempts: 3,
    showAttemptHistory: true,
    attemptHistory: [
      {
        attemptNumber: 1,
        score: 65,
        completedAt: '2024-01-15T10:30:00Z',
        timeSpent: 240,
      },
      {
        attemptNumber: 2,
        score: 78,
        completedAt: '2024-01-16T14:15:00Z',
        timeSpent: 180,
      },
    ],
  },
};

export const WithHints: Story = {
  args: {
    quizData: {
      ...basicQuizData,
      questions: basicQuizData.questions.map(q => ({
        ...q,
        hint: q.id === '1' ? 'Think about what makes neural networks different from linear models' :
              q.id === '2' ? 'Consider the shape of typical loss functions in deep learning' :
              'This is a fundamental algorithm in neural network training',
      })),
    },
    onComplete: (results) => console.log('Quiz with hints completed:', results),
    showHints: true,
    hintPenalty: 5, // Reduce points by 5 when hint is used
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    onComplete: (results) => console.log('Quiz completed:', results),
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to load quiz data. Please try again.',
    onRetry: () => console.log('Retrying quiz load...'),
    onComplete: (results) => console.log('Quiz completed:', results),
  },
};

export const CompletedState: Story = {
  args: {
    quizData: basicQuizData,
    completed: true,
    results: {
      score: 85,
      totalQuestions: 3,
      correctAnswers: 2,
      timeSpent: 145,
      passed: true,
      accuracy: 0.85,
      breakdown: {
        beginner: { correct: 1, total: 1 },
        intermediate: { correct: 1, total: 2 },
        advanced: { correct: 0, total: 0 },
      },
    },
    onRestart: () => console.log('Restarting quiz...'),
    onComplete: (results) => console.log('Quiz completed:', results),
  },
};

export const DarkMode: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Quiz completed:', results),
    theme: 'dark',
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Quiz completed:', results),
    mobileOptimized: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const AccessibleQuiz: Story = {
  args: {
    quizData: basicQuizData,
    onComplete: (results) => console.log('Accessible quiz completed:', results),
    accessibilityFeatures: {
      screenReaderSupport: true,
      highContrast: true,
      keyboardNavigation: true,
      fontSize: 'large',
    },
    announceProgress: true,
  },
};
