import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SurpriseMe from './SurpriseMe';

// Create a query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const meta: Meta<typeof SurpriseMe> = {
  title: 'Components/SurpriseMe',
  component: SurpriseMe,
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
        component: 'Surprise Me component that provides random term discovery with multiple discovery modes and analytics.'
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
        story: 'Default Surprise Me component with random term discovery functionality.'
      }
    }
  }
};

export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Surprise Me component in loading state while fetching random terms.'
      }
    }
  }
};

export const WithMultipleModes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Surprise Me component showing different discovery modes (Random, Trending, Recommended, etc.).'
      }
    }
  }
};

export const ErrorState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Surprise Me component displaying error state when term fetching fails.'
      }
    }
  }
};

export const WithAnalytics: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Surprise Me component with analytics panel showing discovery statistics and user engagement.'
      }
    }
  }
};