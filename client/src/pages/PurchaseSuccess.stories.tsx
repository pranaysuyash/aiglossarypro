import { Meta, StoryObj } from '@storybook/react';
import { PurchaseSuccess } from './PurchaseSuccess';

const meta = {
  title: 'Pages/PurchaseSuccess',
  component: PurchaseSuccess,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PurchaseSuccess>;

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
