import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { useState } from 'react';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modal dialog component with customizable content, header, and footer sections.',
      },
    },
  },
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'open state changed' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a description of what this dialog is for and what the user can do with it.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content goes here. This can be any content you want to display in the modal.</p>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', { name, email });
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Add User</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Enter the user's information below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
      console.log('Action confirmed');
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Item</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the item
              and remove it from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const InfoDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Show Info</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Information</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This is an informational dialog. It provides details about a specific topic
            or feature. You can include any content here that helps explain something
            to the user.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">Pro Tip</h4>
            <p className="text-sm text-blue-700 mt-1">
              Dialogs are perfect for displaying important information that requires
              user attention without navigating away from the current page.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LargeContentDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detailed Information</DialogTitle>
          <DialogDescription>
            This dialog contains a lot of content and demonstrates scrolling behavior.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Section 1: Overview</h3>
            <p className="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Section 2: Features</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Feature one with detailed explanation</li>
              <li>Feature two with comprehensive overview</li>
              <li>Feature three with extensive documentation</li>
              <li>Feature four with thorough analysis</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Section 3: Technical Details</h3>
            <p className="text-sm text-muted-foreground">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
              proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Section 4: Examples</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <code className="text-sm">
                {`function example() {
  return "This is a code example within the dialog";
}`}
              </code>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Section 5: Additional Information</h3>
            <p className="text-sm text-muted-foreground">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
              doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
              veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const NoFooterDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Simple Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simple Message</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            This is a simple dialog without a footer. The user can close it by
            clicking the X button or pressing Escape.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  ),
};

export const CustomStyledDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          Open Styled Dialog
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <DialogHeader>
          <DialogTitle className="text-purple-800">Custom Styled Dialog</DialogTitle>
          <DialogDescription className="text-purple-600">
            This dialog demonstrates custom styling with gradients and colors.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-purple-100">
            <p className="text-gray-700">
              You can customize the appearance of dialogs to match your brand or
              design system using CSS classes.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button className="bg-purple-600 hover:bg-purple-700">
            Styled Button
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dark Mode Dialog</DialogTitle>
          <DialogDescription>
            This dialog demonstrates the dark mode appearance.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            The dialog automatically adapts to dark mode when the dark class
            is applied to a parent element.
          </p>
        </div>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 p-8 min-h-screen">
        <Story />
      </div>
    ),
  ],
};
