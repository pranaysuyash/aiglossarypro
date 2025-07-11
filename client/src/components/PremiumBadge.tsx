import { Crown, Star } from 'lucide-react';
import { useAccess } from '../hooks/useAccess';
import { Badge } from './ui/badge';

interface PremiumBadgeProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
  showFreeStatus?: boolean;
}

export function PremiumBadge({
  variant = 'default',
  className = '',
  showFreeStatus = false,
}: PremiumBadgeProps) {
  const { accessStatus } = useAccess();

  // Don't render anything if no access status
  if (!accessStatus) return null;

  // Don't show free status unless explicitly requested
  if (!accessStatus.lifetimeAccess && !showFreeStatus) return null;

  const isPremium = accessStatus.lifetimeAccess;

  if (variant === 'icon-only') {
    return (
      <div
        className={`inline-flex items-center ${className}`}
        title={isPremium ? '🌟 Pro Member' : 'Free User'}
      >
        {isPremium ? (
          <Crown className="w-4 h-4 text-yellow-500" />
        ) : (
          <Star className="w-4 h-4 text-gray-400" />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Badge
        variant={isPremium ? 'default' : 'secondary'}
        className={`
          ${
            isPremium
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          } 
          px-2 py-1 text-xs
          ${className}
        `}
      >
        {isPremium ? (
          <>
            🌟 Pro
          </>
        ) : (
          'Free'
        )}
      </Badge>
    );
  }

  // Default variant
  return (
    <Badge
      variant={isPremium ? 'default' : 'secondary'}
      className={`
        ${
          isPremium
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-md'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        } 
        px-3 py-1 font-medium
        ${className}
      `}
    >
      {isPremium ? (
        <>
          🌟 Pro Member
        </>
      ) : (
        <>
          <Star className="w-4 h-4 mr-1" />
          Free User
        </>
      )}
    </Badge>
  );
}

export default PremiumBadge;
