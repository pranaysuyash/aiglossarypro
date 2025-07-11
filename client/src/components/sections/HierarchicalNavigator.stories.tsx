import { Meta, StoryObj } from '@storybook/react';
import { HierarchicalNavigator } from './HierarchicalNavigator';

const meta = {
  title: 'Components/HierarchicalNavigator',
  component: HierarchicalNavigator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof HierarchicalNavigator>;

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
