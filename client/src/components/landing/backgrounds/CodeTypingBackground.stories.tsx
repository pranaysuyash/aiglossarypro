import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CodeTypingBackground } from './CodeTypingBackground';

const meta: Meta<typeof CodeTypingBackground> = {
  title: 'Landing/CodeTypingBackground',
  component: CodeTypingBackground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Landing page marketing component for the AIGlossaryPro application.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    // Add argTypes based on component props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  
  parameters: {
    docs: {
      description: {
        story: 'Default CodeTypingBackground component state.'
      }
    }
  }
};

export const Loading: Story = {
  args: {
    className: 'animate-pulse',
    opacity: 0.5,
    linesCount: 5,
    typingSpeed: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'CodeTypingBackground in loading state.'
      }
    }
  }
};

export const Error: Story = {
  args: {
    className: 'text-red-500',
    opacity: 0.8,
    linesCount: 3,
    typingSpeed: 200,
  },
  parameters: {
    docs: {
      description: {
        story: 'CodeTypingBackground displaying error state.'
      }
    }
  }
};
