import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Plus, 
  Edit, 
  Eye, 
  Wand2, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Search, 
  Filter, 
  RefreshCw,
  Upload,
  Download,
  Sparkles,
  Target,
  TrendingUp,
  Globe,
  Users,
  Clock,
  Star,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Term {
  id: string;
  name: string;
  shortDefinition: string;
  definition: string;
  category: string;
  subcategory?: string;
  characteristics?: string[];
  applications?: Array<{name: string; description: string}>;
  mathFormulation?: string;
  relatedTerms?: string[];
  aiGenerated: boolean;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface AIDefinitionResponse {
  shortDefinition: string;
  definition: string;
  characteristics?: string[];
  applications?: Array<{name: string; description: string}>;
  relatedTerms?: string[];
  mathFormulation?: string;
}

interface TermSuggestion {
  term: string;
  shortDefinition: string;
  category: string;
  reason: string;
}

interface TermFilters {
  search: string;
  category: string;
  verificationStatus: string;
  aiGenerated: string;
  qualityRange: [number, number];
  page: number;
  limit: number;
  sort: string;
  order: string;
}

export function AdminTermsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ name: '', category: '', context: '' });
  const [aiSuggestions, setAISuggestions] = useState<TermSuggestion[]>([]);
  const [aiGeneratedContent, setAIGeneratedContent] = useState<AIDefinitionResponse | null>(null);
  const [filters, setFilters] = useState<TermFilters>({
    search: '',
    category: '',
    verificationStatus: 'all',
    aiGenerated: 'all',
    qualityRange: [0, 100],
    page: 1,
    limit: 50,
    sort: 'updatedAt',
    order: 'desc'
  });

  // Query for terms with filters
  const { 
    data: termsData, 
    isLoading: isLoadingTerms, 
    error: termsError,
    refetch: refetchTerms
  } = useQuery({
    queryKey: ['admin-terms', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          if (key === 'qualityRange') {
            params.append('minQuality', value[0].toString());
            params.append('maxQuality', value[1].toString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      const response = await fetch(`/api/terms?${params}&admin=true`);
      if (!response.ok) throw new Error('Failed to fetch terms');
      return response.json();
    },
    enabled: !!user
  });

  // Query for categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Query for AI analytics
  const { data: aiAnalytics } = useQuery({
    queryKey: ['ai-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/ai/analytics?timeframe=7d');
      if (!response.ok) throw new Error('Failed to fetch AI analytics');
      return response.json();
    },
    enabled: !!user
  });

  // Mutation for creating terms with AI
  const createTermMutation = useMutation({
    mutationFn: async (termData: any) => {
      const response = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData)
      });
      if (!response.ok) throw new Error('Failed to create term');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-terms'] });
      setIsCreateDialogOpen(false);
      setNewTerm({ name: '', category: '', context: '' });
      setAIGeneratedContent(null);
      toast({ title: 'Success', description: 'Term created successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create term',
        variant: 'destructive' 
      });
    }
  });

  // Mutation for AI definition generation
  const generateDefinitionMutation = useMutation({
    mutationFn: async ({ term, category, context }: { term: string; category?: string; context?: string }) => {
      const response = await fetch('/api/ai/generate-definition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, category, context })
      });
      if (!response.ok) throw new Error('Failed to generate definition');
      return response.json();
    },
    onSuccess: (data) => {
      setAIGeneratedContent(data.data);
      toast({ 
        title: 'AI Definition Generated', 
        description: 'Review the generated content before saving' 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to generate definition',
        variant: 'destructive' 
      });
    }
  });

  // Mutation for getting AI suggestions
  const getSuggestionsMutation = useMutation({
    mutationFn: async (category?: string) => {
      const response = await fetch(`/api/ai/term-suggestions${category ? `?category=${category}` : ''}`);
      if (!response.ok) throw new Error('Failed to get suggestions');
      return response.json();
    },
    onSuccess: (data) => {
      setAISuggestions(data.data.suggestions);
      setIsAIAssistantOpen(true);
    }
  });

  // Mutation for improving definitions
  const improveDefinitionMutation = useMutation({
    mutationFn: async (termId: string) => {
      const response = await fetch(`/api/ai/improve-definition/${termId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to improve definition');
      return response.json();
    },
    onSuccess: (data) => {
      setAIGeneratedContent(data.data);
      setSelectedTerm(data.originalTerm);
      toast({ 
        title: 'AI Improvements Generated', 
        description: 'Review the suggested improvements' 
      });
    }
  });

  // Mutation for bulk verification
  const bulkVerifyMutation = useMutation({
    mutationFn: async ({ termIds, verified }: { termIds: string[]; verified: boolean }) => {
      const response = await fetch('/api/admin/terms/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termIds, verified })
      });
      if (!response.ok) throw new Error('Failed to update verification status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-terms'] });
      setSelectedTerms([]);
      toast({ title: 'Success', description: 'Terms updated successfully' });
    }
  });

  const handleFilterChange = (key: keyof TermFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTerms(termsData?.data?.map((term: Term) => term.id) || []);
    } else {
      setSelectedTerms([]);
    }
  };

  const handleSelectTerm = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTerms(prev => [...prev, id]);
    } else {
      setSelectedTerms(prev => prev.filter(termId => termId !== id));
    }
  };

  const handleGenerateDefinition = () => {
    if (!newTerm.name.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a term name',
        variant: 'destructive' 
      });
      return;
    }
    
    generateDefinitionMutation.mutate({
      term: newTerm.name,
      category: newTerm.category,
      context: newTerm.context
    });
  };

  const handleCreateTerm = () => {
    if (!aiGeneratedContent || !newTerm.name.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Please generate AI content first',
        variant: 'destructive' 
      });
      return;
    }

    createTermMutation.mutate({
      name: newTerm.name,
      category: newTerm.category,
      shortDefinition: aiGeneratedContent.shortDefinition,
      definition: aiGeneratedContent.definition,
      characteristics: aiGeneratedContent.characteristics,
      applications: aiGeneratedContent.applications,
      mathFormulation: aiGeneratedContent.mathFormulation,
      relatedTerms: aiGeneratedContent.relatedTerms,
      aiGenerated: true,
      verificationStatus: 'unverified'
    });
  };

  const handleCreateFromSuggestion = (suggestion: TermSuggestion) => {
    setNewTerm({
      name: suggestion.term,
      category: suggestion.category,
      context: suggestion.reason
    });
    setIsAIAssistantOpen(false);
    setIsCreateDialogOpen(true);
    
    // Auto-generate definition for the suggestion
    generateDefinitionMutation.mutate({
      term: suggestion.term,
      category: suggestion.category,
      context: suggestion.reason
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'unverified': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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

  if (termsError) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load terms data. Please check your permissions and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Powered Terms Management</h1>
          <p className="text-gray-600 mt-2">Manage glossary terms with AI assistance for creation, improvement, and quality control</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => getSuggestionsMutation.mutate(undefined)}
            disabled={getSuggestionsMutation.isPending}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            AI Suggestions
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Term
          </Button>
          <Button
            variant="outline"
            onClick={() => refetchTerms()}
            disabled={isLoadingTerms}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terms">Terms Management</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {termsData?.pagination?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {termsData?.data?.filter((term: Term) => term.aiGenerated).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((termsData?.data?.filter((term: Term) => term.aiGenerated).length || 0) / (termsData?.pagination?.total || 1)) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {termsData?.data?.filter((term: Term) => term.verificationStatus === 'verified').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Expert reviewed and approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {termsData?.data?.filter((term: Term) => term.verificationStatus === 'unverified').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending verification
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Usage Analytics */}
          {aiAnalytics?.success && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Usage Analytics (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {aiAnalytics.data.summary.totalRequests}
                    </div>
                    <div className="text-sm text-gray-500">Total AI Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${aiAnalytics.data.summary.totalCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {aiAnalytics.data.summary.averageLatency}ms
                    </div>
                    <div className="text-sm text-gray-500">Avg Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search-filter">Search</Label>
                  <Input
                    id="search-filter"
                    placeholder="Search terms..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="category-filter">Category</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => handleFilterChange('category', value)}
                  >
                    <SelectTrigger id="category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories?.map((cat: Category) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="verification-filter">Verification</Label>
                  <Select
                    value={filters.verificationStatus}
                    onValueChange={(value) => handleFilterChange('verificationStatus', value)}
                  >
                    <SelectTrigger id="verification-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-filter">AI Generated</Label>
                  <Select
                    value={filters.aiGenerated}
                    onValueChange={(value) => handleFilterChange('aiGenerated', value)}
                  >
                    <SelectTrigger id="ai-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      <SelectItem value="true">AI Generated</SelectItem>
                      <SelectItem value="false">Human Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedTerms.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedTerms.length} term(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkVerifyMutation.mutate({ termIds: selectedTerms, verified: true })}
                      disabled={bulkActionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Verified
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkVerifyMutation.mutate({ termIds: selectedTerms, verified: false })}
                      disabled={bulkActionLoading}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Mark Unverified
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms Table */}
          <Card>
            <CardHeader>
              <CardTitle>Terms</CardTitle>
              <CardDescription>
                {termsData?.pagination?.total || 0} total terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTerms ? (
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
                            checked={selectedTerms.length === termsData?.data?.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>AI Generated</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termsData?.data?.map((term: Term) => (
                        <TableRow key={term.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTerms.includes(term.id)}
                              onCheckedChange={(checked) => 
                                handleSelectTerm(term.id, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{term.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {term.shortDefinition}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{term.category}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(term.verificationStatus)}>
                              {term.verificationStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {term.aiGenerated ? (
                              <Badge variant="secondary">
                                <Bot className="w-3 h-3 mr-1" />
                                AI
                              </Badge>
                            ) : (
                              <Badge variant="outline">Human</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={getQualityColor(term.qualityScore)}>
                              {term.qualityScore ? `${term.qualityScore}%` : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(term.updatedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTerm(term)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => improveDefinitionMutation.mutate(term.id)}
                                disabled={improveDefinitionMutation.isPending}
                              >
                                <Wand2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {termsData?.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((termsData.pagination.page - 1) * termsData.pagination.limit) + 1} to{' '}
                    {Math.min(termsData.pagination.page * termsData.pagination.limit, termsData.pagination.total)} of{' '}
                    {termsData.pagination.total} terms
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
                      disabled={filters.page >= termsData.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                AI Content Assistant
              </CardTitle>
              <CardDescription>
                Get AI-powered suggestions and improvements for your glossary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => getSuggestionsMutation.mutate(undefined)}
                  disabled={getSuggestionsMutation.isPending}
                  className="h-20 flex-col"
                >
                  <Lightbulb className="w-6 h-6 mb-2" />
                  <span>Get Term Suggestions</span>
                  <span className="text-xs opacity-75">AI recommends missing terms</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="h-20 flex-col"
                >
                  <Plus className="w-6 h-6 mb-2" />
                  <span>Create AI Term</span>
                  <span className="text-xs opacity-75">Generate definitions with AI</span>
                </Button>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">AI Suggestions</h3>
                  <div className="grid gap-3">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{suggestion.term}</h4>
                          <Badge variant="outline">{suggestion.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.shortDefinition}</p>
                        <p className="text-xs text-gray-500">{suggestion.reason}</p>
                        <Button
                          size="sm"
                          onClick={() => handleCreateFromSuggestion(suggestion)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Create Term
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Quality Control Dashboard
              </CardTitle>
              <CardDescription>
                Monitor and improve content quality across your glossary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {termsData?.data?.filter((term: Term) => (term.qualityScore || 0) >= 80).length || 0}
                  </div>
                  <div className="text-sm text-gray-500">High Quality (80%+)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {termsData?.data?.filter((term: Term) => (term.qualityScore || 0) >= 60 && (term.qualityScore || 0) < 80).length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Medium Quality (60-79%)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {termsData?.data?.filter((term: Term) => (term.qualityScore || 0) < 60).length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Needs Improvement (&lt;60%)</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Terms Needing Review</h3>
                <div className="space-y-2">
                  {termsData?.data
                    ?.filter((term: Term) => term.verificationStatus === 'unverified' || (term.qualityScore || 0) < 70)
                    ?.slice(0, 5)
                    ?.map((term: Term) => (
                      <div key={term.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{term.name}</div>
                          <div className="text-sm text-gray-500">
                            Quality: {term.qualityScore ? `${term.qualityScore}%` : 'Unscored'} • 
                            Status: {term.verificationStatus}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => improveDefinitionMutation.mutate(term.id)}
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          Improve
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Term Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              Create Term with AI
            </DialogTitle>
            <DialogDescription>
              Use AI to generate comprehensive definitions and content for new terms
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="term-name">Term Name</Label>
                <Input
                  id="term-name"
                  value={newTerm.name}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter term name..."
                />
              </div>
              <div>
                <Label htmlFor="term-category">Category</Label>
                <Select
                  value={newTerm.category}
                  onValueChange={(value) => setNewTerm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="term-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="term-context">Context (Optional)</Label>
              <Textarea
                id="term-context"
                value={newTerm.context}
                onChange={(e) => setNewTerm(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Provide additional context to help AI generate better content..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={handleGenerateDefinition}
                disabled={generateDefinitionMutation.isPending || !newTerm.name.trim()}
              >
                {generateDefinitionMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Generate AI Content
              </Button>
              
              {aiGeneratedContent && (
                <Button
                  onClick={handleCreateTerm}
                  disabled={createTermMutation.isPending}
                >
                  {createTermMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Term
                </Button>
              )}
            </div>

            {aiGeneratedContent && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">AI Generated Content</h3>
                  <Badge variant="secondary">
                    <Bot className="w-3 h-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Short Definition</Label>
                    <p className="text-sm">{aiGeneratedContent.shortDefinition}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Detailed Definition</Label>
                    <p className="text-sm">{aiGeneratedContent.definition}</p>
                  </div>
                  
                  {aiGeneratedContent.characteristics && (
                    <div>
                      <Label className="text-sm font-medium">Key Characteristics</Label>
                      <ul className="text-sm list-disc list-inside">
                        {aiGeneratedContent.characteristics.map((char, index) => (
                          <li key={index}>{char}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {aiGeneratedContent.applications && (
                    <div>
                      <Label className="text-sm font-medium">Applications</Label>
                      <div className="space-y-2">
                        {aiGeneratedContent.applications.map((app, index) => (
                          <div key={index}>
                            <div className="font-medium text-sm">{app.name}</div>
                            <div className="text-sm text-gray-600">{app.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiGeneratedContent.mathFormulation && (
                    <div>
                      <Label className="text-sm font-medium">Mathematical Formulation</Label>
                      <code className="text-sm bg-white p-2 rounded block">
                        {aiGeneratedContent.mathFormulation}
                      </code>
                    </div>
                  )}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This content was generated by AI and should be reviewed for accuracy before publishing.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Term Details Dialog */}
      {selectedTerm && (
        <Dialog open={!!selectedTerm} onOpenChange={() => setSelectedTerm(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedTerm.name}</span>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedTerm.verificationStatus)}>
                    {selectedTerm.verificationStatus}
                  </Badge>
                  {selectedTerm.aiGenerated && (
                    <Badge variant="secondary">
                      <Bot className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                Category: {selectedTerm.category} • Updated: {formatDate(selectedTerm.updatedAt)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Short Definition</Label>
                <p className="text-sm">{selectedTerm.shortDefinition}</p>
              </div>
              
              <div>
                <Label className="font-medium">Definition</Label>
                <p className="text-sm">{selectedTerm.definition}</p>
              </div>
              
              {selectedTerm.characteristics && (
                <div>
                  <Label className="font-medium">Characteristics</Label>
                  <ul className="text-sm list-disc list-inside">
                    {selectedTerm.characteristics.map((char, index) => (
                      <li key={index}>{char}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedTerm.qualityScore && (
                <div>
                  <Label className="font-medium">Quality Score</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={selectedTerm.qualityScore} className="flex-1" />
                    <span className={`text-sm font-medium ${getQualityColor(selectedTerm.qualityScore)}`}>
                      {selectedTerm.qualityScore}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}