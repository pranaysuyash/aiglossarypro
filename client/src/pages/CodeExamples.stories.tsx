import type { Meta, StoryObj } from '@storybook/react';
import { CodeExamples } from './CodeExamples';

const meta = {
  title: 'Pages/CodeExamples',
  component: CodeExamples,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CodeExamples>;

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
