import type { Meta, StoryObj } from '@storybook/react';
import NavigationPerformanceTest from './NavigationPerformanceTest';

const meta = {
  title: 'Components/NavigationPerformanceTest',
  component: NavigationPerformanceTest,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NavigationPerformanceTest>;

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
