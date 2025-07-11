import { Meta, StoryObj } from '@storybook/react';
import { Resizable } from './Resizable';

const meta = {
  title: 'UI/Resizable',
  component: Resizable,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Resizable>;

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
