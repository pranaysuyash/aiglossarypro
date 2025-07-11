import { Meta, StoryObj } from '@storybook/react';
import { S3FileBrowser } from './S3FileBrowser';

const meta = {
  title: 'Components/S3FileBrowser',
  component: S3FileBrowser,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof S3FileBrowser>;

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
