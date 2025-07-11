import { Meta, StoryObj } from '@storybook/react';
import { PredictiveAnalytics } from './PredictiveAnalytics';

const meta = {
  title: 'Components/PredictiveAnalytics',
  component: PredictiveAnalytics,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PredictiveAnalytics>;

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
