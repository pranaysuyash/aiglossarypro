import { ReactNode, useState } from 'react';
import { useTermAccess } from '../hooks/useAccess';
import { UpgradePrompt } from './UpgradePrompt';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lock, Eye, Zap } from 'lucide-react';

interface FreeTierGateProps {
  termId?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean;
  previewLength?: number;
}

export function FreeTierGate({ 
  termId, 
  children, 
  fallback, 
  showPreview = true, 
  previewLength = 200 
}: FreeTierGateProps) {
  const { canViewTerm, isLoading, accessStatus } = useTermAccess(termId);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  // If user has access, show the content
  if (canViewTerm) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Extract preview text from children if showPreview is true
  const getPreviewText = (content: ReactNode): string => {
    if (typeof content === 'string') {
      return content.length > previewLength 
        ? content.substring(0, previewLength) + '...'
        : content;
    }
    
    // For React elements, try to extract text content
    if (content && typeof content === 'object' && 'props' in content) {
      const props = (content as any).props;
      if (props.children) {
        return getPreviewText(props.children);
      }
    }
    
    return 'Premium content preview not available...';
  };

  const isFreeTier = accessStatus?.subscriptionTier === 'free';
  const remainingViews = accessStatus?.remainingViews || 0;
  const hasReachedLimit = isFreeTier && remainingViews <= 0;

  return (
    <div className="space-y-4">
      {/* Show preview if requested */}
      {showPreview && (
        <div className="relative">
          <div className="text-gray-600">
            {getPreviewText(children)}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white pointer-events-none" />
        </div>
      )}

      {/* Access gate card */}
      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-white" />
          </div>
          
          <CardTitle className="text-lg">
            {hasReachedLimit ? 'Daily Limit Reached' : 'Premium Content'}
          </CardTitle>
          
          <CardDescription className="text-center max-w-md mx-auto">
            {hasReachedLimit ? (
              <>
                You've viewed all {accessStatus?.dailyLimit || 50} free terms today. 
                Upgrade for unlimited access to our complete AI/ML glossary.
              </>
            ) : (
              <>
                This content is part of our comprehensive AI/ML glossary. 
                Get unlimited access to all {10372} definitions.
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Usage indicator for free tier */}
          {isFreeTier && !hasReachedLimit && (
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Views remaining today
                </span>
                <span className="font-medium">{remainingViews}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.max(0, (remainingViews / (accessStatus?.dailyLimit || 50)) * 100)}%` 
                  }}
                />
              </div>
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
            <div className="text-2xl font-bold text-blue-600">$129</div>
            <div className="text-sm text-gray-600">One-time lifetime access</div>
            <div className="text-xs text-green-600 font-medium mt-1">
              🌍 Automatically adjusted for your region
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Get Lifetime Access
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            7-day money-back guarantee • Instant access • One-time payment
          </p>
        </CardContent>
      </Card>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradePrompt 
          variant="modal" 
          onClose={() => setShowUpgradeModal(false)} 
        />
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