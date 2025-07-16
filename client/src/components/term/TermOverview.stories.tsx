import type { Meta, StoryObj } from '@storybook/react';
import TermOverview from './TermOverview';

const meta = {
  title: 'Components/TermOverview',
  component: TermOverview,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TermOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    term: {
      id: 1,
      name: 'Test Term',
      definition: 'Test definition',
      slug: 'test-term',
    },
    isEnhanced: false,
  },
};

export const WithProps: Story = {
  args: {
    // Add relevant props here
  },
};
