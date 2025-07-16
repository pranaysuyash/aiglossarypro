import type { Meta, StoryObj } from '@storybook/react';
import TermContentTabs from './TermContentTabs';

const meta = {
  title: 'Components/TermContentTabs',
  component: TermContentTabs,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TermContentTabs>;

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
