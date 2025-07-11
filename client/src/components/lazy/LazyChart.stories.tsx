import { Meta, StoryObj } from '@storybook/react';
import { LazyChart } from './LazyChart';

const meta = {
  title: 'Components/LazyChart',
  component: LazyChart,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LazyChart>;

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
