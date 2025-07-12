import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from './button';
import { ConfirmationDialog } from './confirmation-dialog';

const meta: Meta<typeof ConfirmationDialog> = {
  title: 'UI/ConfirmationDialog',
  component: ConfirmationDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Confirmation dialog component for user actions with customizable styling and content.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    description: {
      control: 'text',
      description: 'Dialog description',
    },
    confirmText: {
      control: 'text',
      description: 'Confirm button text',
    },
    cancelText: {
      control: 'text',
      description: 'Cancel button text',
    },
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Dialog variant',
    },
    details: {
      control: 'text',
      description: 'Additional details to show',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConfirmationDialog>;

// Wrapper component for interactive stories
function DialogWrapper({ 
  title, 
  description, 
  confirmText, 
  cancelText, 
  variant, 
  details,
  triggerText = 'Open Dialog'
}: {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  details?: string;
  triggerText?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)} variant={variant === 'destructive' ? 'destructive' : 'default'}>
        {triggerText}
      </Button>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => {
          alert('Confirmed!');
          setOpen(false);
        }}
        title={title}
        description={description}
        confirmText={confirmText}
        cancelText={cancelText}
        variant={variant}
        details={details}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <DialogWrapper
      title="Are you sure?"
      description="This action cannot be undone. Please confirm if you want to proceed."
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default confirmation dialog with standard messaging.',
      },
    },
  },
};

export const Destructive: Story = {
  render: () => (
    <DialogWrapper
      title="Delete Account"
      description="This will permanently delete your account and all associated data. This action cannot be undone."
      confirmText="Delete Account"
      cancelText="Keep Account"
      variant="destructive"
      triggerText="Delete Account"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Destructive confirmation dialog for dangerous actions.',
      },
    },
  },
};

export const WithDetails: Story = {
  render: () => (
    <DialogWrapper
      title="Delete 5 Selected Items"
      description="Are you sure you want to delete these items? This action cannot be undone."
      details="Items: Machine Learning.pdf, Deep Learning.docx, Neural Networks.txt, AI Ethics.md, Computer Vision.png"
      confirmText="Delete Items"
      variant="destructive"
      triggerText="Delete Selected Items"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Confirmation dialog with additional details about the action.',
      },
    },
  },
};

export const CustomButtons: Story = {
  render: () => (
    <DialogWrapper
      title="Save Changes"
      description="You have unsaved changes. Would you like to save them before continuing?"
      confirmText="Save & Continue"
      cancelText="Discard Changes"
      triggerText="Save Changes"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with custom button text.',
      },
    },
  },
};

export const LongContent: Story = {
  render: () => (
    <DialogWrapper
      title="Terms of Service Update"
      description="We have updated our Terms of Service. By continuing to use our service, you agree to the new terms. Please review the changes carefully before proceeding."
      details="Key changes include: Updated privacy policy, new data retention policies, modified refund terms, enhanced security measures, and revised user responsibilities. The full terms can be reviewed at example.com/terms."
      confirmText="I Agree"
      cancelText="Review Terms"
      triggerText="Accept New Terms"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog with longer content to test text wrapping and layout.',
      },
    },
  },
};

export const SimpleConfirmation: Story = {
  render: () => (
    <DialogWrapper
      title="Confirm Action"
      description="Are you sure?"
      confirmText="Yes"
      cancelText="No"
      triggerText="Simple Confirm"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Simple confirmation dialog with minimal text.',
      },
    },
  },
};

export const LogoutConfirmation: Story = {
  render: () => (
    <DialogWrapper
      title="Sign Out"
      description="Are you sure you want to sign out of your account?"
      confirmText="Sign Out"
      cancelText="Stay Signed In"
      triggerText="Sign Out"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Logout confirmation dialog.',
      },
    },
  },
};

export const UnsavedChanges: Story = {
  render: () => (
    <DialogWrapper
      title="Unsaved Changes"
      description="You have unsaved changes that will be lost if you navigate away from this page."
      details="Modified: Term definition, categories, and related terms. Last saved: 2 minutes ago."
      confirmText="Leave Page"
      cancelText="Stay on Page"
      variant="destructive"
      triggerText="Leave Page"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dialog warning about unsaved changes.',
      },
    },
  },
};

export const BulkAction: Story = {
  render: () => (
    <DialogWrapper
      title="Bulk Update"
      description="This will update 47 terms with the selected category. Are you sure you want to proceed?"
      details="Terms will be moved from 'Unsorted' to 'Machine Learning' category. This action affects: definitions, metadata, and search indexing."
      confirmText="Update Terms"
      cancelText="Cancel"
      triggerText="Apply Bulk Update"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Confirmation dialog for bulk operations.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dialog Variants</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DialogWrapper
          title="Default Dialog"
          description="This is a default confirmation dialog."
          triggerText="Default"
        />
        <DialogWrapper
          title="Destructive Action"
          description="This is a destructive action that cannot be undone."
          variant="destructive"
          triggerText="Destructive"
        />
        <DialogWrapper
          title="With Details"
          description="This dialog includes additional details."
          details="Here are some additional details about the action."
          triggerText="With Details"
        />
        <DialogWrapper
          title="Custom Buttons"
          description="This dialog has custom button text."
          confirmText="Proceed"
          cancelText="Go Back"
          triggerText="Custom Buttons"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all dialog variants and options.',
      },
    },
  },
};