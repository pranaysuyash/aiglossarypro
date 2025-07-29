import type { Meta, StoryObj } from '@storybook/react';
import MobileLayoutWrapper from './MobileLayoutWrapper';

const meta = {
  title: 'Components/MobileLayoutWrapper',
  component: MobileLayoutWrapper,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileLayoutWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <div>Layout content</div>,
  },
};

export const WithProps: Story = {
  args: {
    children: 'Layout content',
    enableMobileNav: true,
  },
};
