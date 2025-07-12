import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIFeedbackDashboard } from './AIFeedbackDashboard';

// Create a query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof AIFeedbackDashboard> = {
  title: 'Components/AIFeedbackDashboard',
  component: AIFeedbackDashboard,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI Feedback Dashboard component for collecting and analyzing user feedback on AI-generated content.'
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default AI Feedback Dashboard showing feedback collection and analysis interface.'
      }
    }
  }
};

export const AdminView: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI Feedback Dashboard in admin mode with comprehensive analytics and management tools.'
      }
    }
  }
};

export const FeedbackForm: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI Feedback Dashboard focused on the feedback submission form interface.'
      }
    }
  }
};

export const AnalyticsView: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI Feedback Dashboard showing analytics and insights from collected feedback data.'
      }
    }
  }
};

export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI Feedback Dashboard in loading state while fetching feedback data.'
      }
    }
  }
};