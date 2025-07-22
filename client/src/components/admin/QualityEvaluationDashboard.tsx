import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  Award,
  Brain,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Star,
  Target,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';

// Interfaces for Quality Evaluation System
interface QualityMetric {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  evaluationCriteria: string[];
  examples: {
    excellent: string;
    good: string;
    average: string;
    poor: string;
  };
}

interface QualityEvaluation {
  id: string;
  termId: string;
  termName: string;
  sectionId: string;
  sectionName: string;
  content: string;
  evaluationDate: Date;
  evaluatorId: string;
  evaluatorType: 'ai' | 'human' | 'hybrid';

  // Overall scoring
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';

  // Dimensional scores
  dimensionalScores: {
    accuracy: number;
    clarity: number;
    completeness: number;
    relevance: number;
    readability: number;
    consistency: number;
    technicalDepth: number;
    examples: number;
  };

  // Detailed feedback
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  };

  // Improvement tracking
  improvementStatus: 'pending' | 'in_progress' | 'completed' | 'rejected';
  previousScore?: number;
  improvementHistory: Array<{
    date: Date;
    score: number;
    changes: string;
  }>;

  // Metadata
  evaluationTime: number;
  confidence: number;
  needsHumanReview: boolean;
  flags: string[];
}

interface QualityTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  metrics: QualityMetric[];
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  customInstructions: string;
  isActive: boolean;
  usageCount: number;
  averageScore: number;
  created: Date;
  lastUsed: Date;
}

interface QualityAnalytics {
  totalEvaluations: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  trendsData: Array<{
    date: string;
    averageScore: number;
    totalEvaluations: number;
    improvementRate: number;
  }>;
  topPerformingSections: Array<{
    sectionName: string;
    averageScore: number;
    count: number;
  }>;
  improvementOpportunities: Array<{
    sectionName: string;
    issueType: string;
    count: number;
    severity: string;
  }>;
  evaluatorPerformance: Array<{
    evaluatorId: string;
    evaluatorType: string;
    accuracy: number;
    consistency: number;
    throughput: number;
  }>;
}

interface ContentSample {
  id: string;
  termName: string;
  sectionName: string;
  content: string;
  currentScore: number;
  lastEvaluated: Date;
  status: 'needs_evaluation' | 'under_review' | 'approved' | 'flagged';
  priority: number;
}

const QUALITY_METRICS: QualityMetric[] = [
  {
    id: 'accuracy',
    name: 'Accuracy',
    description: 'Factual correctness and technical precision',
    weight: 0.25,
    maxScore: 10,
    evaluationCriteria: [
      'Information is factually correct',
      'Technical details are precise',
      'No misleading statements',
      'Sources are reliable',
    ],
    examples: {
      excellent: 'All facts verified, precise technical language, authoritative sources',
      good: 'Mostly accurate with minor imprecisions',
      average: 'Generally correct but lacks precision',
      poor: 'Contains factual errors or misleading information',
    },
  },
  {
    id: 'clarity',
    name: 'Clarity',
    description: 'Clear communication and understandability',
    weight: 0.2,
    maxScore: 10,
    evaluationCriteria: [
      'Uses clear, concise language',
      'Avoids unnecessary jargon',
      'Logical flow of information',
      'Easy to understand',
    ],
    examples: {
      excellent: 'Crystal clear explanations, perfect flow',
      good: 'Clear with minor ambiguities',
      average: 'Understandable but could be clearer',
      poor: 'Confusing or difficult to follow',
    },
  },
  {
    id: 'completeness',
    name: 'Completeness',
    description: 'Covers all essential aspects comprehensively',
    weight: 0.2,
    maxScore: 10,
    evaluationCriteria: [
      'Covers all key points',
      'Appropriate level of detail',
      'No significant gaps',
      'Comprehensive coverage',
    ],
    examples: {
      excellent: 'Thoroughly covers all aspects with appropriate detail',
      good: 'Covers most important aspects',
      average: 'Basic coverage with some gaps',
      poor: 'Missing significant information',
    },
  },
  {
    id: 'relevance',
    name: 'Relevance',
    description: 'Content is relevant and appropriate for context',
    weight: 0.15,
    maxScore: 10,
    evaluationCriteria: [
      'Content matches the section purpose',
      'Appropriate for target audience',
      'Stays on topic',
      'Contextually relevant',
    ],
    examples: {
      excellent: 'Perfectly relevant and targeted',
      good: 'Mostly relevant with minor tangents',
      average: 'Generally relevant but some off-topic content',
      poor: 'Contains irrelevant or inappropriate content',
    },
  },
  {
    id: 'readability',
    name: 'Readability',
    description: 'Easy to read and well-structured',
    weight: 0.1,
    maxScore: 10,
    evaluationCriteria: [
      'Good sentence structure',
      'Appropriate paragraph length',
      'Smooth transitions',
      'Engaging style',
    ],
    examples: {
      excellent: 'Excellent readability and engagement',
      good: 'Easy to read with good flow',
      average: 'Readable but could be more engaging',
      poor: 'Difficult to read or poorly structured',
    },
  },
  {
    id: 'examples',
    name: 'Examples & Illustrations',
    description: 'Quality and relevance of examples provided',
    weight: 0.1,
    maxScore: 10,
    evaluationCriteria: [
      'Provides relevant examples',
      'Examples clarify concepts',
      'Diverse example types',
      'Real-world applications',
    ],
    examples: {
      excellent: 'Perfect examples that illuminate concepts',
      good: 'Good examples with clear relevance',
      average: 'Basic examples that somewhat help',
      poor: 'Poor or irrelevant examples',
    },
  },
];

const QUALITY_TEMPLATES: QualityTemplate[] = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Evaluation',
    description: 'Full multi-dimensional quality assessment',
    category: 'standard',
    metrics: QUALITY_METRICS,
    thresholds: { excellent: 9, good: 7, acceptable: 5, poor: 3 },
    customInstructions: 'Evaluate all dimensions with equal importance',
    isActive: true,
    usageCount: 156,
    averageScore: 7.8,
    created: new Date('2025-01-01'),
    lastUsed: new Date(),
  },
  {
    id: 'technical-focus',
    name: 'Technical Accuracy Focus',
    description: 'Emphasizes technical accuracy and depth',
    category: 'specialized',
    metrics: QUALITY_METRICS.map(m =>
      m.id === 'accuracy'
        ? { ...m, weight: 0.4 }
        : m.id === 'technicalDepth'
          ? { ...m, weight: 0.3 }
          : { ...m, weight: 0.075 }
    ),
    thresholds: { excellent: 9, good: 7.5, acceptable: 6, poor: 4 },
    customInstructions: 'Prioritize technical accuracy and depth over other factors',
    isActive: true,
    usageCount: 89,
    averageScore: 8.2,
    created: new Date('2025-01-01'),
    lastUsed: new Date(),
  },
  {
    id: 'readability-focus',
    name: 'Readability & Clarity Focus',
    description: 'Emphasizes clear communication and readability',
    category: 'specialized',
    metrics: QUALITY_METRICS.map(m =>
      m.id === 'clarity'
        ? { ...m, weight: 0.35 }
        : m.id === 'readability'
          ? { ...m, weight: 0.35 }
          : { ...m, weight: 0.075 }
    ),
    thresholds: { excellent: 8.5, good: 7, acceptable: 5.5, poor: 3 },
    customInstructions: 'Focus on clarity and ease of understanding',
    isActive: true,
    usageCount: 72,
    averageScore: 7.6,
    created: new Date('2025-01-01'),
    lastUsed: new Date(),
  },
];

export function QualityEvaluationDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedTemplate, setSelectedTemplate] = useState<string>('comprehensive');
  const [selectedSample, setSelectedSample] = useState<ContentSample | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<'ai' | 'human' | 'hybrid'>('ai');
  const [batchEvaluationMode, setBatchEvaluationMode] = useState<boolean>(false);
  const [qualityThreshold, setQualityThreshold] = useState<number>(7);
  const [_showAdvancedFilters, _setShowAdvancedFilters] = useState<boolean>(false);
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterScore, _setFilterScore] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Template editing state
  const [_editingTemplate, setEditingTemplate] = useState<QualityTemplate | null>(null);
  const [_showTemplateEditor, setShowTemplateEditor] = useState<boolean>(false);

  // Query for quality analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['quality-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/quality/analytics');
      if (!response.ok) {throw new Error('Failed to fetch quality analytics');}
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Query for content samples needing evaluation
  const { data: samplesData, isLoading: isLoadingSamples } = useQuery({
    queryKey: ['quality-samples', filterSection, filterScore, filterStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterSection !== 'all') {params.append('section', filterSection);}
      if (filterScore !== 'all') {params.append('score', filterScore);}
      if (filterStatus !== 'all') {params.append('status', filterStatus);}
      if (searchQuery) {params.append('search', searchQuery);}

      const response = await fetch(`/api/admin/quality/samples?${params.toString()}`);
      if (!response.ok) {throw new Error('Failed to fetch content samples');}
      return response.json();
    },
  });

  // Query for recent evaluations
  const { data: evaluationsData, isLoading: isLoadingEvaluations } = useQuery({
    queryKey: ['quality-evaluations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/quality/evaluations?limit=20');
      if (!response.ok) {throw new Error('Failed to fetch evaluations');}
      return response.json();
    },
    refetchInterval: 15000,
  });

  // Mutation for running quality evaluation
  const evaluateContentMutation = useMutation({
    mutationFn: async (params: {
      contentId: string;
      templateId: string;
      evaluatorType: 'ai' | 'human' | 'hybrid';
    }) => {
      const response = await fetch('/api/admin/quality/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {throw new Error('Failed to evaluate content');}
      return response.json();
    },
    onSuccess: data => {
      toast({
        title: 'Evaluation Completed',
        description: `Quality score: ${data.score}/10 (${data.grade})`,
      });
      queryClient.invalidateQueries({ queryKey: ['quality-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['quality-samples'] });
      queryClient.invalidateQueries({ queryKey: ['quality-evaluations'] });
    },
  });

  // Mutation for batch evaluation
  const batchEvaluateMutation = useMutation({
    mutationFn: async (params: {
      templateId: string;
      filters: any;
      evaluatorType: 'ai' | 'human' | 'hybrid';
      priority: 'low' | 'medium' | 'high';
    }) => {
      const response = await fetch('/api/admin/quality/batch-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {throw new Error('Failed to start batch evaluation');}
      return response.json();
    },
    onSuccess: data => {
      toast({
        title: 'Batch Evaluation Started',
        description: `Evaluating ${data.totalItems} content pieces`,
      });
      queryClient.invalidateQueries({ queryKey: ['quality-analytics'] });
    },
  });

  // Helper functions
  const getScoreColor = (score: number) => {
    if (score >= 9) {return 'text-green-600';}
    if (score >= 7) {return 'text-blue-600';}
    if (score >= 5) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'needs_evaluation':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const analytics = analyticsData?.data as QualityAnalytics | null;
  const samples = samplesData?.data as ContentSample[] | null;
  const evaluations = evaluationsData?.data as QualityEvaluation[] | null;

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quality Evaluation Dashboard</h2>
          <p className="text-muted-foreground">
            Multi-dimensional content quality assessment and improvement tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isLoadingAnalytics ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading Analytics...
            </div>
          ) : analytics && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-2xl text-blue-600">
                  {analytics.averageScore.toFixed(1)}
                </div>
                <div className="text-muted-foreground">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-green-600">
                  {analytics.totalEvaluations.toLocaleString()}
                </div>
                <div className="text-muted-foreground">Evaluations</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-purple-600">
                  {analytics.scoreDistribution.excellent}
                </div>
                <div className="text-muted-foreground">Excellent</div>
              </div>
            </div>
          )}
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quality Score Distribution */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Excellent (9-10)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.scoreDistribution.excellent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (analytics.scoreDistribution.excellent / analytics.totalEvaluations) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Good (7-8)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.scoreDistribution.good}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (analytics.scoreDistribution.good / analytics.totalEvaluations) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Acceptable (5-6)</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.scoreDistribution.acceptable}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (analytics.scoreDistribution.acceptable / analytics.totalEvaluations) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Poor (&lt;5)</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.scoreDistribution.poor}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (analytics.scoreDistribution.poor / analytics.totalEvaluations) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="evaluation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="samples">Content Samples</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="improvement">Improvement</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluation" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Evaluation Controls */}
            <div className="xl:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Quality Evaluation Controls
                  </CardTitle>
                  <CardDescription>Configure and run content quality evaluations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <Label>Evaluation Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALITY_TEMPLATES.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {template.description} • Avg: {template.averageScore.toFixed(1)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Evaluator Type */}
                  <div>
                    <Label>Evaluator Type</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['ai', 'human', 'hybrid'].map(type => (
                        <Button
                          key={type}
                          variant={evaluationMode === type ? 'default' : 'outline'}
                          onClick={() => setEvaluationMode(type as any)}
                          className="capitalize"
                        >
                          {type === 'ai' && <Brain className="w-4 h-4 mr-2" />}
                          {type === 'human' && <Users className="w-4 h-4 mr-2" />}
                          {type === 'hybrid' && <Zap className="w-4 h-4 mr-2" />}
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Quality Threshold */}
                  <div>
                    <Label>Quality Threshold: {qualityThreshold}/10</Label>
                    <Slider
                      value={[qualityThreshold]}
                      onValueChange={value => setQualityThreshold(value[0])}
                      max={10}
                      min={1}
                      step={0.5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Minimum</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  {/* Batch Mode Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="batch-mode"
                      checked={batchEvaluationMode}
                      onCheckedChange={setBatchEvaluationMode}
                    />
                    <Label htmlFor="batch-mode">Batch Evaluation Mode</Label>
                  </div>

                  {/* Batch Evaluation Controls */}
                  {batchEvaluationMode && (
                    <div className="p-4 bg-muted rounded-lg space-y-4">
                      <h4 className="font-medium">Batch Evaluation Settings</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Section Filter</Label>
                          <Select value={filterSection} onValueChange={setFilterSection}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sections</SelectItem>
                              <SelectItem value="definition">Definitions</SelectItem>
                              <SelectItem value="examples">Examples</SelectItem>
                              <SelectItem value="applications">Applications</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Status Filter</Label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="needs_evaluation">Needs Evaluation</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="flagged">Flagged</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        onClick={() =>
                          batchEvaluateMutation.mutate({
                            templateId: selectedTemplate,
                            filters: { section: filterSection, status: filterStatus },
                            evaluatorType: evaluationMode,
                            priority: 'medium',
                          })
                        }
                        disabled={batchEvaluateMutation.isPending}
                        className="w-full"
                      >
                        {batchEvaluateMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Starting Batch Evaluation...
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4 mr-2" />
                            Start Batch Evaluation
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Single Content Evaluation */}
                  {!batchEvaluationMode && selectedSample && (
                    <div className="p-4 bg-muted rounded-lg space-y-4">
                      <h4 className="font-medium">Selected Content</h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Term:</strong> {selectedSample.termName}
                        </p>
                        <p className="text-sm">
                          <strong>Section:</strong> {selectedSample.sectionName}
                        </p>
                        <p className="text-sm">
                          <strong>Current Score:</strong>
                          <span className={getScoreColor(selectedSample.currentScore)}>
                            {selectedSample.currentScore}/10
                          </span>
                        </p>
                      </div>

                      <Button
                        onClick={() =>
                          evaluateContentMutation.mutate({
                            contentId: selectedSample.id,
                            templateId: selectedTemplate,
                            evaluatorType: evaluationMode,
                          })
                        }
                        disabled={evaluateContentMutation.isPending}
                        className="w-full"
                      >
                        {evaluateContentMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            Evaluate Content
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Template Details */}
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        Template: {QUALITY_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(
                            QUALITY_TEMPLATES.find(t => t.id === selectedTemplate) || null
                          );
                          setShowTemplateEditor(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Template
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {QUALITY_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label>Usage Count</Label>
                          <p className="font-mono">
                            {QUALITY_TEMPLATES.find(t => t.id === selectedTemplate)?.usageCount}
                          </p>
                        </div>
                        <div>
                          <Label>Average Score</Label>
                          <p className="font-mono">
                            {QUALITY_TEMPLATES.find(
                              t => t.id === selectedTemplate
                            )?.averageScore.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Badge variant="outline">
                            {QUALITY_TEMPLATES.find(t => t.id === selectedTemplate)?.category}
                          </Badge>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>

                      <div>
                        <Label>Quality Metrics</Label>
                        <div className="mt-2 space-y-2">
                          {QUALITY_METRICS.map(metric => (
                            <div
                              key={metric.id}
                              className="flex items-center justify-between p-2 bg-muted rounded"
                            >
                              <div>
                                <span className="font-medium">{metric.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({(metric.weight * 100).toFixed(0)}% weight)
                                </span>
                              </div>
                              <Badge variant="outline">{metric.maxScore} pts</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Content Selection Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Content Selection
                  </CardTitle>
                  <CardDescription>Select content for evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {isLoadingSamples ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading samples...
                        </div>
                      ) : samples?.slice(0, 10).map(sample => (
                        <Card
                          key={sample.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedSample?.id === sample.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setSelectedSample(sample)}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge className={getStatusColor(sample.status)}>
                                  {sample.status}
                                </Badge>
                                <span
                                  className={`text-sm font-mono ${getScoreColor(sample.currentScore)}`}
                                >
                                  {sample.currentScore}/10
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{sample.termName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sample.sectionName}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {sample.content.substring(0, 100)}...
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {samples && samples.length > 10 && (
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View All ({samples.length} total)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Evaluations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Evaluations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isLoadingEvaluations ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading evaluations...
                      </div>
                    ) : evaluations?.slice(0, 5).map(evaluation => (
                      <div
                        key={evaluation.id}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{evaluation.termName}</p>
                          <p className="text-xs text-muted-foreground">{evaluation.sectionName}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getGradeColor(evaluation.overallGrade)}>
                            {evaluation.overallGrade}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {evaluation.evaluatorType}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Other tabs placeholders */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Quality Analytics & Trends</CardTitle>
              <CardDescription>Detailed quality analytics and trend visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics dashboard will be implemented in Phase 3.2
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="samples">
          <Card>
            <CardHeader>
              <CardTitle>Content Sample Management</CardTitle>
              <CardDescription>Browse and manage content samples for evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Content sample management interface will be implemented in Phase 3.3
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Template Editor</CardTitle>
              <CardDescription>Create and manage quality evaluation templates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Template editor will be implemented in Phase 3.4
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvement">
          <Card>
            <CardHeader>
              <CardTitle>Quality Improvement Tracking</CardTitle>
              <CardDescription>Track improvement suggestions and outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Improvement tracking interface will be implemented in Phase 3.5
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Quality Evaluation Settings</CardTitle>
              <CardDescription>Configure quality evaluation parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings panel will be implemented in Phase 3.6
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default QualityEvaluationDashboard;
