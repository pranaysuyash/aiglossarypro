import { Meta, StoryObj } from '@storybook/react';
import { PWAStatus } from './PWAStatus';

const meta = {
  title: 'Components/PWAStatus',
  component: PWAStatus,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PWAStatus>;

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
