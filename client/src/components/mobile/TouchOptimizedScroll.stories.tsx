import { Meta, StoryObj } from '@storybook/react';
import { TouchOptimizedScroll } from './TouchOptimizedScroll';

const meta = {
  title: 'Components/TouchOptimizedScroll',
  component: TouchOptimizedScroll,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TouchOptimizedScroll>;

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
