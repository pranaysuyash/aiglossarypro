import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Brain,
  Cpu,
  DollarSign,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
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
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';

// Enhanced interfaces for comprehensive content generation
interface EnhancedGenerationRequest {
  termId: string;
  sectionName: string;
  templateId?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  regenerate: boolean;
  customPrompt?: string;
  qualityThreshold?: number;
  batchMode?: boolean;
  scheduledGeneration?: boolean;
  scheduledTime?: Date;
  multiModelEnsemble?: boolean;
  contextWindow?: number;
  enableQualityPipeline?: boolean;
}

interface EnhancedGenerationResponse {
  success: boolean;
  content?: string;
  qualityScore?: number;
  qualityFeedback?: string;
  improvedContent?: string;
  metadata?: {
    termId: string;
    termName: string;
    sectionName: string;
    templateUsed: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    generatedAt: Date;
    processingTime: number;
    qualityScore: number;
    pipelinePhase: string;
    improvements: number;
    finalContent: string;
  };
  error?: string;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  category: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTokens: number;
  recommendedModel: string;
  qualityThreshold: number;
  created: Date;
  lastUsed: Date;
  usage: number;
  successRate: number;
}

interface ModelConfiguration {
  id: string;
  name: string;
  provider: string;
  costPer1MTokens: {
    input: number;
    output: number;
    batch: {
      input: number;
      output: number;
    };
  };
  maxTokens: number;
  capabilities: string[];
  bestFor: string[];
  performance: {
    speed: number; // 1-10
    quality: number; // 1-10
    consistency: number; // 1-10
  };
}

interface CostEstimate {
  estimatedTokens: number;
  estimatedCost: number;
  confidence: number;
  breakdown: {
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
  };
  savingsWithBatch: number;
  recommendations: string[];
}

interface RealTimeAnalytics {
  totalGenerations: number;
  successRate: number;
  averageQualityScore: number;
  totalCost: number;
  averageProcessingTime: number;
  modelUsage: { [key: string]: number };
  hourlyStats: Array<{
    hour: string;
    generations: number;
    cost: number;
    qualityScore: number;
  }>;
  qualityDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  costTrends: Array<{
    date: string;
    cost: number;
    volume: number;
  }>;
}

const ENHANCED_MODEL_CONFIGURATIONS: ModelConfiguration[] = [
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'OpenAI',
    costPer1MTokens: {
      input: 0.1,
      output: 0.4,
      batch: { input: 0.05, output: 0.2 },
    },
    maxTokens: 16384,
    capabilities: ['text-generation', 'structured-output', 'fast-processing'],
    bestFor: ['Simple definitions', 'Basic examples', 'Term explanations', 'Short content'],
    performance: { speed: 9, quality: 7, consistency: 8 },
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    costPer1MTokens: {
      input: 0.4,
      output: 1.6,
      batch: { input: 0.2, output: 0.8 },
    },
    maxTokens: 32768,
    capabilities: ['text-generation', 'reasoning', 'analysis', 'structured-output'],
    bestFor: ['Detailed explanations', 'Technical content', 'Use cases', 'Implementation guides'],
    performance: { speed: 8, quality: 8, consistency: 9 },
  },
  {
    id: 'o4-mini',
    name: 'O4 Mini',
    provider: 'OpenAI',
    costPer1MTokens: {
      input: 1.1,
      output: 4.4,
      batch: { input: 0.55, output: 2.2 },
    },
    maxTokens: 65536,
    capabilities: ['advanced-reasoning', 'complex-analysis', 'mathematical-processing', 'research'],
    bestFor: [
      'Mathematical foundations',
      'Research analysis',
      'Complex algorithms',
      'Theoretical concepts',
    ],
    performance: { speed: 6, quality: 10, consistency: 9 },
  },
];

const CONTENT_CATEGORIES = [
  { id: 'essential', name: 'Essential', priority: 1, color: 'bg-red-100 text-red-800' },
  { id: 'important', name: 'Important', priority: 2, color: 'bg-orange-100 text-orange-800' },
  { id: 'supplementary', name: 'Supplementary', priority: 3, color: 'bg-blue-100 text-blue-800' },
  { id: 'advanced', name: 'Advanced', priority: 4, color: 'bg-purple-100 text-purple-800' },
];

export function EnhancedContentGenerationV2() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for content generation
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4.1-mini');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [qualityThreshold, setQualityThreshold] = useState<number>(7);
  const [regenerate, setRegenerate] = useState<boolean>(false);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [multiModelEnsemble, setMultiModelEnsemble] = useState<boolean>(false);
  const [enableQualityPipeline, setEnableQualityPipeline] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('generation');

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, _setFilterCategory] = useState<string>('all');
  const [_filterModel, _setFilterModel] = useState<string>('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Query for terms with search and filtering
  const { data: termsData, isLoading: isLoadingTerms } = useQuery({
    queryKey: ['terms', searchTerm, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) {params.append('search', searchTerm);}
      if (filterCategory !== 'all') {params.append('category', filterCategory);}

      const response = await fetch(`/api/terms?${params.toString()}`);
      if (!response.ok) {throw new Error('Failed to fetch terms');}
      return response.json();
    },
  });

  // Query for templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['content-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/templates');
      if (!response.ok) {throw new Error('Failed to fetch templates');}
      return response.json();
    },
  });

  // Query for real-time analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['content-generation-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/content-generation');
      if (!response.ok) {throw new Error('Failed to fetch analytics');}
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query for cost estimates
  const { data: costEstimate, isLoading: isLoadingCost } = useQuery({
    queryKey: ['cost-estimate', selectedModel, maxTokens, selectedSection],
    queryFn: async () => {
      if (!selectedSection || !selectedModel) {return null;}

      const response = await fetch('/api/admin/cost-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          section: selectedSection,
          maxTokens,
          batchMode,
        }),
      });
      if (!response.ok) {throw new Error('Failed to fetch cost estimate');}
      return response.json();
    },
    enabled: !!(selectedSection && selectedModel),
  });

  // Mutation for enhanced content generation
  const generateContentMutation = useMutation({
    mutationFn: async (request: EnhancedGenerationRequest) => {
      const response = await fetch('/api/admin/content/enhanced-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {throw new Error('Failed to generate content');}
      return response.json();
    },
    onSuccess: (data: EnhancedGenerationResponse) => {
      if (data.success) {
        setGeneratedContent(data.content || '');
        setShowPreview(true);

        toast({
          title: 'Content Generated Successfully',
          description: `Quality Score: ${data.qualityScore}/10 | Cost: $${data.metadata?.cost.toFixed(4)}`,
        });

        // Refresh analytics
        queryClient.invalidateQueries({ queryKey: ['content-generation-analytics'] });
      } else {
        toast({
          title: 'Generation Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    },
    onError: error => {
      toast({
        title: 'Generation Error',
        description: error instanceof Error ? error?.message : 'Failed to generate content',
        variant: 'destructive',
      });
    },
  });

  

  const handleGenerateContent = () => {
    if (!selectedTerm || !selectedSection) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a term and a section',
        variant: 'destructive',
      });
      return;
    }

    generateContentMutation.mutate({
      termId: selectedTerm.id,
      sectionName: selectedSection,
      templateId: selectedTemplate,
      model: selectedModel,
      temperature,
      maxTokens,
      regenerate,
      customPrompt,
      qualityThreshold,
      batchMode,
      multiModelEnsemble,
      enableQualityPipeline,
    });
  };

  const getModelColor = (modelId: string) => {
    switch (modelId) {
      case 'gpt-4.1-nano':
        return 'bg-green-100 text-green-800';
      case 'gpt-4.1-mini':
        return 'bg-blue-100 text-blue-800';
      case 'o4-mini':
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

  const analytics = analyticsData?.data as RealTimeAnalytics | null;

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Content Generation v2</h2>
          <p className="text-muted-foreground">
            AI-powered content generation with advanced quality assurance and cost optimization
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isLoadingAnalytics ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading Analytics...
            </div>
          ) : analytics && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-green-600">{analytics.totalGenerations}</div>
                <div className="text-muted-foreground">Generated</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-blue-600">
                  {analytics.successRate.toFixed(1)}%
                </div>
                <div className="text-muted-foreground">Success</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-purple-600">
                  {formatCost(analytics.totalCost)}
                </div>
                <div className="text-muted-foreground">Total Cost</div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['content-generation-analytics'] });
              queryClient.invalidateQueries({ queryKey: ['terms'] });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="generation">Generation</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="cost-tracking">Cost Tracking</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="generation" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Enhanced Generation Controls */}
            <div className="xl:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Content Generation Controls
                  </CardTitle>
                  <CardDescription>
                    Advanced AI content generation with multi-model support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Term and Section Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="term-search">Search Terms</Label>
                      <Input
                        id="term-search"
                        placeholder="Search terms..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mb-2"
                      />
                      <Select
                        value={selectedTerm?.id || ''}
                        onValueChange={value => {
                          const term = termsData?.data?.find((t: any) => t.id === value);
                          setSelectedTerm(term || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a term..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTerms ? (
                            <SelectItem value="loading" disabled>
                              Loading terms...
                            </SelectItem>
                          ) : (
                            termsData?.data?.slice(0, 100).map((term: any) => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="section-select">Section</Label>
                      <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a section..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_CATEGORIES.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className={category.color}>
                                  {category.name}
                                </Badge>
                                <span>Priority {category.priority}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Model Selection with Enhanced Info */}
                  <div>
                    <Label>AI Model Selection</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      {ENHANCED_MODEL_CONFIGURATIONS.map(model => (
                        <Card
                          key={model.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedModel === model.id
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedModel(model.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={getModelColor(model.id)}>{model.name}</Badge>
                              <Cpu className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="space-y-1 text-xs">
                              <div>Quality: {model.performance.quality}/10</div>
                              <div>Speed: {model.performance.speed}/10</div>
                              <div>Cost: {formatCost(model.costPer1MTokens.output)}/1M</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div>
                    <Label>Content Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template (optional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No template</SelectItem>
                        {isLoadingTemplates ? (
                          <SelectItem value="loading" disabled>
                            Loading templates...
                          </SelectItem>
                        ) : (
                          templatesData?.data?.map((template: ContentTemplate) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex flex-col">
                                <span>{template.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {template.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Options Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="advanced-options"
                      checked={showAdvancedOptions}
                      onCheckedChange={setShowAdvancedOptions}
                    />
                    <Label htmlFor="advanced-options">Show Advanced Options</Label>
                  </div>

                  {showAdvancedOptions && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                      {/* Generation Parameters */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Temperature: {temperature}</Label>
                          <Slider
                            value={[temperature]}
                            onValueChange={value => setTemperature(value[0])}
                            max={2}
                            min={0}
                            step={0.1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Max Tokens: {maxTokens}</Label>
                          <Slider
                            value={[maxTokens]}
                            onValueChange={value => setMaxTokens(value[0])}
                            max={4000}
                            min={100}
                            step={100}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Quality Threshold: {qualityThreshold}/10</Label>
                        <Slider
                          value={[qualityThreshold]}
                          onValueChange={value => setQualityThreshold(value[0])}
                          max={10}
                          min={1}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      {/* Feature Toggles */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="batch-mode"
                            checked={batchMode}
                            onCheckedChange={setBatchMode}
                          />
                          <Label htmlFor="batch-mode">Batch Mode (50% savings)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="quality-pipeline"
                            checked={enableQualityPipeline}
                            onCheckedChange={setEnableQualityPipeline}
                          />
                          <Label htmlFor="quality-pipeline">Quality Pipeline</Label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="multi-model"
                          checked={multiModelEnsemble}
                          onCheckedChange={setMultiModelEnsemble}
                        />
                        <Label htmlFor="multi-model">Multi-Model Ensemble</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="regenerate"
                          checked={regenerate}
                          onCheckedChange={setRegenerate}
                        />
                        <Label htmlFor="regenerate">Force Regeneration</Label>
                      </div>

                      {/* Custom Prompt */}
                      <div>
                        <Label>Custom Prompt (Optional)</Label>
                        <Textarea
                          value={customPrompt}
                          onChange={e => setCustomPrompt(e.target.value)}
                          placeholder="Override default prompt template..."
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cost Estimate */}
                  {isLoadingCost ? (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertTitle>Calculating Cost...</AlertTitle>
                      <AlertDescription>Estimating token usage and cost.</AlertDescription>
                    </Alert>
                  ) : costEstimate?.data && (
                    <Alert>
                      <DollarSign className="h-4 w-4" />
                      <AlertTitle>Cost Estimate</AlertTitle>
                      <AlertDescription>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <span className="font-medium">Estimated Cost: </span>
                            {formatCost(costEstimate.data.estimatedCost)}
                          </div>
                          <div>
                            <span className="font-medium">Tokens: </span>
                            {costEstimate.data.estimatedTokens.toLocaleString()}
                          </div>
                          {batchMode && (
                            <div className="col-span-2">
                              <span className="font-medium text-green-600">
                                Batch Savings: {formatCost(costEstimate.data.savingsWithBatch)}
                              </span>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateContent}
                    disabled={
                      !selectedTerm || !selectedSection || generateContentMutation.isPending
                    }
                    className="w-full"
                    size="lg"
                  >
                    {generateContentMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Enhanced Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Preview Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Content Preview
                  </CardTitle>
                  <CardDescription>Generated content with quality metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  {showPreview && generatedContent ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Generated Content</Label>
                        <Textarea
                          value={generatedContent}
                          readOnly
                          className="min-h-[300px] mt-2"
                        />
                      </div>

                      {generateContentMutation.data?.metadata && (
                        <div className="space-y-4">
                          <Separator />
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <Label>Quality Score</Label>
                              <div className="flex items-center space-x-2">
                                <Progress
                                  value={generateContentMutation.data.metadata.qualityScore * 10}
                                  className="flex-1"
                                />
                                <span className="font-mono">
                                  {generateContentMutation.data.metadata.qualityScore}/10
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label>Cost</Label>
                              <p className="font-mono text-lg">
                                {formatCost(generateContentMutation.data.metadata.cost)}
                              </p>
                            </div>
                            <div>
                              <Label>Tokens</Label>
                              <p className="font-mono">
                                {generateContentMutation.data.metadata.totalTokens.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <Label>Processing Time</Label>
                              <p className="font-mono">
                                {generateContentMutation.data.metadata.processingTime}ms
                              </p>
                            </div>
                            <div>
                              <Label>Model</Label>
                              <Badge
                                className={getModelColor(
                                  generateContentMutation.data.metadata.model
                                )}
                              >
                                {generateContentMutation.data.metadata.model}
                              </Badge>
                            </div>
                            <div>
                              <Label>Pipeline Phase</Label>
                              <Badge variant="outline">
                                {generateContentMutation.data.metadata.pipelinePhase}
                              </Badge>
                            </div>
                          </div>

                          {generateContentMutation.data.metadata.improvements > 0 && (
                            <Alert>
                              <TrendingUp className="h-4 w-4" />
                              <AlertTitle>Content Improved</AlertTitle>
                              <AlertDescription>
                                Content went through{' '}
                                {generateContentMutation.data.metadata.improvements} improvement
                                iterations
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Ready to Generate</p>
                      <p className="text-sm">Select term and section to begin</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Cost Tracking */}
              {analytics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Live Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Success Rate</span>
                        <Badge variant="outline">{analytics.successRate.toFixed(1)}%</Badge>
                      </div>
                      <Progress value={analytics.successRate} />

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Avg Quality</span>
                        <Badge variant="outline">
                          {analytics.averageQualityScore.toFixed(1)}/10
                        </Badge>
                      </div>
                      <Progress value={analytics.averageQualityScore * 10} />

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Avg Processing</span>
                        <Badge variant="outline">{analytics.averageProcessingTime}ms</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Placeholder for other tabs - will be implemented in subsequent phases */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Template Management</CardTitle>
              <CardDescription>Manage content generation templates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Template management interface will be implemented in Phase 1.2
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Analytics</CardTitle>
              <CardDescription>Detailed analytics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics dashboard will be implemented in Phase 1.3
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-tracking">
          <Card>
            <CardHeader>
              <CardTitle>Cost Tracking & Budget Management</CardTitle>
              <CardDescription>Monitor and control generation costs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cost tracking dashboard will be implemented in Phase 1.4
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card>
            <CardHeader>
              <CardTitle>Quality Assurance Pipeline</CardTitle>
              <CardDescription>Quality evaluation and improvement tools</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Quality assurance tools will be implemented in Phase 1.5
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>System configuration and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced settings panel will be implemented in Phase 1.6
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedContentGenerationV2;
