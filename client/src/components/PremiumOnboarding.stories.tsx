import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PremiumOnboarding } from './PremiumOnboarding';

const meta: Meta<typeof PremiumOnboarding> = {
  title: 'Components/PremiumOnboarding',
  component: PremiumOnboarding,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive onboarding flow for new premium users, guiding them through key features and capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showAsModal: {
      control: 'boolean',
      description: 'Whether to show the onboarding as a modal overlay',
    },
    onComplete: {
      action: 'onComplete',
      description: 'Callback when onboarding is completed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showAsModal: false,
  },
};

export const AsModal: Story = {
  args: {
    showAsModal: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarding flow displayed as a modal overlay with backdrop.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  args: {
    showAsModal: false,
    onComplete: () => {
      console.log('Onboarding completed!');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing all onboarding steps with console logging.',
      },
    },
  },
};

export const ModalWithCallback: Story = {
  args: {
    showAsModal: true,
    onComplete: () => {
      alert('Welcome to Premium! Onboarding completed successfully.');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal version with completion callback that shows an alert.',
      },
    },
  },
};