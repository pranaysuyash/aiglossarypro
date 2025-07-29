import { ChevronDown, ChevronUp, Clock, Tag, TrendingUp, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type React from 'react';
import { Link } from 'wouter';
import { trackUserAction } from '@/lib/analytics';
import { useExperiment } from '@/services/posthogExperiments';

interface WidgetVariant {
  title: string;
  subtitle: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  urgency?: string;
  icon: React.ReactNode;
  color: string;
}

const WIDGET_VARIANTS: Record<string, WidgetVariant> = {
  control: {
    title: 'Upgrade to Pro',
    subtitle: 'Unlock all features',
    price: '$39',
    icon: <Zap className="w-5 h-5" />,
    color: 'blue',
  },
  discount_focused: {
    title: 'Limited Time Offer',
    subtitle: 'Save 30% Today',
    price: '$27',
    originalPrice: '$39',
    discount: '30% OFF',
    icon: <Tag className="w-5 h-5" />,
    color: 'green',
  },
  urgency: {
    title: 'Flash Sale Ending',
    subtitle: 'Only 2 hours left!',
    price: '$29',
    originalPrice: '$39',
    urgency: '02:00:00',
    icon: <Clock className="w-5 h-5" />,
    color: 'red',
  },
  value: {
    title: 'Best Value Plan',
    subtitle: 'Most popular choice',
    price: '$39',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'purple',
  },
};

export function FloatingPricingWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours
  const [scrollProgress, setScrollProgress] = useState(0);

  const { variant, trackConversion, trackFeatureUsage } = useExperiment(
    'floatingPricingVariant',
    'control'
  );

  const currentVariant = WIDGET_VARIANTS[variant] || WIDGET_VARIANTS.control;

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollY / docHeight) * 100;

      setScrollProgress(progress);

      // Show widget after 20% scroll or 10 seconds
      if (progress > 20 && !isDismissed) {
        setIsVisible(true);
      }
    };

    // Time-based trigger
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setIsVisible(true);
        trackFeatureUsage('floating_pricing_shown', { trigger: 'time' });
      }
    }, 10000);

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [isDismissed, trackFeatureUsage]);

  // Countdown timer for urgency variant
  useEffect(() => {
    if (variant === 'urgency' && timeRemaining > 0 && isVisible) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [variant, timeRemaining, isVisible]);

  // Track when widget becomes visible
  useEffect(() => {
    if (isVisible && !isDismissed) {
      trackFeatureUsage('floating_pricing_shown', {
        variant,
        scroll_progress: scrollProgress,
      });
    }
  }, [isVisible, isDismissed, variant, scrollProgress, trackFeatureUsage]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    trackUserAction('floating_pricing_dismissed', { variant });
  };

  const handleCTA = () => {
    trackConversion('floating_pricing_clicked');
    trackUserAction('floating_pricing_cta_clicked', {
      variant,
      expanded: isExpanded,
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || isDismissed) {return null;}

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-600 to-purple-600',
    green: 'from-green-600 to-emerald-600',
    red: 'from-red-600 to-pink-600',
    purple: 'from-purple-600 to-indigo-600',
  };

  return (
    <div
      className={`
      fixed bottom-6 right-6 z-40
      transition-all duration-300 ease-out
      ${isExpanded ? 'w-80' : 'w-64'}
    `}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colorClasses[currentVariant.color]} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentVariant.icon}
              <div>
                <h3 className="font-bold text-sm">{currentVariant.title}</h3>
                <p className="text-xs opacity-90">{currentVariant.subtitle}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="p-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-gray-900">{currentVariant.price}</span>
            {currentVariant.originalPrice && (
              <span className="text-lg text-gray-500 line-through">
                {currentVariant.originalPrice}
              </span>
            )}
            {currentVariant.discount && (
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                {currentVariant.discount}
              </span>
            )}
          </div>

          {/* Urgency timer */}
          {variant === 'urgency' && currentVariant.urgency && (
            <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
              <p className="text-red-600 text-sm font-medium text-center">
                Offer ends in: {formatTime(timeRemaining)}
              </p>
            </div>
          )}

          {/* Expandable content */}
          {isExpanded && (
            <div className="mb-3 space-y-2 animate-slideDown">
              <p className="text-sm text-gray-600">What's included:</p>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center gap-1">
                  <span className="text-green-500">✓</span> 3,500+ AI/ML terms
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-500">✓</span> Interactive visualizations
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-500">✓</span> Export to Anki/Notion
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-green-500">✓</span> Priority updates
                </li>
              </ul>
            </div>
          )}

          {/* CTA Button */}
          <Link
            to="/pricing"
            onClick={handleCTA}
            className={`
              block w-full text-center py-2.5 px-4 rounded-lg font-semibold
              bg-gradient-to-r ${colorClasses[currentVariant.color]} text-white
              hover:opacity-90 transition-all transform hover:scale-105
            `}
          >
            Get Pro Access
          </Link>

          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pulse animation for attention */}
      {variant === 'urgency' && (
        <div className="absolute -inset-1 bg-red-500 rounded-lg opacity-20 animate-pulse" />
      )}
    </div>
  );
}

// Add slide down animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { 
      opacity: 0;
      max-height: 0;
    }
    to { 
      opacity: 1;
      max-height: 200px;
    }
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
`;
document.head.appendChild(style);
