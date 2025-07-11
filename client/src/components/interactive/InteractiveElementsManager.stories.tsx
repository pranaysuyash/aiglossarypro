import { Meta, StoryObj } from '@storybook/react';
import { InteractiveElementsManager } from './InteractiveElementsManager';

const meta = {
  title: 'Components/InteractiveElementsManager',
  component: InteractiveElementsManager,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof InteractiveElementsManager>;

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
