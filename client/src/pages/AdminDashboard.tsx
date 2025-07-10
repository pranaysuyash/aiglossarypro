import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, FileText, BarChart3, Settings, Zap } from '@/components/ui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);

  const handleContentGeneration = async () => {
    setIsGenerating(true);
    setGenerationResult(null);
    
    try {
      // Simulate content generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGenerationResult('Content generation completed successfully!');
    } catch (error) {
      setGenerationResult('Content generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const mockStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalTerms: 10543,
    pendingReviews: 23,
    systemHealth: 'Good',
    dailyUploads: 156
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, content, and system settings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Badge variant="secondary">{mockStats.activeUsers}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">71% of total users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTerms.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+43 terms this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mockStats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
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
                    <div className="text-2xl font-bold">{mockStats.pendingReviews}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Daily Uploads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockStats.dailyUploads}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Auto-Generated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">89</div>
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
                  <Button variant="outline">View All Users</Button>
                  <Button variant="outline">Subscription Reports</Button>
                  <Button variant="outline">User Analytics</Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  User management features will be implemented here
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
                  <Button variant="outline">Usage Reports</Button>
                  <Button variant="outline">Performance Metrics</Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Advanced analytics and reporting tools will be available here
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