import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FreeTierGate } from './FreeTierGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const meta: Meta<typeof FreeTierGate> = {
  title: 'Core/FreeTierGate',
  component: FreeTierGate,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Access control component that shows premium content gates for free tier users with upgrade prompts and usage tracking.',
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-2xl mx-auto p-6">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    termId: {
      control: 'text',
      description: 'ID of the term being accessed',
    },
    showPreview: {
      control: 'boolean',
      description: 'Whether to show a preview of the content',
    },
    previewLength: {
      control: 'number',
      description: 'Number of characters to show in preview',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FreeTierGate>;

// Sample content for testing
const sampleContent = (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Machine Learning</h2>
    <p>
      Machine Learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.
    </p>
    <p>
      The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide. The primary aim is to allow the computers to learn automatically without human intervention or assistance and adjust actions accordingly.
    </p>
    <h3 className="text-xl font-semibold">Key Characteristics</h3>
    <ul className="list-disc list-inside space-y-2">
      <li>Pattern Recognition: Ability to identify patterns in data</li>
      <li>Automated Learning: Systems improve performance automatically</li>
      <li>Data-Driven: Decisions based on data rather than pre-programmed rules</li>
      <li>Predictive Capability: Can make predictions about future data</li>
    </ul>
  </div>
);

// Mock the useTermAccess hook
const mockUseTermAccess = (canAccess: boolean, accessStatus: any) => ({
  canViewTerm: canAccess,
  isLoading: false,
  accessStatus,
});

export const Default: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    showPreview: true,
    previewLength: 200,
  },
  decorators: [
    (Story) => {
      // Mock no access
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(false, {
          subscriptionTier: 'free',
          remainingViews: 35,
          dailyLimit: 50,
          lifetimeAccess: false
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Default free tier gate with preview and upgrade prompt.',
      },
    },
  },
};

export const WithAccess: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    showPreview: true,
  },
  decorators: [
    (Story) => {
      // Mock with access
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(true, {
          subscriptionTier: 'premium',
          lifetimeAccess: true
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'When user has access, content is shown directly without gate.',
      },
    },
  },
};

export const DailyLimitReached: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    showPreview: true,
  },
  decorators: [
    (Story) => {
      // Mock daily limit reached
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(false, {
          subscriptionTier: 'free',
          remainingViews: 0,
          dailyLimit: 50,
          lifetimeAccess: false
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Gate when user has reached their daily limit of free views.',
      },
    },
  },
};

export const LowRemainingViews: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    showPreview: true,
  },
  decorators: [
    (Story) => {
      // Mock low remaining views
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(false, {
          subscriptionTier: 'free',
          remainingViews: 3,
          dailyLimit: 50,
          lifetimeAccess: false
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Gate when user has only a few views remaining for the day.',
      },
    },
  },
};

export const NoPreview: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    showPreview: false,
  },
  decorators: [
    (Story) => {
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(false, {
          subscriptionTier: 'free',
          remainingViews: 25,
          dailyLimit: 50,
          lifetimeAccess: false
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Gate without content preview, showing only the upgrade prompt.',
      },
    },
  },
};

export const CustomFallback: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    fallback: (
      <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Custom Access Message</h3>
        <p className="text-yellow-700 mb-4">
          This content requires special access. Please contact support for more information.
        </p>
        <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
          Contact Support
        </button>
      </div>
    ),
  },
  decorators: [
    (Story) => {
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(false, {
          subscriptionTier: 'free',
          remainingViews: 25,
          dailyLimit: 50,
          lifetimeAccess: false
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Gate with custom fallback content instead of the default upgrade prompt.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    showPreview: true,
  },
  decorators: [
    (Story) => {
      // Mock loading state
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => ({
          canViewTerm: false,
          isLoading: true,
          accessStatus: null
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Loading state while checking user access permissions.',
      },
    },
  },
};

export const ShortContent: Story = {
  args: {
    termId: 'short-term',
    children: (
      <div>
        <h2 className="text-xl font-bold">Short Term</h2>
        <p>This is a short definition.</p>
      </div>
    ),
    showPreview: true,
    previewLength: 200,
  },
  decorators: [
    (Story) => {
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(false, {
          subscriptionTier: 'free',
          remainingViews: 25,
          dailyLimit: 50,
          lifetimeAccess: false
        })
      }));
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Gate with short content that doesn\'t exceed the preview length.',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    termId: 'ml-basics',
    children: sampleContent,
    showPreview: true,
  },
  decorators: [
    (Story) => {
      jest.doMock('../hooks/useAccess', () => ({
        useTermAccess: () => mockUseTermAccess(false, {
          subscriptionTier: 'free',
          remainingViews: 15,
          dailyLimit: 50,
          lifetimeAccess: false
        })
      }));
      return (
        <div className="max-w-sm mx-auto p-4">
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Gate optimized for mobile viewing with responsive design.',
      },
    },
  },
};