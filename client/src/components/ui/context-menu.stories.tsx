import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuRadioGroup } from './context-menu';

const meta = {
  title: 'UI/ContextMenu',
  component: ContextMenu,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem>Profile</ContextMenuItem>
        <ContextMenuItem>Settings</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Logout</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithSubmenus: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click for advanced menu
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel>Actions</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem>Paste</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>Show Bookmarks</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value="theme">
          <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
          <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
          <ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
