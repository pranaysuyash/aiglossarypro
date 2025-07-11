import { Meta, StoryObj } from '@storybook/react';
import { ARConceptOverlay } from './ARConceptOverlay';

const meta = {
  title: 'Components/ARConceptOverlay',
  component: ARConceptOverlay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ARConceptOverlay>;

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
