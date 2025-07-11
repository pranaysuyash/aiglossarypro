import type { Meta, StoryObj } from '@storybook/react';
import PageBreadcrumb from './page-breadcrumb';

const meta: Meta<typeof PageBreadcrumb> = {
  title: 'UI Components/PageBreadcrumb',
  component: PageBreadcrumb,
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
        story: 'Default PageBreadcrumb component state.'
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
        story: 'PageBreadcrumb in loading state.'
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
        story: 'PageBreadcrumb displaying error state.'
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
        story: 'PageBreadcrumb in disabled state.'
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
        story: 'Small variant of PageBreadcrumb.'
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
        story: 'Large variant of PageBreadcrumb.'
      }
    }
  }
};
