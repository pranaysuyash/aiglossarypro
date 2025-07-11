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
        { month: 'Jan', desktop: 186, mobile: 80 },
        { month: 'Feb', desktop: 305, mobile: 200 },
        { month: 'Mar', desktop: 237, mobile: 120 },
        { month: 'Apr', desktop: 73, mobile: 190 },
        { month: 'May', desktop: 209, mobile: 130 },
        { month: 'Jun', desktop: 214, mobile: 140 },
      ]}
      index="month"
      categories={['desktop', 'mobile']}
      colors={['#8884d8', '#82ca9d']}
      yAxisWidth={48}
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
    <BarChart
      data={[]}
      index="month"
      categories={['desktop', 'mobile']}
      colors={['#8884d8', '#82ca9d']}
      yAxisWidth={48}
      loading
    />
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
    <BarChart
      data={[]}
      index="month"
      categories={['desktop', 'mobile']}
      colors={['#8884d8', '#82ca9d']}
      yAxisWidth={48}
      error="Something went wrong"
    />
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
          { month: 'Jan', desktop: 186, mobile: 80 },
          { month: 'Feb', desktop: 305, mobile: 200 },
          { month: 'Mar', desktop: 237, mobile: 120 },
        ]}
        index="month"
        categories={['desktop', 'mobile']}
        colors={['#8884d8', '#82ca9d']}
        yAxisWidth={48}
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
          { month: 'Jan', desktop: 186 },
          { month: 'Feb', desktop: 305 },
          { month: 'Mar', desktop: 237 },
        ]}
        index="month"
        categories={['desktop']}
        colors={['#8884d8']}
        yAxisWidth={48}
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
          { month: 'Jan', desktop: 186, mobile: 80, tablet: 120 },
          { month: 'Feb', desktop: 305, mobile: 200, tablet: 150 },
          { month: 'Mar', desktop: 237, mobile: 120, tablet: 90 },
          { month: 'Apr', desktop: 73, mobile: 190, tablet: 110 },
          { month: 'May', desktop: 209, mobile: 130, tablet: 160 },
          { month: 'Jun', desktop: 214, mobile: 140, tablet: 180 },
          { month: 'Jul', desktop: 155, mobile: 160, tablet: 140 },
          { month: 'Aug', desktop: 280, mobile: 180, tablet: 200 },
        ]}
        index="month"
        categories={['desktop', 'mobile', 'tablet']}
        colors={['#8884d8', '#82ca9d', '#ffc658']}
        yAxisWidth={48}
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
