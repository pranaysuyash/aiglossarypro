import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, FileText, BarChart3, Settings, Zap, RefreshCw, Shield, ShieldAlert } from '@/components/ui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminStats {
  userCount: number;
  termCount: number;
  categoryCount: number;
  recentActivity?: any[];
}

interface SystemHealth {
  database: string;
  s3: string;
  ai: string;
  termCount: number;
  uptime?: string;
  lastCheck?: string;
}

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { isAuthorized, isLoading: authLoading, error: authError, redirectToLogin, redirectToHome } = useAdminAuth();

  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error('Admin access required. You do not have permission to view this data.');
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}. Please try again later.`);
      }
      
      const data = await response.json();
      if (data.success) {
        setAdminStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to load admin statistics');
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load admin statistics';
      
      toast({
        title: 'Error Loading Statistics',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication required for health check.');
      }
      
      if (response.status === 403) {
        throw new Error('Admin access required for health monitoring.');
      }
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}. Service may be unavailable.`);
      }
      
      const data = await response.json();
      if (data.success) {
        setSystemHealth(data.data);
      } else {
        throw new Error(data.message || 'Health check returned invalid data');
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load system health';
      
      toast({
        title: 'Health Check Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Set fallback health status
      setSystemHealth({
        database: 'unknown',
        s3: 'unknown',
        ai: 'unknown',
        termCount: 0,
      });
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication required for user data.');
      }
      
      if (response.status === 403) {
        throw new Error('Admin access required for user management.');
      }
      
      if (!response.ok) {
        throw new Error(`User data fetch failed: ${response.status}. Please check server status.`);
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to parse user data');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      
      toast({
        title: 'User Data Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Set empty users array as fallback
      setUsers([]);
    }
  }, [toast]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      // Load data concurrently with individual error handling
      const results = await Promise.allSettled([
        fetchAdminStats(),
        fetchSystemHealth(),
        fetchUsers(),
      ]);
      
      // Count successful operations
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const totalOperations = results.length;
      
      if (successCount === 0) {
        toast({
          title: 'Dashboard Load Failed',
          description: 'Unable to load any dashboard data. Please check your connection and try again.',
          variant: 'destructive',
        });
      } else if (successCount < totalOperations) {
        toast({
          title: 'Partial Load',
          description: `Loaded ${successCount}/${totalOperations} data sources. Some information may be missing.`,
          variant: 'destructive',
        });
      }
      
      // Log failed operations for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const operationNames = ['Admin Stats', 'System Health', 'Users'];
          console.error(`Failed to load ${operationNames[index]}:`, result.reason);
        }
      });
      
    } catch (error) {
      console.error('Critical error loading dashboard data:', error);
      toast({
        title: 'Critical Error',
        description: 'Dashboard initialization failed. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      const loadTime = Date.now() - startTime;
      console.log(`Dashboard data loaded in ${loadTime}ms`);
      setLoading(false);
    }
  }, [fetchAdminStats, fetchSystemHealth, fetchUsers, toast]);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Dashboard data refreshed',
    });
  }, [loadDashboardData, toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleContentGeneration = async () => {
    setIsGenerating(true);
    setGenerationResult(null);
    
    try {
      // Call real content generation endpoint
      const response = await fetch('/api/admin/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          batchSize: 5,
          categories: ['machine-learning', 'neural-networks'],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setGenerationResult(`Content generation completed successfully! Generated ${data.data?.count || 0} new terms.`);
        // Refresh stats after generation
        await fetchAdminStats();
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (error) {
      console.error('Content generation error:', error);
      setGenerationResult('Content generation failed. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Handle authentication and authorization
  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600 animate-pulse" />
            <span className="text-lg">Verifying admin access...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Checking authentication and permissions
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-6">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
              <p className="text-muted-foreground mt-1">
                {authError || 'You do not have permission to access the admin dashboard'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button onClick={redirectToLogin} variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Log In
            </Button>
            <Button onClick={redirectToHome}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg">Loading admin dashboard...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Fetching admin statistics, system health, and user data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, content, and system settings
            </p>
          </div>
          <Button 
            onClick={refreshDashboard}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminStats?.userCount?.toLocaleString() || 
               (adminStats === null ? (
                 <span className="text-muted-foreground">Loading...</span>
               ) : '0')
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {users.length > 0 ? `${users.length} recent users` : 
               loading ? 'Loading users...' : 'No recent activity'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Badge variant="secondary">
              {users.filter(u => u.isActive).length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.isActive).length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {adminStats?.userCount ? 
                `${Math.round((users.filter(u => u.isActive).length / adminStats.userCount) * 100)}% of total users` :
                'No data available'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminStats?.termCount?.toLocaleString() || systemHealth?.termCount?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {adminStats?.categoryCount ? `Across ${adminStats.categoryCount} categories` : 'No category data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthStatusColor(systemHealth?.database || 'unknown')}`}>
              {systemHealth?.database || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth ? 
                `DB: ${systemHealth.database}, AI: ${systemHealth.ai}` :
                'Health check pending'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" data-testid="content-management">Content Management</TabsTrigger>
          <TabsTrigger value="users" data-testid="user-management">User Management</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings" data-testid="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Content Generation
              </CardTitle>
              <CardDescription>
                Generate new AI/ML terms and definitions using advanced AI models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={handleContentGeneration}
                  disabled={isGenerating}
                  data-testid="generate-content"
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
                
                <Button variant="outline" disabled={isGenerating}>
                  Batch Import
                </Button>
                
                <Button variant="outline" disabled={isGenerating}>
                  Review Queue
                </Button>
              </div>

              {generationResult && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{generationResult}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pending Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {adminStats?.recentActivity?.filter((a: any) => a.type === 'pending_review')?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Content awaiting approval</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {adminStats?.categoryCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Total categories</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Health Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getHealthStatusColor(systemHealth?.ai || 'unknown')}`}>
                      {systemHealth?.ai || 'Unknown'}
                    </div>
                    <p className="text-xs text-muted-foreground">AI service status</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, subscriptions, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={() => window.open('/admin/users', '_blank')}>
                    View All Users ({adminStats?.userCount || 0})
                  </Button>
                  <Button variant="outline">Subscription Reports</Button>
                  <Button variant="outline" onClick={() => window.open('/admin/analytics', '_blank')}>
                    User Analytics
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Recent Users</h4>
                  {users.length > 0 ? (
                    <div className="space-y-2">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <div>
                              <div className="font-medium text-sm">
                                {user.firstName && user.lastName ? 
                                  `${user.firstName} ${user.lastName}` : 
                                  user.email
                                }
                              </div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground border rounded-lg p-4 text-center">
                      No users found. This may indicate the system is newly initialized.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                System performance and usage analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/api/analytics/export?format=csv&timeframe=month&type=content', '_blank')}
                  >
                    Download Usage Report
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/admin/analytics', '_blank')}
                  >
                    View Performance Metrics
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Quick Analytics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{adminStats?.termCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Terms</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{adminStats?.categoryCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Categories</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{users.length}</div>
                      <div className="text-sm text-muted-foreground">Recent Users</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    <strong>System Status:</strong> Database: {systemHealth?.database || 'Unknown'} | 
                    AI Service: {systemHealth?.ai || 'Unknown'} | 
                    Storage: {systemHealth?.s3 || 'Unknown'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline">API Settings</Button>
                  <Button variant="outline">Email Templates</Button>
                  <Button variant="outline">Feature Flags</Button>
                  <Button variant="outline">System Maintenance</Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  System configuration options will be available here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}