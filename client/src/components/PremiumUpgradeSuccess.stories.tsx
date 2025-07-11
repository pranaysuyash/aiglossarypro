import { Meta, StoryObj } from '@storybook/react';
import { PremiumUpgradeSuccess } from './PremiumUpgradeSuccess';

const meta = {
  title: 'Components/PremiumUpgradeSuccess',
  component: PremiumUpgradeSuccess,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PremiumUpgradeSuccess>;

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
