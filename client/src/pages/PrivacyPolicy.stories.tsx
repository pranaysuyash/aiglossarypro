import { Meta, StoryObj } from '@storybook/react';
import { PrivacyPolicy } from './PrivacyPolicy';

const meta = {
  title: 'Pages/PrivacyPolicy',
  component: PrivacyPolicy,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PrivacyPolicy>;

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
