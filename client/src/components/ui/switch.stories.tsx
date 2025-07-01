import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A control that allows users to toggle between checked and not checked states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: { type: 'boolean' },
      description: 'Whether the switch is checked',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the switch is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Switch />,
  parameters: {
    docs: {
      description: {
        story: 'Default switch in unchecked state.',
      },
    },
  },
};

export const Checked: Story = {
  render: () => <Switch defaultChecked />,
  parameters: {
    docs: {
      description: {
        story: 'Switch in checked state.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex space-x-4">
      <Switch disabled />
      <Switch disabled defaultChecked />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled switches in both checked and unchecked states.',
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane mode</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switch with an associated label.',
      },
    },
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notifications">Push Notifications</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Receive notifications about new messages and updates
          </p>
        </div>
        <Switch id="notifications" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="marketing">Marketing Emails</Label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Receive promotional emails and special offers
          </p>
        </div>
        <Switch id="marketing" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switches with descriptive labels and help text.',
      },
    },
  },
};

export const SettingsPanel: Story = {
  render: () => (
    <div className="w-80 space-y-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use dark theme
            </p>
          </div>
          <Switch id="dark-mode" />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-save">Auto Save</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically save changes
            </p>
          </div>
          <Switch id="auto-save" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="show-preview">Show Preview</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Display live preview
            </p>
          </div>
          <Switch id="show-preview" defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="public-profile">Public Profile</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Make your profile visible to others
            </p>
          </div>
          <Switch id="public-profile" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete settings panel with multiple switches.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [isEnabled, setIsEnabled] = React.useState(false);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="interactive-switch"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
          <Label htmlFor="interactive-switch">
            Feature is {isEnabled ? 'enabled' : 'disabled'}
          </Label>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isEnabled 
            ? '✅ The feature is currently active and working.'
            : '❌ The feature is currently inactive.'
          }
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive switch with state management and feedback.',
      },
    },
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      marketingEmails: false,
      weeklyDigest: true,
    });
    
    const handleChange = (key: keyof typeof formData) => (checked: boolean) => {
      setFormData(prev => ({ ...prev, [key]: checked }));
    };
    
    return (
      <div className="w-96 space-y-6 p-6 border rounded-lg">
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch 
              id="email-notifications"
              checked={formData.emailNotifications}
              onCheckedChange={handleChange('emailNotifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notifications">SMS Notifications</Label>
            <Switch 
              id="sms-notifications"
              checked={formData.smsNotifications}
              onCheckedChange={handleChange('smsNotifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <Switch 
              id="push-notifications"
              checked={formData.pushNotifications}
              onCheckedChange={handleChange('pushNotifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing-emails">Marketing Emails</Label>
            <Switch 
              id="marketing-emails"
              checked={formData.marketingEmails}
              onCheckedChange={handleChange('marketingEmails')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-digest">Weekly Digest</Label>
            <Switch 
              id="weekly-digest"
              checked={formData.weeklyDigest}
              onCheckedChange={handleChange('weeklyDigest')}
            />
          </div>
        </div>
        
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
          <strong>Current Settings:</strong>
          <ul className="mt-1 space-y-1">
            {Object.entries(formData).map(([key, value]) => (
              <li key={key}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {' '}
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {value ? 'On' : 'Off'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A complete form with multiple switches and state management.',
      },
    },
  },
};

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch 
          id="screen-reader"
          aria-describedby="screen-reader-description"
        />
        <Label htmlFor="screen-reader">Screen Reader Support</Label>
      </div>
      <p id="screen-reader-description" className="text-sm text-gray-600 dark:text-gray-400">
        Enable enhanced accessibility features for screen readers
      </p>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="high-contrast"
          aria-describedby="high-contrast-description"
        />
        <Label htmlFor="high-contrast">High Contrast Mode</Label>
      </div>
      <p id="high-contrast-description" className="text-sm text-gray-600 dark:text-gray-400">
        Increase contrast for better visibility
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switches with proper accessibility attributes and descriptions.',
      },
    },
  },
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch 
          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
        />
        <Label>Green theme</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-200"
        />
        <Label>Red theme</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          className="data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-gray-200"
        />
        <Label>Purple theme</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          className="h-8 w-14 data-[state=checked]:bg-blue-500"
        />
        <Label>Large switch</Label>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Switches with custom colors and sizes.',
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false);
    
    const handleToggle = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 2000);
    };
    
    return (
      <div className="flex items-center space-x-2">
        <Switch 
          disabled={isLoading}
          onCheckedChange={handleToggle}
          className={isLoading ? 'opacity-50' : ''}
        />
        <Label>
          {isLoading ? 'Saving...' : 'Auto Backup'}
        </Label>
        {isLoading && (
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Switch with loading state simulation.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="dark-notifications">Notifications</Label>
          <p className="text-sm text-gray-400">
            Receive push notifications
          </p>
        </div>
        <Switch id="dark-notifications" />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="dark-auto-save">Auto Save</Label>
          <p className="text-sm text-gray-400">
            Automatically save changes
          </p>
        </div>
        <Switch id="dark-auto-save" defaultChecked />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch disabled />
        <Switch disabled defaultChecked />
        <Label>Disabled switches</Label>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Switch components in dark mode theme.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 dark">
        <Story />
      </div>
    ),
  ],
};
