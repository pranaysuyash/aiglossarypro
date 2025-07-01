import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { HeroSection } from './HeroSection';

import { setMockCountryPricing } from '@/hooks/__mocks__/useCountryPricing';

const createMockPricing = (overrides = {}) => ({
  basePrice: 299,
  localPrice: 249,
  discount: 17,
  countryName: 'United States',
  countryCode: 'US',
  currency: 'USD',
  annualSavings: 351,
  loading: false,
  flag: '🇺🇸',
  localCompetitor: 'DataCamp',
  ...overrides,
});

const HeroSectionDecorator = (Story, context) => {
  const { mockPricing } = context.parameters;

  setMockCountryPricing(mockPricing || createMockPricing());

  return <Story />;
};

const meta: Meta<typeof HeroSection> = {
  title: 'Landing/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Hero section component for the landing page with compelling headlines, social proof, and clear call-to-action.',
      },
    },
  },
  decorators: [
    HeroSectionDecorator,
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default hero section with gradient background, compelling copy, and prominent CTA button.',
      },
    },
  },
};

export const WithDifferentPricing: Story = {
  parameters: {
    mockPricing: createMockPricing({
      localPrice: 199,
      discount: 33,
      countryName: 'India',
      countryCode: 'IN',
      currency: 'USD',
    }),
    docs: {
      description: {
        story: 'Hero section with different pricing for international markets.',
      },
    },
  },
};

export const LoadingState: Story = {
  parameters: {
    mockPricing: createMockPricing({
      loading: true,
    }),
    docs: {
      description: {
        story: 'Hero section in loading state while pricing data is being fetched.',
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
        story: 'Hero section optimized for mobile devices.',
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
        story: 'Hero section on tablet devices.',
      },
    },
  },
};

export const HighContrastMode: Story = {
  decorators: [
    (Story) => (
      <div style={{ filter: 'contrast(150%) brightness(110%)' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Hero section with high contrast for accessibility.',
      },
    },
  },
};

export const WithCustomContent: Story = {
  render: () => {
    const CustomHeroSection = () => {
      return (
        <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900 text-white py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 text-white rounded-full inline-block">
              🚀 Now with 15,000+ terms
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Your AI/ML Knowledge Hub
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              The ultimate reference for AI professionals with comprehensive definitions, 
              practical examples, and cutting-edge insights.
            </p>
            
            <div className="space-y-4">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl transition-all transform hover:scale-105">
                Get Instant Access
              </button>
              
              <p className="text-gray-400 text-sm">
                Join thousands of professionals • Lifetime access for $299
              </p>
            </div>
          </div>
        </section>
      );
    };
    
    return <CustomHeroSection />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom hero section with different messaging and styling.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [ctaClicked, setCtaClicked] = React.useState(false);
    const [previewClicked, setPreviewClicked] = React.useState(false);
    
    const InteractiveHero = () => {
      return (
        <div className="space-y-8">
          <section className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-20 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <div className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 text-white rounded-full inline-flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Join 1,000+ AI/ML professionals
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Master AI & Machine Learning
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                The most comprehensive AI/ML reference with <span className="text-purple-300 font-semibold">10,000+ terms</span>, 
                code examples, and real-world applications.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setCtaClicked(!ctaClicked)}
                  className={`px-8 py-4 text-lg font-semibold rounded-lg shadow-xl transition-all transform hover:scale-105 ${
                    ctaClicked 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white`}
                >
                  {ctaClicked ? 'Clicked! ✓' : 'Start Your 7-Day Free Trial'}
                </button>
                
                <p className="text-gray-400 text-sm">
                  No credit card required • Instant access • Then $249 one-time for lifetime access
                </p>
                
                <div className="pt-4">
                  <button 
                    onClick={() => setPreviewClicked(!previewClicked)}
                    className={`border text-white hover:bg-white/10 px-6 py-3 rounded-lg transition-all ${
                      previewClicked ? 'border-green-400 bg-green-400/10' : 'border-white/30'
                    }`}
                  >
                    {previewClicked ? 'Preview Clicked! ✓' : 'See What\'s Inside'}
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Interaction feedback */}
          <div className="max-w-2xl mx-auto p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Interaction Status:</h3>
            <div className="space-y-1 text-sm">
              <p>Main CTA clicked: {ctaClicked ? '✅ Yes' : '❌ No'}</p>
              <p>Preview button clicked: {previewClicked ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        </div>
      );
    };
    
    return <InteractiveHero />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing button states and user interactions.',
      },
    },
  },
};

export const A11yOptimized: Story = {
  render: () => {
    const AccessibleHeroSection = () => {
      return (
        <section 
          className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-20 px-4"
          aria-labelledby="hero-heading"
          role="banner"
        >
          <div className="max-w-7xl mx-auto text-center">
            <div 
              className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 text-white rounded-full inline-block"
              role="status"
              aria-label="Social proof: Join 1,000+ AI/ML professionals"
            >
              👥 Join 1,000+ AI/ML professionals
            </div>

            <h1 
              id="hero-heading"
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              Master AI & Machine Learning
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed"
              aria-describedby="hero-description"
            >
              The most comprehensive AI/ML reference with{' '}
              <span className="text-purple-300 font-semibold">10,000+ terms</span>, 
              code examples, and real-world applications.
            </p>
            
            <ul className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-gray-300" aria-label="Key features">
              <li className="flex items-center gap-2">
                <span aria-hidden="true">📚</span>
                <span>10,000+ Definitions</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">💻</span>
                <span>Code Examples</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true">🎯</span>
                <span>Real Applications</span>
              </li>
            </ul>

            <div className="space-y-4" role="group" aria-label="Call to action buttons">
              <button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50"
                aria-describedby="cta-description"
              >
                Start Your 7-Day Free Trial
                <span className="ml-2" aria-hidden="true">→</span>
              </button>
              
              <p id="cta-description" className="text-gray-400 text-sm">
                No credit card required • Instant access • Then $249 one-time for lifetime access
              </p>
              
              <div className="pt-4">
                <button 
                  className="border-white/30 text-white hover:bg-white/10 px-6 py-3 border rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30"
                  aria-label="See what's inside the AI/ML Glossary"
                >
                  See What's Inside
                </button>
              </div>
            </div>

            <div className="mt-8 text-gray-400 text-sm" role="contentinfo">
              <p>✅ 30-day money back guarantee • ✅ Instant access • ✅ Lifetime updates</p>
            </div>
          </div>
        </section>
      );
    };
    
    return <AccessibleHeroSection />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Hero section with enhanced accessibility features including ARIA labels, roles, and focus management.',
      },
    },
  },
};

export const PerformanceOptimized: Story = {
  render: () => {
    const OptimizedHeroSection = () => {
      return (
        <section className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            {/* Optimized badge with minimal DOM */}
            <div className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 text-white rounded-full inline-block">
              Join 1,000+ AI/ML professionals
            </div>

            {/* Semantic HTML for better performance */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Master AI & Machine Learning
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              The most comprehensive AI/ML reference with{' '}
              <strong className="text-purple-300">10,000+ terms</strong>, 
              code examples, and real-world applications.
            </p>
            
            {/* Optimized list structure */}
            <ul className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-gray-300">
              <li>📚 10,000+ Definitions</li>
              <li>💻 Code Examples</li>
              <li>🎯 Real Applications</li>
            </ul>

            {/* Optimized buttons with minimal re-renders */}
            <div className="space-y-4">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl transition-colors">
                Start Your 7-Day Free Trial →
              </button>
              
              <p className="text-gray-400 text-sm">
                No credit card required • Instant access • Then $249 one-time
              </p>
              
              <button className="border-white/30 text-white hover:bg-white/10 px-6 py-3 border rounded-lg transition-colors">
                See What's Inside
              </button>
            </div>

            <p className="mt-8 text-gray-400 text-sm">
              ✅ 30-day guarantee • ✅ Instant access • ✅ Lifetime updates
            </p>
          </div>
        </section>
      );
    };
    
    return <OptimizedHeroSection />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance-optimized hero section with minimal DOM manipulation and efficient rendering.',
      },
    },
  },
};

export const ComparisonVariants: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Variant A: Standard */}
      <div>
        <h3 className="text-lg font-semibold mb-4 px-4">Variant A: Standard Hero</h3>
        <HeroSection />
      </div>
      
      {/* Variant B: Minimal */}
      <div>
        <h3 className="text-lg font-semibold mb-4 px-4">Variant B: Minimal Hero</h3>
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI/ML Glossary Pro
            </h1>
            <p className="text-xl mb-8">
              10,000+ AI/ML terms in one place
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 text-lg font-semibold rounded-lg hover:bg-gray-100">
              Get Started - $249
            </button>
          </div>
        </section>
      </div>
      
      {/* Variant C: Feature-Heavy */}
      <div>
        <h3 className="text-lg font-semibold mb-4 px-4">Variant C: Feature-Heavy Hero</h3>
        <section className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-24 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8 px-6 py-3 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full inline-block">
              🔥 Limited Time: 50% Off Launch Price
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              The Complete AI/ML Reference
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-5xl mx-auto">
              Master every AI concept with our comprehensive glossary featuring{' '}
              <span className="text-purple-300 font-bold">10,000+ terms</span>,{' '}
              <span className="text-blue-300 font-bold">practical examples</span>, and{' '}
              <span className="text-green-300 font-bold">real-world applications</span>
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300">10,000+</div>
                <div className="text-sm">Definitions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300">500+</div>
                <div className="text-sm">Code Examples</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300">100+</div>
                <div className="text-sm">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300">24/7</div>
                <div className="text-sm">Access</div>
              </div>
            </div>
            
            <div className="space-y-6">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-5 text-xl font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105">
                Get Lifetime Access - Only $149 (50% Off)
              </button>
              
              <p className="text-gray-300">
                ⏰ Offer expires in 24 hours • 💳 No subscription • 🔄 30-day refund
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Comparison of different hero section variants for A/B testing purposes.',
      },
    },
  },
};
