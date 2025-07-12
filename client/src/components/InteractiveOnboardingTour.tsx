import { ArrowRight, BookOpen, CheckCircle, Clock, Crown, Heart, Lightbulb, Search, Sparkles, Star, Target, Trophy, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface InteractiveOnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showAsModal?: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  highlights: string[];
  actionText: string;
  actionPath: string;
  bgGradient: string;
  iconBg: string;
  actionVariant?: 'default' | 'secondary' | 'outline';
}

export function InteractiveOnboardingTour({
  onComplete,
  onSkip,
  showAsModal = false,
}: InteractiveOnboardingTourProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  // No grace period - free users get 50 terms per day immediately

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Welcome to AI Glossary Pro! 🎉`,
      description: `Access 50 AI/ML definitions daily for free, or upgrade to unlimited lifetime access. Let's explore 10,000+ definitions!`,
      icon: <Trophy className="w-12 h-12 text-yellow-500" />,
      features: [
        '50 terms per day with free account',
        'Access to all content and search',
        'Bookmark your favorite definitions',
        'Track your learning progress'
      ],
      highlights: [
        'No credit card required',
        'Immediate access to all content',
        'Upgrade to lifetime access anytime'
      ],
      actionText: 'Start My Journey',
      actionPath: '/categories',
      bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950',
      iconBg: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'explore',
      title: 'Explore 42 AI/ML Categories',
      description: 'Dive into comprehensive categories covering every aspect of artificial intelligence and machine learning.',
      icon: <BookOpen className="w-12 h-12 text-blue-500" />,
      features: [
        'Machine Learning Algorithms',
        'Deep Learning & Neural Networks',
        'Natural Language Processing',
        'Computer Vision & Image Recognition',
        'Reinforcement Learning',
        'MLOps & Production Systems'
      ],
      highlights: [
        '10,000+ expertly curated definitions',
        'Real-world examples and use cases',
        'Updated weekly with latest trends'
      ],
      actionText: 'Browse Categories',
      actionPath: '/categories',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
      iconBg: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'search',
      title: 'Master Advanced Search',
      description: 'Find exactly what you need with our powerful semantic search and intelligent filtering system.',
      icon: <Search className="w-12 h-12 text-purple-500" />,
      features: [
        'Semantic search across all definitions',
        'Filter by complexity and topic',
        'Search by industry or use case',
        'Discover related concepts',
        'Smart autocomplete suggestions'
      ],
      highlights: [
        'AI-powered search results',
        'Instant filtering and sorting',
        'Save your favorite searches'
      ],
      actionText: 'Try Search Now',
      actionPath: '/search',
      bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950',
      iconBg: 'from-purple-500 to-violet-500',
    },
    {
      id: 'favorites',
      title: 'Build Your Learning Library',
      description: 'Save important definitions and track your learning progress across all AI/ML topics.',
      icon: <Heart className="w-12 h-12 text-pink-500" />,
      features: [
        'Bookmark important definitions',
        'Create custom learning collections',
        'Track your reading progress',
        'Export your favorites list',
        'Share collections with others'
      ],
      highlights: [
        'Personal learning dashboard',
        'Progress tracking and insights',
        'Organized knowledge management'
      ],
      actionText: 'Start Building Library',
      actionPath: '/favorites',
      bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950',
      iconBg: 'from-pink-500 to-rose-500',
    },
    {
      id: 'progress',
      title: 'Track Your Learning Progress',
      description: 'Monitor your daily term views and learning progress with our comprehensive tracking dashboard.',
      icon: <Clock className="w-12 h-12 text-green-500" />,
      features: [
        'Track daily term usage (50 per day)',
        'Advanced search and filtering',
        'Progress tracking and analytics',
        'Bookmark and organize favorites',
        'Access to latest AI terminology'
      ],
      highlights: [
        '50 terms per day with free account',
        'Track your daily usage and progress',
        'Upgrade anytime for unlimited lifetime access'
      ],
      actionText: 'Explore Your Progress',
      actionPath: '/dashboard',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
      iconBg: 'from-green-500 to-emerald-500',
    },
    {
      id: 'premium',
      title: 'Ready to Go Premium?',
      description: 'Join thousands of AI professionals with lifetime access to the most comprehensive AI/ML glossary.',
      icon: <Crown className="w-12 h-12 text-yellow-500" />,
      features: [
        'Lifetime access to all content',
        'Priority customer support',
        'Early access to new features',
        'Advanced export capabilities',
        'Team collaboration tools'
      ],
      highlights: [
        'One-time payment of $249',
        'No recurring subscriptions',
        'Money-back guarantee'
      ],
      actionText: 'Upgrade to Premium',
      actionPath: '/lifetime',
      bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950',
      iconBg: 'from-yellow-500 to-amber-500',
      actionVariant: 'secondary',
    }
  ];

  useEffect(() => {
    // Update progress based on current step
    const progressValue = ((currentStep + 1) / onboardingSteps.length) * 100;
    setProgress(progressValue);
  }, [currentStep, onboardingSteps.length]);

  const currentStepData = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast({
      title: '🚀 Tour Complete!',
      description: `You're ready to explore! Access 50 terms daily or upgrade for unlimited lifetime access.`,
      duration: 6000,
    });
    
    // Mark onboarding as completed in localStorage
    localStorage.setItem('free_user_onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_date', new Date().toISOString());
    
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard?welcome=free');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('free_user_onboarding_completed', 'true');
    localStorage.setItem('onboarding_skipped', 'true');
    
    toast({
      title: 'Onboarding Skipped',
      description: 'You can always take the tour later from your dashboard.',
      duration: 4000,
    });
    
    if (onSkip) {
      onSkip();
    } else {
      navigate('/dashboard');
    }
  };

  const handleNavigateToFeature = () => {
    navigate(currentStepData.actionPath);
    if (currentStep === onboardingSteps.length - 1) {
      handleComplete();
    }
  };

  const containerClass = showAsModal
    ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
    : 'container mx-auto px-4 py-8';

  const cardClass = showAsModal ? 'max-w-4xl w-full mx-auto' : 'max-w-4xl mx-auto';

  return (
    <div className={containerClass}>
      <Card className={`${cardClass} border-blue-200 bg-gradient-to-br ${currentStepData.bgGradient}`}>
        <CardHeader className="text-center pb-4">
          {/* Free User Access Badge */}
          <Badge className="mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-2 text-lg">
            <BookOpen className="w-5 h-5 mr-2" />
            50 Terms Daily - Free Access
          </Badge>

          {/* Close Button for Modal */}
          {showAsModal && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {onboardingSteps.length}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Icon */}
          <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${currentStepData.iconBg} rounded-full flex items-center justify-center mb-4`}>
            {currentStepData.icon}
          </div>

          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {currentStepData.title}
          </CardTitle>
          <CardDescription className="text-lg text-gray-700 dark:text-gray-300">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features List */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Key Features:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentStepData.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights Section */}
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
              Why You'll Love This:
            </h4>
            <div className="space-y-2">
              {currentStepData.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  <span className="font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">10,000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI/ML Terms</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">42</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">∞</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Premium Access</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">50</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Daily Terms</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleNavigateToFeature}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              size="lg"
              variant={currentStepData.actionVariant || 'default'}
            >
              <Zap className="w-5 h-5 mr-2" />
              {currentStepData.actionText}
            </Button>

            <Button
              onClick={handleNext}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-900/20"
              size="lg"
            >
              {currentStep < onboardingSteps.length - 1 ? (
                <>
                  Next Step
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Complete Tour
                  <CheckCircle className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              disabled={currentStep === 0}
              className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            >
              ← Previous
            </Button>

            <div className="flex space-x-2">
              {onboardingSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-500'
                      : index < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
            >
              Skip Tour →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InteractiveOnboardingTour;