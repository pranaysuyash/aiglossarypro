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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download, 
  Search, 
  Filter, 
  RefreshCw,
  BarChart3,
  Globe,
  Calendar,
  Eye,
  Edit,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

interface ContactSubmission {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  language: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at?: string;
  user_agent?: string;
  notes?: string;
}

interface ContactAnalytics {
  total_submissions: number;
  new_submissions: number;
  in_progress_submissions: number;
  resolved_submissions: number;
  unique_languages: number;
  unique_sources: number;
}

interface ContactData {
  submissions: ContactSubmission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  analytics: ContactAnalytics;
}

interface ContactFilters {
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

const AdminContactsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [editingContact, setEditingContact] = useState<ContactSubmission | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [filters, setFilters] = useState<ContactFilters>({
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

  // Query for contact submissions
  const { 
    data: contactData, 
    isLoading: isLoadingSubmissions, 
    error: submissionsError,
    refetch: refetchSubmissions
  } = useQuery({
    queryKey: ['admin-contact-submissions', filters],
    queryFn: async (): Promise<ContactData> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/admin/contact/submissions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contact submissions');
      const result = await response.json();
      return result.data;
    },
    enabled: !!user
  });

  // Query for contact analytics
  const { 
    data: analyticsData, 
    isLoading: isLoadingAnalytics 
  } = useQuery({
    queryKey: ['admin-contact-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/contact/analytics');
      if (!response.ok) throw new Error('Failed to fetch contact analytics');
      const result = await response.json();
      return result.data;
    },
    enabled: !!user
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof ContactFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? Number(value) : 1 // Reset page when other filters change
    }));
  };

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(contactData?.submissions.map(sub => sub.id) || []);
    } else {
      setSelectedSubmissions([]);
    }
  };

  const handleSelectSubmission = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(prev => [...prev, id]);
    } else {
      setSelectedSubmissions(prev => prev.filter(subId => subId !== id));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'mark_resolved' | 'mark_in_progress' | 'mark_new') => {
    if (selectedSubmissions.length === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/admin/contact/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ids: selectedSubmissions
        })
      });

      if (!response.ok) throw new Error('Bulk action failed');

      await refetchSubmissions();
      setSelectedSubmissions([]);
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle individual status update
  const handleStatusUpdate = async (id: number, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/contact/submissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes })
      });

      if (!response.ok) throw new Error('Status update failed');

      await refetchSubmissions();
      setEditingContact(null);
      setStatusNotes('');
    } catch (error) {
      console.error('Status update error:', error);
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
      
      const response = await fetch(`/api/admin/contact/export?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contact-submissions-${new Date().toISOString().split('T')[0]}.csv`;
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
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (submissionsError) {
    return (
      <div className="p-6">
        <Alert className="mb-4">
          <AlertDescription>
            Failed to load contact data. Please check your permissions and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Management</h1>
          <p className="text-gray-600 mt-2">Manage contact form submissions and customer inquiries</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => refetchSubmissions()}
            disabled={isLoadingSubmissions}
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
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contactData?.analytics.total_submissions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Submissions</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {contactData?.analytics.new_submissions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {contactData?.analytics.in_progress_submissions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {contactData?.analytics.resolved_submissions || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
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
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search-filter">Search</Label>
                  <Input
                    id="search-filter"
                    placeholder="Search name, email, subject..."
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
          {selectedSubmissions.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedSubmissions.length} submission(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('mark_new')}
                      disabled={bulkActionLoading}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Mark as New
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('mark_in_progress')}
                      disabled={bulkActionLoading}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Mark In Progress
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('mark_resolved')}
                      disabled={bulkActionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Submissions</CardTitle>
              <CardDescription>
                {contactData?.pagination.total || 0} total submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubmissions ? (
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
                            checked={selectedSubmissions.length === contactData?.submissions.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactData?.submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubmissions.includes(submission.id)}
                              onCheckedChange={(checked) => 
                                handleSelectSubmission(submission.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">{submission.name}</TableCell>
                          <TableCell>{submission.email}</TableCell>
                          <TableCell className="max-w-xs truncate">{submission.subject}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(submission.status)}>
                              {getStatusIcon(submission.status)}
                              <span className="ml-1">{submission.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>{submission.language}</TableCell>
                          <TableCell>{formatDate(submission.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedContact(submission)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Contact Submission Details</DialogTitle>
                                    <DialogDescription>
                                      Submitted by {submission.name} on {formatDate(submission.created_at)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Name</Label>
                                        <p className="text-sm">{submission.name}</p>
                                      </div>
                                      <div>
                                        <Label>Email</Label>
                                        <p className="text-sm">{submission.email}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Subject</Label>
                                      <p className="text-sm">{submission.subject}</p>
                                    </div>
                                    <div>
                                      <Label>Message</Label>
                                      <p className="text-sm whitespace-pre-wrap">{submission.message}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Status</Label>
                                        <Badge className={getStatusColor(submission.status)}>
                                          {submission.status}
                                        </Badge>
                                      </div>
                                      <div>
                                        <Label>Language</Label>
                                        <p className="text-sm">{submission.language}</p>
                                      </div>
                                    </div>
                                    {submission.utm_source && (
                                      <div>
                                        <Label>UTM Source</Label>
                                        <p className="text-sm">{submission.utm_source}</p>
                                      </div>
                                    )}
                                    {submission.notes && (
                                      <div>
                                        <Label>Notes</Label>
                                        <p className="text-sm">{submission.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingContact(submission);
                                      setStatusNotes(submission.notes || '');
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update Status</DialogTitle>
                                    <DialogDescription>
                                      Update the status and add notes for this submission
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Status</Label>
                                      <Select
                                        value={editingContact?.status || submission.status}
                                        onValueChange={(value) => {
                                          if (editingContact) {
                                            setEditingContact({ ...editingContact, status: value as any });
                                          }
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="new">New</SelectItem>
                                          <SelectItem value="in_progress">In Progress</SelectItem>
                                          <SelectItem value="resolved">Resolved</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={statusNotes}
                                        onChange={(e) => setStatusNotes(e.target.value)}
                                        placeholder="Add notes about this submission..."
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setEditingContact(null);
                                          setStatusNotes('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          if (editingContact) {
                                            handleStatusUpdate(editingContact.id, editingContact.status, statusNotes);
                                          }
                                        }}
                                      >
                                        Update Status
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {contactData?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((contactData.pagination.page - 1) * contactData.pagination.limit) + 1} to{' '}
                    {Math.min(contactData.pagination.page * contactData.pagination.limit, contactData.pagination.total)} of{' '}
                    {contactData.pagination.total} submissions
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
                      disabled={filters.page >= contactData.pagination.pages}
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
            {/* Submissions Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Submissions Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyticsData?.submissionsOverTime?.slice(0, 7).map((item: any, index: number) => (
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
                            <div className="text-sm font-medium text-green-600">{item.resolved_count}</div>
                            <div className="text-xs text-gray-500">Resolved</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response Time Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Response Time Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analyticsData?.responseTimeAnalytics?.avg_response_hours 
                            ? Math.round(analyticsData.responseTimeAnalytics.avg_response_hours * 10) / 10 
                            : 0}
                        </div>
                        <div className="text-sm text-gray-500">Avg Response Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analyticsData?.responseTimeAnalytics?.resolved_count || 0}
                        </div>
                        <div className="text-sm text-gray-500">Resolved</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {analyticsData?.responseTimeAnalytics?.total_count || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Submissions</div>
                    </div>
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

export default AdminContactsDashboard;