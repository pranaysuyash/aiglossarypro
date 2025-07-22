import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Gauge,
  Loader2,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalCreated: number;
  totalDestroyed: number;
  avgAcquireTime: number;
  peakConnections: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
}

interface SystemMetrics {
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  cpu: {
    user: string;
    system: string;
  };
  uptime: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: number;
}

export function PerformanceAnalyticsDashboard() {
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [streamConnected, setStreamConnected] = useState(false);

  // Fetch metrics
  const fetchMetrics = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/monitoring/system', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPoolMetrics(data.data.database.pool);
        setSystemMetrics(data.data.system);
        
        // Calculate performance metrics
        const metrics: PerformanceMetric[] = [
          {
            name: 'Response Time',
            value: data.data.database.pool.avgAcquireTime || 0,
            unit: 'ms',
            status: data.data.database.pool.avgAcquireTime < 100 ? 'good' : 
                   data.data.database.pool.avgAcquireTime < 500 ? 'warning' : 'critical',
            threshold: 100
          },
          {
            name: 'Connection Usage',
            value: Math.round((data.data.database.pool.totalConnections / 20) * 100),
            unit: '%',
            status: data.data.database.pool.totalConnections < 15 ? 'good' :
                   data.data.database.pool.totalConnections < 18 ? 'warning' : 'critical',
            threshold: 75
          },
          {
            name: 'Memory Usage',
            value: parseInt(data.data.system.memory.heapUsed) / parseInt(data.data.system.memory.heapTotal) * 100,
            unit: '%',
            status: parseInt(data.data.system.memory.heapUsed) / parseInt(data.data.system.memory.heapTotal) < 0.7 ? 'good' :
                   parseInt(data.data.system.memory.heapUsed) / parseInt(data.data.system.memory.heapTotal) < 0.85 ? 'warning' : 'critical',
            threshold: 70
          }
        ];
        
        setPerformanceMetrics(metrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Set up SSE for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    if (autoRefresh) {
      eventSource = new EventSource('/api/monitoring/pool/stream', {
        withCredentials: true
      });
      
      eventSource.onopen = () => {
        setStreamConnected(true);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const metrics = JSON.parse(event.data);
          setPoolMetrics(metrics);
        } catch (err) {
          console.error('Failed to parse SSE data:', err);
        }
      };
      
      eventSource.onerror = () => {
        setStreamConnected(false);
        eventSource?.close();
        
        // Fallback to polling
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
      };
    }
    
    return () => {
      eventSource?.close();
    };
  }, [autoRefresh]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'Response Time':
        return <Clock className="w-5 h-5" />;
      case 'Connection Usage':
        return <Database className="w-5 h-5" />;
      case 'Memory Usage':
        return <Server className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Performance Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring of system performance and health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={streamConnected ? 'default' : 'secondary'}>
            {streamConnected ? 'Live' : 'Polling'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {poolMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              <Badge className={getHealthColor(poolMetrics.healthStatus)}>
                {poolMetrics.healthStatus.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceMetrics.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric.name)}
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <span className={`font-bold ${
                      metric.status === 'good' ? 'text-green-600' :
                      metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {metric.value.toFixed(1)}{metric.unit}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (metric.value / metric.threshold) * 100)} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different metrics */}
      <Tabs defaultValue="database" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          {poolMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Active Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{poolMetrics.totalConnections}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Peak: {poolMetrics.peakConnections}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Idle Connections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{poolMetrics.idleConnections}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Available for use
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Waiting Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {poolMetrics.waitingRequests}
                      {poolMetrics.waitingRequests > 0 && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      In queue
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Avg Acquire Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{poolMetrics.avgAcquireTime.toFixed(0)}ms</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Connection latency
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Lifecycle</CardTitle>
                  <CardDescription>
                    Total connections created and destroyed over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>Total Created</span>
                      </div>
                      <span className="font-mono">{poolMetrics.totalCreated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span>Total Destroyed</span>
                      </div>
                      <span className="font-mono">{poolMetrics.totalDestroyed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          {systemMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">RSS</span>
                      <span className="font-mono text-sm">{systemMetrics.memory.rss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Heap Total</span>
                      <span className="font-mono text-sm">{systemMetrics.memory.heapTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Heap Used</span>
                      <span className="font-mono text-sm">{systemMetrics.memory.heapUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">External</span>
                      <span className="font-mono text-sm">{systemMetrics.memory.external}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      CPU Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">User</span>
                      <span className="font-mono text-sm">{systemMetrics.cpu.user}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">System</span>
                      <span className="font-mono text-sm">{systemMetrics.cpu.system}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uptime</span>
                      <span className="font-mono text-sm">{systemMetrics.uptime}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Historical performance data and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Real-time trend visualization coming soon</p>
                <p className="text-sm mt-2">
                  Historical data will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      {poolMetrics && poolMetrics.healthStatus !== 'healthy' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Recommendations:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {poolMetrics.avgAcquireTime > 500 && (
                <li>High connection acquire time detected. Consider increasing pool size.</li>
              )}
              {poolMetrics.waitingRequests > 5 && (
                <li>Multiple requests waiting for connections. Scale up the connection pool.</li>
              )}
              {performanceMetrics.find(m => m.name === 'Memory Usage' && m.status === 'critical') && (
                <li>High memory usage detected. Consider optimizing queries or increasing resources.</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}