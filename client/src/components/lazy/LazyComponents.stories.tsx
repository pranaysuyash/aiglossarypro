import { Meta, StoryObj } from '@storybook/react';
import { LazyAIFeedbackDashboard, LazyAIFeedbackDashboardWrapped } from './LazyComponents';

const meta = {
  title: 'Components/LazyComponents',
  component: LazyAIFeedbackDashboard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LazyAIFeedbackDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AIFeedbackDashboard: Story = {
  render: () => (
    <div className="h-screen w-full p-4">
      <LazyAIFeedbackDashboard />
    </div>
  ),
};

export const AIFeedbackDashboardWrapped: Story = {
  render: () => (
    <div className="h-screen w-full p-4">
      <LazyAIFeedbackDashboardWrapped />
    </div>
  ),
};
