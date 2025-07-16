import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  PauseCircle,
  PlayCircle,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types locally until schema is properly exported
interface ABTestMetricsType {
  id: string;
  testId: string;
  variant: string;
  pageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  seeWhatsInsideClicks: number;
  ctaClicks: number;
  trialSignups: number;
  newsletterSignups: number;
  pricingPageViews: number;
  bounceRate: number | null;
  avgSessionDuration: number | null;
  avgScrollDepth: number | null;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  utmSourceBreakdown: Record<string, number>;
  utmMediumBreakdown: Record<string, number>;
  conversionRate: number | null;
  confidenceInterval: { lower: number; upper: number } | null;
}

interface DashboardMetrics {
  testId: string;
  testName: string;
  status: string;
  startDate: string;
  variants: string[];
  metrics: ABTestMetricsType[];
  significance: {
    cta?: { pValue: number; isSignificant: boolean; confidenceLevel: number };
    trial?: { pValue: number; isSignificant: boolean; confidenceLevel: number };
  };
  winner?: {
    variant: string;
    improvement: number;
    confidence: number;
  };
}

const VARIANT_COLORS = {
  neural: '#8B5CF6',
  code: '#10B981',
  geometric: '#F59E0B',
  default: '#6B7280',
  fallback: '#EF4444',
};

export function ABTestingDashboard() {
  const [activeTest, setActiveTest] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [_selectedTimeRange, _setSelectedTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch active test data
  useEffect(() => {
    fetchActiveTest();

    if (autoRefresh) {
      const interval = setInterval(fetchActiveTest, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchActiveTest = async () => {
    try {
      const response = await fetch('/api/ab-tests/results/landing_bg_test_active');
      if (response.ok) {
        const data = await response.json();
        setActiveTest(data);
      }
    } catch (error: any) {
      console.error('Failed to fetch A/B test data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate conversion funnel data
  const getFunnelData = () => {
    if (!activeTest) {return [];}

    return activeTest.variants
      .map(variant => {
        const metrics = activeTest.metrics.find(m => m.variant === variant);
        if (!metrics) {return null;}

        return {
          variant,
          'Page Views': metrics.pageViews,
          "See What's Inside": metrics.seeWhatsInsideClicks,
          'CTA Clicks': metrics.ctaClicks,
          'Trial Signups': metrics.trialSignups,
          Newsletter: metrics.newsletterSignups,
        };
      })
      .filter(Boolean);
  };

  // Calculate time series data
  const getTimeSeriesData = () => {
    // This would be populated with real time-series data from the backend
    // For now, showing sample data structure
    return [
      { date: 'Mon', neural: 45, code: 38, geometric: 42, default: 35 },
      { date: 'Tue', neural: 52, code: 42, geometric: 45, default: 38 },
      { date: 'Wed', neural: 48, code: 45, geometric: 50, default: 42 },
      { date: 'Thu', neural: 58, code: 48, geometric: 52, default: 40 },
      { date: 'Fri', neural: 62, code: 52, geometric: 48, default: 45 },
      { date: 'Sat', neural: 55, code: 50, geometric: 53, default: 48 },
      { date: 'Sun', neural: 60, code: 55, geometric: 58, default: 50 },
    ];
  };

  // Calculate device breakdown
  const getDeviceData = () => {
    if (!activeTest) {return [];}

    const deviceTotals: Record<string, number> = {};

    activeTest.metrics.forEach(metric => {
      const breakdown = metric.deviceBreakdown as Record<string, number>;
      Object.entries(breakdown).forEach(([device, count]) => {
        deviceTotals[device] = (deviceTotals[device] || 0) + count;
      });
    });

    return Object.entries(deviceTotals).map(([device, count]) => ({
      name: device.charAt(0).toUpperCase() + device.slice(1),
      value: count,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!activeTest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active A/B Test</AlertTitle>
          <AlertDescription>There is no active A/B test running at the moment.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing Dashboard</h1>
          <p className="text-gray-600 mt-2">Landing Page Background Test</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? (
              <PauseCircle className="h-4 w-4 mr-2" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Test Status Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{activeTest.testName}</CardTitle>
              <CardDescription>
                Started {new Date(activeTest.startDate).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={activeTest.status === 'active' ? 'default' : 'secondary'}>
              {activeTest.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeTest.metrics.map(metric => (
              <div key={metric.variant} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{metric.variant}</span>
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor:
                        VARIANT_COLORS[metric.variant as keyof typeof VARIANT_COLORS],
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-medium">{metric.conversionRate?.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sessions</span>
                    <span className="font-medium">{metric.totalSessions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Winner announcement */}
          {activeTest.winner && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Statistical Winner Found!</AlertTitle>
              <AlertDescription>
                {activeTest.winner.variant} variant shows {activeTest.winner.improvement.toFixed(1)}
                % improvement with {activeTest.winner.confidence}% confidence.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Metrics Tabs */}
      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          <TabsTrigger value="devices">Device Breakdown</TabsTrigger>
          <TabsTrigger value="significance">Statistical Analysis</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel by Variant</CardTitle>
              <CardDescription>
                Track user progression through the conversion funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getFunnelData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="variant" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Page Views" fill="#8B5CF6" />
                  <Bar dataKey="See What's Inside" fill="#10B981" />
                  <Bar dataKey="CTA Clicks" fill="#F59E0B" />
                  <Bar dataKey="Trial Signups" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Series */}
        <TabsContent value="timeseries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Over Time</CardTitle>
              <CardDescription>Daily conversion rates by variant</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getTimeSeriesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {activeTest.variants.map(variant => (
                    <Line
                      key={variant}
                      type="monotone"
                      dataKey={variant}
                      stroke={VARIANT_COLORS[variant as keyof typeof VARIANT_COLORS]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Breakdown */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic by Device Type</CardTitle>
              <CardDescription>Breakdown of visitors by device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getDeviceData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getDeviceData().map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            Object.values(VARIANT_COLORS)[
                              index % Object.values(VARIANT_COLORS).length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  {activeTest.metrics.map(metric => (
                    <div key={metric.variant} className="space-y-2">
                      <h4 className="font-medium capitalize">{metric.variant} Variant</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg Session Duration</span>
                          <span className="font-medium">
                            {Math.floor((metric.avgSessionDuration || 0) / 60)}m{' '}
                            {Math.floor((metric.avgSessionDuration || 0) % 60)}s
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bounce Rate</span>
                          <span className="font-medium">
                            {((metric.bounceRate || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistical Analysis */}
        <TabsContent value="significance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistical Significance Analysis</CardTitle>
              <CardDescription>
                Confidence levels and p-values for conversion metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CTA Conversion Significance */}
              <div>
                <h4 className="font-medium mb-3">CTA Click Conversion</h4>
                {activeTest.significance.cta && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">P-value:</span>
                      <Badge
                        variant={
                          activeTest.significance.cta.isSignificant ? 'default' : 'secondary'
                        }
                      >
                        {activeTest.significance.cta.pValue.toFixed(4)}
                      </Badge>
                      {activeTest.significance.cta.isSignificant && (
                        <Badge variant="default" className="bg-green-600">
                          Statistically Significant
                        </Badge>
                      )}
                    </div>
                    <Progress value={activeTest.significance.cta.confidenceLevel} className="h-2" />
                    <span className="text-sm text-gray-600">
                      {activeTest.significance.cta.confidenceLevel.toFixed(1)}% Confidence Level
                    </span>
                  </div>
                )}
              </div>

              {/* Trial Signup Significance */}
              <div>
                <h4 className="font-medium mb-3">Trial Signup Conversion</h4>
                {activeTest.significance.trial && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">P-value:</span>
                      <Badge
                        variant={
                          activeTest.significance.trial.isSignificant ? 'default' : 'secondary'
                        }
                      >
                        {activeTest.significance.trial.pValue.toFixed(4)}
                      </Badge>
                      {activeTest.significance.trial.isSignificant && (
                        <Badge variant="default" className="bg-green-600">
                          Statistically Significant
                        </Badge>
                      )}
                    </div>
                    <Progress
                      value={activeTest.significance.trial.confidenceLevel}
                      className="h-2"
                    />
                    <span className="text-sm text-gray-600">
                      {activeTest.significance.trial.confidenceLevel.toFixed(1)}% Confidence Level
                    </span>
                  </div>
                )}
              </div>

              {/* Sample Size Calculator */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sample Size Status</AlertTitle>
                <AlertDescription>
                  Current total sessions:{' '}
                  {activeTest.metrics.reduce((sum, m) => sum + m.totalSessions, 0)}
                  <br />
                  Minimum recommended sample size: 1,000 per variant for 95% confidence
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTest.metrics.reduce((sum, m) => sum + m.pageViews, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all variants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTest.metrics.reduce((sum, m) => sum + m.trialSignups, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Trial signups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                activeTest.metrics.reduce((sum, m) => sum + (m.conversionRate || 0), 0) /
                activeTest.metrics.length
              ).toFixed(2)}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across all variants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(
                (Date.now() - new Date(activeTest.startDate).getTime()) / (1000 * 60 * 60 * 24)
              )}{' '}
              days
            </div>
            <p className="text-xs text-muted-foreground">Since test started</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
