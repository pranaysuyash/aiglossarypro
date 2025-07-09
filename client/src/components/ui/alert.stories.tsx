import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A prominent notice that draws attention to important information or actions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
      description: 'The visual style variant of the alert',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This is a general informational alert message.</AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default alert with info icon, title, and description.',
      },
    },
  },
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Something went wrong. Please try again or contact support.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Destructive alert for errors and critical warnings.',
      },
    },
  },
};

export const Success: Story = {
  render: () => (
    <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Your action was completed successfully!</AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Success alert with custom styling for positive feedback.',
      },
    },
  },
};

export const Warning: Story = {
  render: () => (
    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>Please review your input before proceeding.</AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning alert with custom styling for cautionary messages.',
      },
    },
  },
};

export const WithoutIcon: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Simple Alert</AlertTitle>
      <AlertDescription>
        This alert doesn't have an icon, just the title and description.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert without an icon, showing just title and description.',
      },
    },
  },
};

export const OnlyDescription: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>This alert has only a description without a title.</AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert with only description text and an icon.',
      },
    },
  },
};

export const OnlyTitle: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Important Notice</AlertTitle>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert with only a title and an icon.',
      },
    },
  },
};

export const LongContent: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Detailed Information</AlertTitle>
      <AlertDescription>
        This is a longer alert description that contains multiple lines of text to demonstrate how
        the alert component handles longer content. It includes detailed explanations and multiple
        sentences to show proper text wrapping and spacing. The alert should maintain its visual
        hierarchy and readability even with extended content.
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert with longer content to test text wrapping and spacing.',
      },
    },
  },
};

export const WithActions: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Update Available</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>A new version of the application is available.</p>
        <div className="flex space-x-2">
          <button className="text-sm font-medium underline">Update now</button>
          <button className="text-sm font-medium underline">Remind me later</button>
        </div>
      </AlertDescription>
    </Alert>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Alert with actionable buttons embedded in the description.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is the default alert variant.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>This is the destructive alert variant.</AlertDescription>
      </Alert>

      <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Success Alert</AlertTitle>
        <AlertDescription>This is a custom success alert.</AlertDescription>
      </Alert>

      <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning Alert</AlertTitle>
        <AlertDescription>This is a custom warning alert.</AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All alert variants displayed together for comparison.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Default in Dark Mode</AlertTitle>
        <AlertDescription>This shows how the default alert appears in dark mode.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Destructive in Dark Mode</AlertTitle>
        <AlertDescription>
          This shows how the destructive alert appears in dark mode.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Alert components in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl dark">
        <Story />
      </div>
    ),
  ],
};
