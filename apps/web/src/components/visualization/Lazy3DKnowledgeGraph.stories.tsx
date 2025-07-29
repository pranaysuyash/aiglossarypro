import type { Meta, StoryObj } from '@storybook/react';
import { Lazy3DKnowledgeGraph } from './Lazy3DKnowledgeGraph';

const meta: Meta<typeof Lazy3DKnowledgeGraph> = {
  title: 'Components/Lazy3DKnowledgeGraph',
  component: Lazy3DKnowledgeGraph,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Add argTypes here for component props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Add default props here
  },
};

export const WithProps: Story = {
  args: {
    // Add alternative props here
  },
};
