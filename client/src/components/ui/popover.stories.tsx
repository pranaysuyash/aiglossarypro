import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar, Settings, User, Info, Heart, Star, MessageSquare, Share2, MoreVertical } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Popover component built with Radix UI primitives, providing flexible content overlays with customizable positioning and styling.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Popover Title</h4>
          <p className="text-sm text-muted-foreground">
            This is a simple popover with some content. You can place any content here.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default popover with basic content and styling.',
      },
    },
  },
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Profile Settings</h4>
            <p className="text-sm text-muted-foreground">
              Update your profile information below.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell us about yourself" rows={3} />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm">Save</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popover containing a form with various input fields.',
      },
    },
  },
};

export const WithIcon: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Information</p>
            <p className="text-sm text-muted-foreground">
              This feature helps you understand how AI models process information and make decisions.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popover triggered by an icon button with informational content.',
      },
    },
  },
};

export const UserProfile: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <User className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@example.com</p>
            </div>
          </div>
          <div className="border-t pt-3 space-y-1">
            <Button variant="ghost" className="w-full justify-start h-8 px-2">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start h-8 px-2">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start h-8 px-2 text-red-600">
              <span className="mr-2 h-4 w-4">⚠</span>
              Sign Out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'User profile popover with avatar, user info, and action buttons.',
      },
    },
  },
};

export const DatePicker: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Pick a date
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-4">
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium mb-2">Select Date</h4>
              <div className="grid grid-cols-7 gap-1 text-sm">
                <div className="text-center p-2 text-muted-foreground">S</div>
                <div className="text-center p-2 text-muted-foreground">M</div>
                <div className="text-center p-2 text-muted-foreground">T</div>
                <div className="text-center p-2 text-muted-foreground">W</div>
                <div className="text-center p-2 text-muted-foreground">T</div>
                <div className="text-center p-2 text-muted-foreground">F</div>
                <div className="text-center p-2 text-muted-foreground">S</div>
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 4;
                  const isCurrentMonth = day > 0 && day <= 31;
                  const isToday = day === 15;
                  return (
                    <button
                      key={i}
                      className={`text-center p-2 text-sm rounded hover:bg-accent ${
                        isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                      } ${isToday ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {day > 0 && day <= 31 ? day : ''}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button size="sm">Select</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Date picker popover with calendar interface.',
      },
    },
  },
};

export const SharePopover: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Share this term</h4>
            <p className="text-sm text-muted-foreground">
              Share "Machine Learning" with others
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-url">Share URL</Label>
            <div className="flex space-x-2">
              <Input
                id="share-url"
                value="https://aiglossary.pro/terms/machine-learning"
                readOnly
                className="flex-1"
              />
              <Button size="sm" variant="outline">Copy</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Share on social media</Label>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">Twitter</Button>
              <Button variant="outline" size="sm">LinkedIn</Button>
              <Button variant="outline" size="sm">Facebook</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Share popover with URL copying and social media options.',
      },
    },
  },
};

export const QuickActions: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start h-8 px-2">
            <Heart className="mr-2 h-4 w-4" />
            Add to favorites
          </Button>
          <Button variant="ghost" className="w-full justify-start h-8 px-2">
            <Star className="mr-2 h-4 w-4" />
            Rate this term
          </Button>
          <Button variant="ghost" className="w-full justify-start h-8 px-2">
            <MessageSquare className="mr-2 h-4 w-4" />
            Add comment
          </Button>
          <Button variant="ghost" className="w-full justify-start h-8 px-2">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <div className="border-t pt-1">
            <Button variant="ghost" className="w-full justify-start h-8 px-2 text-red-600">
              <span className="mr-2">⚠</span>
              Report issue
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Quick actions popover with menu-style buttons.',
      },
    },
  },
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-8">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-48">
          <p className="text-sm">This popover appears above the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="w-48">
          <p className="text-sm">This popover appears to the right.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-48">
          <p className="text-sm">This popover appears below the trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left" className="w-48">
          <p className="text-sm">This popover appears to the left.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48">
          <p className="text-sm">Aligned to start of trigger.</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">End</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48">
          <p className="text-sm">Aligned to end of trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popovers with different positioning options.',
      },
    },
  },
};

export const AIGlossaryExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold">Machine Learning</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4 mr-2" />
              More Info
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Term Details</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Category:</strong> Artificial Intelligence</p>
                  <p><strong>Difficulty:</strong> Intermediate</p>
                  <p><strong>Related Terms:</strong> Deep Learning, Neural Networks, AI</p>
                  <p><strong>Last Updated:</strong> December 2024</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start h-8 px-2">
                    <Heart className="mr-2 h-4 w-4" />
                    Add to favorites
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-8 px-2">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share term
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-8 px-2">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ask AI about this
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-sm text-muted-foreground">
        Example of how popovers might be used in the AI/ML Glossary application.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'AI/ML Glossary specific popover with term details and quick actions.',
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Popover Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Simple</Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <p className="text-sm">Simple popover content.</p>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">With Icon</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <p className="text-sm">Popover with icon.</p>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">With Form</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Label htmlFor="quick-name">Name</Label>
                <Input id="quick-name" placeholder="Enter name" />
                <Button size="sm" className="w-full">Save</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Menu Style</Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start h-8 px-2">
                  Edit
                </Button>
                <Button variant="ghost" className="w-full justify-start h-8 px-2">
                  Copy
                </Button>
                <Button variant="ghost" className="w-full justify-start h-8 px-2">
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of various popover styles and use cases.',
      },
    },
  },
};