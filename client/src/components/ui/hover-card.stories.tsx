import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';

const meta = {
  title: 'UI/HoverCard',
  component: HoverCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger className="underline cursor-pointer">
        Hover over me
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@nextjs</h4>
            <p className="text-sm">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const WithProfile: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger className="text-blue-600 hover:text-blue-800 underline cursor-pointer">
        @github
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">GH</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">GitHub</h4>
            <p className="text-sm">
              Where the world builds software. Millions of developers use GitHub to build amazing things together.
            </p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">
                Founded 2008 • San Francisco, CA
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
