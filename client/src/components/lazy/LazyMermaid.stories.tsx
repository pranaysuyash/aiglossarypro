import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { LazyMermaid } from './LazyMermaid';

const meta = {
  title: 'Components/LazyMermaid',
  component: LazyMermaid,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LazyMermaid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
      "diagram": "graph TD\\n  A[Start] --> B[End]"
    },
};

export const WithProps: Story = {
  args: {
    diagram: "graph LR\nA --> B",
    title: "Sample"
  },
};
