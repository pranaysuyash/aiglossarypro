// @ts-nocheck

import { AlertCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useExperiment } from '@/services/posthogExperiments';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string | undefined;
}

export function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-500">{timeLeft.days}</div>
        <div className="text-xs text-gray-500">Days</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-500">{timeLeft.hours}</div>
        <div className="text-xs text-gray-500">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-500">{timeLeft.minutes}</div>
        <div className="text-xs text-gray-500">Minutes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-red-500">{timeLeft.seconds}</div>
        <div className="text-xs text-gray-500">Seconds</div>
      </div>
    </div>
  );
}

interface ScarcityIndicatorProps {
  remainingSpots?: number;
  totalSpots?: number;
  className?: string | undefined;
}

export function ScarcityIndicator({
  remainingSpots = 47,
  totalSpots = 500,
  className = '',
}: ScarcityIndicatorProps) {
  const percentage = ((totalSpots - remainingSpots) / totalSpots) * 100;

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        <span className="font-semibold text-orange-800">Limited Availability</span>
      </div>
      <p className="text-sm text-orange-700 mb-3">
        Only <strong>{remainingSpots}</strong> early bird spots remaining out of {totalSpots}
      </p>
      <div className="w-full bg-orange-200 rounded-full h-2">
        <div
          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-orange-600 mt-1">{percentage.toFixed(0)}% claimed</p>
    </div>
  );
}

interface UrgencyBannerProps {
  className?: string | undefined;
}

export function UrgencyBanner({ className = '' }: UrgencyBannerProps) {
  const urgencyExperiment = useExperiment('urgencyTactics', 'control');

  // Track urgency banner exposure
  useEffect(() => {
    urgencyExperiment.trackConversion('urgency_banner_exposure', 1, {
      urgency_variant: urgencyExperiment.variant,
    });
  }, [urgencyExperiment]);

  if (urgencyExperiment.variant === 'control') {
    return null;
  }

  const getUrgencyContent = () => {
    switch (urgencyExperiment.variant) {
      case 'countdown': {
        // 48 hours from now
        const countdownTarget = new Date(Date.now() + 48 * 60 * 60 * 1000);
        return (
          <div className="bg-red-600 text-white py-3 px-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Early Bird Pricing Ends In:</span>
              </div>
              <CountdownTimer targetDate={countdownTarget} />
            </div>
          </div>
        );
      }

      case 'scarcity':
        return (
          <div className="bg-orange-600 text-white py-3 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Limited Time Offer</span>
              </div>
              <p className="text-sm">
                Only 47 early bird spots remaining at $179 (Regular price: $249)
              </p>
            </div>
          </div>
        );

      case 'social_proof':
        return (
          <div className="bg-green-600 text-white py-3 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">
                  🔥 453 people upgraded to lifetime access in the last 7 days
                </span>
              </div>
            </div>
          </div>
        );

      case 'combo':
        return (
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-3">
                <Badge className="bg-yellow-500 text-black font-bold mb-2">
                  ⚡ FLASH SALE: 47 SPOTS LEFT
                </Badge>
                <p className="font-semibold">Early Bird Pricing Ends Soon!</p>
              </div>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                <ScarcityIndicator
                  remainingSpots={47}
                  totalSpots={500}
                  className="bg-white/10 border-white/20"
                />
                <div className="text-center">
                  <p className="text-sm mb-2">Time Remaining:</p>
                  <CountdownTimer targetDate={new Date(Date.now() + 48 * 60 * 60 * 1000)} />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className={className}>{getUrgencyContent()}</div>;
}

interface StickyUrgencyBarProps {
  className?: string | undefined;
}

export function StickyUrgencyBar({ className = '' }: StickyUrgencyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const urgencyExperiment = useExperiment('urgencyTactics', 'control');

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track sticky urgency bar exposure
  useEffect(() => {
    if (isVisible) {
      urgencyExperiment.trackConversion('sticky_urgency_exposure', 1, {
        urgency_variant: urgencyExperiment.variant,
      });
    }
  }, [isVisible, urgencyExperiment]);

  if (urgencyExperiment.variant === 'control' || !isVisible) {
    return null;
  }

  const handleCTAClick = () => {
    urgencyExperiment.trackConversion('sticky_urgency_cta_click', 1, {
      urgency_variant: urgencyExperiment.variant,
    });
    window.location.href = '/login';
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-red-600 text-white py-3 px-4 shadow-lg transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } ${className}`}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className="font-semibold text-sm sm:text-base">
            ⚡ 47 Early Bird Spots Left • Save $70 Today
          </span>
        </div>
        <button
          onClick={handleCTAClick}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-full font-bold text-sm transition-colors"
        >
          Claim Your Spot
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-2 text-white/80 hover:text-white text-lg"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
