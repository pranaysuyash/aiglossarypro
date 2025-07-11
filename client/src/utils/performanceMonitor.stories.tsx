import { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';

// Demo component to showcase the performance monitor
const PerformanceMonitorDemo = () => {
  const [metrics, setMetrics] = useState<any>({});
  
  useEffect(() => {
    // Simulate performance metrics
    const performanceData = {
      loadTime: '1.2s',
      firstContentfulPaint: '0.8s',
      largestContentfulPaint: '1.5s',
      cumulativeLayoutShift: '0.1',
      firstInputDelay: '12ms'
    };
    
    setMetrics(performanceData);
  }, []);

  return (
    <div className="p-6 border rounded-lg bg-gray-50 max-w-lg">
      <h3 className="text-lg font-semibold mb-4">Performance Monitor</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-xs text-gray-500">Load Time</div>
            <div className="text-lg font-semibold text-green-600">{metrics.loadTime}</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-xs text-gray-500">FCP</div>
            <div className="text-lg font-semibold text-blue-600">{metrics.firstContentfulPaint}</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-xs text-gray-500">LCP</div>
            <div className="text-lg font-semibold text-orange-600">{metrics.largestContentfulPaint}</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-xs text-gray-500">CLS</div>
            <div className="text-lg font-semibold text-purple-600">{metrics.cumulativeLayoutShift}</div>
          </div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-xs text-gray-500">First Input Delay</div>
          <div className="text-lg font-semibold text-indigo-600">{metrics.firstInputDelay}</div>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'Utils/PerformanceMonitor',
  component: PerformanceMonitorDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PerformanceMonitorDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-4">Performance Monitor</h2>
      <p className="text-gray-600 mb-4">
        A utility for monitoring and tracking application performance metrics.
      </p>
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-semibold mb-2">Key Metrics:</h4>
        <ul className="text-sm space-y-1">
          <li>• <strong>FCP</strong>: First Contentful Paint</li>
          <li>• <strong>LCP</strong>: Largest Contentful Paint</li>
          <li>• <strong>CLS</strong>: Cumulative Layout Shift</li>
          <li>• <strong>FID</strong>: First Input Delay</li>
        </ul>
      </div>
    </div>
  ),
};