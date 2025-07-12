import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './button';
import { Checkbox } from './checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';

const meta: Meta<typeof Form> = {
  title: 'UI/Form',
  component: Form,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form component built with react-hook-form and Zod validation, providing accessible form controls with error handling.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Form>;

// Basic form schema
const basicFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  age: z.number().min(1, {
    message: 'Age must be at least 1.',
  }),
});

// Profile form schema
const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  email: z.string().email(),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: 'Please enter a valid URL.' }),
      })
    )
    .optional(),
  notifications: z.boolean().default(false).optional(),
  marketing: z.boolean().default(false).optional(),
  security: z.boolean().default(true).optional(),
});

// Settings form schema
const settingsFormSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'es', 'fr', 'de']),
  notifications: z.boolean().default(false),
  newsletter: z.boolean().default(false),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
});

function BasicForm() {
  const form = useForm<z.infer<typeof basicFormSchema>>({
    resolver: zodResolver(basicFormSchema),
    defaultValues: {
      name: '',
      email: '',
      age: 0,
    },
  });

  function onSubmit(values: z.infer<typeof basicFormSchema>) {
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormDescription>
                We'll never share your email with anyone else.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter your age" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Your age helps us customize your experience.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

function ProfileForm() {
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
      notifications: false,
      marketing: false,
      security: true,
    },
  });

  function onSubmit(values: z.infer<typeof profileFormSchema>) {
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                You can manage verified email addresses in your email settings.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="notifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Email notifications
                  </FormLabel>
                  <FormDescription>
                    Receive emails about your account activity.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="marketing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Marketing emails
                  </FormLabel>
                  <FormDescription>
                    Receive emails about new products, features, and more.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="security"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Security emails
                  </FormLabel>
                  <FormDescription>
                    Receive emails about your account security.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  );
}

function SettingsForm() {
  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      theme: 'system',
      language: 'en',
      notifications: false,
      newsletter: false,
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof settingsFormSchema>) {
    alert(JSON.stringify(values, null, 2));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose your preferred theme for the interface.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                This will be used as your default language.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your preferences..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any additional information about your preferences.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="notifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Push notifications
                  </FormLabel>
                  <FormDescription>
                    Receive push notifications on your device.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newsletter"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Newsletter
                  </FormLabel>
                  <FormDescription>
                    Subscribe to our weekly newsletter.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Save settings</Button>
      </form>
    </Form>
  );
}

export const BasicExample: Story = {
  render: () => <BasicForm />,
  parameters: {
    docs: {
      description: {
        story: 'Basic form with text inputs, validation, and form descriptions.',
      },
    },
  },
};

export const ProfileExample: Story = {
  render: () => <ProfileForm />,
  parameters: {
    docs: {
      description: {
        story: 'Profile form with text inputs, textarea, and checkbox fields.',
      },
    },
  },
};

export const SettingsExample: Story = {
  render: () => <SettingsForm />,
  parameters: {
    docs: {
      description: {
        story: 'Settings form with select dropdowns, textarea, and checkbox fields.',
      },
    },
  },
};

export const ValidationStates: Story = {
  render: () => {
    const form = useForm({
      resolver: zodResolver(
        z.object({
          valid: z.string().min(3, 'Must be at least 3 characters'),
          invalid: z.string().min(10, 'Must be at least 10 characters'),
        })
      ),
      defaultValues: {
        valid: 'Valid input',
        invalid: 'Invalid',
      },
    });

    return (
      <Form {...form}>
        <form className="space-y-8">
          <FormField
            control={form.control}
            name="valid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Field</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  This field meets the validation requirements.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="invalid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invalid Field</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  This field does not meet the validation requirements.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Form showing validation states with valid and invalid fields.',
      },
    },
  },
};

export const CompactForm: Story = {
  render: () => {
    const form = useForm({
      resolver: zodResolver(
        z.object({
          name: z.string().min(2, 'Name required'),
          email: z.string().email('Invalid email'),
        })
      ),
      defaultValues: {
        name: '',
        email: '',
      },
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => alert(JSON.stringify(values)))} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Submit</Button>
        </form>
      </Form>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact form without descriptions, suitable for tight spaces.',
      },
    },
  },
};