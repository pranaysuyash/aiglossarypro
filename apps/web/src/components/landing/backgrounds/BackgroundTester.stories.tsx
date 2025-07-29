import type { Meta, StoryObj } from '@storybook/react';
import { BackgroundTester } from './BackgroundTester';

const meta: Meta<typeof BackgroundTester> = {
  title: 'Landing/BackgroundTester',
  component: BackgroundTester,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Landing page marketing component for the AIGlossaryPro application.',
      },
    },
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
        story: 'Default BackgroundTester component state.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    onVariantChange: () => console.log('Variant changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'BackgroundTester in loading state.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    onVariantChange: () => {
      /* throw new Error('Something went wrong'); */
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'BackgroundTester displaying error state.',
      },
    },
  },
};
