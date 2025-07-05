import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Users, 
  TrendingUp, 
  Download, 
  Search, 
  Filter, 
  RefreshCw,
  BarChart3,
  Globe,
  Calendar,
  UserMinus
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

interface NewsletterSubscription {
  id: number;
  email: string;
  status: 'active' | 'unsubscribed';
  language: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  unsubscribed_at?: string;
  user_agent?: string;
}

interface NewsletterAnalytics {
  total_subscriptions: number;
  active_subscriptions: number;
  unsubscribed: number;
  unique_languages: number;
  unique_sources: number;
}

interface NewsletterData {
  subscriptions: NewsletterSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  analytics: NewsletterAnalytics;
}

interface NewsletterFilters {
  status: string;
  search: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  language: string;
  page: number;
  limit: number;
  sort: string;
  order: string;
}

const AdminNewsletterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filters, setFilters] = useState<NewsletterFilters>({
    status: 'all',
    search: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    language: '',
    page: 1,
    limit: 50,
    sort: 'created_at',
    order: 'desc'
  });

  // Query for newsletter subscriptions
  const { 
    data: newsletterData, 
    isLoading: isLoadingSubscriptions, 
    error: subscriptionsError,
    refetch: refetchSubscriptions
  } = useQuery({
    queryKey: ['admin-newsletter-subscriptions', filters],
    queryFn: async (): Promise<NewsletterData> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/admin/newsletter/subscriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch newsletter subscriptions');
      const result = await response.json();
      return result.data;
    },
    enabled: !!user
  });

  // Query for newsletter analytics
  const { 
    data: analyticsData, 
    isLoading: isLoadingAnalytics 
  } = useQuery({
    queryKey: ['admin-newsletter-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/newsletter/analytics');
      if (!response.ok) throw new Error('Failed to fetch newsletter analytics');
      const result = await response.json();
      return result.data;
    },
    enabled: !!user
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof NewsletterFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? Number(value) : 1 // Reset page when other filters change
    }));
  };

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(newsletterData?.subscriptions.map(sub => sub.id) || []);
    } else {
      setSelectedSubscriptions([]);
    }
  };

  const handleSelectSubscription = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(prev => [...prev, id]);
    } else {
      setSelectedSubscriptions(prev => prev.filter(subId => subId !== id));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'unsubscribe') => {
    if (selectedSubscriptions.length === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/admin/contact/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ids: selectedSubscriptions
        })
      });

      if (!response.ok) throw new Error('Bulk action failed');

      await refetchSubscriptions();
      setSelectedSubscriptions([]);
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/admin/newsletter/export?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'unsubscribed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (subscriptionsError) {
    return (
      <div className="p-6">
        <Alert className="mb-4">
          <AlertDescription>
            Failed to load newsletter data. Please check your permissions and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Management</h1>
          <p className="text-gray-600 mt-2">Manage newsletter subscriptions and view analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => refetchSubscriptions()}
            disabled={isLoadingSubscriptions}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {newsletterData?.analytics.total_subscriptions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {newsletterData?.analytics.active_subscriptions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                <UserMinus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {newsletterData?.analytics.unsubscribed || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Languages</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {newsletterData?.analytics.unique_languages || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search-filter">Search</Label>
                  <Input
                    id="search-filter"
                    placeholder="Search emails..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="utm-source-filter">UTM Source</Label>
                  <Input
                    id="utm-source-filter"
                    placeholder="Filter by UTM source..."
                    value={filters.utm_source}
                    onChange={(e) => handleFilterChange('utm_source', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="language-filter">Language</Label>
                  <Input
                    id="language-filter"
                    placeholder="Filter by language..."
                    value={filters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedSubscriptions.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedSubscriptions.length} subscription(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkAction('unsubscribe')}
                      disabled={bulkActionLoading}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unsubscribe Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                {newsletterData?.pagination.total || 0} total subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscriptions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedSubscriptions.length === newsletterData?.subscriptions.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>UTM Source</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Unsubscribed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newsletterData?.subscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubscriptions.includes(subscription.id)}
                              onCheckedChange={(checked) => 
                                handleSelectSubscription(subscription.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">{subscription.email}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(subscription.status)}>
                              {subscription.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{subscription.language}</TableCell>
                          <TableCell>{subscription.utm_source || '-'}</TableCell>
                          <TableCell>{formatDate(subscription.created_at)}</TableCell>
                          <TableCell>
                            {subscription.unsubscribed_at ? formatDate(subscription.unsubscribed_at) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {newsletterData?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((newsletterData.pagination.page - 1) * newsletterData.pagination.limit) + 1} to{' '}
                    {Math.min(newsletterData.pagination.page * newsletterData.pagination.limit, newsletterData.pagination.total)} of{' '}
                    {newsletterData.pagination.total} subscriptions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                      disabled={filters.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={filters.page >= newsletterData.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscriptions Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Subscriptions Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyticsData?.subscriptionsOverTime?.slice(0, 7).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">{item.date}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">{item.count}</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">{item.active_count}</div>
                            <div className="text-xs text-gray-500">Active</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Popular UTM Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyticsData?.popularSources?.slice(0, 5).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium">{item.utm_source}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{item.count}</div>
                          <div className="text-xs text-green-600">{item.active_count} active</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNewsletterDashboard;