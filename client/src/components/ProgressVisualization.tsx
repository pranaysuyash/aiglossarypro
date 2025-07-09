import {
  AwardIcon,
  BarChartIcon,
  BookmarkIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClockIcon,
  FlameIcon,
  TrendingUpIcon,
  TrophyIcon,
  ZapIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface UserProgressStats {
  totalTermsViewed: number;
  totalBookmarks: number;
  currentStreak: number;
  bestStreak: number;
  categoriesExplored: number;
  timeSpentMinutes: number;
  achievements: Achievement[];
  dailyStats: DailyStats[];
  upgradePromptTriggers: UpgradePromptTrigger[];
}

interface Achievement {
  id: string;
  type: string;
  value: number;
  currentStreak: number;
  bestStreak: number;
  progress: number;
  nextMilestone: number;
  unlockedAt: Date;
  isActive: boolean;
  metadata?: any;
}

interface DailyStats {
  date: string;
  termsViewed: number;
  timeSpent: number;
  bookmarksCreated: number;
  categoriesExplored: number;
}

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

interface ProgressVisualizationProps {
  className?: string;
  showUpgradePrompts?: boolean;
  onUpgradeClick?: () => void;
}

export function ProgressVisualization({
  className = '',
  showUpgradePrompts = true,
  onUpgradeClick,
}: ProgressVisualizationProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProgressStats();
    }
  }, [user, fetchProgressStats]);

  const fetchProgressStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/progress/stats', {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      window.open('https://gumroad.com/l/aiml-glossary-pro', '_blank');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Error loading progress: {error}</p>
          <Button onClick={fetchProgressStats} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const bookmarkLimitReached = stats.totalBookmarks >= 50;
  const bookmarkUsagePercent = Math.min((stats.totalBookmarks / 50) * 100, 100);
  const isPremium = user?.lifetimeAccess || false;

  // Calculate streak status
  const getStreakStatus = () => {
    if (stats.currentStreak >= 30) return { color: 'text-purple-600', label: 'Legendary' };
    if (stats.currentStreak >= 14) return { color: 'text-orange-600', label: 'Amazing' };
    if (stats.currentStreak >= 7) return { color: 'text-green-600', label: 'Strong' };
    if (stats.currentStreak >= 3) return { color: 'text-blue-600', label: 'Building' };
    return { color: 'text-gray-600', label: 'Starting' };
  };

  const streakStatus = getStreakStatus();

  // Achievement icons mapping
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'daily_streak':
        return <FlameIcon className="h-5 w-5" />;
      case 'bookmarks_created':
        return <BookmarkIcon className="h-5 w-5" />;
      case 'terms_viewed':
        return <BookOpenIcon className="h-5 w-5" />;
      case 'categories_explored':
        return <BarChartIcon className="h-5 w-5" />;
      default:
        return <AwardIcon className="h-5 w-5" />;
    }
  };

  // Get achievement display name
  const getAchievementName = (type: string) => {
    switch (type) {
      case 'daily_streak':
        return 'Daily Streak';
      case 'bookmarks_created':
        return 'Bookmarks Created';
      case 'terms_viewed':
        return 'Terms Explored';
      case 'categories_explored':
        return 'Categories Mastered';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upgrade Prompts */}
      {showUpgradePrompts && !isPremium && stats.upgradePromptTriggers.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <ZapIcon className="h-5 w-5" />
              Ready to Unlock Your Full Potential?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upgradePromptTriggers.slice(0, 2).map((trigger, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      trigger.severity === 'high'
                        ? 'bg-red-500'
                        : trigger.severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    }`}
                  />
                  <span className="text-gray-700">{trigger.message}</span>
                </div>
              ))}
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white"
              >
                Upgrade to Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Terms Viewed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terms Explored</CardTitle>
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalTermsViewed}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.totalTermsViewed / 10372) * 100)}% of all terms
            </p>
          </CardContent>
        </Card>

        {/* Bookmarks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
            <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalBookmarks}</div>
            {!isPremium && (
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-xs">
                  <span>Free tier limit</span>
                  <span>{stats.totalBookmarks}/50</span>
                </div>
                <Progress value={bookmarkUsagePercent} className="h-2" />
                {bookmarkLimitReached && (
                  <Badge variant="destructive" className="text-xs">
                    Limit reached
                  </Badge>
                )}
              </div>
            )}
            {isPremium && <p className="text-xs text-muted-foreground">Unlimited</p>}
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <FlameIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${streakStatus.color}`}>{stats.currentStreak}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {streakStatus.label}
              </Badge>
              <span className="text-xs text-muted-foreground">Best: {stats.bestStreak}</span>
            </div>
          </CardContent>
        </Card>

        {/* Time Spent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(stats.timeSpentMinutes / 60)}h {stats.timeSpentMinutes % 60}m
            </div>
            <p className="text-xs text-muted-foreground">Learning time</p>
          </CardContent>
        </Card>

        {/* Categories Explored */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.categoriesExplored}</div>
            <p className="text-xs text-muted-foreground">AI/ML categories explored</p>
          </CardContent>
        </Card>

        {/* Best Achievement */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Achievement</CardTitle>
            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.achievements.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-yellow-600">
                  {getAchievementIcon(stats.achievements[0].type)}
                  <span className="text-lg font-bold">{stats.achievements[0].value}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getAchievementName(stats.achievements[0].type)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No achievements yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      {stats.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AwardIcon className="h-5 w-5" />
              Achievements
            </CardTitle>
            <CardDescription>Your learning milestones and accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-yellow-600">{getAchievementIcon(achievement.type)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {getAchievementName(achievement.type)}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Current: {achievement.value}</div>
                      {achievement.type === 'daily_streak' && (
                        <div>Best: {achievement.bestStreak} days</div>
                      )}
                      {achievement.progress < achievement.nextMilestone && (
                        <div>Next milestone: {achievement.nextMilestone}</div>
                      )}
                    </div>
                    {achievement.progress < achievement.nextMilestone && (
                      <Progress
                        value={(achievement.progress / achievement.nextMilestone) * 100}
                        className="h-1 mt-2"
                      />
                    )}
                  </div>
                  {achievement.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Activity Chart */}
      {stats.dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your learning activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.dailyStats.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                    <span>{new Date(day.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-blue-600">{day.termsViewed} terms</span>
                    <span className="text-purple-600">{day.bookmarksCreated} bookmarks</span>
                    <span className="text-green-600">{Math.round(day.timeSpent / 60)}m</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProgressVisualization;
