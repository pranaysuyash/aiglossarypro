import { Activity, Database, Eye, Heart, Search, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTerms: number;
  totalViews: number;
  totalSearches: number;
  totalFavorites: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  recentActivity: any[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: number;
  color?: string;
}

function MetricCard({ title, value, icon: Icon, trend, color = 'blue' }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '+' : ''}
            {trend}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OwnerDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalTerms: 0,
    totalViews: 0,
    totalSearches: 0,
    totalFavorites: 0,
    systemHealth: 'healthy',
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Update every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const refreshMetrics = () => {
    setLoading(true);
    fetchMetrics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={metrics.systemHealth === 'healthy' ? 'default' : 'destructive'}>
            System {metrics.systemHealth}
          </Badge>
          <Button onClick={refreshMetrics} size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Users (30d)"
          value={metrics.activeUsers.toLocaleString()}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Total Terms"
          value={metrics.totalTerms.toLocaleString()}
          icon={Database}
          color="purple"
        />
        <MetricCard
          title="Term Views"
          value={metrics.totalViews.toLocaleString()}
          icon={Eye}
          color="orange"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Total Searches"
          value={metrics.totalSearches.toLocaleString()}
          icon={Search}
          color="indigo"
        />
        <MetricCard
          title="Total Favorites"
          value={metrics.totalFavorites.toLocaleString()}
          icon={Heart}
          color="red"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {metrics.recentActivity.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.details}</p>
                  </div>
                  <Badge variant="outline">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <Database className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm">Import Data</p>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm">View Analytics</p>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm">Manage Users</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
