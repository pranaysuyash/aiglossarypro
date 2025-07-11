import { Meta, StoryObj } from '@storybook/react';
import { SectionDisplay } from './SectionDisplay';

const meta = {
  title: 'Components/SectionDisplay',
  component: SectionDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionDisplay>;

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
