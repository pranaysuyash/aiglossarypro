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
        smallMobile: {
          name: 'Small Mobile (320px)',
          styles: {
            width: '320px',
            height: '568px',
          },
        },
        mobile: {
          name: 'Mobile (375px)',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        largeMobile: {
          name: 'Large Mobile (414px)',
          styles: {
            width: '414px',
            height: '896px',
          },
        },
        smallTablet: {
          name: 'Small Tablet (640px)',
          styles: {
            width: '640px',
            height: '960px',
          },
        },
        tablet: {
          name: 'Tablet (768px)',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        largeTablet: {
          name: 'Large Tablet (1024px)',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        smallDesktop: {
          name: 'Small Desktop (1280px)',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
        desktop: {
          name: 'Desktop (1440px)',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
        largeDesktop: {
          name: 'Large Desktop (1920px)',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
        ultrawide: {
          name: 'Ultrawide (2560px)',
          styles: {
            width: '2560px',
            height: '1440px',
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