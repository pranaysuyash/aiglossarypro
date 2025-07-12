import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BarChart } from './chart';

const meta: Meta<typeof BarChart> = {
  title: 'UI Components/BarChart',
  component: BarChart,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Reusable UI component for the AIGlossaryPro application.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    // Add argTypes based on component props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <BarChart
      data={[
        { name: 'Jan', value: 186 },
        { name: 'Feb', value: 305 },
        { name: 'Mar', value: 237 },
        { name: 'Apr', value: 73 },
        { name: 'May', value: 209 },
        { name: 'Jun', value: 214 },
      ]}
      config={{
        value: {
          label: 'Desktop',
          color: '#8884d8',
        },
      }}
      xAxisKey="name"
      yAxisKey="value"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default BarChart component state.'
      }
    }
  }
};

export const Loading: Story = {
  render: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BarChart in loading state.'
      }
    }
  }
};

export const Error: Story = {
  render: () => (
    <div className="flex items-center justify-center h-48 text-red-500">
      <div className="text-center">
        <div className="text-lg font-semibold">Error</div>
        <div className="text-sm">Something went wrong</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BarChart displaying error state.'
      }
    }
  }
};

export const Disabled: Story = {
  render: () => (
    <div className="opacity-50 pointer-events-none">
      <BarChart
        data={[
          { name: 'Jan', value: 186 },
          { name: 'Feb', value: 305 },
          { name: 'Mar', value: 237 },
        ]}
        config={{
          value: {
            label: 'Desktop',
            color: '#8884d8',
          },
        }}
        xAxisKey="name"
        yAxisKey="value"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'BarChart in disabled state.'
      }
    }
  }
};

export const Small: Story = {
  render: () => (
    <div className="h-64">
      <BarChart
        data={[
          { name: 'Jan', value: 186 },
          { name: 'Feb', value: 305 },
          { name: 'Mar', value: 237 },
        ]}
        config={{
          value: {
            label: 'Desktop',
            color: '#8884d8',
          },
        }}
        xAxisKey="name"
        yAxisKey="value"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Small variant of BarChart.'
      }
    }
  }
};

export const Large: Story = {
  render: () => (
    <div className="h-96">
      <BarChart
        data={[
          { name: 'Jan', value: 186 },
          { name: 'Feb', value: 305 },
          { name: 'Mar', value: 237 },
          { name: 'Apr', value: 73 },
          { name: 'May', value: 209 },
          { name: 'Jun', value: 214 },
          { name: 'Jul', value: 155 },
          { name: 'Aug', value: 280 },
        ]}
        config={{
          value: {
            label: 'Desktop',
            color: '#8884d8',
          },
        }}
        xAxisKey="name"
        yAxisKey="value"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Large variant of BarChart.'
      }
    }
  }
};
