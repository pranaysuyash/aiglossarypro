import type { Meta, StoryObj } from '@storybook/react';
import CrossReferenceAnalytics from './CrossReferenceAnalytics';

const meta = {
  title: 'Components/CrossReferenceAnalytics',
  component: CrossReferenceAnalytics,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CrossReferenceAnalytics>;

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
