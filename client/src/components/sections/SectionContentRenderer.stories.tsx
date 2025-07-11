import { Meta, StoryObj } from '@storybook/react';
import { SectionContentRenderer } from './SectionContentRenderer';

const meta = {
  title: 'Components/SectionContentRenderer',
  component: SectionContentRenderer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionContentRenderer>;

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
