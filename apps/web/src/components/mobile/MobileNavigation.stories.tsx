import type { Meta, StoryObj } from '@storybook/react';
import MobileNavigation from './MobileNavigation';

const meta = {
  title: 'Components/MobileNavigation',
  component: MobileNavigation,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileNavigation>;

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
