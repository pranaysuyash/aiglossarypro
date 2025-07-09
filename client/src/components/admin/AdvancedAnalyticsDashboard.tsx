import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Clock,
  DollarSign,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced interfaces for comprehensive analytics
interface AdvancedAnalyticsData {
  overview: {
    totalGenerations: number;
    successRate: number;
    averageQualityScore: number;
    totalCost: number;
    averageProcessingTime: number;
    costEfficiency: number;
    qualityTrend: 'up' | 'down' | 'stable';
    costTrend: 'up' | 'down' | 'stable';
    performanceTrend: 'up' | 'down' | 'stable';
  };

  timeSeriesData: Array<{
    date: string;
    generations: number;
    cost: number;
    qualityScore: number;
    processingTime: number;
    successRate: number;
  }>;

  modelPerformance: Array<{
    model: string;
    usage: number;
    averageQuality: number;
    averageCost: number;
    successRate: number;
    averageSpeed: number;
    totalTokens: number;
    costEfficiency: number;
    recommendedFor: string[];
  }>;

  sectionAnalytics: Array<{
    sectionName: string;
    totalGenerations: number;
    averageQuality: number;
    averageCost: number;
    averageTokens: number;
    successRate: number;
    complexity: 'simple' | 'moderate' | 'complex';
    improvement: number;
  }>;

  qualityDistribution: {
    excellent: number; // 9-10
    good: number; // 7-8
    average: number; // 5-6
    poor: number; // 1-4
  };

  costBreakdown: {
    byModel: Array<{ model: string; cost: number; percentage: number }>;
    bySection: Array<{ section: string; cost: number; percentage: number }>;
    byTimeOfDay: Array<{ hour: string; cost: number; volume: number }>;
    projectedMonthlyCost: number;
    budgetUtilization: number;
    savingsFromBatching: number;
    recommendations: string[];
  };

  performanceMetrics: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
    errorRate: number;
    retryRate: number;
    timeouts: number;
    queueDepth: number;
    processingEfficiency: number;
  };

  userActivity: {
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    mostActiveHours: string[];
    userEngagement: number;
    featureUsage: Array<{ feature: string; usage: number; satisfaction: number }>;
  };

  systemHealth: {
    aiServiceUptime: number;
    databaseHealth: number;
    s3Health: number;
    queueHealth: number;
    overallHealth: number;
    alerts: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    recommendations: string[];
  };
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF7300',
];

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
];

export function AdvancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedSection, _setSelectedSection] = useState('all');
  const [refreshInterval, _setRefreshInterval] = useState(30000); // 30 seconds

  // Query for advanced analytics data
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery<AdvancedAnalyticsData>({
    queryKey: ['advanced-analytics', timeRange, selectedModel, selectedSection],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange,
        model: selectedModel,
        section: selectedSection,
      });

      const response = await fetch(
        `/api/admin/enhanced-content-generation/advanced-stats?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      return response.json();
    },
    refetchInterval: refreshInterval,
    staleTime: 10000, // 10 seconds
  });

  // Auto-refresh control
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, refetch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading analytics...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Analytics Error</AlertTitle>
        <AlertDescription>
          Failed to load analytics data. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  const data = analyticsData!;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <span className="w-4 h-4 text-gray-500">→</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getHealthColor = (health: number) => {
    if (health >= 95) return 'text-green-500';
    if (health >= 85) return 'text-yellow-500';
    if (health >= 70) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthBadge = (health: number) => {
    if (health >= 95) return <Badge className="bg-green-500">Excellent</Badge>;
    if (health >= 85) return <Badge className="bg-yellow-500">Good</Badge>;
    if (health >= 70) return <Badge className="bg-orange-500">Warning</Badge>;
    return <Badge className="bg-red-500">Critical</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive system performance and cost analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem>
              <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
              <SelectItem value="o4-mini">O4 Mini</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Total Generations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalGenerations.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon(data.overview.performanceTrend)}
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.overview.successRate)}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon(data.overview.qualityTrend)}
              <span>Quality: {data.overview.averageQualityScore.toFixed(1)}/10</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.totalCost)}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon(data.overview.costTrend)}
              <span>Efficiency: {formatPercentage(data.overview.costEfficiency)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.averageProcessingTime.toFixed(1)}s
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getTrendIcon(data.overview.performanceTrend)}
              <span>Performance trend</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getHealthColor(data.systemHealth.overallHealth)}`}
              >
                {data.systemHealth.overallHealth.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Health</div>
              {getHealthBadge(data.systemHealth.overallHealth)}
            </div>
            <div className="text-center">
              <div
                className={`text-xl font-bold ${getHealthColor(data.systemHealth.aiServiceUptime)}`}
              >
                {data.systemHealth.aiServiceUptime.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">AI Service</div>
            </div>
            <div className="text-center">
              <div
                className={`text-xl font-bold ${getHealthColor(data.systemHealth.databaseHealth)}`}
              >
                {data.systemHealth.databaseHealth.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Database</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getHealthColor(data.systemHealth.s3Health)}`}>
                {data.systemHealth.s3Health.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">S3 Storage</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${getHealthColor(data.systemHealth.queueHealth)}`}>
                {data.systemHealth.queueHealth.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Queue System</div>
            </div>
          </div>

          {data.systemHealth.alerts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Active Alerts</h4>
              <div className="space-y-2">
                {data.systemHealth.alerts.map((alert, index) => (
                  <Alert
                    key={index}
                    variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{alert.type}</AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="generations" fill="#8884d8" name="Generations" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="processingTime"
                    stroke="#82ca9d"
                    name="Processing Time (s)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="successRate"
                    stroke="#ffc658"
                    name="Success Rate %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Latency</span>
                  <span className="font-mono">
                    {data.performanceMetrics.averageLatency.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">95th Percentile</span>
                  <span className="font-mono">
                    {data.performanceMetrics.p95Latency.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">99th Percentile</span>
                  <span className="font-mono">
                    {data.performanceMetrics.p99Latency.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Throughput</span>
                  <span className="font-mono">
                    {data.performanceMetrics.throughput.toFixed(1)} req/s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Error Rate</span>
                  <span className="font-mono">
                    {formatPercentage(data.performanceMetrics.errorRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Processing Efficiency</span>
                  <span className="font-mono">
                    {formatPercentage(data.performanceMetrics.processingEfficiency)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Queue Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Queue Depth</span>
                  <span className="font-mono">{data.performanceMetrics.queueDepth}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Retry Rate</span>
                  <span className="font-mono">
                    {formatPercentage(data.performanceMetrics.retryRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Timeouts</span>
                  <span className="font-mono">{data.performanceMetrics.timeouts}</span>
                </div>
                <Progress
                  value={data.performanceMetrics.processingEfficiency * 100}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground text-center">
                  Processing Efficiency:{' '}
                  {formatPercentage(data.performanceMetrics.processingEfficiency)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown by Model</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={data.costBreakdown.byModel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }: { name: string; percentage: number }) =>
                        `${name} ${percentage}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cost"
                    >
                      {data.costBreakdown.byModel.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Projections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Projected Monthly Cost</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(data.costBreakdown.projectedMonthlyCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Budget Utilization</span>
                  <span className="font-mono">
                    {formatPercentage(data.costBreakdown.budgetUtilization)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Savings from Batching</span>
                  <span className="font-mono text-green-600">
                    {formatCurrency(data.costBreakdown.savingsFromBatching)}
                  </span>
                </div>
                <Progress value={data.costBreakdown.budgetUtilization * 100} className="mt-2" />
                <div className="text-xs text-muted-foreground text-center">
                  Budget Utilization: {formatPercentage(data.costBreakdown.budgetUtilization)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.costBreakdown.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                    <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        {
                          name: 'Excellent (9-10)',
                          value: data.qualityDistribution.excellent,
                          color: '#10B981',
                        },
                        {
                          name: 'Good (7-8)',
                          value: data.qualityDistribution.good,
                          color: '#3B82F6',
                        },
                        {
                          name: 'Average (5-6)',
                          value: data.qualityDistribution.average,
                          color: '#F59E0B',
                        },
                        {
                          name: 'Poor (1-4)',
                          value: data.qualityDistribution.poor,
                          color: '#EF4444',
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: { name: string; value: number }) =>
                        `${name}: ${value}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        {
                          name: 'Excellent (9-10)',
                          value: data.qualityDistribution.excellent,
                          color: '#10B981',
                        },
                        {
                          name: 'Good (7-8)',
                          value: data.qualityDistribution.good,
                          color: '#3B82F6',
                        },
                        {
                          name: 'Average (5-6)',
                          value: data.qualityDistribution.average,
                          color: '#F59E0B',
                        },
                        {
                          name: 'Poor (1-4)',
                          value: data.qualityDistribution.poor,
                          color: '#EF4444',
                        },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsLineChart data={data.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="qualityScore"
                      stroke="#8884d8"
                      name="Quality Score"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.modelPerformance.map((model, _index) => (
              <Card key={model.model}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{model.model}</span>
                    <Badge variant="outline">{model.usage} uses</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Quality</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-mono">{model.averageQuality.toFixed(1)}/10</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Cost</span>
                      <span className="font-mono">{formatCurrency(model.averageCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Success Rate</span>
                      <span className="font-mono">{formatPercentage(model.successRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Speed</span>
                      <span className="font-mono">{model.averageSpeed.toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cost Efficiency</span>
                      <span className="font-mono">{formatPercentage(model.costEfficiency)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>Best for:</strong> {model.recommendedFor.join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.sectionAnalytics.map((section, _index) => (
                  <div key={section.sectionName} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{section.sectionName}</h4>
                      <Badge
                        variant={
                          section.complexity === 'complex'
                            ? 'destructive'
                            : section.complexity === 'moderate'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {section.complexity}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Generations</div>
                        <div className="font-mono">{section.totalGenerations}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Quality</div>
                        <div className="font-mono">{section.averageQuality.toFixed(1)}/10</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Cost</div>
                        <div className="font-mono">{formatCurrency(section.averageCost)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Success Rate</div>
                        <div className="font-mono">{formatPercentage(section.successRate)}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span>Quality Progress</span>
                        <span>
                          {section.improvement > 0 ? '+' : ''}
                          {section.improvement.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={section.averageQuality * 10} className="mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.userActivity.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Last 24 hours</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Total Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.userActivity.totalSessions}</div>
                <div className="text-sm text-muted-foreground">
                  Avg: {data.userActivity.averageSessionDuration.toFixed(1)} min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Engagement Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.userActivity.userEngagement.toFixed(1)}/10
                </div>
                <div className="text-sm text-muted-foreground">User satisfaction</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.userActivity.featureUsage.map((feature, _index) => (
                  <div key={feature.feature} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{feature.feature}</span>
                      <Badge variant="outline">{feature.usage} uses</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-sm">{feature.satisfaction.toFixed(1)}</span>
                      </div>
                      <div className="w-24">
                        <Progress value={feature.satisfaction * 10} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.userActivity.mostActiveHours.map((hour, index) => (
                  <Badge key={index} variant="secondary">
                    {hour}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedAnalyticsDashboard;
