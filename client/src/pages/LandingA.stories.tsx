import type { Meta, StoryObj } from '@storybook/react';
import LandingA from './LandingA';

const meta: Meta<typeof LandingA> = {
  title: 'Pages/LandingA',
  component: LandingA,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Landing Page A - Marketing-focused variant with sample CTA emphasis. This variant is part of the A/B test comparing marketing messaging with sample content discovery.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default marketing-focused landing page with prominent sample CTA and social proof.',
      },
    },
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized view of Landing Page A with responsive layout and touch-friendly CTAs.',
      },
    },
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet view of Landing Page A with optimized grid layouts.',
      },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Dark mode variant of Landing Page A (Note: This landing uses fixed light theme for marketing consistency).',
      },
    },
  },
};

export const ScrollProgress: Story = {
  render: () => {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 h-1">
          <div className="bg-yellow-400 h-full w-1/3 transition-all duration-300"></div>
        </div>
        <LandingA />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Landing Page A with scroll progress indicator to visualize user engagement.',
      },
    },
  },
};

export const WithNotification: Story = {
  render: () => {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <span className="font-semibold">Flash Sale: Extra 10% off!</span>
          </div>
        </div>
        <LandingA />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Landing Page A with promotional notification banner for testing urgency tactics.',
      },
    },
  },
};

export const ComparisonWithControl: Story = {
  render: () => {
    return (
      <div className="space-y-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Landing A - Marketing Focus</h2>
          <ul className="text-sm space-y-1">
            <li>• Urgency messaging (50% off limited time)</li>
            <li>• Social proof section with testimonials</li>
            <li>• Sample terms preview cards</li>
            <li>• Marketing-focused copy</li>
            <li>• Prominent free samples CTA</li>
          </ul>
        </div>
        
        <LandingA />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Landing Page A with comparison notes highlighting the marketing-focused approach vs control.',
      },
    },
  },
};

export const InteractiveElements: Story = {
  render: () => {
    const [clicks, setClicks] = React.useState({
      hero: 0,
      samples: 0,
      pricing: 0,
      final: 0,
    });
    
    React.useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        
        if (button?.textContent?.includes('Explore Free Samples')) {
          setClicks(prev => ({ ...prev, hero: prev.hero + 1 }));
        } else if (button?.textContent?.includes('Browse All Free Samples')) {
          setClicks(prev => ({ ...prev, samples: prev.samples + 1 }));
        } else if (button?.textContent?.includes('Get Instant Access')) {
          setClicks(prev => ({ ...prev, pricing: prev.pricing + 1 }));
        } else if (button?.textContent?.includes('Get Full Access Now')) {
          setClicks(prev => ({ ...prev, final: prev.final + 1 }));
        }
      };
      
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }, []);
    
    return (
      <div>
        <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-bold mb-2">Click Tracking</h3>
          <div className="space-y-1 text-sm">
            <div>Hero CTA: {clicks.hero} clicks</div>
            <div>Sample Browse: {clicks.samples} clicks</div>
            <div>Pricing CTA: {clicks.pricing} clicks</div>
            <div>Final CTA: {clicks.final} clicks</div>
          </div>
        </div>
        <LandingA />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing click tracking for different CTAs to analyze user engagement patterns.',
      },
    },
  },
};

// Import React for interactive stories
import React from 'react';

export const PerformanceOptimized: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Performance-optimized version of Landing Page A with lazy loading and optimized images.',
      },
    },
    performance: {
      hints: [
        'Images are lazy loaded',
        'Testimonials use CSS grid for performance',
        'Sample cards are virtualized on mobile',
        'Animations use transform for GPU acceleration',
      ],
    },
  },
};