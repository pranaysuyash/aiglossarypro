import type { Meta, StoryObj } from '@storybook/react';
import { TermsOfService } from './TermsOfService';

const meta = {
  title: 'Pages/TermsOfService',
  component: TermsOfService,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TermsOfService>;

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
