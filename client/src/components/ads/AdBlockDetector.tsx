import { AlertTriangle, Shield, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface AdBlockDetectorProps {
  onDetected?: (isBlocked: boolean) => void;
  showUpgradePrompt?: boolean;
  className?: string | undefined;
}

export function AdBlockDetector({
  onDetected,
  showUpgradePrompt = true,
  className = '',
}: AdBlockDetectorProps) {
  const [isAdBlocked, setIsAdBlocked] = useState<boolean | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Create a test ad element to detect ad blocking
    const detectAdBlock = () => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      testAd.style.top = '-10000px';
      testAd.style.width = '1px';
      testAd.style.height = '1px';

      document.body.appendChild(testAd);

      // Check if the ad element was blocked
      setTimeout(() => {
        const isBlocked =
          testAd.offsetHeight === 0 ||
          testAd.offsetWidth === 0 ||
          testAd.style.display === 'none' ||
          testAd.style.visibility === 'hidden';

        setIsAdBlocked(isBlocked);
        setShowPrompt(isBlocked && showUpgradePrompt);

        if (onDetected) {
          onDetected(isBlocked);
        }

        // Clean up
        document.body.removeChild(testAd);
      }, 100);
    };

    // Alternative method: Check for common ad blocker indicators
    const checkAdBlockerExtension = () => {
      // Check for common ad blocker extensions
      const adBlockerSelectors = [
        '[data-adblock="true"]',
        '.adblock-detected',
        '#adblock-detected',
      ];

      const hasAdBlocker = adBlockerSelectors.some(
        selector => document.querySelector(selector) !== null
      );

      if (hasAdBlocker) {
        setIsAdBlocked(true);
        setShowPrompt(showUpgradePrompt);
        if (onDetected) {onDetected(true);}
      } else {
        detectAdBlock();
      }
    };

    // Run detection after a short delay to allow page to load
    const timer = setTimeout(checkAdBlockerExtension, 1000);

    return () => clearTimeout(timer);
  }, [onDetected, showUpgradePrompt]);

  // Don't render anything if we haven't detected ad blocking or don't want to show prompt
  if (!showPrompt || isAdBlocked === false) {
    return null;
  }

  const handleUpgrade = () => {
    window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem('adblock_prompt_dismissed', Date.now().toString());
  };

  // Check if user dismissed recently (within 24 hours)
  useEffect(() => {
    const dismissed = localStorage.getItem('adblock_prompt_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 1) {
        setShowPrompt(false);
      }
    }
  }, []);

  return (
    <div className={`ad-block-detector ${className}`}>
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 mb-4">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Ad Blocker Detected:</strong> We rely on ads to keep our AI glossary free.
          Consider supporting us by upgrading to Premium for an ad-free experience.
        </AlertDescription>
      </Alert>

      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>

          <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-200">
            🚫 Ad Blocker Detected
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Help us keep AI Glossary Pro free for everyone
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Why We Show Ads
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>Ads help us maintain and improve our AI/ML glossary</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>Revenue supports research and content updates</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>Keeps the platform free for students and learners</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Premium Alternative
            </h3>
            <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-500">✓</span>
                <span>Completely ad-free experience</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-500">✓</span>
                <span>Unlimited access to all 10,000+ terms</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-yellow-500">✓</span>
                <span>Priority support and lifetime updates</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
              size="lg"
            >
              <Star className="w-5 h-5 mr-2" />
              Upgrade to Premium - $249
            </Button>

            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
              size="lg"
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
            💡 You can also whitelist our site in your ad blocker to support us
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdBlockDetector;
