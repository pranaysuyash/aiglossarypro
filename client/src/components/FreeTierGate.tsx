import { Clock, Eye, Lock, UserCheck, Zap } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useTermAccess } from '../hooks/useAccess';
import { useAuth } from '../hooks/useAuth';
import { useGuestConversion, useGuestPreview } from '../hooks/useGuestPreview';
import { GoogleAd } from './ads/GoogleAd';
import { UpgradePrompt } from './UpgradePrompt';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface FreeTierGateProps {
  termId?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean;
  previewLength?: number;
  guestPreviewLength?: number;
}

export function FreeTierGate({
  termId,
  children,
  fallback,
  showPreview = true,
  previewLength = 200,
  guestPreviewLength = 300,
}: FreeTierGateProps) {
  const { isAuthenticated } = useAuth();
  const { canViewTerm, isLoading, accessStatus } = useTermAccess(termId);
  const guestPreview = useGuestPreview();
  const guestConversion = useGuestConversion();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Handle guest preview functionality
  useEffect(() => {
    if (!isAuthenticated && termId && guestPreview.canPreview) {
      // Track that the guest has viewed this term page
      guestPreview.trackPageView(`/term/${termId}`);
    }
  }, [isAuthenticated, termId, guestPreview]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  // Authenticated user access control
  if (isAuthenticated) {
    if (canViewTerm) {
      return <>{children}</>;
    }

    // If custom fallback is provided for authenticated users, use it
    if (fallback) {
      return <>{fallback}</>;
    }
  } else {
    // Guest user logic
    const canGuestView = termId
      ? guestPreview.session?.viewedTerms.includes(termId) || guestPreview.canPreview
      : guestPreview.canPreview;

    if (canGuestView && termId && !guestPreview.session?.viewedTerms.includes(termId)) {
      // Record the preview view
      guestPreview.recordPreview(termId);
    }

    // Show preview for guests if they can view or have already viewed this term
    if (canGuestView || (termId && guestPreview.session?.viewedTerms.includes(termId))) {
      return (
        <div className="space-y-4">
          {/* Guest preview banner */}
          {!guestPreview.hasReachedLimit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Preview Mode ({guestPreview.previewsRemaining} views remaining)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  guestPreview.recordCta('preview_banner_signup');
                  setShowUpgradeModal(true);
                }}
                className="text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Sign Up Free
              </Button>
            </div>
          )}

          {/* Content */}
          {children}

          {/* Ad placement for free users (after content, before CTA) */}
          <GoogleAd slot="1234567890" format="rectangle" responsive className="my-4" />

          {/* Guest CTA after content */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 text-center">
            <h3 className="font-semibold mb-2">
              {guestPreview.hasReachedLimit
                ? "You've reached your preview limit!"
                : 'Like what you see?'}
            </h3>
            <p className="text-sm opacity-90 mb-3">
              {guestPreview.hasReachedLimit
                ? 'Sign up for free to unlock unlimited access to all AI/ML terms and features.'
                : 'Sign up for free to track your progress and access premium features.'}
            </p>
            <Button
              onClick={() => {
                guestPreview.recordCta('post_content_signup');
                setShowUpgradeModal(true);
              }}
              className="bg-white text-blue-600 hover:bg-gray-50"
            >
              Sign Up Free - No Credit Card Required
            </Button>
          </div>
        </div>
      );
    }
  }

  // Extract preview text from children if showPreview is true
  const getPreviewText = (content: ReactNode, isGuest = false): string => {
    const maxLength = isGuest ? guestPreviewLength : previewLength;

    if (typeof content === 'string') {
      return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
    }

    // For React elements, try to extract text content
    if (content && typeof content === 'object' && 'props' in content) {
      const props = (content as any).props;
      if (props.children) {
        return getPreviewText(props.children, isGuest);
      }
    }

    return isGuest
      ? 'Get full access to premium content...'
      : 'Premium content preview not available...';
  };

  const isFreeTier = accessStatus?.subscriptionTier === 'free';
  const remainingViews = accessStatus?.remainingViews || 0;
  const hasReachedLimit = isFreeTier && remainingViews <= 0;

  // Determine the context for the gate display
  const isGuestContext = !isAuthenticated;

  return (
    <div className="space-y-4">
      {/* Show preview if requested */}
      {showPreview && (
        <div className="relative">
          <div className="text-gray-600">{getPreviewText(children, isGuestContext)}</div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white pointer-events-none" />
        </div>
      )}

      {/* Access gate card */}
      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3">
            {isGuestContext ? (
              <UserCheck className="h-6 w-6 text-white" />
            ) : (
              <Lock className="h-6 w-6 text-white" />
            )}
          </div>

          <CardTitle className="text-lg">
            {isGuestContext
              ? guestPreview.hasReachedLimit
                ? 'Preview Limit Reached'
                : 'Start Your Free Preview'
              : hasReachedLimit
                ? 'Daily Limit Reached'
                : 'Premium Content'}
          </CardTitle>

          <CardDescription className="text-center max-w-md mx-auto">
            {isGuestContext ? (
              guestPreview.hasReachedLimit ? (
                <>
                  You've previewed {guestPreview.previewsUsed} terms. Sign up for free to unlock
                  unlimited access to all {10372} AI/ML definitions and track your learning
                  progress.
                </>
              ) : (
                <>
                  Preview {guestPreview.previewsRemaining} terms for free, then sign up for
                  unlimited access to our comprehensive AI/ML glossary with {10372} definitions.
                </>
              )
            ) : hasReachedLimit ? (
              <>
                You've viewed all {accessStatus?.dailyLimit || 50} free terms today. Upgrade for
                unlimited access to our complete AI/ML glossary.
              </>
            ) : (
              <>
                This content is part of our comprehensive AI/ML glossary. Get unlimited access to
                all {10372} definitions.
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Usage indicator */}
          {((isGuestContext && !guestPreview.hasReachedLimit) ||
            (isFreeTier && !hasReachedLimit)) && (
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {isGuestContext ? 'Preview views remaining' : 'Views remaining today'}
                </span>
                <span className="font-medium">
                  {isGuestContext ? guestPreview.previewsRemaining : remainingViews}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: isGuestContext
                      ? `${Math.max(0, (guestPreview.previewsRemaining / 2) * 100)}%`
                      : `${Math.max(0, (remainingViews / (accessStatus?.dailyLimit || 50)) * 100)}%`,
                  }}
                />
              </div>
              {isGuestContext && (
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                  <Clock className="h-3 w-3" />
                  <span>No sign up required for preview</span>
                </div>
              )}
            </div>
          )}

          {/* Benefits list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>10,372+ AI/ML terms</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>42 sections per term</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Interactive examples</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>No subscription needed</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg p-4 border text-center">
            <div className="text-2xl font-bold text-blue-600">$249</div>
            <div className="text-sm text-gray-600">One-time lifetime access</div>
            <div className="text-xs text-green-600 font-medium mt-1">
              🌍 Automatically adjusted for your region
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {isGuestContext ? (
              <>
                <Button
                  onClick={() => {
                    guestPreview.recordCta('gate_signup_free');
                    setShowUpgradeModal(true);
                  }}
                  variant="outline"
                  className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Sign Up Free
                </Button>
                <Button
                  onClick={() => {
                    guestPreview.recordCta('gate_upgrade_premium');
                    setShowUpgradeModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Get Premium
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Get Lifetime Access
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-gray-500">
            {isGuestContext
              ? 'Free account includes progress tracking • Premium unlocks everything'
              : '7-day money-back guarantee • Instant access • One-time payment'}
          </p>
        </CardContent>
      </Card>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradePrompt variant="modal" onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}

/**
 * Higher-order component to wrap content with access control
 */
export function withFreeTierGate<P extends object>(
  Component: React.ComponentType<P>,
  gateProps?: Omit<FreeTierGateProps, 'children'>
) {
  return function WrappedComponent(props: P & { termId?: string }) {
    const { termId, ...componentProps } = props;

    return (
      <FreeTierGate termId={termId} {...gateProps}>
        <Component {...(componentProps as P)} />
      </FreeTierGate>
    );
  };
}
