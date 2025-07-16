import type { Meta, StoryObj } from '@storybook/react';
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
  args: {
    type: 'line',
    children: '// Chart content goes here',
  },
};

export const WithProps: Story = {
  args: {
    type: 'bar',
    height: 300,
    children: 'Chart content',
  },
};
