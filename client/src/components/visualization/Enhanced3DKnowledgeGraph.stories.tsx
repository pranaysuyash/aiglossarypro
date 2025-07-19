import type { Meta, StoryObj } from '@storybook/react';
import { Enhanced3DKnowledgeGraph } from './Enhanced3DKnowledgeGraph';

const meta: Meta<typeof Enhanced3DKnowledgeGraph> = {
  title: 'Components/Enhanced3DKnowledgeGraph',
  component: Enhanced3DKnowledgeGraph,
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
