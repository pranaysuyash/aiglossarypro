import type { Meta, StoryObj } from '@storybook/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Demo component to showcase the main entry point
const MainDemo = () => {
  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Main Entry Point</h2>
      <p className="text-gray-600 mb-4">
        The main.tsx file is the entry point for the AI Glossary Pro React application.
      </p>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h4 className="font-semibold mb-2">Application Bootstrap:</h4>
        <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
{`import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`}
        </pre>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <h4 className="font-semibold mb-2">Key Features:</h4>
        <ul className="text-sm space-y-1">
          <li>• React 18 with createRoot API</li>
          <li>• StrictMode for development checks</li>
          <li>• CSS imports for styling</li>
          <li>• TypeScript support</li>
        </ul>
      </div>
    </div>
  );
};

const meta = {
  title: 'App/Main Entry',
  component: MainDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MainDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Architecture: Story = {
  render: () => (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-bold mb-4">Application Architecture</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Client-Side</h3>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• React 18 with TypeScript</li>
            <li>• Vite for build tooling</li>
            <li>• Tailwind CSS for styling</li>
            <li>• React Router for navigation</li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Server-Side</h3>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• Express.js REST API</li>
            <li>• MongoDB database</li>
            <li>• Authentication system</li>
            <li>• File upload handling</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};
