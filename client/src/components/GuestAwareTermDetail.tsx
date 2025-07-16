import { ExternalLink, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useGuestPageTracking, useGuestPreview } from '@/hooks/useGuestPreview';
import EnhancedTermDetail from '@/pages/EnhancedTermDetail';
import { FreeTierGate } from './FreeTierGate';
import { GuestPreviewBanner } from './GuestPreviewBanner';
import { GuestUpgradeModal } from './modals/GuestUpgradeModal';
import { Alert, AlertDescription } from './ui/alert';

/**
 * Wrapper component that handles guest preview functionality for term details
 */
export default function GuestAwareTermDetail() {
  // Support both route patterns: /term/:id and /enhanced/terms/:id
  const [_matchBasic, paramsBasic] = useRoute('/term/:id');
  const [_matchEnhanced, paramsEnhanced] = useRoute('/enhanced/terms/:id');

  const termId = paramsBasic?.id || paramsEnhanced?.id;
  const { isAuthenticated } = useAuth();
  const guestPreview = useGuestPreview();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Track page views for guests
  useGuestPageTracking();

  // Track specific term page view
  useEffect(() => {
    if (!isAuthenticated && termId) {
      guestPreview.trackPageView(`/term/${termId}`);
    }
  }, [isAuthenticated, termId, guestPreview]);

  // Show upgrade modal when guest tries to view content but has reached limit
  useEffect(() => {
    if (!isAuthenticated && termId && guestPreview.hasReachedLimit) {
      // Check if this is a new attempt to view content
      const hasViewedThisTerm = guestPreview.session?.viewedTerms.includes(termId);
      if (!hasViewedThisTerm) {
        setShowUpgradeModal(true);
      }
    }
  }, [isAuthenticated, termId, guestPreview.hasReachedLimit, guestPreview.session]);

  if (!termId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Term ID not found in the URL.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // For authenticated users, show the regular term detail page
  if (isAuthenticated) {
    return <EnhancedTermDetail />;
  }

  // For guests, wrap the content with FreeTierGate for preview management
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Guest banner at the top */}
      {guestPreview.isGuest && (
        <GuestPreviewBanner
          variant="sticky"
          compact={!guestPreview.hasReachedLimit}
          dismissible={!guestPreview.hasReachedLimit}
        />
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Guest preview gate wrapper */}
        <FreeTierGate
          termId={termId}
          showPreview
          guestPreviewLength={500} // More generous preview for guests
          fallback={<GuestFallbackContent termId={termId} />}
        >
          <div className="space-y-6">
            {/* Guest-specific information banner */}
            {guestPreview.isGuest && !guestPreview.hasReachedLimit && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Preview Mode:</strong> You're viewing a limited preview of this term.
                  {guestPreview.previewsRemaining > 0 && (
                    <span className="ml-1">
                      {guestPreview.previewsRemaining} preview
                      {guestPreview.previewsRemaining === 1 ? '' : 's'} remaining.
                    </span>
                  )}
                  <br />
                  <span className="text-sm">
                    Sign up for free to access the complete definition, examples, and interactive
                    features.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Render the actual term content */}
            <EnhancedTermDetail />

            {/* Guest conversion footer */}
            {guestPreview.isGuest && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
                <h3 className="text-xl font-bold mb-2">
                  Ready to unlock the complete AI/ML glossary?
                </h3>
                <p className="mb-4">
                  Get unlimited access to all {10372} terms with detailed explanations, interactive
                  examples, and progress tracking.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      guestPreview.recordCta('term_footer_signup');
                      setShowUpgradeModal(true);
                    }}
                    className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Sign Up Free
                  </button>
                  <button
                    onClick={() => {
                      guestPreview.recordCta('term_footer_premium');
                      setShowUpgradeModal(true);
                    }}
                    className="border border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    Get Premium Access
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs mt-3 opacity-80">
                  Join thousands of AI professionals and students advancing their careers
                </p>
              </div>
            )}
          </div>
        </FreeTierGate>
      </div>

      {/* Guest Upgrade Modal */}
      <GuestUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSignup={() => {
          guestPreview.recordCta('modal_signup');
          window.location.href = '/login';
        }}
        onUpgrade={() => {
          guestPreview.recordCta('modal_upgrade');
          window.location.href = '/lifetime';
        }}
        previewsUsed={guestPreview.previewsUsed}
        maxPreviews={2}
        termTitle={termId ? `Term ${termId}` : undefined}
      />
    </div>
  );
}

/**
 * Fallback content shown when guests have exceeded their preview limit
 */
function GuestFallbackContent({ termId }: { termId: string }) {
  const guestPreview = useGuestPreview();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Info className="h-8 w-8 text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Preview Limit Reached</h2>

        <p className="text-gray-600 max-w-md mx-auto">
          You've explored {guestPreview.previewsUsed} terms in preview mode. Create your free
          account to continue learning with unlimited access.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900">What you'll get with a free account:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Unlimited access to term definitions</li>
            <li>• Progress tracking and bookmarks</li>
            <li>• Advanced search and filtering</li>
            <li>• Learning path recommendations</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              guestPreview.recordCta('fallback_signup');
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign Up Free
          </button>
          <button
            onClick={() => {
              guestPreview.recordCta('fallback_premium');
              setShowModal(true);
            }}
            className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Get Premium
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in here
          </a>
        </p>
      </div>

      {/* Guest Upgrade Modal */}
      <GuestUpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSignup={() => {
          guestPreview.recordCta('fallback_modal_signup');
          window.location.href = '/login';
        }}
        onUpgrade={() => {
          guestPreview.recordCta('fallback_modal_upgrade');
          window.location.href = '/lifetime';
        }}
        previewsUsed={guestPreview.previewsUsed}
        maxPreviews={2}
        termTitle={termId ? `Term ${termId}` : undefined}
      />
    </div>
  );
}
