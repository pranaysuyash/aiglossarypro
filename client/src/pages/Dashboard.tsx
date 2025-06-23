import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ArrowRight, Calendar, Star, Clock, TrendingUp } from "lucide-react";
import { BarChart } from "@/components/ui/chart";
import TermCard from "@/components/TermCard";
import { useAuth } from "@/hooks/useAuth";
import { ITerm } from "@/interfaces/interfaces";

interface ProgressData {
  termsLearned: number;
  totalTerms: number;
}

interface ActivityData {
  labels: string[];
  views: number[];
  learned: number[];
  totalViews: number;
  categoriesExplored: number;
  lastActivity: string;
}

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastWeek: boolean[];
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch user progress data
  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ["/api/user/progress"],
  });
  
  // Fetch user activity data
  const { data: activityData, isLoading: activityLoading } = useQuery<ActivityData>({
    queryKey: ["/api/user/activity"],
  });
  
  // Fetch user's learning streak data
  const { data: streakData, isLoading: streakLoading } = useQuery<StreakData>({
    queryKey: ["/api/user/streak"],
  });
  
  // Fetch user's recently viewed terms
  const { data: recentlyViewed, isLoading: recentlyViewedLoading } = useQuery<ITerm[]>({
    queryKey: ["/api/terms/recently-viewed"],
  });
  
  // Fetch user's favorite terms
  const { data: favorites, isLoading: favoritesLoading } = useQuery<ITerm[]>({
    queryKey: ["/api/favorites"],
  });
  
  // Fetch recommended terms for the user
  const { data: recommended, isLoading: recommendedLoading } = useQuery<ITerm[]>({
    queryKey: ["/api/terms/recommended"],
  });

  // Create chart data with safe property access - transform for BarChart component
  const chartData = activityData?.labels ? 
    activityData.labels.map((label, index) => ({
      name: label,
      viewed: activityData.views?.[index] || 0,
      learned: activityData.learned?.[index] || 0,
    })) : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-primary" /> 
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {progressData?.termsLearned || 0}/{progressData?.totalTerms || 0} terms
                  </span>
                </div>
                <Progress 
                  value={progressData?.termsLearned && progressData?.totalTerms 
                    ? (progressData.termsLearned / progressData.totalTerms) * 100 
                    : 0} 
                  className="h-2 mb-4" 
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {progressData?.termsLearned && progressData?.totalTerms && progressData.termsLearned > 0 
                    ? `You've learned ${Math.round((progressData.termsLearned / progressData.totalTerms) * 100)}% of all terms`
                    : "Start learning terms to track your progress"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Streak Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-accent" /> 
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {streakLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="text-4xl font-bold text-center text-accent">
                    {streakData?.currentStreak || 0} 
                    <span className="text-lg font-normal ml-1">days</span>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  {streakData?.lastWeek?.map((active: boolean, i: number) => (
                    <div 
                      key={i}
                      className={`w-6 h-${active ? '8' : '4'} rounded ${active ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}
                    ></div>
                  )) || Array.from({ length: 7 }, (_, i) => (
                    <div 
                      key={i}
                      className="w-6 h-4 rounded bg-gray-200 dark:bg-gray-700"
                    ></div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                  {streakData?.currentStreak && streakData.currentStreak > 0 
                    ? `Keep learning daily! Best streak: ${streakData?.bestStreak || 0} days`
                    : "Visit daily to build your learning streak"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" /> 
              Your Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Terms viewed:</span>
                  <span className="font-medium">{activityData?.totalViews || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Favorites:</span>
                  <span className="font-medium">{favorites?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Categories explored:</span>
                  <span className="font-medium">{activityData?.categoriesExplored || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Last activity:</span>
                  <span className="font-medium">{activityData?.lastActivity || 'Never'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
          <CardDescription>Your learning activity over the past 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="h-80 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
          ) : (
            <div className="h-80">
              <BarChart 
                data={chartData} 
                config={{
                  viewed: { label: "Terms Viewed", color: "hsl(var(--chart-1))" },
                  learned: { label: "Terms Learned", color: "hsl(var(--chart-2))" }
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs for Recently Viewed, Favorites, and Recommendations */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" /> Recently Viewed
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center">
            <Star className="mr-2 h-4 w-4" /> Favorites
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" /> Recommended
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="pt-4">
          {recentlyViewedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={`skeleton-${i}`} className="h-40 animate-pulse bg-gray-200 dark:bg-gray-700"></Card>
              ))}
            </div>
          ) : recentlyViewed && recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentlyViewed.slice(0, 6).map((term: ITerm) => (
                <TermCard key={term.id} term={term} isFavorite={favorites?.some(f => f.id === term.id)} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't viewed any terms yet. Start exploring the glossary!
              </p>
              <Link href="/">
                <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                  Browse Terms <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Link>
            </Card>
          )}
          
          {recentlyViewed && recentlyViewed.length > 6 && (
            <div className="mt-4 text-center">
              <Link href="/history">
                <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                  View all history <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="pt-4">
          {favoritesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={`skeleton-${i}`} className="h-40 animate-pulse bg-gray-200 dark:bg-gray-700"></Card>
              ))}
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {favorites.slice(0, 6).map((term: ITerm) => (
                <TermCard key={term.id} term={term} isFavorite={true} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't favorited any terms yet.
              </p>
              <Link href="/">
                <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                  Browse Terms <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Link>
            </Card>
          )}
          
          {favorites && favorites.length > 6 && (
            <div className="mt-4 text-center">
              <Link href="/favorites">
                <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                  View all favorites <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recommended" className="pt-4">
          {recommendedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={`skeleton-${i}`} className="h-40 animate-pulse bg-gray-200 dark:bg-gray-700"></Card>
              ))}
            </div>
          ) : recommended && recommended.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommended.slice(0, 6).map((term: ITerm) => (
                <TermCard key={term.id} term={term} isFavorite={favorites?.some(f => f.id === term.id)} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                We'll recommend terms based on your activity. Start exploring!
              </p>
              <Link href="/">
                <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                  Browse Terms <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Link>
            </Card>
          )}
          
          {recommended && recommended.length > 6 && (
            <div className="mt-4 text-center">
              <Link href="/recommendations">
                <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
                  View all recommendations <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
