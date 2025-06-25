import { useCountryPricing } from '@/hooks/useCountryPricing';
import { Skeleton } from '@/components/ui/skeleton';

interface PriceDisplayProps {
  showComparison?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function PriceDisplay({ showComparison = false, size = 'lg', className }: PriceDisplayProps) {
  const pricing = useCountryPricing();

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl',
  };

  if (pricing.loading) {
    return (
      <div className={`text-center ${className}`}>
        <Skeleton className="h-12 w-24 mx-auto" />
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="space-y-1">
        {showComparison && pricing.discount > 0 && (
          <div className="text-lg text-gray-500 line-through">
            ${pricing.basePrice}
          </div>
        )}
        <div className={`font-bold text-purple-900 ${sizeClasses[size]}`}>
          ${pricing.localPrice}
        </div>
        {pricing.discount > 0 && (
          <div className="text-sm text-green-600 font-medium">
            {pricing.discount}% off for {pricing.countryName}
          </div>
        )}
      </div>
    </div>
  );
}