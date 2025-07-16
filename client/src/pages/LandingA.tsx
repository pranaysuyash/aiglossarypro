import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock,
  Code,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Footer from '@/components/Footer';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { posthog } from '@/lib/analytics';
import { useEnhancedAnalytics } from '@/lib/enhancedAnalytics';
import { useExperiment } from '@/services/posthogExperiments';

// Landing A - Marketing-focused variant with sample CTA emphasis
export default function LandingA() {
  const [, setLocation] = useLocation();
  const { trackConversion, trackJourneyStep, trackFeatureUsage } = useEnhancedAnalytics();

  // Track page view
  useEffect(() => {
    posthog.capture('landing_a_view', {
      variant: 'marketing_sample',
      timestamp: new Date().toISOString(),
    });

    trackJourneyStep({
      step_name: 'landing_a_view',
      step_type: 'page_view',
      page_path: '/landing-a',
      user_properties: {
        landing_variant: 'marketing_sample',
      },
    });
  }, [trackJourneyStep]);

  const handleSampleCTA = () => {
    trackConversion({
      event_name: 'landing_a_sample_cta_click',
      conversion_type: 'engagement',
      value: 1,
      user_properties: {
        cta_location: 'hero',
        cta_text: 'Explore Free Samples',
      },
    });

    setLocation('/sample');
  };

  const handleSecondaryCTA = () => {
    trackConversion({
      event_name: 'landing_a_secondary_cta_click',
      conversion_type: 'engagement',
      value: 1,
      user_properties: {
        cta_location: 'hero',
        cta_text: 'View All Features',
      },
    });

    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* Hero Section - Marketing Focus */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center">
            {/* Urgency Badge */}
            <Badge className="mb-6 px-6 py-2 text-sm font-semibold bg-yellow-500 text-black">
              <Sparkles className="w-4 h-4 mr-2" />
              Limited Time: 50% Off Launch Price
            </Badge>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              The Only AI/ML Reference
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                You'll Ever Need
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-3xl mx-auto">
              Join 10,000+ professionals mastering AI with our comprehensive glossary. From neural
              networks to transformers - all explained with code examples.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-300" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-yellow-300" />
                <span>10,000+ Terms</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-yellow-300" />
                <span>1,000+ Examples</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-300" />
                <span>Updated Daily</span>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={handleSampleCTA}
                className="bg-white text-purple-700 hover:bg-gray-100 px-10 py-6 text-xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all"
              >
                <Search className="w-6 h-6 mr-3" />
                Explore Free Samples
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>

              <p className="text-yellow-300 font-semibold">
                No signup required • See real content instantly
              </p>

              <Button
                variant="ghost"
                size="lg"
                onClick={handleSecondaryCTA}
                className="text-white hover:bg-white/20 mt-4"
              >
                View All Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by AI Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See why engineers at top companies choose AI Glossary Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-500">
                        ★
                      </span>
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Terms Preview */}
      <section className="py-20 bg-white" id="preview">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1 bg-green-100 text-green-800">Free Preview</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Try Before You Buy</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore 10+ curated AI/ML terms completely free. No email required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {sampleTermsPreview.map((term, index) => (
              <Card
                key={index}
                className="border-2 border-gray-200 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={handleSampleCTA}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{term.title}</CardTitle>
                    <Badge variant="secondary">{term.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">{term.preview}</p>
                  <div className="flex items-center text-purple-600 font-semibold">
                    <span>Read Full Definition</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={handleSampleCTA}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-bold rounded-lg shadow-xl"
            >
              <Search className="w-5 h-5 mr-2" />
              Browse All Free Samples
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50" id="features">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Master AI/ML
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive features designed for serious learners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 to-pink-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="mb-6 px-6 py-2 bg-yellow-500 text-black font-bold">
            LIMITED TIME OFFER
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">One Price. Lifetime Access.</h2>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 md:p-12 mb-8">
            <div className="mb-6">
              <span className="text-2xl line-through text-gray-300">$299</span>
              <span className="text-6xl font-black text-yellow-300 ml-4">$149</span>
              <span className="text-xl text-gray-200 ml-2">one time</span>
            </div>

            <ul className="text-left max-w-md mx-auto space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>Access to all 10,000+ AI/ML terms</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>1,000+ code examples and implementations</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>Lifetime updates as AI evolves</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>30-day money-back guarantee</span>
              </li>
            </ul>

            <Button
              size="lg"
              onClick={() => {
                trackConversion({
                  event_name: 'landing_a_pricing_cta_click',
                  conversion_type: 'upgrade',
                  value: 149,
                  currency: 'USD',
                });
                setLocation('/login');
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-10 py-6 text-xl font-bold rounded-full shadow-2xl transform hover:scale-105 transition-all"
            >
              Get Instant Access
              <Zap className="w-6 h-6 ml-3" />
            </Button>
          </div>

          <p className="text-gray-300">
            Join 10,000+ professionals • No subscription fees • Instant access
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Start Your AI/ML Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Try our free samples first, or get instant access to everything.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handleSampleCTA}
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg font-semibold"
            >
              <Search className="w-5 h-5 mr-2" />
              Try Free Samples
            </Button>
            <Button
              size="lg"
              onClick={() => {
                trackConversion({
                  event_name: 'landing_a_final_cta_click',
                  conversion_type: 'upgrade',
                  value: 149,
                  currency: 'USD',
                });
                setLocation('/login');
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold"
            >
              Get Full Access Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Data
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'ML Engineer at Google',
    quote: 'This glossary is my go-to reference. The code examples save me hours of research time.',
  },
  {
    name: 'Marcus Johnson',
    role: 'Data Scientist at Meta',
    quote:
      'Finally, a resource that explains complex AI concepts in a way that actually makes sense.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'AI Researcher at OpenAI',
    quote: 'The depth and accuracy of definitions here is unmatched. Worth every penny.',
  },
];

const sampleTermsPreview = [
  {
    title: 'Neural Network',
    category: 'Deep Learning',
    preview:
      'A computational model inspired by biological neural networks, consisting of interconnected layers of nodes that process and transform data...',
  },
  {
    title: 'Transformer',
    category: 'Architecture',
    preview:
      'A revolutionary neural network architecture that uses self-attention mechanisms to process sequential data in parallel...',
  },
  {
    title: 'Gradient Descent',
    category: 'Optimization',
    preview:
      'An iterative optimization algorithm used to minimize loss functions by moving in the direction of steepest descent...',
  },
  {
    title: 'Backpropagation',
    category: 'Training',
    preview:
      'The fundamental algorithm for training neural networks by computing gradients through the chain rule...',
  },
  {
    title: 'Attention Mechanism',
    category: 'NLP',
    preview:
      'A technique that allows models to focus on relevant parts of the input when producing outputs...',
  },
  {
    title: 'Convolutional Layer',
    category: 'Computer Vision',
    preview:
      'A specialized neural network layer that applies learnable filters to detect features in spatial data...',
  },
];

const features = [
  {
    icon: Brain,
    title: '10,000+ Definitions',
    description:
      'Comprehensive coverage of every AI/ML concept from basics to cutting-edge research.',
  },
  {
    icon: Code,
    title: 'Code Examples',
    description:
      'Real implementation examples in Python, TensorFlow, and PyTorch for every concept.',
  },
  {
    icon: TrendingUp,
    title: 'Learning Paths',
    description: 'Structured journeys from beginner to expert, tailored to your goals.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'AI-powered search that understands context and finds exactly what you need.',
  },
  {
    icon: BookOpen,
    title: 'Use Cases',
    description: 'Real-world applications and case studies for every term and concept.',
  },
  {
    icon: Sparkles,
    title: 'Daily Updates',
    description: 'Stay current with the latest AI developments and terminology.',
  },
];
