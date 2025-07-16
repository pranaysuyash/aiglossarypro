import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  DollarSign,
  Gauge,
  Grid,
  List,
  Pause,
  Play,
  RefreshCw,
  Settings,
  StopCircle,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Interfaces for Column Batch Operations
interface ColumnDefinition {
  id: string;
  name: string;
  displayName: string;
  priority: number;
  category: 'essential' | 'important' | 'supplementary' | 'advanced';
  estimatedTokens: number;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  recommendedModel: string;
  dependencies: string[];
  estimatedTimeMinutes: number;
  qualityThreshold: number;
  batchSize: number;
  retryLimit: number;
}

interface BatchOperationStatus {
  operationId: string;
  columnId: string;
  columnName: string;
  status: 'queued' | 'preparing' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  totalTerms: number;
  processedTerms: number;
  successfulTerms: number;
  failedTerms: number;
  skippedTerms: number;

  // Progress tracking
  currentBatch: number;
  totalBatches: number;
  currentPhase: 'generation' | 'evaluation' | 'improvement' | 'finalization';

  // Quality metrics
  averageQualityScore: number;
  qualityDistribution: {
    excellent: number; // 9-10
    good: number; // 7-8
    needsWork: number; // 5-6
    poor: number; // 1-4
  };

  // Cost tracking
  estimatedCost: number;
  actualCost: number;
  costPerTerm: number;
  budgetUsed: number;
  budgetRemaining: number;

  // Timing
  startTime: Date;
  lastUpdateTime: Date;
  estimatedCompletionTime: Date;
  averageTimePerTerm: number;

  // Error handling
  errorCount: number;
  errorRate: number;
  retryCount: number;
  maxRetries: number;

  // Safety controls
  canPause: boolean;
  canCancel: boolean;
  canRetry: boolean;
  emergencyStop: boolean;

  errors: Array<{
    termId: string;
    termName: string;
    error: string;
    timestamp: Date;
    retryCount: number;
    resolved: boolean;
  }>;
}

interface BatchOperationConfig {
  columnId: string;
  priority: number;
  batchSize: number;
  delayBetweenBatches: number;
  maxRetries: number;
  qualityThreshold: number;
  budgetLimit: number;
  model: string;
  enableQualityPipeline: boolean;
  skipExisting: boolean;
  scheduledStart?: Date;
  dependencies: string[];
  safetyChecks: {
    maxErrorRate: number;
    maxCostPerTerm: number;
    requireApproval: boolean;
    notifyOnCompletion: boolean;
  };
}

interface SystemMetrics {
  activeOperations: number;
  queuedOperations: number;
  totalProcessingCapacity: number;
  currentLoad: number;
  averageProcessingSpeed: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  resourceUsage: {
    cpu: number;
    memory: number;
    apiQuota: number;
    storage: number;
  };
  costMetrics: {
    hourlySpend: number;
    dailySpend: number;
    monthlySpend: number;
    projectedMonthlySpend: number;
  };
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // Essential Columns (Priority 1-5)
  {
    id: 'term',
    name: 'Term Name',
    displayName: 'Term Name',
    priority: 1,
    category: 'essential',
    estimatedTokens: 50,
    complexity: 'simple',
    description: 'Core term name and variations',
    recommendedModel: 'gpt-4.1-nano',
    dependencies: [],
    estimatedTimeMinutes: 5,
    qualityThreshold: 8,
    batchSize: 50,
    retryLimit: 3,
  },
  {
    id: 'definition_overview',
    name: 'Definition & Overview',
    displayName: 'Definition',
    priority: 2,
    category: 'essential',
    estimatedTokens: 200,
    complexity: 'simple',
    description: 'Clear, comprehensive definition',
    recommendedModel: 'gpt-4.1-mini',
    dependencies: ['term'],
    estimatedTimeMinutes: 15,
    qualityThreshold: 8,
    batchSize: 20,
    retryLimit: 3,
  },
  {
    id: 'key_concepts',
    name: 'Key Concepts',
    displayName: 'Key Concepts',
    priority: 3,
    category: 'essential',
    estimatedTokens: 300,
    complexity: 'moderate',
    description: 'Essential understanding points',
    recommendedModel: 'gpt-4.1-mini',
    dependencies: ['definition_overview'],
    estimatedTimeMinutes: 20,
    qualityThreshold: 7,
    batchSize: 15,
    retryLimit: 3,
  },
  {
    id: 'basic_examples',
    name: 'Basic Examples',
    displayName: 'Examples',
    priority: 4,
    category: 'essential',
    estimatedTokens: 250,
    complexity: 'simple',
    description: 'Concrete examples for clarity',
    recommendedModel: 'gpt-4.1-mini',
    dependencies: ['key_concepts'],
    estimatedTimeMinutes: 18,
    qualityThreshold: 7,
    batchSize: 20,
    retryLimit: 3,
  },
  {
    id: 'advantages',
    name: 'Advantages',
    displayName: 'Advantages',
    priority: 5,
    category: 'essential',
    estimatedTokens: 200,
    complexity: 'simple',
    description: 'Benefits and use cases',
    recommendedModel: 'gpt-4.1-mini',
    dependencies: ['basic_examples'],
    estimatedTimeMinutes: 12,
    qualityThreshold: 7,
    batchSize: 25,
    retryLimit: 3,
  },

  // Important Columns (Priority 6-15)
  {
    id: 'how_it_works',
    name: 'How It Works',
    displayName: 'How It Works',
    priority: 6,
    category: 'important',
    estimatedTokens: 400,
    complexity: 'moderate',
    description: 'Detailed explanation of mechanisms',
    recommendedModel: 'gpt-4.1-mini',
    dependencies: ['key_concepts'],
    estimatedTimeMinutes: 25,
    qualityThreshold: 7,
    batchSize: 12,
    retryLimit: 3,
  },
  {
    id: 'applications',
    name: 'Applications',
    displayName: 'Applications',
    priority: 7,
    category: 'important',
    estimatedTokens: 350,
    complexity: 'moderate',
    description: 'Real-world applications and use cases',
    recommendedModel: 'gpt-4.1-mini',
    dependencies: ['advantages'],
    estimatedTimeMinutes: 22,
    qualityThreshold: 7,
    batchSize: 15,
    retryLimit: 3,
  },
  {
    id: 'implementation',
    name: 'Implementation',
    displayName: 'Implementation',
    priority: 8,
    category: 'important',
    estimatedTokens: 450,
    complexity: 'moderate',
    description: 'Implementation guidelines and best practices',
    recommendedModel: 'gpt-4.1-mini',
    dependencies: ['how_it_works'],
    estimatedTimeMinutes: 30,
    qualityThreshold: 7,
    batchSize: 10,
    retryLimit: 3,
  },

  // Advanced Columns (Priority 16+)
  {
    id: 'mathematical_foundations',
    name: 'Mathematical Foundations',
    displayName: 'Math Foundations',
    priority: 16,
    category: 'advanced',
    estimatedTokens: 600,
    complexity: 'complex',
    description: 'Mathematical and theoretical foundations',
    recommendedModel: 'o4-mini',
    dependencies: ['how_it_works'],
    estimatedTimeMinutes: 45,
    qualityThreshold: 8,
    batchSize: 5,
    retryLimit: 5,
  },
  {
    id: 'research_papers',
    name: 'Research Papers',
    displayName: 'Research',
    priority: 17,
    category: 'advanced',
    estimatedTokens: 500,
    complexity: 'complex',
    description: 'Key research papers and citations',
    recommendedModel: 'o4-mini',
    dependencies: ['mathematical_foundations'],
    estimatedTimeMinutes: 40,
    qualityThreshold: 8,
    batchSize: 8,
    retryLimit: 5,
  },
];

export function ColumnBatchOperationsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [_selectedColumns, _setSelectedColumns] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [_filterStatus, _setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Configuration state
  const [batchConfig, setBatchConfig] = useState<Partial<BatchOperationConfig>>({
    batchSize: 15,
    delayBetweenBatches: 2000,
    maxRetries: 3,
    qualityThreshold: 7,
    budgetLimit: 100,
    model: 'gpt-4.1-mini',
    enableQualityPipeline: true,
    skipExisting: true,
    safetyChecks: {
      maxErrorRate: 10,
      maxCostPerTerm: 0.1,
      requireApproval: false,
      notifyOnCompletion: true,
    },
  });

  // Query for active batch operations
  const { data: batchOperations, isLoading: isLoadingOperations } = useQuery({
    queryKey: ['batch-operations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/batch-operations');
      if (!response.ok) {throw new Error('Failed to fetch batch operations');}
      return response.json();
    },
    refetchInterval: autoRefresh ? 3000 : false,
  });

  // Query for system metrics
  const { data: systemMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-metrics');
      if (!response.ok) {throw new Error('Failed to fetch system metrics');}
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Mutation for starting batch operation
  const startBatchOperationMutation = useMutation({
    mutationFn: async (config: BatchOperationConfig) => {
      const response = await fetch('/api/admin/batch-operations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) {throw new Error('Failed to start batch operation');}
      return response.json();
    },
    onSuccess: data => {
      toast({
        title: 'Batch Operation Started',
        description: `Started processing column: ${data.columnName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['batch-operations'] });
    },
  });

  // Mutation for controlling operations
  const controlOperationMutation = useMutation({
    mutationFn: async ({
      operationId,
      action,
    }: {
      operationId: string;
      action: 'pause' | 'resume' | 'cancel' | 'emergency-stop';
    }) => {
      const response = await fetch(`/api/admin/batch-operations/${operationId}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) {throw new Error(`Failed to ${action} operation`);}
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({
        title: 'Operation Updated',
        description: `Successfully ${variables.action}d the operation`,
      });
      queryClient.invalidateQueries({ queryKey: ['batch-operations'] });
    },
  });

  // Filtered and sorted columns
  const filteredColumns = COLUMN_DEFINITIONS.filter(column => {
    const matchesCategory = filterCategory === 'all' || column.category === filterCategory;
    const matchesSearch =
      searchQuery === '' ||
      column.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      column.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.priority - b.priority);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'queued':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential':
        return 'bg-red-100 text-red-800';
      case 'important':
        return 'bg-orange-100 text-orange-800';
      case 'supplementary':
        return 'bg-blue-100 text-blue-800';
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleStartBatchOperation = (columnId: string) => {
    const column = COLUMN_DEFINITIONS.find(c => c.id === columnId);
    if (!column) {return;}

    startBatchOperationMutation.mutate({
      columnId: column.id,
      priority: column.priority,
      batchSize: batchConfig.batchSize || column.batchSize,
      delayBetweenBatches: batchConfig.delayBetweenBatches || 2000,
      maxRetries: batchConfig.maxRetries || column.retryLimit,
      qualityThreshold: batchConfig.qualityThreshold || column.qualityThreshold,
      budgetLimit: batchConfig.budgetLimit || 100,
      model: batchConfig.model || column.recommendedModel,
      enableQualityPipeline: batchConfig.enableQualityPipeline ?? true,
      skipExisting: batchConfig.skipExisting ?? true,
      dependencies: column.dependencies,
      safetyChecks: batchConfig.safetyChecks || {
        maxErrorRate: 10,
        maxCostPerTerm: 0.1,
        requireApproval: false,
        notifyOnCompletion: true,
      },
    });
  };

  const operations = batchOperations?.data as BatchOperationStatus[] | null;
  const metrics = systemMetrics?.data as SystemMetrics | null;

  return (
    <div className="space-y-6">
      {/* Enhanced Header with System Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Column Batch Operations</h2>
          <p className="text-muted-foreground">
            Sophisticated batch processing with real-time monitoring and safety controls
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* System Health Indicator */}
          {metrics && (
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  metrics.systemHealth === 'excellent'
                    ? 'bg-green-500'
                    : metrics.systemHealth === 'good'
                      ? 'bg-blue-500'
                      : metrics.systemHealth === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium">System {metrics.systemHealth}</span>
            </div>
          )}

          {/* Emergency Mode Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="emergency-mode"
              checked={emergencyMode}
              onCheckedChange={setEmergencyMode}
            />
            <Label htmlFor="emergency-mode" className="text-sm">
              Emergency Mode
            </Label>
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center space-x-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto Refresh
            </Label>
          </div>

          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* System Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Operations</p>
                  <p className="text-2xl font-bold">{metrics.activeOperations}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Load</p>
                  <p className="text-2xl font-bold">{metrics.currentLoad.toFixed(1)}%</p>
                </div>
                <Gauge className="w-8 h-8 text-yellow-500" />
              </div>
              <Progress value={metrics.currentLoad} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hourly Spend</p>
                  <p className="text-2xl font-bold">
                    {formatCost(metrics.costMetrics.hourlySpend)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing Speed</p>
                  <p className="text-2xl font-bold">{metrics.averageProcessingSpeed}</p>
                  <p className="text-xs text-muted-foreground">terms/min</p>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Emergency Alert */}
      {emergencyMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Emergency Mode Active</AlertTitle>
          <AlertDescription>
            All non-critical operations are paused. Only emergency controls are available.
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => setEmergencyMode(false)}
            >
              Disable Emergency Mode
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="operations">Active Operations</TabsTrigger>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
          <TabsTrigger value="columns">Column Selection</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="safety">Safety Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          {/* Active Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Active Batch Operations
                </div>
                <Badge variant="outline">
                  {operations?.filter(op => op.status === 'running').length || 0} running
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {operations && operations.length > 0 ? (
                <div className="space-y-4">
                  {operations.map(operation => (
                    <Card key={operation.operationId} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(operation.status)}>
                              {operation.status}
                            </Badge>
                            <h3 className="font-medium">{operation.columnName}</h3>
                            <Badge variant="outline">Priority {operation.priority}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {operation.canPause && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  controlOperationMutation.mutate({
                                    operationId: operation.operationId,
                                    action: operation.status === 'running' ? 'pause' : 'resume',
                                  })
                                }
                                disabled={controlOperationMutation.isPending}
                              >
                                {operation.status === 'running' ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-1" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-1" />
                                    Resume
                                  </>
                                )}
                              </Button>
                            )}
                            {operation.canCancel && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  controlOperationMutation.mutate({
                                    operationId: operation.operationId,
                                    action: 'cancel',
                                  })
                                }
                                disabled={controlOperationMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            {emergencyMode && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  controlOperationMutation.mutate({
                                    operationId: operation.operationId,
                                    action: 'emergency-stop',
                                  })
                                }
                                disabled={controlOperationMutation.isPending}
                              >
                                <StopCircle className="w-4 h-4 mr-1" />
                                Emergency Stop
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Progress Information */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                Progress: {operation.processedTerms}/{operation.totalTerms}
                              </span>
                              <span>Phase: {operation.currentPhase}</span>
                            </div>
                            <Progress
                              value={(operation.processedTerms / operation.totalTerms) * 100}
                              className="h-2"
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                            <div>
                              <Label>Successful</Label>
                              <p className="font-mono text-green-600">
                                {operation.successfulTerms}
                              </p>
                            </div>
                            <div>
                              <Label>Failed</Label>
                              <p className="font-mono text-red-600">{operation.failedTerms}</p>
                            </div>
                            <div>
                              <Label>Quality Score</Label>
                              <p className="font-mono">
                                {operation.averageQualityScore.toFixed(1)}/10
                              </p>
                            </div>
                            <div>
                              <Label>Cost</Label>
                              <p className="font-mono">{formatCost(operation.actualCost)}</p>
                            </div>
                            <div>
                              <Label>ETA</Label>
                              <p className="font-mono">
                                {formatDuration(
                                  (new Date(operation.estimatedCompletionTime).getTime() -
                                    Date.now()) /
                                    60000
                                )}
                              </p>
                            </div>
                            <div>
                              <Label>Error Rate</Label>
                              <p
                                className={`font-mono ${
                                  operation.errorRate > 10 ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {operation.errorRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* Quality Distribution */}
                          <div className="flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-green-500 rounded"></div>
                              <span>Excellent: {operation.qualityDistribution.excellent}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-blue-500 rounded"></div>
                              <span>Good: {operation.qualityDistribution.good}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                              <span>Needs Work: {operation.qualityDistribution.needsWork}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-red-500 rounded"></div>
                              <span>Poor: {operation.qualityDistribution.poor}</span>
                            </div>
                          </div>

                          {/* Error Details */}
                          {operation.errors.length > 0 && (
                            <div className="mt-4">
                              <Label>Recent Errors ({operation.errors.length})</Label>
                              <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                                {operation.errors.slice(0, 3).map((error, index) => (
                                  <div
                                    key={index}
                                    className="text-xs text-red-600 bg-red-50 p-2 rounded"
                                  >
                                    <span className="font-medium">{error.termName}:</span>{' '}
                                    {error.error}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active batch operations</p>
                  <p className="text-sm">Start processing columns to see operations here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Queue Management</CardTitle>
              <CardDescription>Manage operation queue and priorities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Queue management interface will be implemented in Phase 2.2
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns" className="space-y-4">
          {/* Column Selection and Configuration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search columns..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="essential">Essential</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="supplementary">Supplementary</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Advanced Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Batch Configuration</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {showAdvancedConfig ? 'Hide' : 'Show'} Advanced
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={batchConfig.batchSize}
                    onChange={e =>
                      setBatchConfig(prev => ({
                        ...prev,
                        batchSize: parseInt(e.target.value),
                      }))
                    }
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Quality Threshold</Label>
                  <Input
                    type="number"
                    value={batchConfig.qualityThreshold}
                    onChange={e =>
                      setBatchConfig(prev => ({
                        ...prev,
                        qualityThreshold: parseFloat(e.target.value),
                      }))
                    }
                    min="1"
                    max="10"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Budget Limit ($)</Label>
                  <Input
                    type="number"
                    value={batchConfig.budgetLimit}
                    onChange={e =>
                      setBatchConfig(prev => ({
                        ...prev,
                        budgetLimit: parseFloat(e.target.value),
                      }))
                    }
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>

              {showAdvancedConfig && (
                <div className="mt-4 space-y-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Delay Between Batches (ms)</Label>
                      <Input
                        type="number"
                        value={batchConfig.delayBetweenBatches}
                        onChange={e =>
                          setBatchConfig(prev => ({
                            ...prev,
                            delayBetweenBatches: parseInt(e.target.value),
                          }))
                        }
                        min="100"
                        max="10000"
                      />
                    </div>
                    <div>
                      <Label>Max Retries</Label>
                      <Input
                        type="number"
                        value={batchConfig.maxRetries}
                        onChange={e =>
                          setBatchConfig(prev => ({
                            ...prev,
                            maxRetries: parseInt(e.target.value),
                          }))
                        }
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="quality-pipeline"
                        checked={batchConfig.enableQualityPipeline}
                        onCheckedChange={checked =>
                          setBatchConfig(prev => ({
                            ...prev,
                            enableQualityPipeline: checked,
                          }))
                        }
                      />
                      <Label htmlFor="quality-pipeline">Enable Quality Pipeline</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="skip-existing"
                        checked={batchConfig.skipExisting}
                        onCheckedChange={checked =>
                          setBatchConfig(prev => ({
                            ...prev,
                            skipExisting: checked,
                          }))
                        }
                      />
                      <Label htmlFor="skip-existing">Skip Existing Content</Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Columns Grid */}
          <div
            className={`grid gap-4 ${
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {filteredColumns.map(column => (
              <Card key={column.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{column.displayName}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">#{column.priority}</Badge>
                      <Badge className={getCategoryColor(column.category)}>{column.category}</Badge>
                    </div>
                  </div>
                  <CardDescription>{column.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Label>Complexity</Label>
                        <p className="font-medium">{column.complexity}</p>
                      </div>
                      <div>
                        <Label>Est. Time</Label>
                        <p className="font-medium">{formatDuration(column.estimatedTimeMinutes)}</p>
                      </div>
                      <div>
                        <Label>Model</Label>
                        <p className="font-mono text-xs">{column.recommendedModel}</p>
                      </div>
                      <div>
                        <Label>Tokens</Label>
                        <p className="font-mono text-xs">{column.estimatedTokens}</p>
                      </div>
                    </div>

                    {column.dependencies.length > 0 && (
                      <div>
                        <Label>Dependencies</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {column.dependencies.map(dep => (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {COLUMN_DEFINITIONS.find(c => c.id === dep)?.displayName || dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleStartBatchOperation(column.id)}
                      disabled={startBatchOperationMutation.isPending || emergencyMode}
                      className="w-full"
                    >
                      {startBatchOperationMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Batch Processing
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>Advanced monitoring and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced monitoring dashboard will be implemented in Phase 2.3
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety">
          <Card>
            <CardHeader>
              <CardTitle>Safety Controls & Emergency Procedures</CardTitle>
              <CardDescription>Safety mechanisms and emergency overrides</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Safety controls interface will be implemented in Phase 2.4
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ColumnBatchOperationsDashboard;
