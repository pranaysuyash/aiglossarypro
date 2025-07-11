import { Meta, StoryObj } from '@storybook/react';
import { MobileOptimizedLayout } from './MobileOptimizedLayout';

const meta = {
  title: 'Components/MobileOptimizedLayout',
  component: MobileOptimizedLayout,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileOptimizedLayout>;

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
