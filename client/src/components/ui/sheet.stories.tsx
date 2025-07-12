import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import { Textarea } from './textarea';

const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A slide-out sheet component built on top of Radix UI Dialog primitives. Perfect for forms, filters, and additional content.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="John Doe" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" value="john@example.com" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>Quick access to all sections of the application.</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <Button variant="ghost" className="w-full justify-start">
            🏠 Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            📖 Terms
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            🔍 Search
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            ⭐ Favorites
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            ⚙️ Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const RightSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Term Details</SheetTitle>
          <SheetDescription>Additional information and related content.</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Category</h4>
            <Badge variant="secondary">Machine Learning</Badge>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Difficulty</h4>
            <Badge variant="outline">Intermediate</Badge>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Related Terms</h4>
            <div className="space-y-2">
              <Button variant="link" className="p-0 h-auto">
                Neural Networks
              </Button>
              <Button variant="link" className="p-0 h-auto">
                Deep Learning
              </Button>
              <Button variant="link" className="p-0 h-auto">
                Gradient Descent
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Top Sheet</Button>
      </SheetTrigger>
      <SheetContent side="top" className="h-[300px]">
        <SheetHeader>
          <SheetTitle>Search Filters</SheetTitle>
          <SheetDescription>Refine your search results with advanced filters.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <select className="w-full p-2 border rounded">
              <option>All Categories</option>
              <option>Machine Learning</option>
              <option>Deep Learning</option>
              <option>NLP</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <select className="w-full p-2 border rounded">
              <option>All Levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Content Type</Label>
            <select className="w-full p-2 border rounded">
              <option>All Types</option>
              <option>Definition</option>
              <option>Code Examples</option>
              <option>Interactive</option>
            </select>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline">Reset</Button>
          <Button>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
          <SheetDescription>Perform common actions quickly from anywhere.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button className="h-20 flex flex-col gap-2">
            <span className="text-2xl">📚</span>
            <span>Browse Terms</span>
          </Button>
          <Button className="h-20 flex flex-col gap-2">
            <span className="text-2xl">🔍</span>
            <span>AI Search</span>
          </Button>
          <Button className="h-20 flex flex-col gap-2">
            <span className="text-2xl">⭐</span>
            <span>Favorites</span>
          </Button>
          <Button className="h-20 flex flex-col gap-2">
            <span className="text-2xl">📊</span>
            <span>Progress</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const WithForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      termName: '',
      definition: '',
      category: '',
      difficulty: 'beginner',
      tags: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', formData);
    };

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button>Add New Term</Button>
        </SheetTrigger>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Add New Term</SheetTitle>
            <SheetDescription>Create a new term definition for the glossary.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="termName">Term Name</Label>
              <Input
                id="termName"
                value={formData.termName}
                onChange={(e) => setFormData({ ...formData, termName: e.target.value })}
                placeholder="Enter term name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="definition">Definition</Label>
              <Textarea
                id="definition"
                value={formData.definition}
                onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                placeholder="Enter definition"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Machine Learning"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="comma, separated, tags"
              />
            </div>
            <SheetFooter>
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">Create Term</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  },
};

export const WithScrollableContent: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Long Content</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>AI Glossary Terms</SheetTitle>
          <SheetDescription>
            Browse through our comprehensive collection of AI terms.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4 max-h-[500px] overflow-y-auto">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <h4 className="font-semibold">AI Term {i + 1}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                This is a sample definition for AI Term {i + 1}. It provides comprehensive
                information about the concept and its applications in artificial intelligence.
              </p>
              <div className="mt-2">
                <Badge variant="secondary">Machine Learning</Badge>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const MobileBottomSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Mobile Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Term Actions</SheetTitle>
          <SheetDescription>What would you like to do with this term?</SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <Button className="w-full justify-start text-left" variant="ghost">
            <span className="mr-3">⭐</span>
            Add to Favorites
          </Button>
          <Button className="w-full justify-start text-left" variant="ghost">
            <span className="mr-3">📚</span>
            Mark as Learned
          </Button>
          <Button className="w-full justify-start text-left" variant="ghost">
            <span className="mr-3">🔗</span>
            Share Term
          </Button>
          <Button className="w-full justify-start text-left" variant="ghost">
            <span className="mr-3">💬</span>
            Provide Feedback
          </Button>
          <Button className="w-full justify-start text-left" variant="ghost">
            <span className="mr-3">🎯</span>
            Take Quiz
          </Button>
          <Button className="w-full justify-start text-left" variant="ghost">
            <span className="mr-3">📊</span>
            View Analytics
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const ControlledSheet: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-x-2">
        <Button onClick={() => setIsOpen(true)}>Open Controlled Sheet</Button>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Close Programmatically
        </Button>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Controlled Sheet</SheetTitle>
              <SheetDescription>This sheet is controlled by external state.</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p>Sheet state: {isOpen ? 'Open' : 'Closed'}</p>
              <Button onClick={() => setIsOpen(false)} className="mt-4">
                Close from Inside
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
};

export const LoadingSheet: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);

    const handleAction = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setLoading(false);
    };

    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open Loading Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Process Data</SheetTitle>
            <SheetDescription>
              {loading ? 'Processing your request...' : 'Ready to process data'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button onClick={handleAction} disabled={loading}>
              {loading ? 'Processing...' : 'Start Process'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
};

export const CustomWidth: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Wide Sheet</Button>
      </SheetTrigger>
      <SheetContent className="w-[800px] sm:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>Wide Content Sheet</SheetTitle>
          <SheetDescription>
            This sheet has a custom width for displaying more content.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Left Column</h4>
              <p className="text-sm text-muted-foreground">
                Content in the left column with more space to display detailed information and
                complex layouts.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Right Column</h4>
              <p className="text-sm text-muted-foreground">
                Content in the right column taking advantage of the additional width for better
                organization.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Dark Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Dark Mode Sheet</SheetTitle>
          <SheetDescription>This sheet adapts to dark mode styling automatically.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p>Content looks great in both light and dark modes.</p>
        </div>
        <SheetFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};
