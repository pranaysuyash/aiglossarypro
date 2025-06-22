import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Router } from 'wouter';
import { Toaster } from '../client/src/components/ui/toaster';
import '../client/src/index.css'; // Import our Tailwind CSS

// Mock user data for Storybook
const mockUser = {
  id: 'storybook-user',
  email: 'storybook@example.com',
  name: 'Storybook User',
  isAdmin: false,
};

// Create a query client for Storybook with mock data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 300000,
      // Mock query function for Storybook
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        
        // Mock auth endpoint
        if (url.includes('/api/auth/user')) {
          return mockUser;
        }
        
        // Mock other endpoints as needed
        if (url.includes('/api/favorites')) {
          return [];
        }
        
        // Default mock response
        return null;
      },
    },
    mutations: {
      retry: false,
      // Mock mutation function for Storybook
      mutationFn: async () => {
        // Mock successful mutation
        return { success: true };
      },
    },
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story) => (
      <Router>
        <QueryClientProvider client={queryClient}>
          <Story />
          <Toaster />
        </QueryClientProvider>
      </Router>
    ),
  ],
};

export default preview;