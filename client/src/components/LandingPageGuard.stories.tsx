import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { posthogExperiments } from '@/services/posthogExperiments';
import { LandingPageGuard } from './LandingPageGuard';

const meta: Meta<typeof LandingPageGuard> = {
  title: 'Components/LandingPageGuard',
  component: LandingPageGuard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A/B test guard component that routes users to different landing page variants based on PostHog experiment flags. Controls the landing page experiment flow.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to mock experiment variants
const mockExperimentVariant = (variant: string) => {
  (posthogExperiments as any).getExperimentVariant = (key: string) => {
    if (key === 'landingPageVariant') return variant;
    if (key === 'landingPageCTA') return 'control'; // Default for other experiments
    return 'control';
  };
};

export const ControlVariant: Story = {
  decorators: [
    _ => {
      React.useEffect(() => {
        mockExperimentVariant('control');
      }, []);
      return <LandingPageGuard />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Control variant - Shows the original landing page with standard hero section and CTAs.',
      },
    },
  },
};

export const MarketingSampleVariant: Story = {
  decorators: [
    _ => {
      React.useEffect(() => {
        mockExperimentVariant('marketing_sample');
      }, []);
      return <LandingPageGuard />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Marketing Sample variant - Shows Landing Page A with marketing focus and sample CTA emphasis.',
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => {
    const [showLoading, setShowLoading] = React.useState(true);

    React.useEffect(() => {
      const timer = setTimeout(() => setShowLoading(false), 2000);
      return () => clearTimeout(timer);
    }, []);

    if (showLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading experiment variant...</p>
          </div>
        </div>
      );
    }

    return <LandingPageGuard />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state shown while PostHog determines which variant to display.',
      },
    },
  },
};

export const VariantComparison: Story = {
  render: () => {
    const [currentVariant, setCurrentVariant] = React.useState('control');

    React.useEffect(() => {
      mockExperimentVariant(currentVariant);
    }, [currentVariant]);

    return (
      <div>
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4">
          <h3 className="font-bold mb-2">A/B Test Control</h3>
          <div className="space-y-2">
            <button
              onClick={() => setCurrentVariant('control')}
              className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
                currentVariant === 'control'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Control (Original)
            </button>
            <button
              onClick={() => setCurrentVariant('marketing_sample')}
              className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
                currentVariant === 'marketing_sample'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Marketing Sample
            </button>
          </div>
          <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
            <p className="font-semibold">Current: {currentVariant}</p>
            <p className="text-gray-600">Click to switch variants</p>
          </div>
        </div>

        <LandingPageGuard />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive comparison allowing you to switch between landing page variants to see the differences.',
      },
    },
  },
};

export const ExperimentMetrics: Story = {
  render: () => {
    const [metrics, setMetrics] = React.useState({
      control: { views: 0, clicks: 0 },
      marketing_sample: { views: 0, clicks: 0 },
    });
    const [activeVariant, setActiveVariant] = React.useState('control');

    React.useEffect(() => {
      mockExperimentVariant(activeVariant);
      setMetrics(prev => ({
        ...prev,
        [activeVariant]: {
          ...prev[activeVariant as keyof typeof prev],
          views: prev[activeVariant as keyof typeof prev].views + 1,
        },
      }));
    }, [activeVariant]);

    React.useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON') {
          setMetrics(prev => ({
            ...prev,
            [activeVariant]: {
              ...prev[activeVariant as keyof typeof prev],
              clicks: prev[activeVariant as keyof typeof prev].clicks + 1,
            },
          }));
        }
      };

      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }, [activeVariant]);

    const controlCTR =
      metrics.control.views > 0
        ? ((metrics.control.clicks / metrics.control.views) * 100).toFixed(1)
        : '0.0';
    const marketingCTR =
      metrics.marketing_sample.views > 0
        ? ((metrics.marketing_sample.clicks / metrics.marketing_sample.views) * 100).toFixed(1)
        : '0.0';

    return (
      <div>
        <div className="fixed top-4 left-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
          <h3 className="font-bold mb-4">A/B Test Metrics Dashboard</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold text-blue-700">Control Variant</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>Views: {metrics.control.views}</p>
                <p>Clicks: {metrics.control.clicks}</p>
                <p>CTR: {controlCTR}%</p>
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-semibold text-green-700">Marketing Sample</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>Views: {metrics.marketing_sample.views}</p>
                <p>Clicks: {metrics.marketing_sample.clicks}</p>
                <p>CTR: {marketingCTR}%</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveVariant('control')}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Control
            </button>
            <button
              onClick={() => setActiveVariant('marketing_sample')}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Marketing
            </button>
          </div>
        </div>

        <div className="pt-32">
          <LandingPageGuard />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Live metrics dashboard showing simulated A/B test performance for both variants.',
      },
    },
  },
};

export const MobileComparison: Story = {
  render: () => {
    const [variant, setVariant] = React.useState('control');

    React.useEffect(() => {
      mockExperimentVariant(variant);
    }, [variant]);

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <h2 className="text-xl font-bold mb-4">Mobile Landing Page A/B Test</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setVariant('control')}
                className={`px-4 py-2 rounded ${
                  variant === 'control' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Control
              </button>
              <button
                onClick={() => setVariant('marketing_sample')}
                className={`px-4 py-2 rounded ${
                  variant === 'marketing_sample' ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
              >
                Marketing
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="mx-auto" style={{ maxWidth: '375px' }}>
              <div className="border-8 border-gray-800 rounded-3xl overflow-hidden">
                <div className="bg-gray-800 h-6"></div>
                <div className="h-[667px] overflow-y-auto">
                  <LandingPageGuard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile device frame showing how both landing page variants appear on smartphones.',
      },
    },
  },
};
