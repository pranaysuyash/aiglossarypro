import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Calendar, Settings, User, Bell, Shield, CreditCard } from 'lucide-react';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A set of layered sections of content that display one panel of content at a time.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-full">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="name">Name</label>
              <input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <label htmlFor="username">Username</label>
              <input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="current">Current password</label>
              <input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new">New password</label>
              <input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default tabs with account and password sections.',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your profile information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Profile content goes here...</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Notification settings go here...</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your account security and privacy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Security settings go here...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with icons for better visual identification.',
      },
    },
  },
};

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center gap-2">
          Tasks
          <Badge variant="secondary" className="ml-1">
            3
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          Notifications
          <Badge variant="destructive" className="ml-1">
            12
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>General overview of your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Overview content...</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tasks">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>You have 3 pending tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Tasks content...</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>You have 12 new notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Notifications content...</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Settings content...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with badges showing counts or status indicators.',
      },
    },
  },
};

export const VerticalTabs: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-full flex gap-4" orientation="vertical">
      <TabsList className="flex-col h-fit">
        <TabsTrigger value="general" className="w-full justify-start">
          General
        </TabsTrigger>
        <TabsTrigger value="appearance" className="w-full justify-start">
          Appearance
        </TabsTrigger>
        <TabsTrigger value="notifications" className="w-full justify-start">
          Notifications
        </TabsTrigger>
        <TabsTrigger value="advanced" className="w-full justify-start">
          Advanced
        </TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic application settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>General settings content...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Appearance settings content...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure notification preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Notification settings content...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration options.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Advanced settings content...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical tabs layout for sidebar-style navigation.',
      },
    },
  },
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="available" className="w-full">
      <TabsList>
        <TabsTrigger value="available">Available</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="another">Another</TabsTrigger>
      </TabsList>
      <TabsContent value="available">
        <Card>
          <CardHeader>
            <CardTitle>Available Tab</CardTitle>
            <CardDescription>This tab is available and active.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Available content...</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="disabled">
        <Card>
          <CardHeader>
            <CardTitle>Disabled Tab</CardTitle>
            <CardDescription>This tab is disabled.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This content shouldn't be accessible.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="another">
        <Card>
          <CardHeader>
            <CardTitle>Another Tab</CardTitle>
            <CardDescription>Another available tab.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Another tab content...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with disabled state demonstration.',
      },
    },
  },
};

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        <TabsTrigger value="tab4">Tab 4</TabsTrigger>
        <TabsTrigger value="tab5">Tab 5</TabsTrigger>
        <TabsTrigger value="tab6">Tab 6</TabsTrigger>
      </TabsList>
      {Array.from({ length: 6 }, (_, i) => (
        <TabsContent key={i} value={`tab${i + 1}`}>
          <Card>
            <CardHeader>
              <CardTitle>Tab {i + 1} Content</CardTitle>
              <CardDescription>Content for tab {i + 1}.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the content for tab {i + 1}.</p>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple tabs with grid layout for equal spacing.',
      },
    },
  },
};

export const NestedTabs: Story = {
  render: () => (
    <Tabs defaultValue="main1" className="w-full">
      <TabsList>
        <TabsTrigger value="main1">Main 1</TabsTrigger>
        <TabsTrigger value="main2">Main 2</TabsTrigger>
      </TabsList>
      <TabsContent value="main1">
        <Card>
          <CardHeader>
            <CardTitle>Main Tab 1</CardTitle>
            <CardDescription>This contains nested tabs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sub1" className="w-full">
              <TabsList>
                <TabsTrigger value="sub1">Sub 1</TabsTrigger>
                <TabsTrigger value="sub2">Sub 2</TabsTrigger>
              </TabsList>
              <TabsContent value="sub1">
                <div className="p-4 border rounded">
                  <h4 className="font-medium">Sub Tab 1</h4>
                  <p className="text-sm text-gray-600">Nested tab content 1.</p>
                </div>
              </TabsContent>
              <TabsContent value="sub2">
                <div className="p-4 border rounded">
                  <h4 className="font-medium">Sub Tab 2</h4>
                  <p className="text-sm text-gray-600">Nested tab content 2.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="main2">
        <Card>
          <CardHeader>
            <CardTitle>Main Tab 2</CardTitle>
            <CardDescription>Regular tab content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main tab 2 content...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tabs with nested tab components inside.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [activeTab, setActiveTab] = React.useState('dashboard');
    
    return (
      <div className="w-full space-y-4">
        <p className="text-sm text-gray-600">
          Current active tab: <strong>{activeTab}</strong>
        </p>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>Your main dashboard overview.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={() => setActiveTab('analytics')}>
                    Go to Analytics
                  </Button>
                  <p>Dashboard content with interactive elements.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Detailed analytics and metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={() => setActiveTab('reports')}>
                    View Reports
                  </Button>
                  <p>Analytics content...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Generate and view reports.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={() => setActiveTab('settings')}>
                    Open Settings
                  </Button>
                  <p>Reports content...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure your preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button onClick={() => setActiveTab('dashboard')}>
                    Back to Dashboard
                  </Button>
                  <p>Settings content...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive tabs with controlled state and programmatic navigation.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList>
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Profile settings in dark mode...</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="billing">
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage billing and subscriptions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Billing information in dark mode...</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Configure application settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Settings in dark mode...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Tabs in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl dark">
        <Story />
      </div>
    ),
  ],
};
