import type { Meta, StoryObj } from '@storybook/react';
import ShareMenu from './ShareMenu';

const meta = {
  title: 'Components/ShareMenu',
  component: ShareMenu,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ShareMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Share this',
    url: 'https://example.com',
  },
};

export const WithProps: Story = {
  args: {
    // Add relevant props here
  },
};
