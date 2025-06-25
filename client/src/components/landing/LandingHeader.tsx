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
                document.querySelector('[class*="Pricing"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('[class*="FAQ"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              FAQ
            </a>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <Link href="/app">
              <Button variant="ghost" className="text-gray-600 hover:text-purple-600">
                Sign In
              </Button>
            </Link>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
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
              {pricing.loading 
                ? 'Get Access'
                : pricing.discount > 0 
                  ? `Get Access - $${pricing.localPrice} (${pricing.discount}% off)`
                  : `Get Access - $${pricing.localPrice}`
              }
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}