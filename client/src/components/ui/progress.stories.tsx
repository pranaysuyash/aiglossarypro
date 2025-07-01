import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A visual indicator showing completion progress of a task, often displayed as a progress bar.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'The progress value (0-100)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
    'aria-label': 'Progress indicator',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default progress bar at 50% completion.',
      },
    },
  },
};

export const Zero: Story = {
  args: {
    value: 0,
    'aria-label': 'No progress',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress bar at 0% (no progress).',
      },
    },
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    'aria-label': 'Complete',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress bar at 100% (complete).',
      },
    },
  },
};

export const DifferentValues: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>25% Complete</span>
          <span>25/100</span>
        </div>
        <Progress value={25} aria-label="25% complete" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>50% Complete</span>
          <span>50/100</span>
        </div>
        <Progress value={50} aria-label="50% complete" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>75% Complete</span>
          <span>75/100</span>
        </div>
        <Progress value={75} aria-label="75% complete" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>90% Complete</span>
          <span>90/100</span>
        </div>
        <Progress value={90} aria-label="90% complete" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress bars showing different completion percentages with labels.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <label htmlFor="file-progress" className="text-sm font-medium">
        File Upload Progress
      </label>
      <Progress 
        id="file-progress"
        value={67} 
        aria-label="File upload progress: 67% complete"
      />
      <p className="text-xs text-gray-600">67% of 5 files uploaded</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress bar with descriptive labels and context.',
      },
    },
  },
};

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Success (Green)</p>
        <Progress 
          value={80} 
          className="[&>div]:bg-green-500"
          aria-label="Success progress"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Warning (Yellow)</p>
        <Progress 
          value={60} 
          className="[&>div]:bg-yellow-500"
          aria-label="Warning progress"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Error (Red)</p>
        <Progress 
          value={30} 
          className="[&>div]:bg-red-500"
          aria-label="Error progress"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Info (Blue)</p>
        <Progress 
          value={45} 
          className="[&>div]:bg-blue-500"
          aria-label="Info progress"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress bars with different color schemes for various states.',
      },
    },
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Small (h-2)</p>
        <Progress value={60} className="h-2" aria-label="Small progress bar" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Default (h-4)</p>
        <Progress value={60} aria-label="Default progress bar" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Large (h-6)</p>
        <Progress value={60} className="h-6" aria-label="Large progress bar" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Extra Large (h-8)</p>
        <Progress value={60} className="h-8" aria-label="Extra large progress bar" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress bars in different heights.',
      },
    },
  },
};

export const Animated: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0);
    
    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          const newProgress = oldProgress + 1;
          if (newProgress >= 100) {
            return 0; // Reset to 0 when it reaches 100
          }
          return newProgress;
        });
      }, 100);
      
      return () => clearInterval(timer);
    }, []);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Animated Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} aria-label={`Animated progress: ${progress}% complete`} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Animated progress bar that continuously updates its value.',
      },
    },
  },
};

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Downloading... (45%)</p>
        <Progress value={45} aria-label="Download progress: 45%" />
        <p className="text-xs text-gray-600">2.3 MB of 5.1 MB</p>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Installing... (78%)</p>
        <Progress 
          value={78} 
          className="[&>div]:bg-blue-500"
          aria-label="Installation progress: 78%"
        />
        <p className="text-xs text-gray-600">Installing dependencies...</p>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Processing... (12%)</p>
        <Progress 
          value={12} 
          className="[&>div]:bg-orange-500"
          aria-label="Processing progress: 12%"
        />
        <p className="text-xs text-gray-600">Analyzing data...</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress bars representing different loading states with context.',
      },
    },
  },
};

export const Indeterminate: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Loading...</p>
        <div className="relative">
          <Progress value={0} className="bg-gray-200" aria-label="Loading" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        </div>
        <p className="text-xs text-gray-600">Please wait...</p>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Processing...</p>
        <div className="relative overflow-hidden">
          <Progress value={0} className="bg-gray-200" aria-label="Processing" />
          <div 
            className="absolute inset-y-0 left-0 w-1/3 bg-primary opacity-75 animate-pulse"
            style={{
              animation: 'slide 2s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-xs text-gray-600">Working on it...</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Indeterminate progress indicators for unknown duration tasks.',
      },
    },
  },
};

export const SkillLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">JavaScript</span>
          <span className="text-sm text-gray-600">Expert</span>
        </div>
        <Progress value={90} className="[&>div]:bg-green-500" aria-label="JavaScript skill: Expert level" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">React</span>
          <span className="text-sm text-gray-600">Advanced</span>
        </div>
        <Progress value={80} className="[&>div]:bg-blue-500" aria-label="React skill: Advanced level" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Python</span>
          <span className="text-sm text-gray-600">Intermediate</span>
        </div>
        <Progress value={60} className="[&>div]:bg-yellow-500" aria-label="Python skill: Intermediate level" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Go</span>
          <span className="text-sm text-gray-600">Beginner</span>
        </div>
        <Progress value={25} className="[&>div]:bg-orange-500" aria-label="Go skill: Beginner level" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress bars representing skill levels or proficiency ratings.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Default Progress</p>
        <Progress value={65} aria-label="Default progress in dark mode" />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Success Progress</p>
        <Progress 
          value={80} 
          className="[&>div]:bg-green-400"
          aria-label="Success progress in dark mode"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Upload Progress</span>
          <span>45%</span>
        </div>
        <Progress value={45} aria-label="Upload progress: 45%" />
        <p className="text-xs text-gray-400">Uploading file...</p>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Progress bars in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-4 dark">
        <Story />
      </div>
    ),
  ],
};
