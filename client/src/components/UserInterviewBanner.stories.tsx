import type { Meta, StoryObj } from '@storybook/react';
import { UserInterviewBanner } from './UserInterviewBanner';

const meta: Meta<typeof UserInterviewBanner> = {
  title: 'Components/UserInterviewBanner',
  component: UserInterviewBanner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'User research recruitment banner that appears to 1 in 10 new users, offering $20 voucher for 20-minute interview',
      },
    },
  },
  argTypes: {
    onAccept: { action: 'interview accepted' },
    onDecline: { action: 'interview declined' },
  },
  decorators: [
    Story => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Glossary Pro</h1>
          <p className="text-gray-600 dark:text-gray-400">
            The user interview banner will appear in the bottom-right corner after a few seconds.
          </p>

          {/* Sample content */}
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Term {i + 1}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                This is a sample AI/ML term definition that demonstrates the content structure. The
                interview banner should appear for eligible users.
              </p>
            </div>
          ))}
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserInterviewBanner>;

export const Default: Story = {
  args: {
    showOnlyForNewUsers: false, // Show immediately for demo
  },
  beforeEach: () => {
    // Clear any existing interview status
    localStorage.removeItem('interview_declined');
    localStorage.removeItem('interview_accepted');
    localStorage.setItem('interview_eligible', 'true');
  },
};

export const NewUserFlow: Story = {
  args: {
    showOnlyForNewUsers: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Banner appears after 5 seconds for new users (simulated)',
      },
    },
  },
  beforeEach: () => {
    localStorage.removeItem('interview_declined');
    localStorage.removeItem('interview_accepted');
    localStorage.setItem('interview_eligible', 'true');
  },
};

export const IneligibleUser: Story = {
  args: {
    showOnlyForNewUsers: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'User not selected for interview (90% of users) - banner should not appear',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('interview_eligible', 'false');
  },
};

export const AlreadyDeclined: Story = {
  args: {
    showOnlyForNewUsers: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'User who previously declined the interview - banner should not appear',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('interview_eligible', 'true');
    localStorage.setItem('interview_declined', 'true');
  },
};

export const AlreadyAccepted: Story = {
  args: {
    showOnlyForNewUsers: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'User who already accepted the interview - banner should not appear',
      },
    },
  },
  beforeEach: () => {
    localStorage.setItem('interview_eligible', 'true');
    localStorage.setItem('interview_accepted', 'true');
  },
};

export const MobileView: Story = {
  args: {
    showOnlyForNewUsers: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  beforeEach: () => {
    localStorage.removeItem('interview_declined');
    localStorage.removeItem('interview_accepted');
    localStorage.setItem('interview_eligible', 'true');
  },
};

export const TabletView: Story = {
  args: {
    showOnlyForNewUsers: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  beforeEach: () => {
    localStorage.removeItem('interview_declined');
    localStorage.removeItem('interview_accepted');
    localStorage.setItem('interview_eligible', 'true');
  },
};

export const DarkMode: Story = {
  args: {
    showOnlyForNewUsers: false,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  beforeEach: () => {
    localStorage.removeItem('interview_declined');
    localStorage.removeItem('interview_accepted');
    localStorage.setItem('interview_eligible', 'true');
  },
};

export const InteractiveDemo: Story = {
  args: {
    showOnlyForNewUsers: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo - try clicking the different buttons to see the responses',
      },
    },
  },
  beforeEach: () => {
    localStorage.removeItem('interview_declined');
    localStorage.removeItem('interview_accepted');
    localStorage.setItem('interview_eligible', 'true');
  },
};
