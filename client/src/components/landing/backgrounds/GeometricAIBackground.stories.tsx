import type { Meta, StoryObj } from '@storybook/react';
import { GeometricAIBackground } from './GeometricAIBackground';

const meta: Meta<typeof GeometricAIBackground> = {
  title: 'Landing/GeometricAIBackground',
  component: GeometricAIBackground,
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
        story: 'Default GeometricAIBackground component state.'
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
        story: 'GeometricAIBackground in loading state.'
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
        story: 'GeometricAIBackground displaying error state.'
      }
    }
  }
};
