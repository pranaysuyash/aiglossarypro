import {
  BookOpen,
  Clock,
  Code,
  Download,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
} from 'lucide-react';

export function WhatYouGet() {
  const features = [
    {
      icon: BookOpen,
      title: 'Complete AI/ML Reference Library',
      description: '10,000+ terms across all AI/ML domains',
      details: 'Comprehensive coverage from basic concepts to cutting-edge research',
      color: 'text-blue-600',
    },
    {
      icon: Code,
      title: 'Code Examples & Implementations',
      description: 'Python, R, and framework-specific examples',
      details: 'Real working code for key algorithms and concepts',
      color: 'text-green-600',
    },
    {
      icon: RefreshCw,
      title: 'Lifetime Updates',
      description: 'New terms and concepts added regularly',
      details: 'Stay current as the AI/ML field evolves',
      color: 'text-purple-600',
    },
    {
      icon: Search,
      title: 'Advanced Search & Filters',
      description: 'Find exactly what you need instantly',
      details: 'Powerful search with category, difficulty, and topic filters',
      color: 'text-orange-600',
    },
    {
      icon: Smartphone,
      title: 'Mobile-Optimized Access',
      description: 'Learn anywhere, anytime',
      details: 'Fully responsive design for phone, tablet, and desktop',
      color: 'text-pink-600',
    },
    {
      icon: Shield,
      title: 'Free Tier Available',
      description: '50 AI/ML terms daily - forever free',
      details: '1,500+ terms monthly at no cost. Upgrade for unlimited access.',
      color: 'text-green-600',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 mb-4">
            One-Time Payment, Lifetime Access
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Pay once, access forever. No recurring fees.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get everything you need to master AI and Machine Learning concepts.{' '}
            <span className="text-purple-600 font-semibold">
              Save thousands vs annual subscriptions.
            </span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map(feature => (
            <div
              key={feature.title}
              className="border-2 hover:border-purple-200 transition-colors duration-300 hover:shadow-lg bg-white rounded-lg"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gray-50 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{feature.description}</p>
                    <p className="text-gray-500 text-xs">{feature.details}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Value Points */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
            <Download className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-blue-900 mb-2">Instant Access</h3>
            <p className="text-blue-700 text-sm">
              Download immediately after purchase. Start learning right away.
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-4" />
            <h3 className="font-bold text-green-900 mb-2">Save Hours</h3>
            <p className="text-green-700 text-sm">
              No more searching through scattered documentation and papers.
            </p>
          </div>

          <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
            <Shield className="w-8 h-8 text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold text-purple-900 mb-2">Free Tier</h3>
            <p className="text-purple-700 text-sm">50 terms daily free. Upgrade for unlimited.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
