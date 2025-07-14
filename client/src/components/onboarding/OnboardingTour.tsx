import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../hooks/useAuth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI/ML Glossary Pro!',
    description: 'Your comprehensive guide to understanding AI and Machine Learning terminology. Let\'s take a quick tour to get you started.',
  },
  {
    id: 'search',
    title: 'Powerful Search',
    description: 'Use our advanced search to find any AI/ML term quickly. Try searching for "neural network" or "machine learning".',
    target: '[data-testid="search-input"]',
    position: 'bottom',
    action: {
      text: 'Try Search',
      href: '/app?search=neural+network',
    },
  },
  {
    id: 'categories',
    title: 'Explore by Categories',
    description: 'Browse terms organized by categories like Deep Learning, Natural Language Processing, Computer Vision, and more.',
    target: '[data-testid="categories-nav"]',
    position: 'bottom',
    action: {
      text: 'View Categories',
      href: '/categories',
    },
  },
  {
    id: 'dashboard',
    title: 'Track Your Progress',
    description: 'Your dashboard shows your learning streak, bookmarked terms, and progress across different AI/ML domains.',
    target: '[data-testid="dashboard-nav"]',
    position: 'bottom',
    action: {
      text: 'Go to Dashboard',
      href: '/dashboard',
    },
  },
  {
    id: 'features',
    title: 'Premium Features',
    description: 'Unlock unlimited access to all 10,372+ terms, advanced search, bookmarks, and progress tracking.',
    action: {
      text: 'Learn More',
      href: '/lifetime',
    },
  },
];

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export function OnboardingTour({ isVisible, onComplete, onDismiss }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setIsCompleted(false);
    }
  }, [isVisible]);

  if (!isVisible || isCompleted) {
    return null;
  }

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsCompleted(true);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsCompleted(true);
    onDismiss();
  };

  const handleStepAction = () => {
    if (currentStepData.action?.onClick) {
      currentStepData.action.onClick();
    } else if (currentStepData.action?.href) {
      window.location.href = currentStepData.action.href;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        {/* Onboarding Card */}
        <Card className="w-full max-w-md relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">{currentStep + 1}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {onboardingSteps.length}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-gray-600 leading-relaxed">{currentStepData.description}</p>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
              />
            </div>

            {/* Action button */}
            {currentStepData.action && (
              <div className="pt-2">
                <Button
                  onClick={handleStepAction}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {currentStepData.action.text}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-1">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-blue-600'
                        : index < currentStep
                          ? 'bg-blue-300'
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Welcome message for authenticated users */}
            {currentStep === 0 && user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700">
                  Welcome back, {user.displayName || user.email?.split('@')[0]}! 👋
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    // Show onboarding for new authenticated users who haven't seen it
    if (isAuthenticated && !hasSeenOnboarding) {
      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const completeOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const dismissOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    completeOnboarding,
    dismissOnboarding,
    resetOnboarding,
  };
}