import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, ArrowRight, Calendar, Star, Clock, TrendingUp, Crown, Gift, X, Sparkles } from "lucide-react";
import { BarChart } from "@/components/ui/chart";
import TermCard from "@/components/TermCard";
import SurpriseMe from "@/components/SurpriseMe";
import RecommendedForYou from "@/components/RecommendedForYou";
import TrendingWidget from "@/components/TrendingWidget";
import ProgressVisualization from "@/components/ProgressVisualization";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useAuth } from "@/hooks/useAuth";
import { useAccess } from "@/hooks/useAccess";
import { useToast } from "@/hooks/use-toast";
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
  const { accessStatus } = useAccess();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  
  // Check for welcome parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const welcomeParam = urlParams.get('welcome');
    
    if (welcomeParam === 'premium') {
      setShowPremiumWelcome(true);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (welcomeParam === 'true') {
      setShowWelcome(true);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);
  
  // Auto-dismiss welcome messages after 10 seconds
  useEffect(() => {
    if (showWelcome || showPremiumWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setShowPremiumWelcome(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, showPremiumWelcome]);
  
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

  const handleSurpriseTermSelect = (term: ITerm) => {
    setLocation(`/terms/${term.id}`);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Premium Welcome Message */}
      {showPremiumWelcome && (
        <Alert className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Crown className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                  🎉 Welcome to Premium!
                </h3>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Thank you for upgrading! You now have unlimited access to all 10,000+ AI/ML definitions, 
                  advanced features, and lifetime updates. Start exploring without limits!
                </AlertDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => setLocation('/categories')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Explore All Categories
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setLocation('/ai-tools')}
                    className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Discover AI Tools
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPremiumWelcome(false)}
              className="text-green-600 hover:text-green-700 dark:text-green-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Regular Welcome Message */}
      {showWelcome && !showPremiumWelcome && (
        <Alert className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Welcome to AI/ML Glossary!
                </h3>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  You have {accessStatus?.dailyLimit || 50} free daily views to explore our comprehensive AI/ML dictionary. 
                  Start learning and track your progress below!
                </AlertDescription>
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    onClick={() => setLocation('/categories')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Start Exploring
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcome(false)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Header with Premium Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {accessStatus?.lifetimeAccess && (
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1">
              <Crown className="w-4 h-4 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        {!accessStatus?.lifetimeAccess && (
          <Link href="/lifetime">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4 mb-6">
        {/* Progress Card */}
        <Card className={accessStatus?.lifetimeAccess ? "border-yellow-200 dark:border-yellow-800" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" /> 
                Learning Progress
              </div>
              {accessStatus?.lifetimeAccess && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                  <Crown className="w-3 h-3 mr-1" />
                  Unlimited
                </Badge>
              )}
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
                  className={`h-2 mb-4 ${accessStatus?.lifetimeAccess ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-orange-500' : ''}`}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {progressData?.termsLearned && progressData?.totalTerms && progressData.termsLearned > 0 
                    ? `You've learned ${Math.round((progressData.termsLearned / progressData.totalTerms) * 100)}% of all terms`
                    : accessStatus?.lifetimeAccess 
                      ? "Start exploring unlimited AI/ML definitions!"
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
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" /> 
                Your Statistics
              </div>
              {accessStatus?.subscriptionTier && (
                <Badge variant={accessStatus.lifetimeAccess ? "default" : "secondary"}>
                  {accessStatus.lifetimeAccess ? 'Premium' : 'Free'}
                </Badge>
              )}
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
                {!accessStatus?.lifetimeAccess && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Daily views remaining:</span>
                    <span className={`font-medium ${(accessStatus?.remainingViews || 0) <= 10 ? 'text-red-500' : 'text-green-500'}`}>
                      {accessStatus?.remainingViews || 0}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Last activity:</span>
                  <span className="font-medium">{activityData?.lastActivity || 'Never'}</span>
                </div>
                {accessStatus?.lifetimeAccess && accessStatus.purchaseDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Premium since:</span>
                    <span className="font-medium text-yellow-600">
                      {new Date(accessStatus.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Progress Visualization */}
      <ProgressVisualization className="mb-6" />

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
            <div className="h-64 xs:h-80 overflow-hidden">
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

      {/* Personalized Content Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recommended For You */}
        <div>
          <RecommendedForYou 
            limit={3}
            showHeader={true}
          />
        </div>
        
        {/* Trending Widget */}
        <div>
          <TrendingWidget 
            limit={5}
            showHeader={true}
          />
        </div>
      </div>

      {/* Surprise Me Widget */}
      <div className="mb-6">
        <SurpriseMe 
          compact={true}
          showModeSelector={false}
          maxResults={1}
          onTermSelect={handleSurpriseTermSelect}
        />
      </div>
      
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
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={`skeleton-${i}`} className="h-40 animate-pulse bg-gray-200 dark:bg-gray-700"></Card>
              ))}
            </div>
          ) : recentlyViewed && recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={`skeleton-${i}`} className="h-40 animate-pulse bg-gray-200 dark:bg-gray-700"></Card>
              ))}
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={`skeleton-${i}`} className="h-40 animate-pulse bg-gray-200 dark:bg-gray-700"></Card>
              ))}
            </div>
          ) : recommended && recommended.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
