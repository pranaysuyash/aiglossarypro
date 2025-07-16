import type { Meta, StoryObj } from '@storybook/react';
import { XRExploration } from './XRExploration';

const meta = {
  title: 'Pages/XRExploration',
  component: XRExploration,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof XRExploration>;

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
