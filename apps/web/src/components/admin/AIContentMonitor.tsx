import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  CheckCircle,
  Eye,
  Flag,
  MessageSquare,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AIFeedback {
  id: string;
  termId: string;
  termName: string;
  userId: string;
  userEmail: string;
  section?: string;
  feedbackType: 'accuracy' | 'completeness' | 'clarity' | 'relevance' | 'general';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

interface AIVerification {
  id: string;
  termId: string;
  termName: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  accuracyScore?: number;
  createdAt: string;
}

interface AIAnalyticsData {
  summary: {
    totalRequests: number;
    totalCost: number;
    averageLatency: number;
    successRate: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
  byOperation: Record<
    string,
    {
      count: number;
      totalCost: number;
      avgLatency: number;
    }
  >;
  byModel: Record<
    string,
    {
      count: number;
      totalCost: number;
      avgLatency: number;
    }
  >;
  timeline: Array<{
    date: string;
    requests: number;
    cost: number;
    errors: number;
  }>;
}

export function AIContentMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [_selectedFeedback, setSelectedFeedback] = useState<AIFeedback | null>(null);
  const [feedbackFilters, setFeedbackFilters] = useState({
    status: 'all',
    feedbackType: 'all',
    severity: 'all',
  });
  const [verificationFilters, _setVerificationFilters] = useState({
    status: 'all',
  });

  // Query for AI feedback
  const {
    data: feedbackData,
    isLoading: isLoadingFeedback,
    refetch: refetchFeedback,
  } = useQuery({
    queryKey: ['ai-feedback', feedbackFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(feedbackFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {params.append(key, value);}
      });

      const response = await fetch(`/api/ai/feedback?${params}`);
      if (!response.ok) {throw new Error('Failed to fetch AI feedback');}
      return response.json();
    },
    enabled: !!user,
  });

  // Query for AI verification status
  const {
    data: verificationData,
    isLoading: isLoadingVerification,
    refetch: refetchVerification,
  } = useQuery({
    queryKey: ['ai-verification', verificationFilters],
    queryFn: async () => {
      const response = await fetch('/api/ai/verification');
      if (!response.ok) {throw new Error('Failed to fetch verification data');}
      return response.json();
    },
    enabled: !!user,
  });

  // Query for AI analytics
  const { data: analyticsData } = useQuery<AIAnalyticsData>({
    queryKey: ['ai-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/ai/analytics?timeframe=7d');
      if (!response.ok) {throw new Error('Failed to fetch AI analytics');}
      return response.json();
    },
    enabled: !!user,
  });

  // Mutation for updating feedback status
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
    }: {
      id: string;
      status: string;
      adminNotes?: string;
    }) => {
      const response = await fetch(`/api/ai/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) {throw new Error('Failed to update feedback');}
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-feedback'] });
      setSelectedFeedback(null);
      toast({ title: 'Success', description: 'Feedback status updated' });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error?.message : 'Failed to update feedback',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating verification status
  const updateVerificationMutation = useMutation({
    mutationFn: async ({
      id,
      isVerified,
      qualityScore,
      verificationNotes,
    }: {
      id: string;
      isVerified: boolean;
      qualityScore?: number;
      verificationNotes?: string;
    }) => {
      const response = await fetch(`/api/ai/verification/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified, qualityScore, verificationNotes }),
      });
      if (!response.ok) {throw new Error('Failed to update verification');}
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-verification'] });
      toast({ title: 'Success', description: 'Verification status updated' });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'accuracy':
        return <Target className="w-4 h-4" />;
      case 'completeness':
        return <CheckCircle className="w-4 h-4" />;
      case 'clarity':
        return <Eye className="w-4 h-4" />;
      case 'relevance':
        return <Star className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Content Monitor</h2>
          <p className="text-muted-foreground">
            Monitor AI-generated content quality, user feedback, and system performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchFeedback();
              refetchVerification();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="verification">Content Verification</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total AI Requests</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.totalRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData?.summary?.successRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">AI operations successful</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {feedbackData?.data?.filter((f: AIFeedback) => f.status === 'pending').length ||
                    0}
                </div>
                <p className="text-xs text-muted-foreground">Requires review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unverified Content</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {verificationData?.data?.stats?.unverified || 0}
                </div>
                <p className="text-xs text-muted-foreground">Needs expert review</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-sm">
                      {analyticsData?.summary?.averageLatency || 0}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Cost (7 days)</span>
                    <span className="text-sm">
                      ${(analyticsData?.summary?.totalCost || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Input Tokens</span>
                    <span className="text-sm">
                      {(analyticsData?.summary?.totalInputTokens || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Output Tokens</span>
                    <span className="text-sm">
                      {(analyticsData?.summary?.totalOutputTokens || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Content Quality Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Verified Content</span>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={
                          verificationData?.data?.stats
                            ? (verificationData.data.stats.verified /
                                verificationData.data.stats.total) *
                              100
                            : 0
                        }
                        className="w-16"
                      />
                      <span className="text-sm">
                        {verificationData?.data?.stats?.verified || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Unverified</span>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={
                          verificationData?.data?.stats
                            ? (verificationData.data.stats.unverified /
                                verificationData.data.stats.total) *
                              100
                            : 0
                        }
                        className="w-16"
                      />
                      <span className="text-sm">
                        {verificationData?.data?.stats?.unverified || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Flagged</span>
                    <div className="flex items-center space-x-2">
                      <Progress
                        value={
                          verificationData?.data?.stats
                            ? (verificationData.data.stats.flagged /
                                verificationData.data.stats.total) *
                              100
                            : 0
                        }
                        className="w-16"
                      />
                      <span className="text-sm">{verificationData?.data?.stats?.flagged || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {/* Feedback Filters */}
          <Card>
            <CardHeader>
              <CardTitle>User Feedback Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={feedbackFilters.status}
                    onValueChange={value =>
                      setFeedbackFilters(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select
                    value={feedbackFilters.feedbackType}
                    onValueChange={value =>
                      setFeedbackFilters(prev => ({ ...prev, feedbackType: value }))
                    }
                  >
                    <SelectTrigger id="type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="accuracy">Accuracy</SelectItem>
                      <SelectItem value="completeness">Completeness</SelectItem>
                      <SelectItem value="clarity">Clarity</SelectItem>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="severity-filter">Severity</Label>
                  <Select
                    value={feedbackFilters.severity}
                    onValueChange={value =>
                      setFeedbackFilters(prev => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger id="severity-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Feedback Table */}
              {isLoadingFeedback ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackData?.data?.map((feedback: AIFeedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>
                            <div className="font-medium">{feedback.termName}</div>
                            {feedback.section && (
                              <div className="text-sm text-gray-500">
                                Section: {feedback.section}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getFeedbackIcon(feedback.feedbackType)}
                              <span className="ml-2 capitalize">{feedback.feedbackType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(feedback.severity)}>
                              {feedback.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(feedback.status)}>
                              {feedback.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{feedback.userEmail}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(feedback.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedFeedback(feedback)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Feedback Details</DialogTitle>
                                  <DialogDescription>
                                    Review and manage user feedback for AI-generated content
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label className="font-medium">Term</Label>
                                    <p className="text-sm">{feedback.termName}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Feedback</Label>
                                    <p className="text-sm">{feedback.description}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="font-medium">Type</Label>
                                      <p className="text-sm capitalize">{feedback.feedbackType}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Severity</Label>
                                      <Badge className={getSeverityColor(feedback.severity)}>
                                        {feedback.severity}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="status-update">Update Status</Label>
                                    <Select
                                      defaultValue={feedback.status}
                                      onValueChange={value =>
                                        updateFeedbackMutation.mutate({
                                          id: feedback.id,
                                          status: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger id="status-update">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="reviewed">Reviewed</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="dismissed">Dismissed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Verification Queue</CardTitle>
              <CardDescription>
                Review and verify AI-generated content for accuracy and quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingVerification ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {verificationData?.data?.recentUnverified?.map((item: AIVerification) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{item.termName}</h3>
                        <Badge className={getStatusColor(item.verificationStatus)}>
                          {item.verificationStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Created: {formatDate(item.createdAt)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateVerificationMutation.mutate({
                                id: item.id,
                                isVerified: true,
                                qualityScore: 85,
                              })
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateVerificationMutation.mutate({
                                id: item.id,
                                isVerified: false,
                              })
                            }
                          >
                            <Flag className="w-3 h-3 mr-1" />
                            Flag
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operations Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.byOperation &&
                    Object.entries(analyticsData.byOperation).map(
                      ([operation, data]: [string, any]) => (
                        <div key={operation} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {operation.replace('_', ' ')}
                          </span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{data.count} requests</div>
                            <div className="text-xs text-gray-500">
                              ${data.totalCost.toFixed(3)} • {data.avgLatency}ms
                            </div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.byModel &&
                    Object.entries(analyticsData.byModel).map(
                      ([model, data]: [string, any]) => (
                        <div key={model} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{model}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{data.count} requests</div>
                            <div className="text-xs text-gray-500">
                              ${data.totalCost.toFixed(3)} • {data.avgLatency}ms
                            </div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Timeline (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData?.timeline?.map((day: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">{day.date}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{day.requests}</div>
                        <div className="text-xs text-gray-500">Requests</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${day.cost.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Cost</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-red-600">{day.errors}</div>
                        <div className="text-xs text-gray-500">Errors</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
