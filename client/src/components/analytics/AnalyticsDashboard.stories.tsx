import { Meta, StoryObj } from '@storybook/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

const meta = {
  title: 'Components/AnalyticsDashboard',
  component: AnalyticsDashboard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AnalyticsDashboard>;

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
