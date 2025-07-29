import type { Meta, StoryObj } from '@storybook/react';
import NotFound from './not-found';

const meta = {
  title: 'Pages/NotFound',
  component: NotFound,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotFound>;

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
