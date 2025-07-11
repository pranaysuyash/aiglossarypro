import { Meta, StoryObj } from '@storybook/react';
import { FilePreview } from './FilePreview';

const meta = {
  title: 'Components/FilePreview',
  component: FilePreview,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FilePreview>;

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
