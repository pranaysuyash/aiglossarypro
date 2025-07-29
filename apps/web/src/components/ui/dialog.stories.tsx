import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type React from 'react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A modal dialog component built on top of Radix UI primitives with various configurations and use cases.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a basic dialog with a title and description.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content goes here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', formData);
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Contact Us</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription>
              Send us a message and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Your message..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">Send Message</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = () => {
      console.log('Action confirmed');
      setIsOpen(false);
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Item</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the item and remove it from
              our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
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

export const WithScrollableContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Terms of Service</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Please read our terms of service carefully.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <h3 className="font-semibold">1. Acceptance of Terms</h3>
          <p className="text-sm text-muted-foreground">
            By accessing and using this service, you accept and agree to be bound by the terms and
            provision of this agreement.
          </p>

          <h3 className="font-semibold">2. Use License</h3>
          <p className="text-sm text-muted-foreground">
            Permission is granted to temporarily download one copy of the materials on our website
            for personal, non-commercial transitory viewing only.
          </p>

          <h3 className="font-semibold">3. Disclaimer</h3>
          <p className="text-sm text-muted-foreground">
            The materials on our website are provided on an 'as is' basis. We make no warranties,
            expressed or implied, and hereby disclaim and negate all other warranties including
            without limitation, implied warranties or conditions of merchantability, fitness for a
            particular purpose, or non-infringement of intellectual property or other violation of
            rights.
          </p>

          <h3 className="font-semibold">4. Limitations</h3>
          <p className="text-sm text-muted-foreground">
            In no event shall our company or its suppliers be liable for any damages (including,
            without limitation, damages for loss of data or profit, or due to business interruption)
            arising out of the use or inability to use the materials on our website, even if we or
            our authorized representative has been notified orally or in writing of the possibility
            of such damage.
          </p>

          <h3 className="font-semibold">5. Privacy Policy</h3>
          <p className="text-sm text-muted-foreground">
            Your privacy is important to us. Our Privacy Policy explains how we collect, use, and
            protect your information when you use our service.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline">Decline</Button>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutTrigger: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div>
        <Button onClick={() => setIsOpen(true)}>Open Dialog Programmatically</Button>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programmatically Opened</DialogTitle>
              <DialogDescription>
                This dialog was opened programmatically without a trigger.
              </DialogDescription>
            </DialogHeader>
            <p>This is useful for dialogs that need to be opened from code.</p>
            <DialogFooter>
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
};

export const LoadingDialog: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = async () => {
      setIsLoading(true);
      // Simulate async action
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setIsOpen(false);
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>Start Process</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processing Request</DialogTitle>
            <DialogDescription>
              {isLoading
                ? 'Please wait while we process your request...'
                : 'Ready to start processing'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={isLoading} onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isLoading} onClick={handleAction}>
              {isLoading ? 'Processing...' : 'Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const AlertDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">⚠️ Delete Account</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. All your data will be lost.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">Before proceeding, please note:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>All your saved terms and progress will be deleted</li>
            <li>Your subscription will be cancelled immediately</li>
            <li>You will not be able to recover your account</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline">Keep Account</Button>
          <Button variant="destructive">Delete Forever</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const SuccessDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Complete Purchase</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-green-600">✅ Purchase Successful!</DialogTitle>
          <DialogDescription>
            Thank you for your purchase. Your account has been upgraded.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800">What's Next?</h4>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>• Your premium features are now active</li>
              <li>• Check your email for the receipt</li>
              <li>• Explore the new AI-powered features</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const NestedDialogs: Story = {
  render: () => {
    const [parentOpen, setParentOpen] = useState(false);
    const [childOpen, setChildOpen] = useState(false);

    return (
      <Dialog open={parentOpen} onOpenChange={setParentOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Open Parent Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parent Dialog</DialogTitle>
            <DialogDescription>
              This is the parent dialog that can open another dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button onClick={() => setChildOpen(true)}>Open Child Dialog</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParentOpen(false)}>
              Close Parent
            </Button>
          </DialogFooter>

          <Dialog open={childOpen} onOpenChange={setChildOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Child Dialog</DialogTitle>
                <DialogDescription>This is a nested dialog within the parent.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setChildOpen(false)}>Close Child</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    );
  },
};

export const CustomSizedDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Large Dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Large Dialog</DialogTitle>
          <DialogDescription>This dialog has a custom maximum width.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field1">Field 1</Label>
              <Input id="field1" placeholder="Enter value" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field2">Field 2</Label>
              <Input id="field2" placeholder="Enter value" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field3">Field 3</Label>
              <Input id="field3" placeholder="Enter value" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field4">Field 4</Label>
              <Input id="field4" placeholder="Enter value" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dark Mode Dialog</DialogTitle>
          <DialogDescription>This dialog adapts to dark mode styling.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content in dark mode.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};
