import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Zap, Globe, Clock, Star } from 'lucide-react';
import { useAccess } from '../hooks/useAccess';

interface UpgradePromptProps {
  variant?: 'modal' | 'banner' | 'card';
  className?: string;
  onClose?: () => void;
}

export function UpgradePrompt({ variant = 'card', className = '', onClose }: UpgradePromptProps) {
  const { accessStatus } = useAccess();
  
  const handleUpgrade = () => {
    // Navigate to Gumroad checkout with Purchasing Power Parity
    window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
  };

  const remainingViews = accessStatus?.remainingViews || 0;
  const dailyLimit = accessStatus?.dailyLimit || 50;
  const viewsUsed = dailyLimit - remainingViews;

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 ${className}`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-medium">
              {remainingViews > 0 
                ? `${remainingViews} views remaining today` 
                : 'Daily limit reached'
              }
            </span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Free Tier
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleUpgrade}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Upgrade to Lifetime Access
            </Button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className={`max-w-md w-full ${className}`}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">Daily Limit Reached</CardTitle>
            <CardDescription>
              You've viewed {viewsUsed} out of {dailyLimit} free terms today. 
              Upgrade for unlimited access to all {10372} AI/ML definitions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span>PPP Pricing Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Instant Access</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$129</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">One-time payment</div>
                <div className="text-xs text-green-600 font-medium mt-1">
                  Auto-adjusted for your region
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleUpgrade}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Lifetime Access
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose} className="px-3">
                  Later
                </Button>
              )}
            </div>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              7-day money-back guarantee • No subscription • One-time payment
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Usage Limit
            </CardTitle>
            <CardDescription>
              {remainingViews > 0 
                ? `${remainingViews} of ${dailyLimit} free views remaining today`
                : `You've used all ${dailyLimit} free views today`
              }
            </CardDescription>
          </div>
          <Badge variant={remainingViews > 10 ? "secondary" : "destructive"}>
            {Math.round((viewsUsed / dailyLimit) * 100)}% used
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                remainingViews > 10 
                  ? 'bg-green-500' 
                  : remainingViews > 0 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${(viewsUsed / dailyLimit) * 100}%` }}
            />
          </div>
          
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="sm"
          >
            Upgrade for Unlimited Access
          </Button>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            One-time payment • Regional pricing • 7-day guarantee
          </p>
        </div>
      </CardContent>
    </Card>
  );
}