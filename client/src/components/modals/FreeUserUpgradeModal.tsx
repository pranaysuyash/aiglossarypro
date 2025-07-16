import { ArrowRight, Calendar, Clock, Star, TrendingUp, Zap } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

interface FreeUserUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  viewsUsed: number;
  dailyLimit: number;
  daysInTrial?: number;
  isTrialUser?: boolean;
}

export function FreeUserUpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
  viewsUsed,
  dailyLimit,
  daysInTrial = 0,
  isTrialUser = false,
}: FreeUserUpgradeModalProps) {
  const { user } = useAuth();

  const handleUpgrade = () => {
    onUpgrade();
    onClose();
  };

  const getTitle = () => {
    if (isTrialUser) {
      return 'Ready to unlock unlimited learning?';
    }
    return 'Daily Limit Reached - Upgrade to Continue';
  };

  const getDescription = () => {
    if (isTrialUser) {
      return `You're ${daysInTrial} days into your free trial and loving the unlimited access! Continue your learning journey without limits.`;
    }
    return `You've viewed ${viewsUsed} of ${dailyLimit} free terms today. Upgrade to Pro for unlimited access to all 10,000+ AI/ML terms.`;
  };

  const getMotivationalMessage = () => {
    if (isTrialUser) {
      return "Keep the momentum going! Don't let limits slow down your learning progress.";
    }
    return "You're clearly engaged in learning! Why wait until tomorrow when you can continue right now?";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100">
            {isTrialUser ? (
              <TrendingUp className="h-6 w-6 text-purple-600" />
            ) : (
              <Clock className="h-6 w-6 text-purple-600" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold">{getTitle()}</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator for non-trial users */}
          {!isTrialUser && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center justify-between text-sm text-red-700 mb-2">
                <span className="font-medium">Daily Usage Complete</span>
                <span>
                  {viewsUsed} / {dailyLimit} terms
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <Clock className="w-4 h-4" />
                <span>Resets tomorrow at midnight</span>
              </div>
            </div>
          )}

          {/* Trial user progress */}
          {isTrialUser && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Day {daysInTrial} of your 7-day trial</span>
              </div>
              <p className="text-sm text-blue-600">
                You've been exploring freely - keep this momentum going with lifetime access!
              </p>
            </div>
          )}

          {/* Motivational message */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <p className="text-sm font-medium text-purple-800 mb-2">{getMotivationalMessage()}</p>
            <div className="text-xs text-purple-600">
              Join 10,000+ professionals who chose unlimited learning
            </div>
          </div>

          {/* Pro benefits */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-3 h-3 text-green-600" />
              </div>
              <span>
                <strong>Unlimited access</strong> to 10,000+ AI/ML terms
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-green-600" />
              </div>
              <span>
                <strong>Advanced search</strong> with filters and categories
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-green-600" />
              </div>
              <span>
                <strong>Ad-free experience</strong> and priority support
              </span>
            </div>
          </div>

          {/* Value proposition */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-700">$249</div>
            <div className="text-sm text-green-600 font-medium">
              One-time payment • Lifetime access
            </div>
            <div className="text-xs text-gray-500 mt-1">
              🌍 Automatically adjusted for your region
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              Get Lifetime Access Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="text-center">
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Continue tomorrow (limit resets at midnight)
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="text-center pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              30-day money-back guarantee • Instant access • No recurring fees
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FreeUserUpgradeModal;
