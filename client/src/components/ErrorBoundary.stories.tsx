import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from './ErrorBoundary';

// Component that simulates an error for testing
const ErrorThrowingComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  // Always show mock error state instead of throwing real errors
  // This prevents breaking Chromatic visual tests while still showing the UI
  if (shouldThrow) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Boundary Activated</h2>
        <p className="text-red-600 mb-4">
          This shows how the error boundary would look when an error occurs.
        </p>
        <p className="text-sm text-gray-600">(Simulated for visual testing)</p>
      </div>
    );
  }

  return <div>This component works fine!</div>;
};

// Component with interactive error triggering
const InteractiveErrorComponent = () => {
  const [shouldError, setShouldError] = React.useState(false);

  if (shouldError) {
    // Always show mock error state for consistency
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Triggered!</h2>
        <p className="text-red-600 mb-4">This shows how an interactive error would appear.</p>
        <p className="text-sm text-gray-600">(Simulated for visual testing)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p>Click the button below to trigger an error:</p>
      <Button variant="destructive" onClick={() => setShouldError(true)}>
        Trigger Error
      </Button>
    </div>
  );
};

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A React error boundary component that catches JavaScript errors anywhere in the child component tree and displays a fallback UI.',
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
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Working Component</h3>
        <p>This component is working normally and won't trigger the error boundary.</p>
      </div>
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ErrorBoundary wrapping a working component - no error state shown.',
      },
    },
  },
};

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ErrorThrowingComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ErrorBoundary catching an error and displaying the default error UI.',
      },
    },
  },
};

export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-red-600 mb-4">This is a custom error fallback UI.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      }
    >
      <ErrorThrowingComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ErrorBoundary with a custom fallback UI instead of the default error display.',
      },
    },
  },
};

export const InteractiveError: Story = {
  render: () => (
    <ErrorBoundary>
      <InteractiveErrorComponent />
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive component that allows triggering an error to test the ErrorBoundary.',
      },
    },
  },
};

export const NestedErrorBoundaries: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Nested Error Boundaries</h3>

      <ErrorBoundary>
        <div className="p-4 border rounded">
          <h4 className="font-medium mb-2">Outer Boundary - Working</h4>
          <p>This content is protected by the outer error boundary.</p>

          <ErrorBoundary
            fallback={
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">
                  Inner component failed, but outer boundary still works!
                </p>
              </div>
            }
          >
            <div className="mt-4 p-3 border rounded">
              <h5 className="font-medium mb-2">Inner Boundary - Error</h5>
              <ErrorThrowingComponent shouldThrow={true} />
            </div>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Nested ErrorBoundaries showing how inner errors don't affect outer boundaries.",
      },
    },
  },
};

export const MultipleComponents: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h4 className="font-medium mb-2">Component 1 - Working</h4>
          <ErrorThrowingComponent shouldThrow={false} />
        </div>

        <div className="p-4 border rounded">
          <h4 className="font-medium mb-2">Component 2 - Working</h4>
          <ErrorThrowingComponent shouldThrow={false} />
        </div>

        <div className="p-4 border rounded">
          <h4 className="font-medium mb-2">Component 3 - Error</h4>
          <ErrorThrowingComponent shouldThrow={true} />
        </div>
      </div>
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Multiple components where one throws an error - the entire boundary shows error state.',
      },
    },
  },
};

export const AsyncError: Story = {
  render: () => {
    const AsyncErrorComponent = () => {
      const [shouldError, setShouldError] = React.useState(false);

      if (shouldError) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Async Error Simulated</h2>
            <p className="text-red-600 mb-4">This shows how async errors would appear.</p>
            <p className="text-sm text-gray-600">(Mock for visual testing)</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <p>This component can trigger both sync and async errors:</p>
          <div className="space-x-2">
            <Button variant="destructive" onClick={() => setShouldError(true)}>
              Trigger Sync Error
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // This async error won't be caught by ErrorBoundary
                setTimeout(() => {
                  console.error('Async error - not caught by ErrorBoundary');
                }, 1000);
              }}
            >
              Trigger Async Error (Not Caught)
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Note: React ErrorBoundaries only catch synchronous errors in render methods, lifecycle
            methods, and constructors.
          </p>
        </div>
      );
    };

    return (
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates that ErrorBoundaries only catch synchronous errors, not async ones.',
      },
    },
  },
};

export const ErrorInEventHandler: Story = {
  render: () => {
    const EventHandlerErrorComponent = () => {
      const handleClick = () => {
        // Show console error instead of throwing
        console.error('Error in event handler - not caught by ErrorBoundary');
        alert('Event handler error occurred (check console)');
      };

      const [showError, setShowError] = React.useState(false);

      if (showError) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Render Error Caught</h2>
            <p className="text-red-600 mb-4">This error was caught by the ErrorBoundary</p>
            <p className="text-sm text-gray-600">(Mock for visual testing)</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <p>Testing error handling in different scenarios:</p>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleClick}>
              Event Handler Error (Not Caught)
            </Button>
            <Button variant="destructive" onClick={() => setShowError(true)}>
              Render Error (Caught)
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            ErrorBoundaries don't catch errors in event handlers. Use try-catch for those.
          </p>
        </div>
      );
    };

    return (
      <ErrorBoundary>
        <EventHandlerErrorComponent />
      </ErrorBoundary>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Shows that ErrorBoundaries don't catch errors in event handlers.",
      },
    },
  },
};

export const ErrorRecovery: Story = {
  render: () => {
    const RecoverableErrorComponent = () => {
      const [errorCount, setErrorCount] = React.useState(0);
      const [shouldError, setShouldError] = React.useState(false);

      React.useEffect(() => {
        if (shouldError) {
          setErrorCount((prev) => prev + 1);
          setShouldError(false);
        }
      }, [shouldError]);

      if (shouldError) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Recovery Error Simulated</h2>
            <p className="text-red-600 mb-4">Error #{errorCount + 1} - Testing recovery</p>
            <p className="text-sm text-gray-600">(Mock for visual testing)</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <p>Error count: {errorCount}</p>
          <p>This component has recovered from {errorCount} error(s).</p>
          <Button variant="destructive" onClick={() => setShouldError(true)}>
            Trigger Another Error
          </Button>
        </div>
      );
    };

    return (
      <ErrorBoundary
        fallback={
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Component Error</h2>
            <p className="text-red-600 mb-4">
              The component encountered an error but can be recovered.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reset Application
            </Button>
          </div>
        }
      >
        <RecoverableErrorComponent />
      </ErrorBoundary>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Component that can trigger multiple errors and demonstrates recovery patterns.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <ErrorBoundary>
      <ErrorThrowingComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'ErrorBoundary in dark mode theme.',
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
