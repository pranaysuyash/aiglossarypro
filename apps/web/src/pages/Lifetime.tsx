import { BookOpen, Check, Code, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { PurchaseVerification } from '../components/PurchaseVerification';
import { TestPurchaseButton } from '../components/TestPurchaseButton';
import { Button } from '../components/ui/button';
import { useCountryPricing } from '../hooks/useCountryPricing';

export default function Lifetime() {
  const [showVerification, setShowVerification] = useState(false);
  const pricing = useCountryPricing();

  const handlePurchase = () => {
    window.open('https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500', '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Master AI & Machine Learning</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-8">
            The most comprehensive AI/ML reference with 10,000+ terms, code examples, and real-world
            applications.
          </p>
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handlePurchase}
                className="text-xl px-12 py-6 bg-blue-600 hover:bg-blue-700"
              >
                Get Lifetime Access - $179
              </Button>
              <Button
                onClick={() => setShowVerification(true)}
                variant="outline"
                className="text-lg px-8 py-6"
              >
                Already Purchased? Verify Access
              </Button>
            </div>

            {/* Test Purchase Button - Only visible in development */}
            <div className="mt-4">
              <TestPurchaseButton />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              One-time payment, lifetime access. 30-day money back guarantee.
            </p>
          </div>
          <div className="flex justify-center items-center space-x-8 text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>10,000+ Terms</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Code Examples</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Lifetime Updates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="px-4 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Stop Searching. Start Learning.</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Comprehensive Coverage</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every AI/ML concept explained clearly, from basics to advanced topics. No more
                jumping between scattered resources.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <Code className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Practical Code Examples</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Real Python implementations for every concept. Copy-paste ready code that actually
                works in your projects.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Always Up-to-Date</h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI evolves rapidly. Get lifetime updates with new terms and concepts as they emerge
                in the field.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <Shield className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Risk-Free Guarantee</h3>
              <p className="text-gray-600 dark:text-gray-400">
                30-day money back guarantee. If you're not completely satisfied, get a full refund -
                no questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Master AI/ML
          </h2>
          <div className="space-y-6">
            {[
              { category: 'Machine Learning Fundamentals', count: '1,200+ terms' },
              { category: 'Deep Learning & Neural Networks', count: '2,500+ terms' },
              { category: 'Computer Vision', count: '1,800+ terms' },
              { category: 'Natural Language Processing', count: '1,500+ terms' },
              { category: 'Reinforcement Learning', count: '800+ terms' },
              { category: 'Data Science & Statistics', count: '1,200+ terms' },
              { category: 'AI Ethics & Applications', count: '1,372+ terms' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{item.category}</span>
                <span className="text-gray-600 dark:text-gray-400">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20 bg-blue-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Simple, Fair Pricing</h2>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-5xl font-bold text-blue-600 mb-4">
              ${pricing.localPrice}{' '}
              <span className="text-2xl text-gray-500 line-through">${pricing.originalPrice}</span>
            </div>
            <div className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              {pricing.isDiscounted ? 'Special Price for Your Region' : 'One-time Payment'}
            </div>
            <div className="text-sm text-gray-500 mb-8">
              Automatically adjusted for your country • {pricing.currency} pricing
            </div>
            <ul className="text-left space-y-3 mb-8">
              {[
                'All 10,000+ terms and definitions',
                'Remove all ads permanently',
                '42 detailed sections across AI/ML',
                'Code examples and implementations',
                'Lifetime updates and new content',
                'Advanced search and filtering',
                'Mobile access',
                '30-day money back guarantee',
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={handlePurchase}
              className="w-full text-xl py-6 bg-blue-600 hover:bg-blue-700"
            >
              Buy Now - Get Lifetime Access
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Early bird pricing • Save $70 • PPP automatically applied
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Is this really a one-time payment?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! Pay once and get lifetime access. No subscriptions, no recurring fees, no
                surprises. Updates are included forever.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">
                How is this different from free resources?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We provide comprehensive, structured coverage with practical code examples.
                Everything is organized, searchable, and in one place - saving you hundreds of hours
                of searching and piecing together information.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">What if I'm not satisfied?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We offer a 30-day money back guarantee. If you're not completely satisfied, just
                email us and we'll refund your purchase - no questions asked.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Do prices vary by country?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! We use Purchasing Power Parity to ensure fair pricing globally. The price will
                automatically adjust based on your location at checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 bg-gray-900 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Start Mastering AI/ML Today</h2>
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of professionals who trust our platform for their AI/ML reference needs.
          </p>
          <Button
            onClick={handlePurchase}
            className="text-xl px-12 py-6 bg-white text-gray-900 hover:bg-gray-100"
          >
            Get Lifetime Access - $179
          </Button>
          <p className="text-sm text-gray-400 mt-4">
            30-day money back guarantee • Instant access • Lifetime updates
          </p>
        </div>
      </section>

      {/* Purchase Verification Modal */}
      {showVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <Button
              onClick={() => setShowVerification(false)}
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 text-white hover:text-gray-300 z-10"
            >
              ×
            </Button>
            <PurchaseVerification onVerified={() => setShowVerification(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
