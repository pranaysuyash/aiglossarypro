import type { Meta, StoryObj } from '@storybook/react';
import { iconSizes } from './iconSizes';

const meta: Meta<typeof iconSizes> = {
  title: 'UI Components/iconSizes',
  component: iconSizes,
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
        story: 'Default iconSizes component state.'
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
        story: 'iconSizes in loading state.'
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
        story: 'iconSizes displaying error state.'
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
        story: 'iconSizes in disabled state.'
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
        story: 'Small variant of iconSizes.'
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
        story: 'Large variant of iconSizes.'
      }
    }
  }
};
