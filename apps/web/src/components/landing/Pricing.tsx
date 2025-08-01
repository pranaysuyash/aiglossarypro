import { ArrowRight, Check, DollarSign, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBackgroundABTest } from '@/hooks/useBackgroundABTest';
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { useABTestTracking } from '@/services/abTestingService';
import { useExperiment } from '@/services/posthogExperiments';
import { trackPurchaseIntent } from '@/types/analytics';
import { TestPurchaseButton } from '../TestPurchaseButton';
import { FreeTierBanner, TrustBadge } from '../TrustBuilding';
import { FreeTierMessaging } from './FreeTierMessaging';
import { PPPBanner } from './PPPBanner';
import { PricingCountdown } from './PricingCountdown';
import { getCurrentPhaseConfig, getGumroadUrlWithDiscount, formatPrice } from '@/config/pricing';
import { usePricingPhase } from '@/services/pricingPhaseService';

// Separate component for the comparison table to isolate DOM structure
// Million.js optimization disabled for this component due to dynamic content
// The /*#__PURE__*/ annotation helps with tree-shaking
// million-ignore
const ComparisonTable = /*#__PURE__*/ function ComparisonTable() {
  const pricing = useCountryPricing();

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
          {comparison.map(row => (
            <tr key={row.feature} className="border-b border-gray-100">
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
  );
}

// million-ignore
export function Pricing() {
  const pricing = useCountryPricing();
  const { currentVariant } = useBackgroundABTest();
  const { trackConversion } = useABTestTracking(currentVariant);
  const { phaseData } = usePricingPhase();
  const phaseConfig = getCurrentPhaseConfig();

  // PostHog experiment for pricing display variations
  const pricingExperiment = useExperiment('pricingDisplay', 'control');

  // Get pricing section title based on experiment variant
  const getPricingSectionTitle = () => {
    switch (pricingExperiment.variant) {
      case 'value_focused':
        return 'Save $150 • One-Time Payment Only';
      case 'simple':
        return 'Simple Pricing';
      case 'comparison':
        return 'Compare Your Options';
      case 'benefit_focused':
        return 'Free Tier + Lifetime Upgrade';
      default:
        return 'Free Tier + Premium Option';
    }
  };

  // Get pricing section subtitle based on experiment variant
  const getPricingSectionSubtitle = () => {
    switch (pricingExperiment.variant) {
      case 'value_focused':
        return 'Stop paying monthly subscriptions. Get lifetime access for less than most annual plans.';
      case 'simple':
        return 'Try free, upgrade once for lifetime access to everything.';
      case 'comparison':
        return 'See how we compare to expensive alternatives.';
      case 'benefit_focused':
        return 'Start learning immediately with 50 terms daily. Unlock everything with one payment.';
      default:
        return 'Start with 50 terms daily. Upgrade for unlimited access plus premium features.';
    }
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            {getPricingSectionTitle()}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4 sm:px-0">
            {getPricingSectionSubtitle()}
          </p>
        </div>

        {/* Trust Building Banner */}
        <div className="mb-8 max-w-4xl mx-auto">
          <FreeTierBanner />
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

        {/* Comparison Table - show based on experiment variant */}
        {(pricingExperiment.variant === 'comparison' ||
          pricingExperiment.variant === 'control') && (
          <div className="mb-12 sm:mb-16 max-w-5xl mx-auto">
            <ComparisonTable />
            <div className="text-center mt-4 text-sm text-gray-500 sm:hidden">
              ← Scroll to see all features →
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div
          className={`${
            pricingExperiment.variant === 'simple'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto'
              : 'grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto'
          }`}
        >
          {/* Free Tier */}
          <div className="relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <TrustBadge />
            </div>
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

          {/* Competitors - hide in simple variant */}
          {pricingExperiment.variant !== 'simple' && (
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
          )}

          {/* Premium Tier - Phase-based pricing */}
          <div className="relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 z-10">
              🎉 {phaseConfig.name}
            </Badge>
            <Card className="border-2 border-purple-500 shadow-xl">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-center">
                  <div className="text-2xl font-bold text-purple-900">Premium Access</div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="text-3xl font-bold text-purple-900">
                      {formatPrice(phaseConfig.price)}
                    </div>
                    {phaseConfig.discountPercentage > 0 && (
                      <div className="text-xl text-gray-500 line-through">
                        {formatPrice(phaseConfig.originalPrice)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-purple-600">
                    lifetime access • {phaseConfig.message}
                    {phaseData && phaseConfig.slots !== Infinity && (
                      <>
                        <br />
                        <span className="font-bold text-green-600">
                          {phaseData.soldCount}/{phaseConfig.slots} claimed
                        </span>
                      </>
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
                      // Track analytics with phase pricing
                      trackPurchaseIntent(`${phaseConfig.name.toLowerCase()}_lifetime`, phaseConfig.price);

                      // Track A/B test conversion
                      trackConversion('premium_cta_click', {
                        value: phaseConfig.price,
                        button_text: `Get ${phaseConfig.name} - ${formatPrice(phaseConfig.price)}`,
                        position: 'pricing_table',
                        phase: phaseConfig.name,
                        originalPrice: phaseConfig.originalPrice,
                        discount: phaseConfig.discountPercentage,
                        slotsRemaining: phaseData ? phaseConfig.slots - phaseData.soldCount : phaseConfig.slots,
                      });

                      // Track pricing experiment conversion
                      pricingExperiment.trackConversion('premium_cta_click', phaseConfig.price, {
                        pricing_variant: pricingExperiment.variant,
                        phase: phaseConfig.name,
                        price: phaseConfig.price,
                        discount_active: phaseConfig.discountPercentage > 0,
                      });

                      // Open Gumroad with phase discount
                      const gumroadUrl = getGumroadUrlWithDiscount();
                      window.open(gumroadUrl, '_blank');
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>
                        Get {phaseConfig.name} - {formatPrice(phaseConfig.price)}
                      </span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </span>
                  </Button>
                  
                  {/* Phase progress bar */}
                  {phaseData && phaseConfig.slots !== Infinity && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{phaseData.percentage}% claimed</span>
                        <span>{phaseConfig.slots - phaseData.soldCount} spots left</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${phaseData.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
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
                  {formatPrice(phaseConfig.price)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Premium {phaseConfig.name.toLowerCase()}
                </div>
                <div className="text-sm text-purple-600 mt-1">
                  {phaseConfig.message}
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
              * {phaseConfig.message} • No recurring fees • Lifetime updates included
              {phaseData && phaseConfig.slots !== Infinity && (
                <span className="font-semibold text-green-600">
                  {' '}
                  • Only {phaseConfig.slots - phaseData.soldCount} spots remaining
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
