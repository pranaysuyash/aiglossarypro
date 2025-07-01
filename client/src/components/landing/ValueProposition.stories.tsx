import type { Meta, StoryObj } from '@storybook/react';
import { ValueProposition } from './ValueProposition';

const meta: Meta<typeof ValueProposition> = {
  title: 'Landing/ValueProposition',
  component: ValueProposition,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Value proposition section that highlights problems with current solutions and presents the product as the solution.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default value proposition with problem/solution comparison and call-out section.',
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
        story: 'Value proposition optimized for mobile devices.',
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
        story: 'Value proposition on tablet devices.',
      },
    },
  },
};

export const CustomContent: Story = {
  render: () => {
    const CustomValueProposition = () => {
      return (
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Stop Wasting Time on Scattered Resources
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to master AI/ML in one comprehensive platform.
              </p>
            </div>

            {/* Problem vs Solution Grid */}
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              {/* Problems */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center">
                  ❌ Current Challenges
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-500 text-lg">🔍</span>
                    <div>
                      <h4 className="font-semibold text-red-900">Information Overload</h4>
                      <p className="text-red-700 text-sm">Endless Google searches for basic AI concepts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-500 text-lg">⏰</span>
                    <div>
                      <h4 className="font-semibold text-red-900">Time Drain</h4>
                      <p className="text-red-700 text-sm">Hours wasted piecing together incomplete information</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-red-500 text-lg">💸</span>
                    <div>
                      <h4 className="font-semibold text-red-900">Subscription Fatigue</h4>
                      <p className="text-red-700 text-sm">Multiple expensive subscriptions with limited AI content</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solutions */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
                  ✅ Our Solution
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-500 text-lg">📚</span>
                    <div>
                      <h4 className="font-semibold text-green-900">Centralized Knowledge</h4>
                      <p className="text-green-700 text-sm">15,000+ AI/ML terms in one searchable database</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-500 text-lg">⚡</span>
                    <div>
                      <h4 className="font-semibold text-green-900">Instant Access</h4>
                      <p className="text-green-700 text-sm">Find any concept in seconds with smart search</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-500 text-lg">💰</span>
                    <div>
                      <h4 className="font-semibold text-green-900">One-Time Payment</h4>
                      <p className="text-green-700 text-sm">$199 lifetime access vs $500+/year subscriptions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced CTA */}
            <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">
                Join 5,000+ AI Professionals Who've Made the Switch
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm mb-6">
                <div>
                  <div className="font-semibold">✨ 15,000+ Terms</div>
                  <div className="opacity-90">Comprehensive coverage</div>
                </div>
                <div>
                  <div className="font-semibold">🚀 Code Examples</div>
                  <div className="opacity-90">Practical implementations</div>
                </div>
                <div>
                  <div className="font-semibold">🔄 Lifetime Updates</div>
                  <div className="opacity-90">Always current</div>
                </div>
              </div>
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Instant Access
              </button>
            </div>
          </div>
        </section>
      );
    };
    
    return <CustomValueProposition />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom value proposition with different messaging and enhanced visual elements.',
      },
    },
  },
};

export const MinimalVersion: Story = {
  render: () => {
    const MinimalValueProposition = () => {
      return (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Why Choose AI/ML Glossary Pro?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="text-3xl mb-4">📚</div>
                <h3 className="font-bold mb-2">Comprehensive</h3>
                <p className="text-gray-600">10,000+ terms covering all AI/ML concepts</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="font-bold mb-2">Fast</h3>
                <p className="text-gray-600">Instant search and smart recommendations</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="text-3xl mb-4">💡</div>
                <h3 className="font-bold mb-2">Practical</h3>
                <p className="text-gray-600">Real examples and code implementations</p>
              </div>
            </div>
            
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800 font-medium">
                One payment, lifetime access. No subscriptions.
              </p>
            </div>
          </div>
        </section>
      );
    };
    
    return <MinimalValueProposition />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Simplified value proposition with clean layout and minimal copy.',
      },
    },
  },
};

export const FeatureComparison: Story = {
  render: () => {
    const FeatureComparisonSection = () => {
      const competitors = [
        { name: 'Scattered Docs', time: 'Hours', cost: 'Free but inefficient', coverage: 'Incomplete' },
        { name: 'DataCamp', time: '30+ min', cost: '$300+/year', coverage: 'Limited AI focus' },
        { name: 'Coursera', time: '45+ min', cost: '$600+/year', coverage: 'Course-based only' },
        { name: 'AI Glossary Pro', time: 'Seconds', cost: '$249 lifetime', coverage: '10,000+ AI/ML terms' },
      ];
      
      return (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                How We Compare
              </h2>
              <p className="text-xl text-gray-600">
                Stop wasting time and money on inferior solutions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left font-semibold">Solution</th>
                    <th className="p-4 text-left font-semibold">Time to Find Info</th>
                    <th className="p-4 text-left font-semibold">Cost</th>
                    <th className="p-4 text-left font-semibold">AI/ML Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((competitor, index) => (
                    <tr 
                      key={competitor.name} 
                      className={`border-t ${competitor.name === 'AI Glossary Pro' ? 'bg-green-50 border-green-200' : ''}`}
                    >
                      <td className={`p-4 font-medium ${competitor.name === 'AI Glossary Pro' ? 'text-green-800' : ''}`}>
                        {competitor.name}
                        {competitor.name === 'AI Glossary Pro' && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Recommended
                          </span>
                        )}
                      </td>
                      <td className="p-4">{competitor.time}</td>
                      <td className="p-4">{competitor.cost}</td>
                      <td className="p-4">{competitor.coverage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="text-center mt-12">
              <button className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors">
                Choose the Smart Solution
              </button>
              <p className="text-gray-600 mt-2">Join thousands who've already made the switch</p>
            </div>
          </div>
        </section>
      );
    };
    
    return <FeatureComparisonSection />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Detailed feature comparison table showing advantages over competitors.',
      },
    },
  },
};

export const TestimonialIntegrated: Story = {
  render: () => {
    const TestimonialValueProposition = () => {
      return (
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Trusted by AI Professionals Worldwide
              </h2>
            </div>

            {/* Testimonials */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-sm text-gray-600">ML Engineer, Google</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Saves me hours every week. No more jumping between 10 different sites to understand AI concepts."
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Marcus Johnson</div>
                    <div className="text-sm text-gray-600">Data Scientist, Tesla</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "The code examples are incredibly helpful. Finally, a resource that's both comprehensive and practical."
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold">Aisha Patel</div>
                    <div className="text-sm text-gray-600">AI Researcher, MIT</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "Best investment I've made for my AI education. The search feature is incredibly fast and accurate."
                </p>
              </div>
            </div>

            {/* Value proposition */}
            <div className="text-center bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Join These Professionals and Thousands More
              </h3>
              
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">10,000+</div>
                  <div className="text-sm text-gray-600">Definitions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Code Examples</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">5,000+</div>
                  <div className="text-sm text-gray-600">Happy Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">24/7</div>
                  <div className="text-sm text-gray-600">Access</div>
                </div>
              </div>
              
              <button className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors">
                Get Your Copy Today
              </button>
            </div>
          </div>
        </section>
      );
    };
    
    return <TestimonialValueProposition />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Value proposition with integrated testimonials and social proof.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selectedProblem, setSelectedProblem] = React.useState(0);
    
    const problems = [
      {
        title: 'Scattered Information',
        description: 'Searching through dozens of websites and documentation',
        solution: 'Everything in one comprehensive platform',
        impact: 'Save 5+ hours per week',
      },
      {
        title: 'Expensive Subscriptions',
        description: '$300-600/year for multiple platforms with limited AI content',
        solution: 'One-time payment for lifetime access',
        impact: 'Save $1000+ annually',
      },
      {
        title: 'Incomplete Resources',
        description: 'Partial information requiring multiple sources',
        solution: '10,000+ complete definitions with examples',
        impact: 'Complete understanding every time',
      },
    ];
    
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Interactive Problem Solver
            </h2>
            <p className="text-xl text-gray-600">
              Click on each problem to see how we solve it
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {problems.map((problem, index) => (
              <button
                key={index}
                onClick={() => setSelectedProblem(index)}
                className={`p-4 rounded-lg text-left transition-all ${
                  selectedProblem === index
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <h3 className="font-bold mb-2">{problem.title}</h3>
                <p className="text-sm opacity-90">{problem.description}</p>
              </button>
            ))}
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-red-600 mb-4">The Problem</h3>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">
                    {problems[selectedProblem].title}
                  </h4>
                  <p className="text-red-700">
                    {problems[selectedProblem].description}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-green-600 mb-4">Our Solution</h3>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">
                    {problems[selectedProblem].solution}
                  </h4>
                  <p className="text-green-700 mb-3">
                    Direct solution to eliminate this problem completely.
                  </p>
                  <div className="font-semibold text-green-800">
                    💡 Impact: {problems[selectedProblem].impact}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Solve All These Problems Today
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive value proposition where users can explore different problems and solutions.',
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => {
    const DarkValueProposition = () => {
      return (
        <section className="py-20 px-4 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Stop Struggling with Scattered AI Resources
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Get everything you need in one comprehensive platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              {/* Problems */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-red-400 mb-6">
                  ❌ The Problem
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                    <h4 className="font-semibold text-red-300 mb-1">Scattered Information</h4>
                    <p className="text-red-200 text-sm">Hours spent searching multiple sources</p>
                  </div>
                  
                  <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                    <h4 className="font-semibold text-red-300 mb-1">Expensive Subscriptions</h4>
                    <p className="text-red-200 text-sm">$300-600/year with limited AI coverage</p>
                  </div>
                </div>
              </div>

              {/* Solutions */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-green-400 mb-6">
                  ✅ Our Solution
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                    <h4 className="font-semibold text-green-300 mb-1">All-in-One Platform</h4>
                    <p className="text-green-200 text-sm">10,000+ terms with examples and code</p>
                  </div>
                  
                  <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                    <h4 className="font-semibold text-green-300 mb-1">Lifetime Value</h4>
                    <p className="text-green-200 text-sm">$249 one-time vs recurring subscriptions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center bg-purple-800/50 border border-purple-500/30 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">
                When you join AI/ML Glossary Pro:
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div>
                  <div className="font-semibold text-purple-300">✅ 10,000+ AI/ML terms</div>
                  <div className="text-gray-300">with detailed explanations</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-300">✅ Code examples</div>
                  <div className="text-gray-300">for every major concept</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-300">✅ Real applications</div>
                  <div className="text-gray-300">and use cases</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-300">✅ Lifetime updates</div>
                  <div className="text-gray-300">as the field evolves</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    };
    
    return <DarkValueProposition />;
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Value proposition in dark mode theme.',
      },
    },
  },
};
