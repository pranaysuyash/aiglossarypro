import type { Meta, StoryObj } from '@storybook/react';
import { ReferralProgram } from './ReferralProgram';

const meta: Meta<typeof ReferralProgram> = {
  title: 'Components/ReferralProgram',
  component: ReferralProgram,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive referral program dashboard allowing users to track referrals, earn commissions, and manage their referral activity.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReferralProgram>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The default referral program dashboard showing all features including stats, sharing tools, activity tracking, and earnings.',
      },
    },
  },
};

export const ShareTab: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Referral program focused on the sharing tab, allowing users to generate and share referral links.',
      },
    },
  },
};

export const ActivityTab: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Referral program showing the activity tab with referral tracking and conversion status.',
      },
    },
  },
};

export const EarningsTab: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Referral program displaying the earnings tab with commission history and payout information.',
      },
    },
  },
};