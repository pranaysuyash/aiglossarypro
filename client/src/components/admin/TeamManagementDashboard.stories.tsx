import type { Meta, StoryObj } from '@storybook/react';
import { TeamManagementDashboard } from './TeamManagementDashboard';

const meta: Meta<typeof TeamManagementDashboard> = {
  title: 'Admin/TeamManagementDashboard',
  component: TeamManagementDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive team management dashboard for organizations to manage members, invitations, and team settings.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TeamManagementDashboard>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The default team management dashboard showing all team members, pending invitations, and settings.',
      },
    },
  },
};

export const MembersTab: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Team management dashboard focused on the members tab, showing all current team members.',
      },
    },
  },
};

export const InvitationsTab: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Team management dashboard focused on pending invitations and invitation management.',
      },
    },
  },
};

export const SettingsTab: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Team management dashboard showing the settings tab for configuring team-wide preferences.',
      },
    },
  },
};
