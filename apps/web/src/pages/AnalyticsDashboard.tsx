import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, BookOpen, Eye, Star, TrendingUp, Users } from 'lucide-react';
import { Link } from 'wouter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, type ChartConfig, LineChart, PieChart } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import type { IAnalyticsData } from '@/interfaces/interfaces';

export default function AnalyticsDashboard() {
  const { isAuthenticated } = useAuth();

  // Fetch analytics data
  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery<IAnalyticsData>({
    queryKey: ['/api/analytics'],
    enabled: isAuthenticated,
  });

  // Chart configurations
  const userActivityConfig: ChartConfig = {
    count: {
      label: 'Daily Activity',
      color: 'hsl(var(--chart-1))',
    },
  };

  const topTermsConfig: ChartConfig = {
    views: {
      label: 'Views',
      color: 'hsl(var(--chart-2))',
    },
  };

  const categoryConfig: ChartConfig = {
    count: {
      label: 'Terms',
      color: 'hsl(var(--chart-3))',
    },
  };

  // Prepare chart data
  const prepareUserActivityData = () => {
    if (!analytics?.userActivity) {return [];}
    return analytics.userActivity.map(item => ({
      date: item.date,
      count: item.count,
    }));
  };

  const prepareTopTermsData = () => {
    if (!analytics?.topTerms) {return [];}
    return analytics.topTerms.map(term => ({
      name: term.name,
      views: term.views,
    }));
  };

  const prepareCategoryDistributionData = () => {
    if (!analytics?.categoriesDistribution) {return [];}
    return analytics.categoriesDistribution.map(cat => ({
      name: cat.name,
      count: cat.count,
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">Please sign in to view analytics.</p>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg"
                onClick={() => (window.location.href = '/login')}
              >
                Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Link href="/dashboard">
          <a className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center">
            Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading analytics</AlertTitle>
          <AlertDescription>
            There was a problem fetching the analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-gray-500 dark:text-gray-400">
                  <Users className="mr-2 h-4 w-4" /> Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Registered users on the platform
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="mr-2 h-4 w-4" /> Total Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalTerms}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI/ML terms in the glossary
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-gray-500 dark:text-gray-400">
                  <Eye className="mr-2 h-4 w-4" /> Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalViews}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Term detail page visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-gray-500 dark:text-gray-400">
                  <Star className="mr-2 h-4 w-4" /> Total Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalFavorites}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Terms saved as favorites</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity" className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" /> User Activity
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center">
                <Eye className="mr-2 h-4 w-4" /> Top Terms
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" /> Categories Distribution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>User Activity Over Time</CardTitle>
                  <CardDescription>Daily user engagement with the glossary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 xs:h-80 overflow-hidden">
                    <LineChart
                      config={userActivityConfig}
                      data={prepareUserActivityData()}
                      xAxisKey="date"
                      yAxisKey="count"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle>Most Viewed Terms</CardTitle>
                  <CardDescription>Terms with the highest number of views</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 xs:h-80 overflow-hidden">
                    <BarChart
                      config={topTermsConfig}
                      data={prepareTopTermsData()}
                      xAxisKey="name"
                      yAxisKey="views"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle>Terms by Category</CardTitle>
                  <CardDescription>
                    Distribution of terms across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-64 xs:h-80 w-full max-w-xs xs:max-w-lg overflow-hidden">
                    <PieChart
                      config={categoryConfig}
                      data={prepareCategoryDistributionData()}
                      nameKey="name"
                      valueKey="count"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no analytics data available yet. Start using the platform to generate
            analytics.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
