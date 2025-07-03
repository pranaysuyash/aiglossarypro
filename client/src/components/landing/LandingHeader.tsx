import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useCountryPricing } from '@/hooks/useCountryPricing';

export function LandingHeader() {
  const pricing = useCountryPricing();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="text-2xl font-bold text-purple-600 cursor-pointer">
                AI/ML Glossary Pro
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#preview" 
              className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See What's Inside
            </a>
            <a 
              href="#pricing" 
              className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            {/* Desktop: Show both buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/app">
                <Button variant="ghost" className="text-gray-600 hover:text-purple-600 px-4">
                  Sign In
                </Button>
              </Link>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 font-medium"
                onClick={() => {
                  // Track analytics
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'header_cta_click', {
                      event_category: 'conversion',
                      event_label: 'header_button',
                      value: pricing.localPrice,
                    });
                  }
                  
                  window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
                }}
              >
                Get Lifetime Access
              </Button>
            </div>
            
            {/* Mobile: Show only primary CTA */}
            <div className="md:hidden">
              <Button 
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 font-medium"
                onClick={() => {
                  // Track analytics
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'header_cta_click', {
                      event_category: 'conversion',
                      event_label: 'mobile_header_button',
                      value: pricing.localPrice,
                    });
                  }
                  
                  window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
                }}
              >
                Get Access
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}