import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, X, DollarSign } from "lucide-react";
import { PPPBanner } from './PPPBanner';
import { PriceDisplay } from './PriceDisplay';
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { TestPurchaseButton } from '../TestPurchaseButton';
import { trackPurchaseIntent } from '@/types/analytics';

export function Pricing() {
  const pricing = useCountryPricing();
  
  const comparison = [
    {
      feature: "AI/ML Term Coverage",
      free: "Limited",
      competitors: "Partial",
      us: "10,000+ Complete"
    },
    {
      feature: "Code Examples", 
      free: "None",
      competitors: "Basic",
      us: "Comprehensive"
    },
    {
      feature: "Annual Cost",
      free: "Free",
      competitors: "$300-600",
      us: `${Math.round(pricing.localPrice / 5)} equivalent*`
    },
    {
      feature: "Mobile Access",
      free: "Limited",
      competitors: "Yes",
      us: "Optimized"
    },
    {
      feature: "Search & Filters",
      free: "Basic",
      competitors: "Advanced",
      us: "Advanced"
    },
    {
      feature: "Updates",
      free: "Never",
      competitors: "Yearly",
      us: "Lifetime"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Simple, Fair Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Why pay $300-600 annually when you can get comprehensive lifetime access?
          </p>
        </div>

        {/* PPP Banner */}
        <PPPBanner />

        {/* Comparison Table */}
        <div className="mb-16 max-w-5xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-900 border-b">Features</th>
                  <th className="text-center p-4 font-semibold text-gray-900 border-b border-l">Free Resources</th>
                  <th className="text-center p-4 font-semibold text-gray-900 border-b border-l">DataCamp/Coursera</th>
                  <th className="text-center p-4 font-semibold text-white bg-purple-600 border-b border-l">AI/ML Glossary Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-4 font-medium text-gray-900">{row.feature}</td>
                    <td className="p-4 text-center border-l border-gray-200 text-gray-600">{row.free}</td>
                    <td className="p-4 text-center border-l border-gray-200 text-gray-600">{row.competitors}</td>
                    <td className="p-4 text-center border-l border-gray-200 bg-purple-50 font-semibold text-purple-900">{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Alternative */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-gray-700">Free Resources</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">$0</div>
                <div className="text-sm text-gray-500">Wikipedia, Stack Overflow</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Basic definitions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="w-4 h-4 text-red-500" />
                <span>No code examples</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="w-4 h-4 text-red-500" />
                <span>Scattered information</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="w-4 h-4 text-red-500" />
                <span>No organization</span>
              </div>
              <div className="pt-4">
                <Button variant="outline" className="w-full" disabled>
                  Limited Value
                </Button>
              </div>
            </CardContent>
          </Card>

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

          {/* Our Product */}
          <Card className="border-2 border-purple-500 shadow-xl relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1">
              Best Value
            </Badge>
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-purple-900">AI/ML Glossary Pro</div>
                <PriceDisplay showComparison={true} size="xl" />
                <div className="text-sm text-purple-600">lifetime access</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>10,000+ AI/ML terms</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Comprehensive code examples</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Lifetime updates</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>Mobile optimized</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span>30-day money back guarantee</span>
              </div>
              <div className="pt-4">
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    // Track analytics with pricing info
                    trackPurchaseIntent('lifetime_access', pricing.localPrice);
                    
                    // Open Gumroad with country parameter
                    const gumroadUrl = new URL('https://gumroad.com/l/aiml-glossary-pro');
                    gumroadUrl.searchParams.set('country', pricing.countryCode);
                    if (pricing.discount > 0) {
                      gumroadUrl.searchParams.set('discount', pricing.discount.toString());
                    }
                    window.open(gumroadUrl.toString(), '_blank');
                  }}
                >
                  {pricing.discount > 0 
                    ? `Get Access - $${pricing.localPrice} (${pricing.discount}% off)`
                    : `Get Lifetime Access - $${pricing.localPrice}`
                  }
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
              Incredible Value Compared to Alternatives
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-red-600 mb-2">$300+</div>
                <div className="text-gray-600">DataCamp (annual)</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 mb-2">$400+</div>
                <div className="text-gray-600">Coursera (annual)</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">${pricing.localPrice}</div>
                <div className="text-gray-600">Our platform (lifetime)</div>
                {pricing.discount > 0 && (
                  <div className="text-sm text-green-600">
                    {pricing.discount}% off for {pricing.countryName}
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-600 mt-6">
              <strong>Save hundreds of dollars</strong> while getting more comprehensive AI/ML coverage.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              * Purchasing Power Parity automatically applied at checkout for fair global pricing
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}