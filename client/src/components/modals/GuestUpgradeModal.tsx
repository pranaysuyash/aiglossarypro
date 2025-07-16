import { ArrowRight, Lock, Star, Users, Zap } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGuestConversion } from '@/hooks/useGuestPreview';

interface GuestUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  onUpgrade: () => void;
  previewsUsed: number;
  maxPreviews: number;
  termTitle?: string;
}

export function GuestUpgradeModal({
  isOpen,
  onClose,
  onSignup,
  onUpgrade,
  previewsUsed,
  maxPreviews,
  termTitle,
}: GuestUpgradeModalProps) {
  const { recommendedCta, shouldShowAggresiveCta } = useGuestConversion();

  const isLimitReached = previewsUsed >= maxPreviews;
  const remaining = Math.max(0, maxPreviews - previewsUsed);

  const handleCtaClick = (type: 'signup' | 'upgrade') => {
    if (type === 'signup') {
      onSignup();
    } else {
      onUpgrade();
    }
    onClose();
  };

  const getTitle = () => {
    if (isLimitReached) {
      return 'Unlock All 10,000+ AI/ML Terms';
    }
    return "You're exploring like a pro!";
  };

  const getDescription = () => {
    if (isLimitReached) {
      return `You've reached your ${maxPreviews} free previews. Continue your AI/ML learning journey with unlimited access.`;
    }
    return `You have ${remaining} preview${remaining !== 1 ? 's' : ''} remaining. Want unlimited access to our complete glossary?`;
  };

  const shouldShowPremiumFirst = shouldShowAggresiveCta || recommendedCta === 'premium_offer';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100">
            {isLimitReached ? (
              <Lock className="h-6 w-6 text-purple-600" />
            ) : (
              <Star className="h-6 w-6 text-purple-600" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold">{getTitle()}</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator if not at limit */}
          {!isLimitReached && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Free previews used</span>
                <span>
                  {previewsUsed} of {maxPreviews}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(previewsUsed / maxPreviews) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Value proposition */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-green-600" />
              </div>
              <span>Unlimited access to 10,000+ AI/ML terms</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-green-600" />
              </div>
              <span>Advanced search with filters and categories</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3 text-green-600" />
              </div>
              <span>Save favorites and track learning progress</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            {shouldShowPremiumFirst ? (
              <>
                <Button
                  onClick={() => handleCtaClick('upgrade')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                  size="lg"
                >
                  Get Lifetime Access - $249
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleCtaClick('signup')}
                  variant="outline"
                  className="w-full border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50 py-3"
                  size="lg"
                >
                  Start Free Account (7-day trial)
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => handleCtaClick('signup')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                  size="lg"
                >
                  Start Free Account (7-day trial)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleCtaClick('upgrade')}
                  variant="outline"
                  className="w-full border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50 py-3"
                  size="lg"
                >
                  Get Lifetime Access - $249
                </Button>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="text-center pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Join 10,000+ AI professionals • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GuestUpgradeModal;
