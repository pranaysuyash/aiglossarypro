import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Shield, Star } from "lucide-react";
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { trackCTAClick } from '@/types/analytics';

export function FinalCTA() {
  const pricing = useCountryPricing();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto text-center">
        {/* Urgency Badge */}
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 text-white hover:bg-white/20">
          <Clock className="w-4 h-4 mr-2" />
          Limited Time: Lifetime Access Available
        </Badge>

        {/* Main Headline */}
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to Master AI & Machine Learning?
        </h2>
        
        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
          Join 1,000+ professionals who rely on our comprehensive platform for their AI/ML reference needs.
        </p>

        {/* Value Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-10 text-sm">
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>10,000+ AI/ML Terms</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Shield className="w-5 h-5 text-green-400" />
            <span>Lifetime Updates Included</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Instant Access</span>
          </div>
        </div>

        {/* Main CTA */}
        <div className="space-y-6">
          <Button 
            size="lg"
            className="bg-white text-purple-900 hover:bg-gray-100 px-12 py-6 text-xl font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105"
            onClick={() => {
              // Track analytics
              trackCTAClick('final', 'Get Lifetime Access');
              
              window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
            }}
          >
            {pricing.discount > 0 
              ? `Get Lifetime Access - $${pricing.localPrice} (${pricing.discount}% off)`
              : `Get Lifetime Access - $${pricing.localPrice}`
            }
            <ArrowRight className="ml-3 w-6 h-6" />
          </Button>
          
          <p className="text-gray-400">
            One payment. Lifetime access. No regrets.
          </p>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>30-day money back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Instant access after purchase</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Trusted by 1,000+ professionals</span>
            </div>
          </div>
          
          {/* Pricing Comparison */}
          <div className="mt-8 bg-white/10 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold mb-4">Compare the Value</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-red-400 font-bold text-lg">$300+</div>
                <div className="text-gray-400">DataCamp (yearly)</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold text-lg">$400+</div>
                <div className="text-gray-400">Coursera (yearly)</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">${pricing.localPrice}</div>
                <div className="text-gray-400">Our platform (lifetime)</div>
                {pricing.discount > 0 && (
                  <div className="text-green-300 text-xs">
                    {pricing.discount}% off for {pricing.countryName}
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-300 text-xs mt-4">
              * Purchasing Power Parity discounts applied automatically
            </p>
          </div>
        </div>

        {/* Final Reassurance */}
        <div className="mt-12 text-gray-400 text-sm max-w-2xl mx-auto">
          <p>
            <strong className="text-white">Risk-free purchase:</strong> Not satisfied? 
            Get your money back within 30 days, no questions asked. 
            We're confident you'll find this invaluable for your AI/ML journey.
          </p>
        </div>
      </div>
    </section>
  );
}