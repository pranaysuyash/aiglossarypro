import { Meta, StoryObj } from '@storybook/react';
import { TermRelationships } from './TermRelationships';

const meta = {
  title: 'Components/TermRelationships',
  component: TermRelationships,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TermRelationships>;

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
