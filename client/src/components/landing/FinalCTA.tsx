import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Shield, Star } from "lucide-react";
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { trackCTAClick } from '@/types/analytics';
import { useBackgroundABTest } from '@/hooks/useBackgroundABTest';
import { useABTestTracking } from '@/services/abTestingService';

export function FinalCTA() {
  const pricing = useCountryPricing();
  const { currentVariant } = useBackgroundABTest();
  const { trackConversion } = useABTestTracking(currentVariant);

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto text-center">
        {/* Urgency Badge */}
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm sm:text-base font-medium bg-white/10 text-white hover:bg-white/20">
          <Clock className="w-4 h-4 mr-2" />
          Limited Time: Lifetime Access Available
        </Badge>

        {/* Main Headline */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          Ready to Master AI & Machine Learning?
        </h2>
        
        {/* Subheading */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto px-4 sm:px-0">
          Join 1,000+ professionals who rely on our comprehensive platform for their AI/ML reference needs.
        </p>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 text-sm sm:text-base">
          <div className="flex items-center justify-center gap-2 text-gray-300 min-h-[44px]">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>10,000+ AI/ML Terms</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300 min-h-[44px]">
            <Shield className="w-5 h-5 text-green-400" />
            <span>Lifetime Updates Included</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300 min-h-[44px]">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Instant Access</span>
          </div>
        </div>

        {/* Main CTA */}
        <div className="space-y-6 px-4 sm:px-0">
          <Button 
            size="lg"
            className="bg-white text-purple-900 hover:bg-gray-100 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105 w-full sm:w-auto min-h-[56px] sm:min-h-[64px] touch-manipulation"
            onClick={() => {
              // Track analytics
              trackCTAClick('final', 'Get Lifetime Access');
              
              // Track A/B test conversion
              trackConversion('final_cta_click', {
                value: pricing.localPrice,
                button_text: `Get Lifetime Access - $${pricing.localPrice}`,
                position: 'final_cta',
                discount: pricing.discount,
                country: pricing.countryCode
              });
              
              window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
            }}
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-center">
                {pricing.discount > 0 
                  ? `Get Lifetime Access - $${pricing.localPrice} (${pricing.discount}% off)`
                  : `Get Lifetime Access - $${pricing.localPrice}`
                }
              </span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            </span>
          </Button>
          
          <p className="text-gray-400 text-base sm:text-lg">
            One payment. Lifetime access. No regrets.
          </p>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 text-sm sm:text-base text-gray-400 px-4 sm:px-0">
            <div className="flex items-center justify-center gap-2 min-h-[44px]">
              <Shield className="w-4 h-4 text-green-400" />
              <span>7-day free trial • No credit card required</span>
            </div>
            <div className="flex items-center justify-center gap-2 min-h-[44px]">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Instant access after purchase</span>
            </div>
            <div className="flex items-center justify-center gap-2 min-h-[44px]">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Trusted by 1,000+ professionals</span>
            </div>
          </div>
          
          {/* Pricing Comparison */}
          <div className="mt-8 bg-white/10 rounded-xl p-4 sm:p-6 max-w-2xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Compare the Value</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm sm:text-base">
              <div className="text-center p-3 sm:p-0">
                <div className="text-red-400 font-bold text-lg sm:text-xl">$300+</div>
                <div className="text-gray-400">DataCamp (yearly)</div>
              </div>
              <div className="text-center p-3 sm:p-0">
                <div className="text-red-400 font-bold text-lg sm:text-xl">$400+</div>
                <div className="text-gray-400">Coursera (yearly)</div>
              </div>
              <div className="text-center p-3 sm:p-0 bg-white/10 rounded-lg sm:bg-transparent sm:rounded-none">
                <div className="text-green-400 font-bold text-lg sm:text-xl">${pricing.localPrice}</div>
                <div className="text-gray-400">Our platform (lifetime)</div>
                {pricing.discount > 0 && (
                  <div className="text-green-300 text-xs sm:text-sm">
                    {pricing.discount}% off for {pricing.countryName}
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm mt-4">
              * Purchasing Power Parity discounts applied automatically
            </p>
          </div>
        </div>

        {/* Final Reassurance */}
        <div className="mt-12 text-gray-400 text-sm sm:text-base max-w-2xl mx-auto px-4 sm:px-0">
          <p className="leading-relaxed">
            <strong className="text-white">Risk-free purchase:</strong> Not satisfied? 
            Get your money back within 30 days, no questions asked. 
            We're confident you'll find this invaluable for your AI/ML journey.
          </p>
        </div>
      </div>
    </section>
  );
}