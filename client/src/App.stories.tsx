import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock App component for Storybook
const AppDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AI Glossary Pro</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Categories</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to AI Glossary Pro
              </h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Your comprehensive guide to artificial intelligence terminology and concepts.
              </p>
              <div className="space-x-4">
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                  Explore Terms
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const meta = {
  title: 'App/Main',
  component: AppDemo,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof AppDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Documentation: Story = {
  render: () => (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">App Component</h2>
      <p className="text-gray-600 mb-4">
        The main App component that serves as the root of the AI Glossary Pro application.
      </p>
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-semibold mb-2">Features:</h4>
        <ul className="text-sm space-y-1">
          <li>• React Router for navigation</li>
          <li>• React Query for data management</li>
          <li>• Responsive design with Tailwind CSS</li>
          <li>• Comprehensive AI terminology database</li>
        </ul>
      </div>
    </div>
  ),
};