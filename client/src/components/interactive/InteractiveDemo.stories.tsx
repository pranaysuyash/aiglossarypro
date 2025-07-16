import type { Meta, StoryObj } from '@storybook/react';
import InteractiveDemo from './InteractiveDemo';

const meta = {
  title: 'Components/InteractiveDemo',
  component: InteractiveDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof InteractiveDemo>;

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
