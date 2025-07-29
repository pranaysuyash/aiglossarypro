import { Award, CheckCircle, HeartHandshake, Lock, RefreshCw, Shield } from 'lucide-react';
import React from 'react';
import { trackUserAction } from '@/lib/analytics';
import { useExperiment } from '@/services/posthogExperiments';

interface TrustBadge {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TRUST_BADGES: TrustBadge[] = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'SSL Secured',
    description: '256-bit encryption',
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: 'Privacy First',
    description: 'Your data is safe',
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: 'Top Rated',
    description: '4.9/5 star rating',
  },
  {
    icon: <CheckCircle className="w-8 h-8" />,
    title: 'Verified Content',
    description: 'Expert reviewed',
  },
  {
    icon: <RefreshCw className="w-8 h-8" />,
    title: '30-Day Guarantee',
    description: 'Money back promise',
  },
  {
    icon: <HeartHandshake className="w-8 h-8" />,
    title: '24/7 Support',
    description: 'Always here to help',
  },
];

interface TrustBadgesProps {
  placement?: 'inline' | 'floating';
  variant?: 'minimal' | 'detailed' | 'animated';
}

export function TrustBadges({ placement = 'inline', variant: propVariant }: TrustBadgesProps) {
  const { variant, trackFeatureUsage } = useExperiment('trustBadgeStyle', propVariant || 'minimal');

  const { variant: placementVariant } = useExperiment('trustBadgePlacement', placement);

  React.useEffect(() => {
    trackFeatureUsage('trust_badges_viewed', { variant, placement: placementVariant });
  }, [variant, placementVariant, trackFeatureUsage]);

  const handleBadgeClick = (badge: TrustBadge) => {
    trackUserAction('trust_badge_clicked', {
      badge: badge.title,
      variant,
      placement: placementVariant,
    });
  };

  if (placementVariant === 'floating') {
    return <FloatingTrustBadges variant={variant} onClick={handleBadgeClick} />;
  }

  return <InlineTrustBadges variant={variant} onClick={handleBadgeClick} />;
}

function InlineTrustBadges({
  variant,
  onClick,
}: {
  variant: string;
  onClick: (badge: TrustBadge) => void;
}) {
  const selectedBadges = variant === 'minimal' ? TRUST_BADGES.slice(0, 3) : TRUST_BADGES;

  return (
    <div className="bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div
          className={`grid ${variant === 'minimal' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'} gap-4`}
        >
          {selectedBadges.map((badge, index) => (
            <button
              key={index}
              onClick={() => onClick(badge)}
              className={`
                group cursor-pointer
                ${variant === 'animated' ? 'transform transition-all hover:scale-105' : ''}
              `}
            >
              <div
                className={`
                flex flex-col items-center text-center p-4 rounded-lg
                ${variant === 'detailed' ? 'bg-white shadow-md' : ''}
                ${variant === 'animated' ? 'hover:bg-white hover:shadow-lg' : ''}
              `}
              >
                <div
                  className={`
                  text-blue-600 mb-2
                  ${variant === 'animated' ? 'group-hover:text-blue-700 transition-colors' : ''}
                `}
                >
                  {badge.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{badge.title}</h3>
                {(variant === 'detailed' || variant === 'animated') && (
                  <p className="text-xs text-gray-600">{badge.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingTrustBadges({
  variant,
  onClick,
}: {
  variant: string;
  onClick: (badge: TrustBadge) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling down 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) {return null;}

  const badges = variant === 'minimal' ? TRUST_BADGES.slice(0, 3) : TRUST_BADGES.slice(0, 4);

  return (
    <div
      className={`
      fixed bottom-4 right-4 z-40
      transition-all duration-300 ease-out
      ${isExpanded ? 'w-72' : 'w-16'}
    `}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute right-0 top-0 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Shield className="w-6 h-6" />
      </button>

      {/* Expanded badges */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-2xl p-4 mr-16 animate-slideLeft">
          <h3 className="font-semibold text-gray-900 mb-3">Why Trust Us?</h3>
          <div className="space-y-3">
            {badges.map((badge, index) => (
              <button
                key={index}
                onClick={() => onClick(badge)}
                className="flex items-center gap-3 w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <div className="text-blue-600 flex-shrink-0">{badge.icon}</div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{badge.title}</p>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add slide animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideLeft {
    from { 
      opacity: 0;
      transform: translateX(20px);
    }
    to { 
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-slideLeft {
    animation: slideLeft 0.3s ease-out;
  }
`;
document.head.appendChild(style);
