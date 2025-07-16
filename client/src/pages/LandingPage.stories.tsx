import type { Meta, StoryObj } from '@storybook/react';
import { LandingPage } from './LandingPage';

const meta = {
  title: 'Pages/LandingPage',
  component: LandingPage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LandingPage>;

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
