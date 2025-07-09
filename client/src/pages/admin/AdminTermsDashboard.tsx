import { AlertCircle, Bot, Database, TrendingUp } from 'lucide-react';
import type React from 'react';
import { AdminTermsManager } from '@/components/admin/AdminTermsManager';
import { AIContentMonitor } from '@/components/admin/AIContentMonitor';
import { CacheMonitoring } from '@/components/admin/CacheMonitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminTermsDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Content Management Dashboard</h1>
              <p className="text-muted-foreground">
                AI-powered term management, quality control, and system monitoring
              </p>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="terms" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="terms" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Terms Management
              </TabsTrigger>
              <TabsTrigger value="ai-monitor" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Monitor
              </TabsTrigger>
              <TabsTrigger value="cache" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Cache Monitor
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                System Health
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="space-y-4">
              <AdminTermsManager />
            </TabsContent>

            <TabsContent value="ai-monitor" className="space-y-4">
              <AIContentMonitor />
            </TabsContent>

            <TabsContent value="cache" className="space-y-4">
              <CacheMonitoring />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Analytics</CardTitle>
                  <CardDescription>
                    Analytics dashboard for content performance and user engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Analytics dashboard coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Health Monitor</CardTitle>
                  <CardDescription>
                    Monitor system health, database performance, and service availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    System health monitoring coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminTermsDashboard;
