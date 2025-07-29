import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider } from './ThemeProvider';

const meta = {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4">
        <h2 className="text-lg font-bold">Theme Provider Example</h2>
        <p className="text-gray-600">This content is wrapped by the theme provider.</p>
      </div>
    ),
  },
};

export const WithProps: Story = {
  args: {
    children: (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold">Dark Theme Provider</h2>
        <p className="text-gray-600">This example uses a dark default theme.</p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Sample Button</button>
      </div>
    ),
    defaultTheme: 'dark',
    storageKey: 'theme-preference',
  },
};
