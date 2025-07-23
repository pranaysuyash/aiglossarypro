import {
  Award,
  BarChart,
  Bookmark,
  BookOpen,
  CalendarDays,
  Clock,
  Flame,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { getIdToken } from '@/lib/firebase';

interface UserProgressStats {
  totalTermsViewed: number;
  totalBookmarks: number;
  currentStreak: number;
  bestStreak: number;
  categoriesExplored: number;
  timeSpentMinutes: number;
  achievements: Achievement[];
  dailyStats: DailyStats[];
  upgradePromptTriggers?: UpgradePromptTrigger[]; // Optional to handle API responses without this field
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
  className?: string | undefined;
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

  const fetchProgressStats = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token or use local auth token
      let token = null;
      
      // First try to get token from localStorage (for non-Firebase auth)
      token = localStorage.getItem('authToken');
      
      // If no local token and we have a Firebase user, try to get Firebase token
      if (!token && user) {
        try {
          token = await getIdToken();
        } catch (tokenError) {
          console.error('Error getting Firebase ID token:', tokenError);
          // Continue with local token attempt
        }
      }
      
      if (!token) {
        // If no token at all, show empty stats for new user
        setStats({
          totalTermsViewed: 0,
          totalBookmarks: 0,
          currentStreak: 0,
          bestStreak: 0,
          categoriesExplored: 0,
          timeSpentMinutes: 0,
          achievements: [],
          dailyStats: [],
          upgradePromptTriggers: [],
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/user/progress/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404 || response.status === 400) {
        // New user with no progress data - show empty stats instead of error
        setStats({
          totalTermsViewed: 0,
          totalBookmarks: 0,
          currentStreak: 0,
          bestStreak: 0,
          categoriesExplored: 0,
          timeSpentMinutes: 0,
          achievements: [],
          dailyStats: [],
          upgradePromptTriggers: [],
        });
        return;
      }

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Failed to fetch progress stats (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        
        console.error('Progress stats API error:', response.status, errorMessage);
        
        // For 500 errors, use fallback data instead of showing error
        if (response.status >= 500) {
          setStats({
            totalTermsViewed: 0,
            totalBookmarks: 0,
            currentStreak: 0,
            bestStreak: 0,
            categoriesExplored: 0,
            timeSpentMinutes: 0,
            achievements: [],
            dailyStats: [],
            upgradePromptTriggers: [],
          });
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Ensure data has all required fields with defaults
      setStats({
        totalTermsViewed: data.totalTermsViewed || 0,
        totalBookmarks: data.totalBookmarks || 0,
        currentStreak: data.currentStreak || 0,
        bestStreak: data.bestStreak || 0,
        categoriesExplored: data.categoriesExplored || 0,
        timeSpentMinutes: data.timeSpentMinutes || 0,
        achievements: data.achievements || [],
        dailyStats: data.dailyStats || [],
        upgradePromptTriggers: data.upgradePromptTriggers || [],
      });
    } catch (err) {
      console.error('Progress stats fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // For network errors, also use fallback data
      setStats({
        totalTermsViewed: 0,
        totalBookmarks: 0,
        currentStreak: 0,
        bestStreak: 0,
        categoriesExplored: 0,
        timeSpentMinutes: 0,
        achievements: [],
        dailyStats: [],
        upgradePromptTriggers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProgressStats();
    }
  }, [user]);

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

  if (error || !user) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Learning Progress
          </CardTitle>
          <CardDescription>Track your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <Trophy className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Explore AI/ML terms to build your knowledge and track your progress
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/glossary'} 
                className="bg-primary hover:bg-primary/90"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Terms
              </Button>
              <Button 
                onClick={() => window.location.href = '/categories'} 
                variant="outline"
              >
                Explore Categories
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalTermsViewed === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Learning Progress
          </CardTitle>
          <CardDescription>Track your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <Trophy className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Explore AI/ML terms to build your knowledge and track your progress
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/glossary'} 
                className="bg-primary hover:bg-primary/90"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Terms
              </Button>
              <Button 
                onClick={() => window.location.href = '/categories'} 
                variant="outline"
              >
                Explore Categories
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bookmarkLimitReached = stats.totalBookmarks >= 50;
  const bookmarkUsagePercent = Math.min((stats.totalBookmarks / 50) * 100, 100);
  const isPremium = user?.lifetimeAccess || false;

  // Calculate streak status
  const getStreakStatus = () => {
    if (stats.currentStreak >= 30) {return { color: 'text-purple-600', label: 'Legendary' };}
    if (stats.currentStreak >= 14) {return { color: 'text-orange-600', label: 'Amazing' };}
    if (stats.currentStreak >= 7) {return { color: 'text-green-600', label: 'Strong' };}
    if (stats.currentStreak >= 3) {return { color: 'text-blue-600', label: 'Building' };}
    return { color: 'text-gray-600', label: 'Starting' };
  };

  const streakStatus = getStreakStatus();

  // Achievement icons mapping
  const getAchievement = (type: string) => {
    switch (type) {
      case 'daily_streak':
        return <Flame className="h-5 w-5" />;
      case 'bookmarks_created':
        return <Bookmark className="h-5 w-5" />;
      case 'terms_viewed':
        return <BookOpen className="h-5 w-5" />;
      case 'categories_explored':
        return <BarChart className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  // Get achievement display name
  const getAchievementName = (type: string) => {
    if (!type) return 'Unknown Achievement';
    
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
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upgrade Prompts */}
      {showUpgradePrompts && !isPremium && stats?.upgradePromptTriggers?.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Zap className="h-5 w-5" />
              Ready to Unlock Your Full Potential?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.upgradePromptTriggers || []).slice(0, 2).map((trigger, index) => (
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
            <BookOpen className="h-4 w-4 text-muted-foreground" />
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
            <Bookmark className="h-4 w-4 text-muted-foreground" />
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
            <Flame className="h-4 w-4 text-muted-foreground" />
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
            <Clock className="h-4 w-4 text-muted-foreground" />
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
            <BarChart className="h-4 w-4 text-muted-foreground" />
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
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.achievements.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-yellow-600">
                  {getAchievement(stats.achievements[0]?.type || '')}
                  <span className="text-lg font-bold">{stats.achievements[0]?.value || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getAchievementName(stats.achievements[0]?.type || '')}
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
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
            <CardDescription>Your learning milestones and accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-yellow-600">{getAchievement(achievement?.type || '')}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {getAchievementName(achievement?.type || '')}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Current: {achievement?.value || 0}</div>
                      {achievement?.type === 'daily_streak' && achievement?.bestStreak && (
                        <div>Best: {achievement.bestStreak} days</div>
                      )}
                      {achievement?.progress < achievement?.nextMilestone && (
                        <div>Next milestone: {achievement.nextMilestone}</div>
                      )}
                    </div>
                    {achievement?.progress < achievement?.nextMilestone && (
                      <Progress
                        value={((achievement?.progress || 0) / (achievement?.nextMilestone || 1)) * 100}
                        className="h-1 mt-2"
                      />
                    )}
                  </div>
                  {achievement?.isActive && (
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
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your learning activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.dailyStats.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
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
