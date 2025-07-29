import { DollarSign, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCountryPricing } from '@/hooks/useCountryPricing';

export function PPPBanner() {
  const pricing = useCountryPricing();

  if (pricing.loading || pricing.discount === 0) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto mb-8">
      <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <TrendingDown className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-center">
          <div className="flex flex-col items-center gap-3">
            {/* Country Flag and Badge */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{pricing.flag}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                Special Pricing for {pricing.countryName}
              </Badge>
            </div>

            {/* Discount Information */}
            <div className="text-green-800">
              <div className="text-lg font-semibold mb-1">
                {pricing.discount}% Purchasing Power Parity Discount Applied!
              </div>
              <div className="text-2xl font-bold">
                Your Price: <span className="text-green-900">${pricing.localPrice}</span>
                <span className="text-base text-green-600 ml-2 line-through">
                  (normally ${pricing.basePrice})
                </span>
              </div>
            </div>

            {/* Value Comparison */}
            <div className="bg-white border border-green-200 rounded-lg p-3 mt-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  Save ${pricing.annualSavings}+ annually vs {pricing.localCompetitor} subscriptions
                </span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
