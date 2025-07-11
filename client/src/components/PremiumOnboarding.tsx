import { ArrowRight, BookOpen, CheckCircle, Crown, Gift, Lightbulb, Search, Sparkles, Star, TrendingUp, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface PremiumOnboardingProps {
  onComplete?: () => void;
  showAsModal?: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  path: string;
}

export function PremiumOnboarding({
  onComplete,
  showAsModal = false,
}: PremiumOnboardingProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Premium! 🎉',
      description: 'You now have unlimited access to all 10,000+ AI/ML definitions and premium features.',
      icon: <Crown className="w-12 h-12 text-yellow-500" />,
      features: [
        'Unlimited daily access to all terms',
        'No ads or upgrade prompts',
        'Priority customer support',
        'Lifetime access to all updates'
      ],
      cta: 'Start Your Premium Journey',
      path: '/dashboard'
    },
    {
      id: 'explore',
      title: 'Explore 42 AI/ML Categories',
      description: 'Dive deep into comprehensive categories covering every aspect of AI and Machine Learning.',
      icon: <BookOpen className="w-12 h-12 text-blue-500" />,
      features: [
        'Machine Learning Algorithms',
        'Deep Learning & Neural Networks',
        'Natural Language Processing',
        'Computer Vision & Image Processing',
        'Reinforcement Learning',
        'MLOps & Production Systems'
      ],
      cta: 'Browse Categories',
      path: '/categories'
    },
    {
      id: 'search',
      title: 'Advanced Search & Discovery',
      description: 'Use powerful search features to find exactly what you need across our entire knowledge base.',
      icon: <Search className="w-12 h-12 text-purple-500" />,
      features: [
        'Semantic search across all definitions',
        'Filter by complexity level',
        'Search by use case or industry',
        'Related terms and concepts',
        'Bookmark and organize favorites'
      ],
      cta: 'Try Advanced Search',
      path: '/search'
    },
    {
      id: 'features',
      title: 'Premium Features & Tools',
      description: 'Access exclusive premium tools designed to accelerate your AI/ML learning journey.',
      icon: <Sparkles className="w-12 h-12 text-green-500" />,
      features: [
        'AI-powered explanations and examples',
        'Interactive concept visualizations',
        'Learning progress tracking',
        'Personalized recommendations',
        'Downloadable study guides'
      ],
      cta: 'Explore Premium Tools',
      path: '/tools'
    },
    {
      id: 'community',
      title: 'Join the Premium Community',
      description: 'Connect with other AI practitioners and get priority support from our team.',
      icon: <Users className="w-12 h-12 text-orange-500" />,
      features: [
        'Priority email support',
        'Feature request submission',
        'Early access to new content',
        'Community discussions',
        'Expert office hours'
      ],
      cta: 'Get Support',
      path: '/support'
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
      title: '🚀 Onboarding Complete!',
      description: 'You\'re all set to explore your premium features. Welcome aboard!',
      duration: 5000,
    });
    
    // Mark onboarding as completed in localStorage
    localStorage.setItem('premium_onboarding_completed', 'true');
    
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('premium_onboarding_completed', 'true');
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  };

  const handleNavigateToFeature = () => {
    navigate(currentStepData.path);
    handleComplete();
  };

  const containerClass = showAsModal
    ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
    : 'container mx-auto px-4 py-8';

  const cardClass = showAsModal ? 'max-w-4xl w-full mx-auto' : 'max-w-4xl mx-auto';

  return (
    <div className={containerClass}>
      <Card className={`${cardClass} border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950`}>
        <CardHeader className="text-center pb-4">
          {/* Premium Badge */}
          <Badge className="mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-2 text-lg">
            <Crown className="w-5 h-5 mr-2" />
            🌟 Pro Member
          </Badge>

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
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
            {currentStepData.icon}
          </div>

          <CardTitle className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-2">
            {currentStepData.title}
          </CardTitle>
          <CardDescription className="text-lg text-purple-700 dark:text-purple-300">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Features List */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              What You Can Do:
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">10,000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI/ML Terms</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">42</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">∞</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Daily Access</div>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleNavigateToFeature}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
              size="lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {currentStepData.cta}
            </Button>

            <Button
              onClick={handleNext}
              variant="outline"
              className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20"
              size="lg"
            >
              {currentStep < onboardingSteps.length - 1 ? (
                <>
                  Next Step
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-purple-200 dark:border-purple-800">
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
                      ? 'bg-purple-500'
                      : index < currentStep
                      ? 'bg-purple-300'
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

export default PremiumOnboarding;