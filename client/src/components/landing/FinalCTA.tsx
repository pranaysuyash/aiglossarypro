import { ArrowRight, Clock, Shield, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBackgroundABTest } from '@/hooks/useBackgroundABTest';
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { useABTestTracking } from '@/services/abTestingService';
import { trackCTAClick } from '@/types/analytics';

export function FinalCTA() {
  const _pricing = useCountryPricing();
  const { currentVariant } = useBackgroundABTest();
  const { trackConversion } = useABTestTracking(currentVariant);

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-5xl mx-auto text-center">
        {/* Urgency Badge */}
        <Badge
          variant="secondary"
          className="mb-6 px-4 py-2 text-sm sm:text-base font-medium bg-white/10 text-white hover:bg-white/20"
        >
          <Clock className="w-4 h-4 mr-2" />
          Limited Time: Lifetime Access Available
        </Badge>

        {/* Main Headline */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          Ready to Master AI & Machine Learning?
        </h2>

        {/* Subheading */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto px-4 sm:px-0">
          Join 1,000+ professionals who rely on our comprehensive platform for their AI/ML reference
          needs.
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

        {/* Main CTAs */}
        <div className="space-y-6 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105 w-full sm:w-auto min-h-[56px] sm:min-h-[64px] touch-manipulation"
              onClick={() => {
                trackCTAClick('final', 'Start for Free');
                trackConversion('final_free_cta_click', {
                  button_text: 'Start for Free',
                  position: 'final_cta',
                });
                window.location.href = '/login';
              }}
            >
              <span className="flex items-center justify-center gap-3">
                <span>Start for Free</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              </span>
            </Button>

            <Button
              size="lg"
              className="bg-white text-purple-900 hover:bg-gray-100 px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105 w-full sm:w-auto min-h-[56px] sm:min-h-[64px] touch-manipulation"
              onClick={() => {
                trackCTAClick('final', 'Get Premium Early Bird');
                trackConversion('final_premium_cta_click', {
                  value: 179,
                  button_text: 'Get Premium - $179 (Early Bird)',
                  position: 'final_cta',
                  originalPrice: 249,
                  discount: 70,
                });
                window.open('https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500', '_blank');
              }}
            >
              <span className="flex items-center justify-center gap-3">
                <span>Get Premium - $179 (Early Bird)</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              </span>
            </Button>
          </div>

          <p className="text-gray-400 text-base sm:text-lg">
            Access 50 AI/ML terms daily for free. Upgrade anytime for unlimited access.
          </p>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 text-sm sm:text-base text-gray-400 px-4 sm:px-0">
            <div className="flex items-center justify-center gap-2 min-h-[44px]">
              <Shield className="w-4 h-4 text-green-400" />
              <span>50 terms daily free • No credit card required</span>
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
          <div className="mt-8 bg-white/10 rounded-xl p-4 sm:p-6 max-w-3xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Compare the Value</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm sm:text-base">
              <div className="text-center p-3 sm:p-0 bg-green-500/20 rounded-lg">
                <div className="text-green-400 font-bold text-lg sm:text-xl">$0</div>
                <div className="text-gray-400">Free tier</div>
                <div className="text-green-300 text-xs">50 terms daily</div>
              </div>
              <div className="text-center p-3 sm:p-0 bg-purple-500/20 rounded-lg">
                <div className="text-purple-400 font-bold text-lg sm:text-xl">$179</div>
                <div className="text-gray-400">Early Bird Premium</div>
                <div className="text-purple-300 text-xs">Save $70</div>
              </div>
              <div className="text-center p-3 sm:p-0">
                <div className="text-red-400 font-bold text-lg sm:text-xl">$300+</div>
                <div className="text-gray-400">DataCamp (yearly)</div>
                <div className="text-red-300 text-xs">Recurring cost</div>
              </div>
              <div className="text-center p-3 sm:p-0">
                <div className="text-red-400 font-bold text-lg sm:text-xl">$400+</div>
                <div className="text-gray-400">Coursera (yearly)</div>
                <div className="text-red-300 text-xs">Recurring cost</div>
              </div>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm mt-4">
              * Early bird pricing limited to first 500 customers
            </p>
          </div>
        </div>

        {/* Final Reassurance */}
        <div className="mt-12 text-gray-400 text-sm sm:text-base max-w-2xl mx-auto px-4 sm:px-0">
          <p className="leading-relaxed">
            <strong className="text-white">Start with 50 free terms daily:</strong> That's 1,500+
            terms monthly at no cost. Upgrade to unlimited access (10,000+ terms) plus premium
            features for just $179. Perfect for your AI/ML learning journey.
          </p>
        </div>
      </div>
    </section>
  );
}
