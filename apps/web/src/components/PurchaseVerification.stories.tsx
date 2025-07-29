import type { Meta, StoryObj } from '@storybook/react';
import { PurchaseVerification } from './PurchaseVerification';

const meta = {
  title: 'Components/PurchaseVerification',
  component: PurchaseVerification,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PurchaseVerification>;

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
