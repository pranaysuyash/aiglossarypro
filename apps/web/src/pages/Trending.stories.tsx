import type { Meta, StoryObj } from '@storybook/react';
import Trending from './Trending';

const meta = {
  title: 'Pages/Trending',
  component: Trending,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Trending>;

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
