import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Brain, 
  Play,
  Pause,
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Star,
  Settings,
  Eye,
  RefreshCw,
  Zap,
  Target,
  DollarSign,
  Clock,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GenerationRequest {
  termId: string;
  sectionName: string;
  templateId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  regenerate?: boolean;
}

interface GenerationResponse {
  success: boolean;
  content?: string;
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
  };
  error?: string;
}

interface ColumnProcessingStatus {
  columnId: string;
  totalTerms: number;
  processedTerms: number;
  generatedCount: number;
  generationErrors: number;
  evaluatedCount: number;
  averageQualityScore: number;
  lowQualityCount: number;
  improvedCount: number;
  finalizedCount: number;
  status: 'generating' | 'evaluating' | 'improving' | 'completed' | 'failed';
  currentPhase: 'generation' | 'evaluation' | 'improvement';
  qualityDistribution: {
    excellent: number;
    good: number;
    needsWork: number;
    poor: number;
  };
  estimatedCost: number;
  actualCost: number;
  errors: Array<{
    termId: string;
    termName: string;
    phase: string;
    error: string;
    timestamp: Date;
  }>;
}

interface Term {
  id: string;
  name: string;
  shortDescription?: string;
  fullDefinition?: string;
}

const ESSENTIAL_COLUMNS = [
  { id: 'term', name: 'Term Name', description: 'Core term name and variations', priority: 1 },
  { id: 'definition_overview', name: 'Definition & Overview', description: 'Clear, comprehensive definition', priority: 2 },
  { id: 'key_concepts', name: 'Key Concepts', description: 'Essential understanding points', priority: 3 },
  { id: 'basic_examples', name: 'Basic Examples', description: 'Concrete examples for clarity', priority: 4 },
  { id: 'advantages', name: 'Advantages', description: 'Benefits and use cases', priority: 5 }
];

const AVAILABLE_MODELS = [
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', cost: '$0.20/1M tokens', use: 'Simple content' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', cost: '$0.80/1M tokens', use: 'Balanced content' },
  { value: 'o4-mini', label: 'O4 Mini', cost: '$2.20/1M tokens', use: 'Complex reasoning' }
];

export function EnhancedContentGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4.1-nano');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [regenerate, setRegenerate] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Query for terms
  const { data: termsData, isLoading: isLoadingTerms } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const response = await fetch('/api/terms');
      if (!response.ok) throw new Error('Failed to fetch terms');
      return response.json();
    }
  });

  // Query for current processing status
  const { data: processingStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['enhanced-content-generation-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/enhanced-triplet/status');
      if (!response.ok) throw new Error('Failed to fetch processing status');
      return response.json();
    },
    refetchInterval: 2000, // Refetch every 2 seconds when processing is active
    enabled: true
  });

  // Mutation for single content generation
  const generateContentMutation = useMutation({
    mutationFn: async (request: GenerationRequest) => {
      const response = await fetch('/api/admin/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!response.ok) throw new Error('Failed to generate content');
      return response.json();
    },
    onSuccess: (data: GenerationResponse) => {
      if (data.success) {
        setGeneratedContent(data.content || '');
        setShowPreview(true);
        toast({
          title: 'Content Generated',
          description: `Successfully generated ${selectedSection} for ${selectedTerm?.name}`,
        });
      } else {
        toast({
          title: 'Generation Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive'
      });
    }
  });

  // Mutation for starting column batch processing
  const startColumnProcessingMutation = useMutation({
    mutationFn: async (columnId: string) => {
      const response = await fetch('/api/admin/enhanced-triplet/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId,
          options: {
            mode: 'generate-evaluate',
            qualityThreshold: 7,
            batchSize: 10,
            delayBetweenBatches: 2000,
            skipExisting: true
          }
        })
      });
      if (!response.ok) throw new Error('Failed to start column processing');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Processing Started',
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['enhanced-content-generation-status'] });
      } else {
        toast({
          title: 'Failed to Start Processing',
          description: data.message || 'Unknown error',
          variant: 'destructive'
        });
      }
    }
  });

  const handleGenerateContent = () => {
    if (!selectedTerm || !selectedSection) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a term and a section',
        variant: 'destructive'
      });
      return;
    }

    generateContentMutation.mutate({
      termId: selectedTerm.id,
      sectionName: selectedSection,
      model: selectedModel,
      temperature,
      maxTokens,
      regenerate
    });
  };

  const handleStartColumnProcessing = (columnId: string) => {
    startColumnProcessingMutation.mutate(columnId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'evaluating': return 'bg-yellow-100 text-yellow-800';
      case 'improving': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-blue-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const currentStatus = processingStatus?.data as ColumnProcessingStatus | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Content Generation</h2>
          <p className="text-muted-foreground">
            AI-powered content generation with quality assurance pipeline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['enhanced-content-generation-status'] });
              queryClient.invalidateQueries({ queryKey: ['terms'] });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="single-generation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single-generation">Single Generation</TabsTrigger>
          <TabsTrigger value="column-processing">Column Processing</TabsTrigger>
          <TabsTrigger value="quality-pipeline">Quality Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="single-generation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Content Generation
                </CardTitle>
                <CardDescription>
                  Generate content for a specific term and section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="term-select">Select Term</Label>
                  <Select
                    value={selectedTerm?.id || ''}
                    onValueChange={(value) => {
                      const term = termsData?.data?.find((t: Term) => t.id === value);
                      setSelectedTerm(term || null);
                    }}
                  >
                    <SelectTrigger id="term-select">
                      <SelectValue placeholder="Choose a term..." />
                    </SelectTrigger>
                    <SelectContent>
                      {termsData?.data?.map((term: Term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section-select">Select Section</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger id="section-select">
                      <SelectValue placeholder="Choose a section..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESSENTIAL_COLUMNS.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="model-select">AI Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger id="model-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {model.cost} • {model.use}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      min="100"
                      max="4000"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="regenerate"
                    checked={regenerate}
                    onChange={(e) => setRegenerate(e.target.checked)}
                  />
                  <Label htmlFor="regenerate">Force regeneration (overwrite existing)</Label>
                </div>

                <Button
                  onClick={handleGenerateContent}
                  disabled={!selectedTerm || !selectedSection || generateContentMutation.isPending}
                  className="w-full"
                >
                  {generateContentMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Content Preview
                </CardTitle>
                <CardDescription>
                  Generated content and metadata
                </CardDescription>
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
                        placeholder="Generated content will appear here..."
                      />
                    </div>
                    
                    {generateContentMutation.data?.metadata && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Tokens Used</Label>
                          <p className="font-mono">{generateContentMutation.data.metadata.totalTokens}</p>
                        </div>
                        <div>
                          <Label>Cost</Label>
                          <p className="font-mono">${generateContentMutation.data.metadata.cost.toFixed(4)}</p>
                        </div>
                        <div>
                          <Label>Processing Time</Label>
                          <p className="font-mono">{generateContentMutation.data.metadata.processingTime}ms</p>
                        </div>
                        <div>
                          <Label>Model Used</Label>
                          <p className="font-mono">{generateContentMutation.data.metadata.model}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Generate content to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="column-processing" className="space-y-4">
          {/* Current Processing Status */}
          {currentStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Current Processing Status
                </CardTitle>
                <CardDescription>
                  Column: {currentStatus.columnId} • Phase: {currentStatus.currentPhase}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <Badge className={getStatusColor(currentStatus.status)}>
                      {currentStatus.status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(currentStatus.processedTerms / currentStatus.totalTerms) * 100} 
                    className="w-full" 
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label>Generated</Label>
                      <p className="font-mono">{currentStatus.generatedCount}/{currentStatus.totalTerms}</p>
                    </div>
                    <div>
                      <Label>Evaluated</Label>
                      <p className="font-mono">{currentStatus.evaluatedCount}/{currentStatus.totalTerms}</p>
                    </div>
                    <div>
                      <Label>Avg Quality</Label>
                      <p className={`font-mono ${getQualityColor(currentStatus.averageQualityScore)}`}>
                        {currentStatus.averageQualityScore.toFixed(1)}/10
                      </p>
                    </div>
                    <div>
                      <Label>Cost</Label>
                      <p className="font-mono">${currentStatus.actualCost.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Essential Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESSENTIAL_COLUMNS.map((column) => (
              <Card key={column.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{column.name}</span>
                    <Badge variant="outline">Priority {column.priority}</Badge>
                  </CardTitle>
                  <CardDescription>{column.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleStartColumnProcessing(column.id)}
                    disabled={startColumnProcessingMutation.isPending}
                    className="w-full"
                  >
                    {startColumnProcessingMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Processing
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quality-pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Quality Assurance Pipeline
              </CardTitle>
              <CardDescription>
                Generate → Evaluate → Improve workflow with quality tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Quality Pipeline Stages */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Generation</p>
                      <p className="text-sm text-muted-foreground">AI content creation</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Evaluation</p>
                      <p className="text-sm text-muted-foreground">Quality assessment</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Improvement</p>
                      <p className="text-sm text-muted-foreground">Content enhancement</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quality Metrics */}
                {currentStatus && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {currentStatus.qualityDistribution.excellent}
                      </div>
                      <div className="text-sm text-muted-foreground">Excellent (9-10)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentStatus.qualityDistribution.good}
                      </div>
                      <div className="text-sm text-muted-foreground">Good (7-8)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {currentStatus.qualityDistribution.needsWork}
                      </div>
                      <div className="text-sm text-muted-foreground">Needs Work (5-6)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {currentStatus.qualityDistribution.poor}
                      </div>
                      <div className="text-sm text-muted-foreground">Poor (1-4)</div>
                    </div>
                  </div>
                )}

                {/* Quality Threshold Settings */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Quality Threshold: 7/10</h4>
                  <p className="text-sm text-muted-foreground">
                    Content scoring below this threshold will automatically enter the improvement phase.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedContentGeneration;