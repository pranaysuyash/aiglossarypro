import { CheckCircle, Clock, Shield, X, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { trackUserAction } from '@/lib/analytics';
import { useExperiment } from '@/services/posthogExperiments';

interface ExitIntentVariant {
  title: string;
  description: string;
  cta: string;
  offer?: string;
  urgency?: string;
  features?: string[];
}

const EXIT_INTENT_VARIANTS: Record<string, ExitIntentVariant> = {
  control: {
    title: "Wait! Don't Leave Empty-Handed",
    description: 'Get instant access to the most comprehensive AI/ML glossary',
    cta: 'Get Access Now',
    offer: 'Special offer: 20% off for the next 24 hours',
  },
  value_focused: {
    title: 'Your AI Knowledge Journey Starts Here',
    description: 'Join 10,000+ professionals mastering AI/ML concepts',
    cta: 'Start Learning Now',
    features: [
      '3,500+ AI/ML terms explained',
      'Interactive visualizations',
      'Daily updates with new terms',
      'Export to Anki/Notion',
    ],
  },
  urgency: {
    title: 'Last Chance: 30% Off Today Only',
    description: 'This exclusive discount expires when you leave',
    cta: 'Claim Your Discount',
    urgency: 'Offer expires in 05:00',
    offer: 'Save $14 - Today Only!',
  },
  social_proof: {
    title: 'Join 10,000+ AI Professionals',
    description: 'See why industry leaders choose AI Glossary Pro',
    cta: 'Join the Community',
    features: [
      'Trusted by researchers at top universities',
      'Used by engineers at FAANG companies',
      'Recommended by AI influencers',
    ],
  },
};

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  const { variant, trackConversion, trackFeatureUsage } = useExperiment(
    'exitIntentVariant',
    'control'
  );

  const currentVariant = EXIT_INTENT_VARIANTS[variant] || EXIT_INTENT_VARIANTS.control;

  // Timer for urgency variant
  useEffect(() => {
    if (variant === 'urgency' && isVisible && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [variant, isVisible, timeRemaining]);

  // Exit intent detection
  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger if mouse leaves from the top of the viewport
      if (e.clientY <= 0 && !hasBeenShown) {
        setIsVisible(true);
        setHasBeenShown(true);
        trackFeatureUsage('exit_intent_triggered');
        trackUserAction('exit_intent_popup_shown', { variant });
      }
    },
    [hasBeenShown, trackFeatureUsage, variant]
  );

  useEffect(() => {
    // Don't show on mobile devices
    if (window.innerWidth < 768) {return;}

    // Add exit intent listener after a delay
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000); // Wait 5 seconds before activating

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleClose = () => {
    setIsVisible(false);
    trackUserAction('exit_intent_popup_closed', { variant });
  };

  const handleCTA = () => {
    trackConversion('exit_intent_conversion');
    trackUserAction('exit_intent_cta_clicked', { variant });
    // Navigate to pricing or signup
    window.location.href = '/pricing';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) {return null;}

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-fadeIn" onClick={handleClose} />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slideUp"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {variant === 'urgency' ? (
                <Clock className="w-16 h-16 text-red-500 animate-pulse" />
              ) : variant === 'social_proof' ? (
                <Shield className="w-16 h-16 text-blue-600" />
              ) : (
                <Zap className="w-16 h-16 text-yellow-500" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              {currentVariant.title}
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-center mb-6">{currentVariant.description}</p>

            {/* Urgency timer */}
            {variant === 'urgency' && currentVariant.urgency && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
                <p className="text-red-600 font-semibold">
                  {currentVariant.urgency.replace('05:00', formatTime(timeRemaining))}
                </p>
              </div>
            )}

            {/* Features list */}
            {currentVariant.features && (
              <ul className="space-y-2 mb-6">
                {currentVariant.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Offer */}
            {currentVariant.offer && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 text-center">
                <p className="text-blue-900 font-semibold">{currentVariant.offer}</p>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleCTA}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              {currentVariant.cta}
            </button>

            {/* Secondary action */}
            <button
              onClick={handleClose}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              No thanks, I'll pass on this offer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }
`;
document.head.appendChild(style);
