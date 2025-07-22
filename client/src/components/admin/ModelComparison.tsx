import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Bot,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';

interface ModelVersion {
  id: string;
  model: string;
  content: string;
  qualityScore?: number;
  cost: number;
  processingTime: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: Date;
  isSelected: boolean;
  userRating?: number;
  userNotes?: string;
}

interface Term {
  id: string;
  name: string;
  shortDescription?: string;
}

const AVAILABLE_MODELS = [
  {
    value: 'gpt-4.1',
    label: 'GPT-4.1',
    cost: '$25/1M tokens',
    use: 'Latest flagship model, superior coding & instruction following',
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    value: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    cost: '$0.20/1M tokens',
    use: 'Small model with GPT-4o level performance',
    color: 'bg-teal-100 text-teal-800',
  },
  {
    value: 'gpt-4.1-nano',
    label: 'GPT-4.1 Nano',
    cost: '$0.05/1M tokens',
    use: 'Fastest, cheapest for classification & autocompletion',
    color: 'bg-cyan-100 text-cyan-800',
  },
  {
    value: 'o1-mini',
    label: 'OpenAI o1-mini',
    cost: '$3/1M tokens',
    use: 'Advanced reasoning for complex problems',
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    cost: '$0.15/1M tokens',
    use: 'Multimodal, fast & cost-effective',
    color: 'bg-orange-100 text-orange-800',
  },
];

const ESSENTIAL_COLUMNS = [
  {
    id: 'definition_overview',
    name: 'Definition & Overview',
    description: 'Clear, comprehensive definition',
  },
  { id: 'key_concepts', name: 'Key Concepts', description: 'Essential understanding points' },
  { id: 'basic_examples', name: 'Basic Examples', description: 'Concrete examples for clarity' },
  { id: 'advantages', name: 'Advantages', description: 'Benefits and use cases' },
  { id: 'disadvantages', name: 'Disadvantages', description: 'Limitations and challenges' },
  { id: 'applications', name: 'Applications', description: 'Real-world use cases' },
  { id: 'implementation', name: 'Implementation', description: 'How to implement or use' },
  { id: 'best_practices', name: 'Best Practices', description: 'Recommended approaches' },
];

export function ModelComparison() {
  const { toast } = useToast();

  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4.1-mini', 'gpt-4o-mini']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showContent, setShowContent] = useState<Record<string, boolean>>({});
  const [_activeTab, _setActiveTab] = useState<string>('comparison');

  // Query for terms
  const { data: termsData, isLoading: isLoadingTerms } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const response = await fetch('/api/terms');
      if (!response.ok) {throw new Error('Failed to fetch terms');}
      return response.json();
    },
  });

  // Query for model versions
  const {
    data: modelVersions,
    isLoading: isLoadingVersions,
    refetch: refetchVersions,
  } = useQuery({
    queryKey: ['model-versions', selectedTerm?.id, selectedSection],
    queryFn: async () => {
      if (!selectedTerm || !selectedSection) {return [];}
      const response = await fetch(
        `/api/admin/enhanced-triplet/model-versions/${selectedTerm.id}/${selectedSection}`
      );
      if (!response.ok) {throw new Error('Failed to fetch model versions');}
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedTerm && !!selectedSection,
  });

  // Multi-model generation mutation
  const generateMultiModelMutation = useMutation({
    mutationFn: async (data: {
      termId: string;
      sectionName: string;
      models: string[];
      temperature?: number;
      maxTokens?: number;
    }) => {
      const response = await fetch('/api/admin/enhanced-triplet/generate-multi-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {throw new Error('Failed to generate multi-model content');}
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Multi-model generation completed',
        description: 'Content has been generated with selected models',
      });
      refetchVersions();
    },
    onError: error => {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error?.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Select model version mutation
  const selectVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const response = await fetch('/api/admin/enhanced-triplet/select-model-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (!response.ok) {throw new Error('Failed to select model version');}
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Model version selected',
        description: 'This version is now the active content',
      });
      refetchVersions();
    },
    onError: error => {
      toast({
        title: 'Selection failed',
        description: error instanceof Error ? error?.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Rate model version mutation
  const rateVersionMutation = useMutation({
    mutationFn: async (data: { versionId: string; rating: number; notes?: string }) => {
      const response = await fetch('/api/admin/enhanced-triplet/rate-model-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {throw new Error('Failed to rate model version');}
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rating saved',
        description: 'Your rating has been saved',
      });
      refetchVersions();
    },
    onError: error => {
      toast({
        title: 'Rating failed',
        description: error instanceof Error ? error?.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const handleGenerateMultiModel = async () => {
    if (!selectedTerm || !selectedSection || selectedModels.length === 0) {
      toast({
        title: 'Missing selection',
        description: 'Please select a term, section, and at least one model',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateMultiModelMutation.mutateAsync({
        termId: selectedTerm.id,
        sectionName: selectedSection,
        models: selectedModels,
        temperature: 0.7,
        maxTokens: 1000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVersion = (versionId: string) => {
    selectVersionMutation.mutate(versionId);
  };

  const handleRateVersion = (versionId: string, rating: number, notes?: string) => {
    const params: { versionId: string; rating: number; notes?: string } = { versionId, rating };
    if (notes) {
      params.notes = notes;
    }
    rateVersionMutation.mutate(params);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Content has been copied to your clipboard',
    });
  };

  const toggleContentVisibility = (versionId: string) => {
    setShowContent(prev => ({ ...prev, [versionId]: !prev[versionId] }));
  };

  const getModelInfo = (modelName: string) => {
    return AVAILABLE_MODELS.find(m => m.value === modelName) || AVAILABLE_MODELS[0];
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  const formatTokens = (tokens: number) => {
    return new Intl.NumberFormat('en-US').format(tokens);
  };

  const getQualityColor = (score?: number) => {
    if (!score) {return 'bg-gray-100 text-gray-800';}
    if (score >= 8) {return 'bg-green-100 text-green-800';}
    if (score >= 6) {return 'bg-yellow-100 text-yellow-800';}
    return 'bg-red-100 text-red-800';
  };

  const renderStarRating = (versionId: string, currentRating?: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRateVersion(versionId, star)}
            className={`w-4 h-4 ${
              currentRating && star <= currentRating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Comparison</h2>
          <p className="text-gray-600">Compare AI model outputs for content generation</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Sparkles className="w-3 h-3 mr-1" />
            Multi-Model
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <BarChart3 className="w-3 h-3 mr-1" />
            Comparison
          </Badge>
        </div>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            Generation Setup
          </CardTitle>
          <CardDescription>Select term, section, and models to compare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Term Selection */}
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select
                value={selectedTerm?.id || ''}
                onValueChange={value => {
                  const term = termsData?.data?.find((t: Term) => t.id === value);
                  setSelectedTerm(term || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTerms ? (
                    <SelectItem value="loading" disabled>
                      Loading terms...
                    </SelectItem>
                  ) : (
                    termsData?.data?.map((term: Term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Section Selection */}
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {ESSENTIAL_COLUMNS.map(column => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Models to Compare</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_MODELS.map(model => (
                  <label key={model.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.value)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedModels(prev => [...prev, model.value]);
                        } else {
                          setSelectedModels(prev => prev.filter(m => m !== model.value));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{model.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleGenerateMultiModel}
              disabled={
                !selectedTerm || !selectedSection || selectedModels.length === 0 || isGenerating
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate with {selectedModels.length} Models
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Versions Display */}
      {modelVersions && modelVersions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Model Comparison Results
            </CardTitle>
            <CardDescription>Compare outputs from different AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelVersions.map((version: ModelVersion) => {
                const modelInfo = getModelInfo(version.model);
                const isVisible = showContent[version.id];

                return (
                  <div key={version.id} className="border rounded-lg p-4 space-y-3">
                    {/* Version Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={modelInfo.color}>{modelInfo.label}</Badge>
                        {version.isSelected && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                        {version.qualityScore && (
                          <Badge className={getQualityColor(version.qualityScore)}>
                            Quality: {version.qualityScore.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleContentVisibility(version.id)}
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(version.content)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>{formatCost(version.cost)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{version.processingTime}ms</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-orange-600" />
                        <span>{formatTokens(version.totalTokens)} tokens</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Rating:</span>
                        {renderStarRating(version.id, version.userRating)}
                      </div>
                    </div>

                    {/* Content */}
                    {isVisible && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="prose max-w-none">{version.content}</div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {!version.isSelected && (
                              <Button
                                onClick={() => handleSelectVersion(version.id)}
                                size="sm"
                                variant="outline"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Select This Version
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Generated {new Date(version.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedTerm &&
        selectedSection &&
        (!modelVersions || modelVersions.length === 0) &&
        !isLoadingVersions && (
          <Card>
            <CardContent className="text-center py-8">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No model versions found for this term and section.</p>
              <p className="text-sm text-gray-500 mt-1">
                Generate content with multiple models to compare results.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
