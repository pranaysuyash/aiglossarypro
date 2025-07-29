import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';

const meta = {
  title: 'U./label',
  component: Label,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

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
