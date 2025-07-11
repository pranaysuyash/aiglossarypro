import { Meta, StoryObj } from '@storybook/react';
import { ABTestingDashboard } from './ABTestingDashboard';

const meta = {
  title: 'Pages/ABTestingDashboard',
  component: ABTestingDashboard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ABTestingDashboard>;

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
