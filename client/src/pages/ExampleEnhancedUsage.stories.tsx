import { Meta, StoryObj } from '@storybook/react';
import { ExampleEnhancedUsage } from './ExampleEnhancedUsage';

const meta = {
  title: 'Pages/ExampleEnhancedUsage',
  component: ExampleEnhancedUsage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ExampleEnhancedUsage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithProps: Story = {
  args: {
    // Add relevant props here
  },
};
