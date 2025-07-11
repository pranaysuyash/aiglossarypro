import { Meta, StoryObj } from '@storybook/react';
import { Lifetime } from './Lifetime';

const meta = {
  title: 'Pages/Lifetime',
  component: Lifetime,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Lifetime>;

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
