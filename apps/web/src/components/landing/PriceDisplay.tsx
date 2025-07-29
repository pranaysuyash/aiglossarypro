import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountryPricing } from '@/hooks/useCountryPricing';

interface PriceDisplayProps {
  showComparison?: boolean;
  showSavings?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string | undefined;
}

export function PriceDisplay({
  showComparison = false,
  showSavings = false,
  size = 'lg',
  className,
}: PriceDisplayProps) {
  const pricing = useCountryPricing();

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl lg:text-6xl',
  };

  if (pricing.loading) {
    return (
      <div className={`text-center ${className}`}>
        <Skeleton className="h-12 w-32 mx-auto" />
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="space-y-2">
        {/* Original Price (if discounted) */}
        {showComparison && pricing.discount > 0 && (
          <div className="text-lg text-gray-500 line-through">${pricing.basePrice}</div>
        )}

        {/* Main Price */}
        <div className={`font-bold text-purple-900 ${sizeClasses[size]}`}>
          ${pricing.localPrice}
        </div>

        {/* Discount Badge */}
        {pricing.discount > 0 && (
          <div className="flex justify-center">
            <Badge className="bg-green-100 text-green-800 px-3 py-1">
              {pricing.discount}% off for {pricing.countryName}
            </Badge>
          </div>
        )}

        {/* Annual Savings */}
        {showSavings && (
          <div className="text-sm text-green-600 font-medium">
            Save ${pricing.annualSavings}+ annually vs competitors
          </div>
        )}
      </div>
    </div>
  );
}
