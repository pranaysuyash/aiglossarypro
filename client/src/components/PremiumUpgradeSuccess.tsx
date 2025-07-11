import { ArrowRight, BookOpen, CheckCircle, Crown, Gift, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PremiumOnboarding } from './PremiumOnboarding';

interface PremiumUpgradeSuccessProps {
  onClose?: () => void;
  autoRedirect?: boolean;
  showAsModal?: boolean;
  showOnboarding?: boolean;
}

export function PremiumUpgradeSuccess({
  onClose,
  autoRedirect = true,
  showAsModal = false,
  showOnboarding = true,
}: PremiumUpgradeSuccessProps) {
  const { toast } = useToast();
  const { user, refetch } = useAuth();
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(10);
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false);

  useEffect(() => {
    // Refetch user data to get updated premium status
    refetch();

    // Show success toast
    toast({
      title: '🎉 Welcome to Premium!',
      description: 'Your upgrade was successful. You now have unlimited access!',
      duration: 8000,
    });

    // Countdown for auto-redirect
    if (autoRedirect) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard?welcome=premium');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoRedirect, navigate, refetch, toast]);

  const features = [
    {
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      title: '10,000+ AI/ML Definitions',
      description: 'Access our complete glossary without limits',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      title: 'Advanced AI Tools',
      description: 'Exclusive access to premium AI tools and resources',
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      title: 'Priority Support',
      description: 'Get priority help and feature requests',
    },
    {
      icon: <Gift className="w-5 h-5 text-green-500" />,
      title: 'Lifetime Updates',
      description: 'Forever access to new terms and features',
    },
  ];

  const containerClass = showAsModal
    ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
    : 'container mx-auto px-4 py-8';

  const cardClass = showAsModal ? 'max-w-2xl w-full mx-auto' : 'max-w-4xl mx-auto';

  // Show onboarding flow if requested
  if (showOnboardingFlow) {
    return (
      <PremiumOnboarding
        showAsModal={showAsModal}
        onComplete={() => {
          setShowOnboardingFlow(false);
          navigate('/dashboard');
        }}
      />
    );
  }

  return (
    <div className={containerClass}>
      <Card
        className={`${cardClass} border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950`}
      >
        <CardHeader className="text-center pb-4">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>

          {/* Premium Badge */}
          <Badge className="mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-2 text-lg">
            <Crown className="w-5 h-5 mr-2" />
            Premium Member
          </Badge>

          <CardTitle className="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
            🎉 Upgrade Complete!
          </CardTitle>
          <CardDescription className="text-lg text-green-700 dark:text-green-300">
            Thank you for upgrading to Premium! Your lifetime access is now active.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Alert */}
          <Alert className="border-green-300 bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
              🚀 Your payment has been processed successfully. You now have unlimited access to all
              premium features!
            </AlertDescription>
          </Alert>

          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-green-200 dark:border-green-800"
              >
                <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* What's Next Section */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
              What's Next?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>Explore all 42 AI/ML categories without limits</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>Access exclusive AI tools and resources</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>Track your learning progress across all topics</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>Get priority support and feature requests</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {showOnboarding && (
              <Button
                onClick={() => setShowOnboardingFlow(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Take Premium Tour
              </Button>
            )}

            <Button
              onClick={() => navigate('/dashboard?welcome=premium')}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
              size="lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Go to Premium Dashboard
              {autoRedirect && countdown > 0 && (
                <span className="ml-2 text-sm opacity-80">({countdown}s)</span>
              )}
            </Button>

            <Button
              onClick={() => navigate('/categories')}
              variant="outline"
              className="flex-1 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/20"
              size="lg"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start Exploring
            </Button>

            {showAsModal && onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
              >
                Close
              </Button>
            )}
          </div>

          {/* Email Confirmation Note */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-green-200 dark:border-green-800">
            📧 A confirmation email has been sent to your address with your receipt and account
            details.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PremiumUpgradeSuccess;
