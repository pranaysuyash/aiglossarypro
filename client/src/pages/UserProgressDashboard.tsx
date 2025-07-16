import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Flame,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { getDifficultyColor } from '@/utils/termUtils';

interface UserProgressStats {
  totalTermsViewed: number;
  totalSectionsCompleted: number;
  totalTimeSpent: number; // in minutes
  streakDays: number;
  completedTerms: number;
  favoriteTerms: number;
  difficultyBreakdown: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  categoryProgress: {
    category: string;
    completed: number;
    total: number;
    percentage: number;
  }[];
  recentActivity: {
    termId: string;
    termName: string;
    action: 'viewed' | 'completed' | 'favorited';
    timestamp: string;
    sectionName?: string;
  }[];
  learningStreak: {
    currentStreak: number;
    longestStreak: number;
    lastActive: string;
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
    icon: string;
  }[];
}

interface SectionProgress {
  termId: string;
  termName: string;
  sectionName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  completionPercentage: number;
  timeSpent: number;
  lastAccessed: string;
}

export default function UserProgressDashboard() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user progress statistics
  const { data: progressStats, isLoading: statsLoading } = useQuery<UserProgressStats>({
    queryKey: ['/api/user/progress/stats'],
    enabled: isAuthenticated,
  });

  // Fetch detailed section progress
  const { data: sectionProgress = [], isLoading: sectionsLoading } = useQuery<SectionProgress[]>({
    queryKey: ['/api/user/progress/sections'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Progress Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to view your learning progress
          </p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (statsLoading || sectionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {return `${minutes}m`;}
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) {return <Trophy className="h-5 w-5 text-yellow-500" />;}
    if (streak >= 7) {return <Flame className="h-5 w-5 text-orange-500" />;}
    return <Calendar className="h-5 w-5 text-blue-500" />;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terms Explored</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressStats?.totalTermsViewed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {progressStats?.completedTerms || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(progressStats?.totalTimeSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total time spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            {getStreakIcon(progressStats?.learningStreak?.currentStreak || 0)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressStats?.learningStreak?.currentStreak || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Longest: {progressStats?.learningStreak?.longestStreak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sections Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressStats?.totalSectionsCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">Across all terms</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Category Progress</CardTitle>
          <CardDescription>
            Your learning progress across different AI/ML categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressStats?.categoryProgress?.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category.category}</span>
                  <span className="text-sm text-gray-500">
                    {category.completed}/{category.total} ({Math.round(category.percentage)}%)
                  </span>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Distribution</CardTitle>
          <CardDescription>Terms you've explored by difficulty level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(progressStats?.difficultyBreakdown || {}).map(([level, count]) => (
              <div key={level} className="text-center">
                <Badge className={getDifficultyColor(level)} variant="secondary">
                  {level}
                </Badge>
                <p className="text-2xl font-bold mt-2">{count}</p>
                <p className="text-xs text-gray-500">terms</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progressStats?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.action === 'viewed' && <Eye className="h-5 w-5 text-blue-500" />}
                  {activity.action === 'completed' && <Target className="h-5 w-5 text-green-500" />}
                  {activity.action === 'favorited' && <Star className="h-5 w-5 text-yellow-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.action === 'viewed' && 'Viewed'}
                    {activity.action === 'completed' && 'Completed'}
                    {activity.action === 'favorited' && 'Favorited'}{' '}
                    <Link
                      href={`/terms/${activity.termId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {activity.termName}
                    </Link>
                  </p>
                  {activity.sectionName && (
                    <p className="text-xs text-gray-500">Section: {activity.sectionName}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {progressStats?.achievements && progressStats.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Milestones you've unlocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressStats.achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <Award className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-gray-500">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSectionsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Section Progress</CardTitle>
          <CardDescription>Detailed progress through term sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectionProgress.map((section, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Link
                      href={`/terms/${section.termId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {section.termName}
                    </Link>
                    <p className="text-sm text-gray-600">{section.sectionName}</p>
                  </div>
                  <Badge
                    variant={section.status === 'completed' ? 'default' : 'secondary'}
                    className={
                      section.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : section.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {section.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{section.completionPercentage}%</span>
                  </div>
                  <Progress value={section.completionPercentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Time spent: {formatTime(section.timeSpent)}</span>
                    <span>
                      Last accessed: {new Date(section.lastAccessed).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Progress</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your AI/ML learning journey and achievements
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Sections</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverviewTab()}</TabsContent>

        <TabsContent value="activity">{renderActivityTab()}</TabsContent>

        <TabsContent value="sections">{renderSectionsTab()}</TabsContent>
      </Tabs>
    </div>
  );
}
