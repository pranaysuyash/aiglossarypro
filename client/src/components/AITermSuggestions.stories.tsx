import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AITermSuggestions } from './AITermSuggestions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta: Meta<typeof AITermSuggestions> = {
  title: 'AI/AITermSuggestions',
  component: AITermSuggestions,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-4xl mx-auto p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'AI-powered component that suggests related terms and concepts based on current content or user behavior.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSuggestionSelect: (suggestion) => console.log('Selected suggestion:', suggestion),
  },
};

export const WithFocusCategory: Story = {
  args: {
    focusCategory: 'Machine Learning',
    onSuggestionSelect: (suggestion) => console.log('Selected suggestion:', suggestion),
  },
};

export const WithSpecificCategory: Story = {
  args: {
    focusCategory: 'Natural Language Processing',
    onSuggestionSelect: (suggestion) => console.log('Selected suggestion:', suggestion),
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: 'border-2 border-blue-200 rounded-lg p-4',
    onSuggestionSelect: (suggestion) => console.log('Selected suggestion:', suggestion),
  },
};

export const DeepLearningFocus: Story = {
  args: {
    focusCategory: 'Deep Learning',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected deep learning suggestion:', suggestion);
      alert(`Selected: ${suggestion.term} - ${suggestion.shortDefinition}`);
    },
  },
};

export const ComputerVisionFocus: Story = {
  args: {
    focusCategory: 'Computer Vision',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected computer vision suggestion:', suggestion);
      // Simulate adding to a learning plan
      setTimeout(() => {
        alert(`Added "${suggestion.term}" to your learning plan!`);
      }, 500);
    },
  },
};

export const NLPFocus: Story = {
  args: {
    focusCategory: 'Natural Language Processing',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected NLP suggestion:', suggestion);
      // Simulate saving to favorites
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      favorites.push(suggestion.term);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      alert(`"${suggestion.term}" added to favorites!`);
    },
  },
};

export const DataScienceFocus: Story = {
  args: {
    focusCategory: 'Data Science',
    className: 'bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected data science suggestion:', suggestion);
      // Simulate detailed logging
      console.log('Suggestion details:', {
        term: suggestion.term,
        category: suggestion.category,
        reason: suggestion.reason,
        timestamp: new Date().toISOString(),
      });
    },
  },
};

export const StatisticsFocus: Story = {
  args: {
    focusCategory: 'Statistics',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected statistics suggestion:', suggestion);
      // Simulate tracking user interaction
      const interactions = JSON.parse(sessionStorage.getItem('interactions') || '[]');
      interactions.push({
        term: suggestion.term,
        category: suggestion.category,
        timestamp: Date.now(),
      });
      sessionStorage.setItem('interactions', JSON.stringify(interactions));
    },
  },
};

export const AlgorithmsFocus: Story = {
  args: {
    focusCategory: 'Algorithms',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected algorithms suggestion:', suggestion);
      // Simulate progress tracking
      const progress = {
        selectedTerm: suggestion.term,
        category: suggestion.category,
        completionTime: new Date().toLocaleTimeString(),
        difficulty: 'Intermediate',
      };
      console.log('Progress updated:', progress);
    },
  },
};

export const OptimizationFocus: Story = {
  args: {
    focusCategory: 'Optimization',
    className: 'shadow-lg border border-gray-200',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected optimization suggestion:', suggestion);
      // Simulate advanced interaction with detailed callback
      const event = new CustomEvent('termSelected', {
        detail: {
          suggestion,
          timestamp: Date.now(),
          userAgent: navigator.userAgent.substring(0, 50),
        },
      });
      window.dispatchEvent(event);
    },
  },
};

export const ReinforcementLearningFocus: Story = {
  args: {
    focusCategory: 'Reinforcement Learning',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected RL suggestion:', suggestion);
      // Simulate comprehensive interaction logging
      const analytics = {
        action: 'suggestion_selected',
        term: suggestion.term,
        category: suggestion.category,
        reason: suggestion.reason,
        shortDefinition: suggestion.shortDefinition,
        sessionId: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
      };
      console.log('Analytics event:', analytics);
      alert(
        `Exploring: ${suggestion.term}\n\nCategory: ${suggestion.category}\nReason: ${suggestion.reason}`
      );
    },
  },
};

export const AllCategoriesMode: Story = {
  args: {
    // No focusCategory means all categories
    className: 'max-w-6xl',
    onSuggestionSelect: (suggestion) => {
      console.log('Selected suggestion from all categories:', suggestion);
      // Simulate rich interaction with multiple actions
      const actions = [
        () => console.log('Action 1: Added to study queue'),
        () => console.log('Action 2: Updated learning path'),
        () => console.log('Action 3: Sent notification to study group'),
        () => console.log('Action 4: Logged progress milestone'),
      ];

      actions.forEach((action, index) => {
        setTimeout(action, index * 200);
      });

      setTimeout(() => {
        alert(`Successfully processed: ${suggestion.term}`);
      }, 1000);
    },
  },
};

export const InteractiveDemo: Story = {
  args: {
    focusCategory: 'Machine Learning',
    className: 'border-2 border-dashed border-blue-300 bg-blue-50/30 p-4 rounded-lg',
    onSuggestionSelect: (suggestion) => {
      console.log('Interactive demo - selected suggestion:', suggestion);

      // Simulate a comprehensive workflow
      const workflow = {
        step1: 'Validating selection...',
        step2: 'Checking prerequisites...',
        step3: 'Adding to learning plan...',
        step4: 'Updating progress tracker...',
        step5: 'Generating related suggestions...',
      };

      Object.entries(workflow).forEach(([step, message], index) => {
        setTimeout(() => {
          console.log(`${step}: ${message}`);
        }, index * 300);
      });

      // Final success message
      setTimeout(() => {
        const result = {
          selectedTerm: suggestion.term,
          category: suggestion.category,
          addedToPath: true,
          nextSuggestions: 3,
          estimatedStudyTime: '15 minutes',
          difficulty: 'Intermediate',
        };
        console.log('Workflow completed:', result);
        alert(
          `✅ Successfully added "${suggestion.term}" to your learning path!\n\nCategory: ${suggestion.category}\nEstimated study time: 15 minutes`
        );
      }, 1800);
    },
  },
};
