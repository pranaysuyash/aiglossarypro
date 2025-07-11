import type { Meta, StoryObj } from '@storybook/react';
import { FinalCTA } from './FinalCTA';

const meta: Meta<typeof FinalCTA> = {
  title: 'Landing/FinalCTA',
  component: FinalCTA,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Landing page marketing component for the AIGlossaryPro application.'
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
        story: 'Default FinalCTA component state.'
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
        story: 'FinalCTA in loading state.'
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
        story: 'FinalCTA displaying error state.'
      }
    }
  }
};
