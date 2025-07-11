import {
  BarChartIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  Clock,
  FlameIcon,
  Globe,
  Star,
  TrophyIcon,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAccess } from '../hooks/useAccess';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface UpgradePromptTrigger {
  type:
    | 'bookmark_limit'
    | 'high_engagement'
    | 'streak_milestone'
    | 'category_exploration'
    | 'historical_access';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: any;
}

interface ProgressStats {
  totalTermsViewed: number;
  totalBookmarks: number;
  currentStreak: number;
  bestStreak: number;
  categoriesExplored: number;
  timeSpentMinutes: number;
  upgradePromptTriggers: UpgradePromptTrigger[];
}

interface UpgradePromptProps {
  variant?: 'modal' | 'banner' | 'card' | 'smart' | 'inline';
  className?: string;
  onClose?: () => void;
  trigger?: UpgradePromptTrigger;
  progressStats?: ProgressStats;
  contentType?: 'section' | 'term' | 'feature';
  contentTitle?: string;
}

export function UpgradePrompt({
  variant = 'card',
  className = '',
  onClose,
  trigger,
  progressStats,
  contentType = 'term',
  contentTitle = '',
}: UpgradePromptProps) {
  const { accessStatus } = useAccess();
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(progressStats || null);
  const [_loading, setLoading] = useState(false);

  // Don't show upgrade prompt for premium users
  if (accessStatus?.lifetimeAccess) {
    return null;
  }

  useEffect(() => {
    if (user && !progressStats && (variant === 'smart' || trigger)) {
      fetchProgressStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, progressStats, variant, trigger]);

  const fetchProgressStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/progress/stats', {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch progress stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    // Navigate to Gumroad checkout with Purchasing Power Parity
    window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
  };

  const remainingViews = accessStatus?.remainingViews || 0;
  const dailyLimit = accessStatus?.dailyLimit || 50;
  const viewsUsed = dailyLimit - remainingViews;

  // Get trigger-specific content
  const getTriggerContent = (triggerData: UpgradePromptTrigger) => {
    const getIcon = () => {
      switch (triggerData.type) {
        case 'bookmark_limit':
          return <BookmarkIcon className="h-6 w-6 text-purple-500" />;
        case 'high_engagement':
          return <TrophyIcon className="h-6 w-6 text-yellow-500" />;
        case 'streak_milestone':
          return <FlameIcon className="h-6 w-6 text-orange-500" />;
        case 'category_exploration':
          return <BarChartIcon className="h-6 w-6 text-blue-500" />;
        case 'historical_access':
          return <CalendarDaysIcon className="h-6 w-6 text-green-500" />;
        default:
          return <Star className="h-6 w-6 text-blue-500" />;
      }
    };

    const getTitle = () => {
      switch (triggerData.type) {
        case 'bookmark_limit':
          return 'Bookmark Limit Reached';
        case 'high_engagement':
          return "You're a Power User!";
        case 'streak_milestone':
          return 'Streak Milestone Achieved!';
        case 'category_exploration':
          return 'Category Explorer';
        case 'historical_access':
          return 'Loyal Learner';
        default:
          return 'Upgrade Available';
      }
    };

    const getDescription = () => {
      switch (triggerData.type) {
        case 'bookmark_limit':
          return `You've reached your ${triggerData.metadata?.limit || 50} bookmark limit. Upgrade to save unlimited terms and build your personal AI/ML knowledge base.`;
        case 'high_engagement':
          return `You've explored ${triggerData.metadata?.termsViewed || 0} terms and spent ${triggerData.metadata?.timeSpent || 0} minutes learning. Unlock advanced features to accelerate your AI journey.`;
        case 'streak_milestone':
          return `Congratulations on your ${triggerData.metadata?.streak || 0}-day learning streak! Keep the momentum going with premium features designed for dedicated learners.`;
        case 'category_exploration':
          return `You've explored ${triggerData.metadata?.categoriesExplored || 0} different AI/ML categories. Dive deeper with premium content and advanced search capabilities.`;
        case 'historical_access':
          return `You've been learning with us for ${triggerData.metadata?.daysSinceFirst || 0} days. Ready to unlock the full potential of your AI/ML education?`;
        default:
          return triggerData.message;
      }
    };

    return { icon: getIcon(), title: getTitle(), description: getDescription() };
  };

  // Smart variant uses behavioral triggers
  if (variant === 'smart' && (trigger || stats?.upgradePromptTriggers?.length)) {
    const currentTrigger = trigger || stats?.upgradePromptTriggers?.[0];

    if (!currentTrigger) {
      return null;
    }

    const triggerContent = getTriggerContent(currentTrigger);
    const severityColors = {
      low: 'from-blue-50 to-cyan-50 border-blue-200',
      medium: 'from-orange-50 to-yellow-50 border-orange-200',
      high: 'from-red-50 to-pink-50 border-red-200',
    };

    return (
      <Card className={`${severityColors[currentTrigger.severity]} ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4">
            {triggerContent.icon}
          </div>
          <CardTitle className="text-xl">{triggerContent.title}</CardTitle>
          <CardDescription className="text-sm">{triggerContent.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 gap-4 text-sm bg-white/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <BookmarkIcon className="h-4 w-4 text-purple-500" />
                <span>{stats.totalBookmarks} bookmarks</span>
              </div>
              <div className="flex items-center gap-2">
                <FlameIcon className="h-4 w-4 text-orange-500" />
                <span>{stats.currentStreak} day streak</span>
              </div>
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-yellow-500" />
                <span>{stats.totalTermsViewed} terms</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChartIcon className="h-4 w-4 text-blue-500" />
                <span>{stats.categoriesExplored} categories</span>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">$249</div>
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
              Upgrade Now
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} className="px-3">
                Later
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-500" />
              <span>PPP Pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Instant Access</span>
            </div>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            7-day money-back guarantee • No subscription • One-time payment
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 ${className}`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-medium">
              {remainingViews > 0
                ? `${remainingViews} views remaining today`
                : 'Daily limit reached'}
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
              You've viewed {viewsUsed} out of {dailyLimit} free terms today. Upgrade for unlimited
              access to all {10372} AI/ML definitions.
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
                <div className="text-2xl font-bold text-blue-600">$249</div>
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

  if (variant === 'inline') {
    const getInlineContent = () => {
      switch (contentType) {
        case 'section':
          return {
            icon: <BookmarkIcon className="h-5 w-5 text-blue-500" />,
            title: `Unlock ${contentTitle || 'this section'}`,
            description: 'Get unlimited access to detailed explanations, examples, and advanced content.',
            cta: 'Unlock All Sections',
          };
        case 'feature':
          return {
            icon: <Star className="h-5 w-5 text-purple-500" />,
            title: `Premium Feature: ${contentTitle || 'Advanced Tools'}`,
            description: 'This feature is available to premium users. Upgrade for full access.',
            cta: 'Get Premium Access',
          };
        default:
          return {
            icon: <Zap className="h-5 w-5 text-yellow-500" />,
            title: 'Daily limit reached',
            description: `You've used your daily free views. Upgrade for unlimited ${contentTitle || 'terms'}.`,
            cta: 'Get Unlimited Access',
          };
      }
    };

    const content = getInlineContent();

    return (
      <div className={`bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 my-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            {content.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{content.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{content.description}</p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {content.cta}
              </Button>
              <div className="text-xs text-gray-500">
                $249 • One-time payment
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
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
                : `You've used all ${dailyLimit} free views today`}
            </CardDescription>
          </div>
          <Badge variant={remainingViews > 10 ? 'secondary' : 'destructive'}>
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
