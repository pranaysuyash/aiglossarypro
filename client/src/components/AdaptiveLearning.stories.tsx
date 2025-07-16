import type { Meta, StoryObj } from '@storybook/react';
import AdaptiveLearning from './AdaptiveLearning';

const meta = {
  title: 'Components/AdaptiveLearning',
  component: AdaptiveLearning,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AdaptiveLearning>;

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