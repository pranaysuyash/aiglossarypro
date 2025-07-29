import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  LineChart,
  PieChart,
  RefreshCw,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GenerationStats {
  summary: {
    totalGenerations: number;
    totalCost: number;
    averageCost: number;
    successRate: number;
    totalTokens: number;
    averageTokens: number;
    averageLatency: number;
    costToday: number;
    costThisMonth: number;
    generationsToday: number;
    generationsThisMonth: number;
  };
  byTimeframe: {
    today: GenerationMetrics;
    week: GenerationMetrics;
    month: GenerationMetrics;
  };
  byModel: { [model: string]: ModelStats };
  byTemplate: { [templateId: string]: TemplateStats };
  bySection: { [sectionName: string]: SectionStats };
  qualityMetrics: {
    averageScore: number;
    scoreDistribution: {
      excellent: number;
      good: number;
      needsWork: number;
      poor: number;
    };
    improvementRate: number;
  };
  recentGenerations: RecentGeneration[];
  timeline: TimelineData[];
  costAnalytics: CostAnalytics;
}

interface GenerationMetrics {
  count: number;
  cost: number;
  tokens: number;
  successRate: number;
  averageLatency: number;
}

interface ModelStats {
  count: number;
  cost: number;
  tokens: number;
  successRate: number;
  averageLatency: number;
  averageQuality: number;
}

interface TemplateStats {
  templateName: string;
  count: number;
  cost: number;
  successRate: number;
  averageQuality: number;
  lastUsed: Date;
}

interface SectionStats {
  count: number;
  cost: number;
  successRate: number;
  averageQuality: number;
  averageTokens: number;
}

interface RecentGeneration {
  id: string;
  termName: string;
  sectionName: string;
  model: string;
  cost: number;
  tokens: number;
  qualityScore?: number;
  status: 'success' | 'failed';
  createdAt: Date;
  processingTime: number;
}

interface TimelineData {
  date: string;
  generations: number;
  cost: number;
  successRate: number;
  averageQuality: number;
}

interface CostAnalytics {
  projectedMonthlyCost: number;
  costEfficiency: number;
  savingsFromBatching: number;
  costByComplexity: {
    simple: number;
    moderate: number;
    complex: number;
  };
}

export function GenerationStatsDashboard() {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [selectedModel, _setSelectedModel] = useState<string>('all');

  // Query for generation statistics
  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch,
  } = useQuery({
    queryKey: ['generation-statistics', timeframe, selectedModel],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe,
        ...(selectedModel !== 'all' && { model: selectedModel }),
      });
      const response = await fetch(`/api/admin/generation/stats?${params}`);
      if (!response.ok) {throw new Error('Failed to fetch generation statistics');}
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const stats = statsData?.data as GenerationStats | undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const getQualityColor = (score: number) => {
    if (score >= 9) {return 'text-green-600';}
    if (score >= 7) {return 'text-blue-600';}
    if (score >= 5) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Generation Statistics</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics for AI content generation performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoadingStats ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="costs">Cost Analytics</TabsTrigger>
            <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(stats?.summary.totalGenerations || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(stats?.summary.generationsToday || 0)} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(stats?.summary.successRate || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">AI generation success</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.summary.totalCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats?.summary.costToday || 0)} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${getQualityColor(stats?.qualityMetrics.averageScore || 0)}`}
                  >
                    {(stats?.qualityMetrics.averageScore || 0).toFixed(1)}/10
                  </div>
                  <p className="text-xs text-muted-foreground">Content quality score</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Cost per Generation</span>
                      <span className="text-sm font-mono">
                        {formatCurrency(stats?.summary.averageCost || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Tokens</span>
                      <span className="text-sm font-mono">
                        {formatNumber(stats?.summary.averageTokens || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Latency</span>
                      <span className="text-sm font-mono">
                        {stats?.summary.averageLatency || 0}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Improvement Rate</span>
                      <span className="text-sm font-mono">
                        {formatPercentage(stats?.qualityMetrics.improvementRate || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Quality Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Excellent (9-10)</span>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={stats?.qualityMetrics.scoreDistribution.excellent || 0}
                          className="w-16"
                        />
                        <span className="text-sm font-mono w-12">
                          {stats?.qualityMetrics.scoreDistribution.excellent || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Good (7-8)</span>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={stats?.qualityMetrics.scoreDistribution.good || 0}
                          className="w-16"
                        />
                        <span className="text-sm font-mono w-12">
                          {stats?.qualityMetrics.scoreDistribution.good || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Needs Work (5-6)</span>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={stats?.qualityMetrics.scoreDistribution.needsWork || 0}
                          className="w-16"
                        />
                        <span className="text-sm font-mono w-12">
                          {stats?.qualityMetrics.scoreDistribution.needsWork || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Poor (1-4)</span>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={stats?.qualityMetrics.scoreDistribution.poor || 0}
                          className="w-16"
                        />
                        <span className="text-sm font-mono w-12">
                          {stats?.qualityMetrics.scoreDistribution.poor || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Comparison</CardTitle>
                <CardDescription>
                  Compare performance metrics across different AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Generations</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Quality</TableHead>
                      <TableHead>Avg Cost</TableHead>
                      <TableHead>Avg Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.byModel &&
                      Object.entries(stats.byModel).map(([model, data]) => (
                        <TableRow key={model}>
                          <TableCell className="font-medium">{model}</TableCell>
                          <TableCell>{formatNumber(data.count)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                data.successRate > 0.95
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {formatPercentage(data.successRate)}
                            </Badge>
                          </TableCell>
                          <TableCell className={getQualityColor(data.averageQuality)}>
                            {data.averageQuality.toFixed(1)}/10
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(data.cost / data.count)}
                          </TableCell>
                          <TableCell className="font-mono">{data.averageLatency}ms</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Section Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Section Performance</CardTitle>
                <CardDescription>Performance metrics by content section type</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Generations</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Quality</TableHead>
                      <TableHead>Avg Tokens</TableHead>
                      <TableHead>Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.bySection &&
                      Object.entries(stats.bySection).map(([section, data]) => (
                        <TableRow key={section}>
                          <TableCell className="font-medium">{section.replace('_', ' ')}</TableCell>
                          <TableCell>{formatNumber(data.count)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                data.successRate > 0.95
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {formatPercentage(data.successRate)}
                            </Badge>
                          </TableCell>
                          <TableCell className={getQualityColor(data.averageQuality)}>
                            {data.averageQuality.toFixed(1)}/10
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatNumber(data.averageTokens)}
                          </TableCell>
                          <TableCell className="font-mono">{formatCurrency(data.cost)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            {/* Cost Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.costAnalytics.projectedMonthlyCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Based on current usage</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(stats?.costAnalytics.costEfficiency || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Efficiency score</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Batch Savings</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(stats?.costAnalytics.savingsFromBatching || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Saved through batching</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats?.summary.costThisMonth || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Month-to-date spend</p>
                </CardContent>
              </Card>
            </div>

            {/* Cost by Complexity */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown by Complexity</CardTitle>
                <CardDescription>
                  How costs are distributed across content complexity levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.costAnalytics.costByComplexity &&
                    Object.entries(stats.costAnalytics.costByComplexity).map(
                      ([complexity, cost]) => (
                        <div key={complexity} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getComplexityColor(complexity)}>{complexity}</Badge>
                            <span className="text-sm font-medium capitalize">
                              {complexity} Content
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatCurrency(cost)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPercentage(cost / (stats?.summary.totalCost || 1))} of total
                            </div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics Deep Dive</CardTitle>
                <CardDescription>
                  Detailed analysis of content quality and improvement patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Quality Score Distribution</h4>
                    {stats?.qualityMetrics.scoreDistribution &&
                      Object.entries(stats.qualityMetrics.scoreDistribution).map(
                        ([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {category.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={
                                  (count /
                                    Object.values(stats.qualityMetrics.scoreDistribution).reduce(
                                      (a, b) => a + b,
                                      0
                                    )) *
                                  100
                                }
                                className="w-24"
                              />
                              <span className="text-sm font-mono w-8">{count}</span>
                            </div>
                          </div>
                        )
                      )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Quality Trends</h4>
                    <div className="text-center py-8 text-muted-foreground">
                      <LineChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Quality trend chart would be implemented here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Generation Activity</CardTitle>
                <CardDescription>
                  Latest content generation requests and their outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.recentGenerations?.map(generation => (
                      <TableRow key={generation.id}>
                        <TableCell className="font-medium">{generation.termName}</TableCell>
                        <TableCell>{generation.sectionName.replace('_', ' ')}</TableCell>
                        <TableCell className="font-mono text-sm">{generation.model}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(generation.status)}>
                            {generation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {generation.qualityScore ? (
                            <span className={getQualityColor(generation.qualityScore)}>
                              {generation.qualityScore.toFixed(1)}/10
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(generation.cost)}
                        </TableCell>
                        <TableCell className="font-mono">{generation.processingTime}ms</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(generation.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default GenerationStatsDashboard;
