import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from './alert-dialog';

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete Item</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const WithCustomAction: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Archive Item</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this item?</AlertDialogTitle>
          <AlertDialogDescription>
            This item will be moved to the archive. You can restore it later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-orange-600 hover:bg-orange-700">Archive</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
