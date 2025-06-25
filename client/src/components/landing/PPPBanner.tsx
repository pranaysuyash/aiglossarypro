import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCountryPricing } from '@/hooks/useCountryPricing';

export function PPPBanner() {
  const pricing = useCountryPricing();

  // Don't show banner if no discount or still loading
  if (pricing.loading || pricing.discount === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{pricing.flag}</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Special Pricing for {pricing.countryName}
            </Badge>
          </div>
          <div className="text-green-800">
            <span className="font-medium">
              {pricing.discount}% discount automatically applied!
            </span>
            <br />
            <span className="text-lg">
              Your price: <span className="font-bold text-green-900">${pricing.localPrice}</span>
              {pricing.discount > 0 && (
                <span className="text-sm text-green-600 ml-2">
                  (normally ${pricing.basePrice})
                </span>
              )}
            </span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}