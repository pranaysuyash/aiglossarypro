import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
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
import { useToast } from '@/hooks/useToast';

interface CacheStats {
  query: CacheTypeStats;
  search: CacheTypeStats;
  user: CacheTypeStats;
  combined: {
    totalHits: number;
    totalMisses: number;
    totalSize: number;
    overallHitRate: number;
  };
}

interface CacheTypeStats {
  size: number;
  maxItems: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
  enabled: boolean;
  cacheType: string;
}

interface RealTimeMetrics {
  timestamp: Date;
  opsPerSecond: number;
  hitRate: number;
  avgResponseTime: number;
  activeKeys: number;
  recentOperations: any[];
}

interface CacheHealth {
  healthy: boolean;
  hitRate: number;
  evictionRate: number;
  memoryPressure: number;
  warnings: string[];
  recommendations: string[];
}

interface CacheReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: {
    avgHitRate: number;
    totalHits: number;
    totalMisses: number;
    avgResponseTime: number;
    peakCacheSize: number;
  };
  currentStatus: any;
  health: CacheHealth;
  trends: any;
  keyAnalysis: {
    hotKeys: Array<{ key: string; hits: number }>;
    coldKeys: Array<{ key: string; lastAccess: Date }>;
  };
  recommendations: string[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export function CacheMonitoring() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [health, setHealth] = useState<CacheHealth | null>(null);
  const [report, setReport] = useState<CacheReport | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/cache-analytics/stats');
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching cache stats:', error);
    }
  }, []);

  const fetchRealTimeMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/cache-analytics/real-time');
      const data = await response.json();
      setRealTimeMetrics(data);
    } catch (error: any) {
      console.error('Error fetching real-time metrics:', error);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/cache-analytics/health');
      const data = await response.json();
      setHealth(data);
    } catch (error: any) {
      console.error('Error fetching cache health:', error);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      const response = await fetch('/api/cache-analytics/report');
      const data = await response.json();
      setReport(data);
    } catch (error: any) {
      console.error('Error fetching cache report:', error);
    }
  }, []);

  const fetchHistoricalData = useCallback(async () => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch(
        `/api/cache-analytics/historical?startDate=${startDate}&endDate=${endDate}&interval=hour`
      );
      const data = await response.json();
      setHistoricalData(data.metrics || []);
    } catch (error: any) {
      console.error('Error fetching historical data:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRealTimeMetrics(),
      fetchHealth(),
      fetchReport(),
      fetchHistoricalData(),
    ]);
    setLoading(false);
  }, [fetchStats, fetchRealTimeMetrics, fetchHealth, fetchReport, fetchHistoricalData]);

  useEffect(() => {
    fetchAllData();

    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStats();
        fetchRealTimeMetrics();
        fetchHealth();
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval) {clearInterval(interval);}
    };
  }, [autoRefresh, fetchAllData, fetchStats, fetchRealTimeMetrics, fetchHealth]);

  const clearCache = async (cacheType: string) => {
    try {
      const response = await fetch('/api/cache-analytics/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheType }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Cache Cleared',
          description: data.message,
        });
        fetchAllData();
      }
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      });
    }
  };

  const getHealthBadge = (health: CacheHealth | null) => {
    if (!health) {return null;}

    if (health.healthy) {
      return <Badge className="bg-green-500">Healthy</Badge>;
    } else if (health.warnings.length <= 2) {
      return <Badge className="bg-yellow-500">Warning</Badge>;
    } 
      return <Badge className="bg-red-500">Critical</Badge>;
    
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pieData = stats
    ? [
        { name: 'Query Cache', value: stats.query.size },
        { name: 'Search Cache', value: stats.search.size },
        { name: 'User Cache', value: stats.user.size },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cache Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time cache analytics and health monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status Alert */}
      {health && !health.healthy && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cache Performance Issues Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {health.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Hit Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatPercentage(stats.combined.overallHitRate) : '0%'}
            </div>
            <Progress value={stats ? stats.combined.overallHitRate * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realTimeMetrics ? `${realTimeMetrics.avgResponseTime.toFixed(1)}ms` : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground">
              {realTimeMetrics && realTimeMetrics.avgResponseTime < 50
                ? 'Excellent'
                : 'Needs optimization'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.combined.totalSize) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Active entries across all caches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getHealthBadge(health)}
              {health?.healthy ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {health ? `${health.warnings.length} warnings` : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="historical">Historical</TabsTrigger>
          <TabsTrigger value="caches">Cache Types</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Operations</CardTitle>
              <CardDescription>Live cache operations per second</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={realTimeMetrics?.recentOperations || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="opsPerSecond" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span>Operations/sec: {realTimeMetrics?.opsPerSecond.toFixed(1) || 0}</span>
                <span>Active Keys: {realTimeMetrics?.activeKeys || 0}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Performance</CardTitle>
              <CardDescription>Hit rate and response time trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgHitRate"
                      stroke="#82ca9d"
                      name="Hit Rate"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#8884d8"
                      name="Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caches" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cache Distribution</CardTitle>
                <CardDescription>Size distribution across cache types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance by Type</CardTitle>
                <CardDescription>Hit rates and sizes for each cache</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats &&
                  ['query', 'search', 'user'].map(cacheType => {
                    const cache = stats[cacheType as keyof typeof stats] as CacheTypeStats;
                    return (
                      <div key={cacheType} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{cacheType} Cache</span>
                          <Button size="sm" variant="outline" onClick={() => clearCache(cacheType)}>
                            Clear
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Hit Rate: {formatPercentage(cache.hitRate)}</div>
                          <div>
                            Size: {cache.size}/{cache.maxItems}
                          </div>
                          <div>Hits: {formatNumber(cache.hitCount)}</div>
                          <div>Misses: {formatNumber(cache.missCount)}</div>
                        </div>
                        <Progress value={(cache.size / cache.maxItems) * 100} />
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Analysis</CardTitle>
              <CardDescription>Hot and cold cache keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Hot Keys
                  </h4>
                  <div className="space-y-1">
                    {report?.keyAnalysis.hotKeys.map((key, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="truncate max-w-[200px]">{key.key}</span>
                        <span className="text-muted-foreground">{key.hits} hits</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Cold Keys
                  </h4>
                  <div className="space-y-1">
                    {report?.keyAnalysis.coldKeys.map((key, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="truncate max-w-[200px]">{key.key}</span>
                        <span className="text-muted-foreground">
                          {new Date(key.lastAccess).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {report && report.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Optimization suggestions based on current performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
