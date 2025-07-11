import { Meta, StoryObj } from '@storybook/react';
import CookieConsentBanner from './CookieConsentBanner';

const meta = {
  title: 'Components/CookieConsentBanner',
  component: CookieConsentBanner,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CookieConsentBanner>;

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
