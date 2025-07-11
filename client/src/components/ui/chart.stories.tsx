import type { Meta, StoryObj } from '@storybook/react';
import { BarChart } from './BarChart';

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
  
  parameters: {
    docs: {
      description: {
        story: 'Default BarChart component state.'
      }
    }
  }
};

export const Loading: Story = {
  args: {
  "loading": true,
  "isLoading": true
},
  parameters: {
    docs: {
      description: {
        story: 'BarChart in loading state.'
      }
    }
  }
};

export const Error: Story = {
  args: {
  "error": "Something went wrong",
  "hasError": true
},
  parameters: {
    docs: {
      description: {
        story: 'BarChart displaying error state.'
      }
    }
  }
};

export const Disabled: Story = {
  args: {
  "disabled": true
},
  parameters: {
    docs: {
      description: {
        story: 'BarChart in disabled state.'
      }
    }
  }
};

export const Small: Story = {
  args: {
  "size": "small"
},
  parameters: {
    docs: {
      description: {
        story: 'Small variant of BarChart.'
      }
    }
  }
};

export const Large: Story = {
  args: {
  "size": "large"
},
  parameters: {
    docs: {
      description: {
        story: 'Large variant of BarChart.'
      }
    }
  }
};
