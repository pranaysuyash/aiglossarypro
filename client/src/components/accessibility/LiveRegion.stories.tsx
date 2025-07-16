import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
    level: 'polite',
  },
  argTypes: {
    message: {
      control: { type: 'text' },
      description: 'The message to announce to screen readers',
    },
    level: {
      control: { type: 'select' },
      options: ['polite', 'assertive', 'off'],
      description: 'How urgently the message should be announced',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'This is a polite announcement',
    level: 'polite',
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
    level: 'assertive',
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
    level: 'polite',
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
    level: 'polite',
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
    const [messageLevel, setMessageLevel] = React.useState<'polite' | 'assertive'>('polite');

    const announcements = [
      { id: 'form-saved', text: 'Form saved successfully', level: 'polite' as const },
      { id: 'message-received', text: 'New message received', level: 'polite' as const },
      { id: 'form-error', text: 'Error: Please fix the form', level: 'assertive' as const },
      { id: 'connection-lost', text: 'Connection lost', level: 'assertive' as const },
      { id: 'page-loaded', text: 'Page loaded', level: 'polite' as const },
      { id: 'search-complete', text: 'Search completed', level: 'polite' as const },
    ];

    const handleAnnouncement = (message: string, level: 'polite' | 'assertive') => {
      setCurrentMessage(message);
      setMessageLevel(level);
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
          {announcements.map(announcement => (
            <Button
              key={announcement.id}
              variant={announcement.level === 'assertive' ? 'destructive' : 'outline'}
              onClick={() => handleAnnouncement(announcement.text, announcement.level)}
              className="justify-start text-left"
            >
              <span className="flex flex-col items-start">
                <span>{announcement.text}</span>
                <span className="text-xs opacity-60">({announcement.level})</span>
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
              <strong>Level:</strong> {messageLevel}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            <strong>Note:</strong> The live region is visually hidden but accessible to screen
            readers.
          </p>
        </div>

        <LiveRegion message={currentMessage} level={messageLevel} />
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
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
            This form demonstrates how to use live regions for form validation feedback.
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
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <div id="name-error" className="text-red-600 text-sm mt-1">
                {errors.name}
              </div>
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
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <div id="email-error" className="text-red-600 text-sm mt-1">
                {errors.email}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>

        <div className="text-xs text-gray-500">
          <p>
            <strong>Accessibility:</strong> Form errors are announced assertively, while success
            messages are announced politely.
          </p>
        </div>

        {/* Live regions for form feedback */}
        <LiveRegion message={errorMessage} level="assertive" />
        <LiveRegion message={successMessage} level="polite" />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Form validation example showing how to announce errors and success messages.',
      },
    },
  },
};

export const LoadingStates: Story = {
  render: () => {
    const [loadingState, setLoadingState] = React.useState<
      'idle' | 'loading' | 'success' | 'error'
    >('idle');
    const [currentMessage, setCurrentMessage] = React.useState('');

    const simulateProcess = async () => {
      setLoadingState('loading');
      setCurrentMessage('Loading data...');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Randomly succeed or fail
      const success = Math.random() > 0.3;

      if (success) {
        setLoadingState('success');
        setCurrentMessage('Data loaded successfully!');
      } else {
        setLoadingState('error');
        setCurrentMessage('Failed to load data. Please try again.');
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setLoadingState('idle');
        setCurrentMessage('');
      }, 3000);
    };

    const getMessageLevel = (): 'polite' | 'assertive' => {
      return loadingState === 'error' ? 'assertive' : 'polite';
    };

    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Loading State Announcements</h3>
          <p className="text-sm text-gray-600">
            This example shows how to announce loading states to screen readers.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={simulateProcess}
            disabled={loadingState === 'loading'}
            className="w-full"
            variant={loadingState === 'error' ? 'destructive' : 'default'}
          >
            {loadingState === 'loading' ? 'Loading...' : 'Load Data'}
          </Button>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Current State:</h4>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Status:</strong> {loadingState}
              </p>
              <p>
                <strong>Message:</strong> {currentMessage || 'None'}
              </p>
              <p>
                <strong>Level:</strong> {getMessageLevel()}
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            <strong>Pattern:</strong> Loading and success states use polite announcements, while
            errors use assertive announcements.
          </p>
        </div>

        <LiveRegion message={currentMessage} level={getMessageLevel()} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state example showing different announcement priorities.',
      },
    },
  },
};

export const MultipleRegions: Story = {
  render: () => {
    const [statusMessage, setStatusMessage] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');
    const [infoMessage, setInfoMessage] = React.useState('');

    const showStatus = () => {
      setStatusMessage('Status updated');
      setTimeout(() => setStatusMessage(''), 3000);
    };

    const showError = () => {
      setErrorMessage('An error occurred');
      setTimeout(() => setErrorMessage(''), 3000);
    };

    const showInfo = () => {
      setInfoMessage('Information message');
      setTimeout(() => setInfoMessage(''), 3000);
    };

    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Multiple Live Regions</h3>
          <p className="text-sm text-gray-600">
            This example shows how to use multiple live regions for different types of messages.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={showStatus} variant="outline" className="w-full">
            Show Status (Polite)
          </Button>

          <Button onClick={showError} variant="destructive" className="w-full">
            Show Error (Assertive)
          </Button>

          <Button onClick={showInfo} variant="secondary" className="w-full">
            Show Info (Off)
          </Button>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Active Messages:</h4>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Status:</strong> {statusMessage || 'None'}
            </p>
            <p>
              <strong>Error:</strong> {errorMessage || 'None'}
            </p>
            <p>
              <strong>Info:</strong> {infoMessage || 'None'}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            <strong>Best Practice:</strong> Use separate live regions for different types of
            messages to avoid conflicts.
          </p>
        </div>

        {/* Multiple live regions for different message types */}
        <LiveRegion message={statusMessage} level="polite" />
        <LiveRegion message={errorMessage} level="assertive" />
        <LiveRegion message={infoMessage} level="off" />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple live regions for different message types.',
      },
    },
  },
};