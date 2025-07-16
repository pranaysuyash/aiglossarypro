import type { Meta, StoryObj } from '@storybook/react';
import ScrollDepthTracker from './ScrollDepthTracker';

const meta = {
  title: 'Components/ScrollDepthTracker',
  component: ScrollDepthTracker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollDepthTracker>;

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
