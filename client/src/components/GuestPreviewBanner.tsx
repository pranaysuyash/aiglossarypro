import { AlertCircle, Eye, UserPlus, Zap, X } from 'lucide-react';
import { useState } from 'react';
import { useGuestPreview, useGuestConversion } from '../hooks/useGuestPreview';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface GuestPreviewBannerProps {
  variant?: 'top-bar' | 'sticky' | 'inline' | 'modal';
  onSignupClick?: () => void;
  onUpgradeClick?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

export function GuestPreviewBanner({
  variant = 'top-bar',
  onSignupClick,
  onUpgradeClick,
  onDismiss,
  dismissible = true,
  showProgress = true,
  compact = false,
}: GuestPreviewBannerProps) {
  const { isAuthenticated } = useAuth();
  const guestPreview = useGuestPreview();
  const guestConversion = useGuestConversion();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner for authenticated users or if dismissed
  if (isAuthenticated || isDismissed || !guestPreview.isGuest) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    guestPreview.recordCta('banner_dismiss');
    onDismiss?.();
  };

  const handleSignupClick = () => {
    guestPreview.recordCta('banner_signup');
    onSignupClick?.();
  };

  const handleUpgradeClick = () => {
    guestPreview.recordCta('banner_upgrade');
    onUpgradeClick?.();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'top-bar':
        return 'fixed top-0 left-0 right-0 z-50 shadow-md';
      case 'sticky':
        return 'sticky top-0 z-40 shadow-sm';
      case 'modal':
        return 'fixed inset-x-4 top-4 z-50 mx-auto max-w-2xl shadow-lg';
      case 'inline':
      default:
        return 'relative shadow-sm';
    }
  };

  const getBannerContent = () => {
    if (guestPreview.hasReachedLimit) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
        title: "You've reached your preview limit!",
        description: "Sign up for free to unlock unlimited access to all AI/ML terms and features.",
        bgColor: "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200",
        urgent: true,
      };
    } else {
      return {
        icon: <Eye className="h-5 w-5 text-blue-600" />,
        title: `${guestPreview.previewsRemaining} free preview${guestPreview.previewsRemaining === 1 ? '' : 's'} remaining`,
        description: "No sign up required for preview. Create a free account to track your progress.",
        bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
        urgent: false,
      };
    }
  };

  const content = getBannerContent();

  if (compact) {
    return (
      <div className={`${getVariantStyles()} ${content.bgColor} border px-4 py-2 text-sm`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            {content.icon}
            <span className="font-medium">{content.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSignupClick}
              className="h-8 px-3 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Sign Up Free
            </Button>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 p-1"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`${getVariantStyles()} ${content.bgColor} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            {content.icon}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {content.title}
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                {content.description}
              </p>

              {/* Progress indicator */}
              {showProgress && !guestPreview.hasReachedLimit && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Preview progress</span>
                    <span>{guestPreview.previewsUsed}/2 used</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(guestPreview.previewsUsed / 2) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Call-to-action buttons */}
              <div className="flex gap-2 flex-wrap">
                {guestPreview.hasReachedLimit ? (
                  <>
                    <Button
                      onClick={handleSignupClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign Up Free
                    </Button>
                    <Button
                      onClick={handleUpgradeClick}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Get Premium
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleSignupClick}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign Up Free
                    </Button>
                    <Button
                      onClick={handleUpgradeClick}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Get Premium Access
                    </Button>
                  </>
                )}
              </div>

              {/* Additional info */}
              <div className="mt-2 text-xs text-gray-600">
                {guestPreview.hasReachedLimit ? (
                  "Free account includes progress tracking • Premium unlocks everything"
                ) : (
                  "Continue browsing without signing up"
                )}
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1 ml-2"
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Floating action button for guest conversion
 */
export function GuestConversionFab() {
  const { isAuthenticated } = useAuth();
  const guestPreview = useGuestPreview();
  const guestConversion = useGuestConversion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isAuthenticated || !guestPreview.isGuest || isDismissed) {
    return null;
  }

  const shouldShow = guestConversion.shouldShowAggresiveCta || guestPreview.hasReachedLimit;

  if (!shouldShow) return null;

  const handleSignupClick = () => {
    guestPreview.recordCta('fab_signup');
    // Handle signup modal/redirect
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    guestPreview.recordCta('fab_dismiss');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <Card className="w-80 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">
                {guestPreview.hasReachedLimit ? "Unlock Full Access!" : "Join Thousands of AI Learners"}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm mb-4 text-white/90">
              {guestPreview.hasReachedLimit
                ? "You've used all your previews. Sign up now for unlimited access!"
                : "Create your free account to unlock progress tracking and premium features."}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSignupClick}
                className="flex-1 bg-white text-blue-600 hover:bg-gray-50"
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up Free
              </Button>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                size="sm"
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          size="sm"
        >
          {guestPreview.hasReachedLimit ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <UserPlus className="h-6 w-6" />
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Smart banner that adapts based on guest behavior
 */
export function SmartGuestBanner() {
  const guestConversion = useGuestConversion();
  const [bannerType, setBannerType] = useState<'default' | 'urgent' | 'engaged'>('default');

  const recommendedCta = guestConversion.recommendedCta;

  const getBannerProps = () => {
    switch (recommendedCta) {
      case 'unlock_more_terms':
        return {
          variant: 'sticky' as const,
          compact: false,
          dismissible: false,
        };
      case 'engaged_user_offer':
        return {
          variant: 'inline' as const,
          compact: false,
          dismissible: true,
        };
      case 'first_time_offer':
        return {
          variant: 'top-bar' as const,
          compact: true,
          dismissible: true,
        };
      default:
        return {
          variant: 'top-bar' as const,
          compact: true,
          dismissible: true,
        };
    }
  };

  const bannerProps = getBannerProps();

  return <GuestPreviewBanner {...bannerProps} />;
}