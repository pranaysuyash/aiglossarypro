import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressVisualization } from './ProgressVisualization';

const meta: Meta<typeof ProgressVisualization> = {
  title: 'Components/ProgressVisualization',
  component: ProgressVisualization,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Progress visualization component showing user learning statistics, achievements, and progress tracking.'
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default progress visualization with sample user data.'
      }
    }
  }
};

export const NewUser: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Progress visualization for a new user with minimal progress.'
      }
    }
  }
};

export const ActiveUser: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Progress visualization for an active user with substantial progress and achievements.'
      }
    }
  }
};

export const PowerUser: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Progress visualization for a power user with high engagement and multiple achievements.'
      }
    }
  }
};

export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Progress visualization in loading state while fetching user data.'
      }
    }
  }
};