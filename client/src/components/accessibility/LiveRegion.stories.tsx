import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { LiveRegion, useLiveRegion } from './LiveRegion';

const meta: Meta<typeof LiveRegion> = {
  title: 'Accessibility/LiveRegion',
  component: LiveRegion,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A component that announces messages to screen readers using ARIA live regions. Essential for accessibility when content changes dynamically.',
      },
    },
  },
  args: {
    message: '',
    priority: 'polite',
    clearAfter: 5000,
  },
  argTypes: {
    message: {
      control: { type: 'text' },
      description: 'The message to announce to screen readers',
    },
    priority: {
      control: { type: 'select' },
      options: ['polite', 'assertive'],
      description: 'How urgently the message should be announced',
    },
    clearAfter: {
      control: { type: 'number' },
      description: 'Clear message after X milliseconds (0 to disable)',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'This is a polite announcement',
    priority: 'polite',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default live region with a polite announcement. The message will be read by screen readers.',
      },
    },
  },
};

export const AssertiveMessage: Story = {
  args: {
    message: 'Important: This is an urgent announcement!',
    priority: 'assertive',
  },
  parameters: {
    docs: {
      description: {
        story: 'Assertive live region for urgent messages that interrupt the screen reader.',
      },
    },
  },
};

export const PersistentMessage: Story = {
  args: {
    message: 'This message will not clear automatically',
    priority: 'polite',
    clearAfter: 0, // Disable auto-clear
  },
  parameters: {
    docs: {
      description: {
        story: 'Live region with persistent message that does not clear automatically.',
      },
    },
  },
};

export const QuickClearMessage: Story = {
  args: {
    message: 'This message clears quickly',
    priority: 'polite',
    clearAfter: 2000, // Clear after 2 seconds
  },
  parameters: {
    docs: {
      description: {
        story: 'Live region that clears the message after 2 seconds.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [currentMessage, setCurrentMessage] = React.useState('');
    const [messagePriority, setMessagePriority] = React.useState<'polite' | 'assertive'>('polite');

    const announcements = [
      { text: 'Form saved successfully', priority: 'polite' as const },
      { text: 'New message received', priority: 'polite' as const },
      { text: 'Error: Please fix the form', priority: 'assertive' as const },
      { text: 'Connection lost', priority: 'assertive' as const },
      { text: 'Page loaded', priority: 'polite' as const },
      { text: 'Search completed', priority: 'polite' as const },
    ];

    const handleAnnouncement = (message: string, priority: 'polite' | 'assertive') => {
      setCurrentMessage(message);
      setMessagePriority(priority);
    };

    return (
      <div className="space-y-6 w-full max-w-2xl">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Live Region Announcements</h3>
          <p className="text-sm text-gray-600">
            Click the buttons below to test different announcements. Use a screen reader to hear the
            announcements, or check the browser's accessibility inspector to see the live region
            updates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {announcements.map((announcement, index) => (
            <Button
              key={index}
              variant={announcement.priority === 'assertive' ? 'destructive' : 'outline'}
              onClick={() => handleAnnouncement(announcement.text, announcement.priority)}
              className="justify-start text-left"
            >
              <span className="flex flex-col items-start">
                <span>{announcement.text}</span>
                <span className="text-xs opacity-60">({announcement.priority})</span>
              </span>
            </Button>
          ))}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Current Live Region State:</h4>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Message:</strong> {currentMessage || 'None'}
            </p>
            <p>
              <strong>Priority:</strong> {messagePriority}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            <strong>Note:</strong> The live region is visually hidden but accessible to screen
            readers.
          </p>
        </div>

        <LiveRegion message={currentMessage} priority={messagePriority} clearAfter={5000} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing different types of announcements for screen readers.',
      },
    },
  },
};

export const WithCustomHook: Story = {
  render: () => {
    const { announce } = useLiveRegion();

    const handleFormSubmit = () => {
      // Simulate form submission
      setTimeout(() => {
        announce('Form submitted successfully!', 'polite');
      }, 1000);
    };

    const handleError = () => {
      announce('Error: Please check your input!', 'assertive');
    };

    const handleUpdate = () => {
      announce('Content updated', 'polite');
    };

    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Using the useLiveRegion Hook</h3>
          <p className="text-sm text-gray-600">
            This example uses the useLiveRegion hook to create temporary announcements.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleFormSubmit} className="w-full">
            Submit Form (Polite)
          </Button>

          <Button onClick={handleError} variant="destructive" className="w-full">
            Trigger Error (Assertive)
          </Button>

          <Button onClick={handleUpdate} variant="outline" className="w-full">
            Update Content (Polite)
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            <strong>Hook Usage:</strong> The useLiveRegion hook creates temporary live regions that
            are automatically cleaned up after the announcement.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example using the useLiveRegion hook for programmatic announcements.',
      },
    },
  },
};

export const FormFeedback: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({ email: '', name: '' });
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};

      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }

      if (!formData.name) {
        newErrors.name = 'Name is required';
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length === 0) {
        setSuccessMessage('Form submitted successfully!');
        setFormData({ email: '', name: '' });
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    };

    const errorMessage = Object.values(errors).join('. ');

    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Form with Live Region Feedback</h3>
          <p className="text-sm text-gray-600">
            This form uses live regions to announce validation errors and success messages.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-red-600 text-sm mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-red-600 text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>

        {/* Live Regions for Announcements */}
        <LiveRegion
          message={errorMessage}
          priority="assertive"
          clearAfter={0} // Don't auto-clear errors
        />

        <LiveRegion message={successMessage} priority="polite" clearAfter={5000} />

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {successMessage}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Practical example of using live regions for form validation feedback.',
      },
    },
  },
};

export const StatusUpdates: Story = {
  render: () => {
    const [status, setStatus] = React.useState<string>('');
    const [progress, setProgress] = React.useState(0);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const simulateProcess = async () => {
      setIsProcessing(true);
      setProgress(0);
      setStatus('Starting process...');

      const steps = [
        'Initializing...',
        'Loading data...',
        'Processing information...',
        'Validating results...',
        'Finalizing...',
        'Process completed successfully!',
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStatus(steps[i]);
        setProgress(((i + 1) / steps.length) * 100);
      }

      setIsProcessing(false);
    };

    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Process Status Updates</h3>
          <p className="text-sm text-gray-600">
            This example shows how to use live regions for progress updates.
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={simulateProcess} disabled={isProcessing} className="w-full">
            {isProcessing ? 'Processing...' : 'Start Process'}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center">{Math.round(progress)}% complete</p>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded text-sm min-h-[3rem] flex items-center">
            <strong>Status:</strong>&nbsp;{status || 'Ready to start'}
          </div>
        </div>

        <LiveRegion
          message={status}
          priority="polite"
          clearAfter={0} // Keep status visible
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example of using live regions for process status updates and progress announcements.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    message: 'Dark mode announcement',
    priority: 'polite',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Live region in dark mode (note: the component itself is always hidden visually).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="text-white p-4">
          <p>Live regions work the same in dark mode since they are screen reader only.</p>
          <p className="text-sm text-gray-400 mt-2">
            The live region component is present but visually hidden.
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
};
