import { Meta, StoryObj } from '@storybook/react';
import { RelationshipGraph } from './RelationshipGraph';

const meta = {
  title: 'Components/RelationshipGraph',
  component: RelationshipGraph,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RelationshipGraph>;

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
