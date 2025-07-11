import { Meta, StoryObj } from '@storybook/react';
import { useMobile } from './use-mobile';

// Demo component to showcase the hook
const MobileDetectionDemo = () => {
  const isMobile = useMobile();

  return (
    <div className="p-6 border rounded-lg bg-gray-50 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Mobile Detection Demo</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isMobile ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            Currently {isMobile ? 'Mobile' : 'Desktop'} viewport
          </span>
        </div>
        <div className="text-xs text-gray-600">
          <p>Screen width: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</p>
          <p>Breakpoint: {isMobile ? '< 768px' : '≥ 768px'}</p>
        </div>
        <div className="mt-4 p-3 bg-white rounded border text-sm">
          <strong>Usage:</strong>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
            {`const isMobile = useMobile();
// Returns true if viewport < 768px`}
          </pre>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'Hooks/useMobile',
  component: MobileDetectionDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileDetectionDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-4">useMobile Hook</h2>
      <p className="text-gray-600 mb-4">
        A React hook that detects if the current viewport is mobile-sized (< 768px).
      </p>
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-semibold mb-2">Features:</h4>
        <ul className="text-sm space-y-1">
          <li>• Responsive breakpoint detection</li>
          <li>• Automatically updates on window resize</li>
          <li>• SSR-safe with proper hydration</li>
          <li>• Based on Tailwind CSS mobile breakpoint</li>
        </ul>
      </div>
    </div>
  ),
};