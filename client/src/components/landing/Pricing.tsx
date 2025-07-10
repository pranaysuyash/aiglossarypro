import { ArrowRight, Check, DollarSign, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBackgroundABTest } from '@/hooks/useBackgroundABTest';
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { useABTestTracking } from '@/services/abTestingService';
import { trackPurchaseIntent } from '@/types/analytics';
import { TestPurchaseButton } from '../TestPurchaseButton';
import { FreeTierMessaging } from './FreeTierMessaging';
import { PPPBanner } from './PPPBanner';
import { PricingCountdown } from './PricingCountdown';

export function Pricing() {
  const pricing = useCountryPricing();
  const { currentVariant } = useBackgroundABTest();
  const { trackConversion } = useABTestTracking(currentVariant);

  const comparison = [
    {
      feature: 'AI/ML Term Coverage',
      free: 'Limited',
      competitors: 'Partial',
      us: '10,000+ Complete',
    },
    {
      feature: 'Code Examples',
      free: 'None',
      competitors: 'Basic',
      us: 'Comprehensive',
    },
    {
      feature: 'Annual Cost',
      free: 'Free',
      competitors: '$300-600',
      us: `${Math.round(pricing.localPrice / 5)} equivalent*`,
    },
    {
      feature: 'Mobile Access',
      free: 'Limited',
      competitors: 'Yes',
      us: 'Optimized',
    },
    {
      feature: 'Search & Filters',
      free: 'Basic',
      competitors: 'Advanced',
      us: 'Advanced',
    },
    {
      feature: 'Updates',
      free: 'Never',
      competitors: 'Yearly',
      us: 'Lifetime',
    },
  ];

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Free Tier + Premium Option
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4 sm:px-0">
            Start with 50 terms daily. Upgrade for unlimited access plus premium features.
          </p>
        </div>

        {/* Early Bird Countdown */}
        <div className="mb-12 sm:mb-16 max-w-2xl mx-auto">
          <PricingCountdown />
        </div>

        {/* Free Tier Messaging */}
        <div className="mb-12 sm:mb-16 max-w-4xl mx-auto">
          <FreeTierMessaging variant="compact" />
        </div>

        {/* PPP Banner */}
        <PPPBanner />

        {/* Comparison Table */}
        <div className="mb-12 sm:mb-16 max-w-5xl mx-auto">
          <div className="overflow-x-auto touch-manipulation">
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg sm:min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 sm:p-4 font-semibold text-gray-900 border-b text-sm sm:text-base">
                    Features
                  </th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-gray-900 border-b border-l text-sm sm:text-base">
                    Free Resources
                  </th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-gray-900 border-b border-l text-sm sm:text-base">
                    DataCamp/Coursera
                  </th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-white bg-purple-600 border-b border-l text-sm sm:text-base">
                    AI/ML Glossary Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-2 sm:p-4 font-medium text-gray-900 text-sm sm:text-base">
                      {row.feature}
                    </td>
                    <td className="p-2 sm:p-4 text-center border-l border-gray-200 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                      {row.free}
                    </td>
                    <td className="p-2 sm:p-4 text-center border-l border-gray-200 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                      {row.competitors}
                    </td>
                    <td className="p-2 sm:p-4 text-center border-l border-gray-200 bg-purple-50 font-semibold text-purple-900 text-sm sm:text-base">
                      {row.us}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-4 text-sm text-gray-500 sm:hidden">
            ← Scroll to see all features →
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 z-10">
              Free Tier
            </Badge>
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-green-900">Free Tier</div>
                  <div className="text-3xl font-bold text-green-900 mt-2">$0</div>
                  <div className="text-sm text-green-600">50 terms daily • No credit card</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>50 AI/ML terms daily</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Code examples & applications</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Advanced search & filters</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Mobile optimized</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>1,500+ terms monthly</span>
                </div>
                <div className="pt-4">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white min-h-[48px] sm:min-h-[44px] text-base sm:text-sm font-semibold py-3 sm:py-2 touch-manipulation"
                    onClick={() => {
                      trackConversion('free_start_click', {
                        button_text: 'Start Free Now',
                        position: 'pricing_table',
                      });
                      window.location.href = '/login';
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Start Free Now</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competitors */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-gray-700">Competitors</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">$300+</div>
                <div className="text-sm text-gray-500">per year, recurring</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Structured content</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Some code examples</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="w-4 h-4 text-red-500" />
                <span>Expensive subscriptions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="w-4 h-4 text-red-500" />
                <span>Limited AI/ML focus</span>
              </div>
              <div className="pt-4">
                <Button variant="outline" className="w-full" disabled>
                  Too Expensive
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Premium Tier - Launch Special */}
          <div className="relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 z-10">
              🎉 Launch Special
            </Badge>
            <Card className="border-2 border-purple-500 shadow-xl">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-purple-900">Premium Preview</div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="text-3xl font-bold text-purple-900">
                      $
                      {pricing.launchPricing.isActive
                        ? pricing.launchPricing.launchPrice
                        : pricing.launchPricing.originalPrice}
                    </div>
                    {pricing.launchPricing.isActive && (
                      <div className="text-xl text-gray-500 line-through">
                        ${pricing.launchPricing.originalPrice}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-purple-600">
                    {pricing.launchPricing.isActive ? (
                      <>
                        lifetime access • Save ${pricing.launchPricing.savingsAmount} - First 500
                        Customers Only
                        <br />
                        <span className="font-bold text-green-600">
                          {pricing.launchPricing.claimedSlots}/{pricing.launchPricing.totalSlots}{' '}
                          claimed
                        </span>
                      </>
                    ) : (
                      'lifetime access'
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Unlimited access to 10,000+ terms</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Interactive quizzes & exercises</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>AI-powered explanations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Personalized learning paths</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Export & offline access</span>
                </div>
                <div className="pt-4">
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white min-h-[48px] sm:min-h-[44px] text-base sm:text-sm font-semibold py-3 sm:py-2 touch-manipulation"
                    onClick={() => {
                      const currentPrice = pricing.launchPricing.isActive
                        ? pricing.launchPricing.launchPrice
                        : pricing.launchPricing.originalPrice;

                      // Track analytics with launch pricing
                      trackPurchaseIntent('launch_special_lifetime', currentPrice);

                      // Track A/B test conversion
                      trackConversion('launch_special_cta_click', {
                        value: currentPrice,
                        button_text: `Get Launch Special - $${currentPrice}`,
                        position: 'pricing_table',
                        originalPrice: pricing.launchPricing.originalPrice,
                        discount: pricing.launchPricing.savingsAmount,
                        slotsRemaining:
                          pricing.launchPricing.totalSlots - pricing.launchPricing.claimedSlots,
                      });

                      // Open Gumroad with launch special discount
                      const discountCode = pricing.launchPricing.isActive ? 'LAUNCH500' : '';
                      const gumroadUrl = discountCode
                        ? `https://pranaysuyash.gumroad.com/l/ggczfy/${discountCode}`
                        : 'https://pranaysuyash.gumroad.com/l/ggczfy';

                      window.open(gumroadUrl, '_blank');
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>
                        Get Launch Special - $
                        {pricing.launchPricing.isActive
                          ? pricing.launchPricing.launchPrice
                          : pricing.launchPricing.originalPrice}
                      </span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Test Purchase Button - Only visible in development */}
        <div className="mt-8 text-center">
          <TestPurchaseButton />
        </div>

        {/* Value Proposition */}
        <div className="mt-16 text-center">
          <div className="bg-white border border-purple-200 rounded-xl p-8 max-w-4xl mx-auto">
            <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Start Free, Upgrade Only If You Want More
            </h3>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">$0</div>
                <div className="text-gray-600 dark:text-gray-400">Our free tier</div>
                <div className="text-sm text-green-600 mt-1">10,000+ terms</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  $
                  {pricing.launchPricing.isActive
                    ? pricing.launchPricing.launchPrice
                    : pricing.launchPricing.originalPrice}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {pricing.launchPricing.isActive ? 'Premium launch special' : 'Premium full price'}
                </div>
                <div className="text-sm text-purple-600 mt-1">
                  {pricing.launchPricing.isActive ? 'First 500 customers' : 'Regular pricing'}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 mb-2">$300+</div>
                <div className="text-gray-600 dark:text-gray-400">DataCamp (annual)</div>
                <div className="text-sm text-red-600 mt-1">Recurring cost</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 mb-2">$400+</div>
                <div className="text-gray-600 dark:text-gray-400">Coursera (annual)</div>
                <div className="text-sm text-red-600 mt-1">Recurring cost</div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-6">
              <strong>Start with 50 terms daily free.</strong> Get lifetime unlimited access for
              less than one year of competitors.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              * Launch special pricing limited to first 500 customers • No recurring fees • Lifetime
              updates included
              {pricing.launchPricing.isActive && (
                <span className="font-semibold text-green-600">
                  {' '}
                  • Only {pricing.launchPricing.totalSlots - pricing.launchPricing.claimedSlots}{' '}
                  spots remaining
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
