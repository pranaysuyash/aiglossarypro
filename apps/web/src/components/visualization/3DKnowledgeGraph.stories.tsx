import type { Meta, StoryObj } from '@storybook/react';
import ThreeDKnowledgeGraph from './3DKnowledgeGraph';

const meta = {
  title: 'Components/ThreeDKnowledgeGraph',
  component: ThreeDKnowledgeGraph,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ThreeDKnowledgeGraph>;

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
