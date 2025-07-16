import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Brain,
  Edit,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  TestTube,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'generation' | 'evaluation' | 'improvement';
  sectionType: string;
  complexity: 'simple' | 'moderate' | 'complex';
  generativePrompt: string;
  evaluativePrompt: string;
  improvementPrompt: string;
  metadata: {
    estimatedTokens: number;
    recommendedModel: string;
    version: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isDefault: boolean;
    usageCount: number;
  };
}

interface TestResult {
  success: boolean;
  generatedContent?: string;
  evaluationScore?: number;
  evaluationFeedback?: string;
  improvedContent?: string;
  metadata?: {
    totalTokens: number;
    cost: number;
    processingTime: number;
  };
  error?: string;
}

const SECTION_TYPES = [
  'definition_overview',
  'key_concepts',
  'basic_examples',
  'advantages',
  'limitations',
  'historical_context',
  'real_world_applications',
  'implementation_basics',
  'best_practices',
  'common_mistakes',
];

const COMPLEXITY_LEVELS = [
  { value: 'simple', label: 'Simple', description: 'Basic content, 60% of columns' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced content, 30% of columns' },
  { value: 'complex', label: 'Complex', description: 'Complex reasoning, 10% of columns' },
];

const RECOMMENDED_MODELS = [
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', cost: '$0.20/1M', use: 'Simple content' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', cost: '$0.80/1M', use: 'Balanced content' },
  { value: 'o4-mini', label: 'O4 Mini', cost: '$2.20/1M', use: 'Complex reasoning' },
];

export function TemplateManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [_isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testTerm, setTestTerm] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sectionType: '',
    complexity: 'simple' as 'simple' | 'moderate' | 'complex',
    generativePrompt: '',
    evaluativePrompt: '',
    improvementPrompt: '',
    estimatedTokens: 500,
    recommendedModel: 'gpt-4.1-nano',
  });

  // Query for templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/templates');
      if (!response.ok) {throw new Error('Failed to fetch templates');}
      return response.json();
    },
  });

  // Mutation for creating template
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) {throw new Error('Failed to create template');}
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Template created successfully' });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error?.message : 'Failed to create template',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...templateData }: any) => {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      if (!response.ok) {throw new Error('Failed to update template');}
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({ title: 'Success', description: 'Template updated successfully' });
    },
  });

  // Mutation for deleting template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {throw new Error('Failed to delete template');}
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      toast({ title: 'Success', description: 'Template deleted successfully' });
    },
  });

  // Mutation for testing template
  const testTemplateMutation = useMutation({
    mutationFn: async ({ templateId, termName }: { templateId: string; termName: string }) => {
      const response = await fetch('/api/admin/templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, termName }),
      });
      if (!response.ok) {throw new Error('Failed to test template');}
      return response.json();
    },
    onSuccess: (data: TestResult) => {
      setTestResult(data);
      if (data.success) {
        toast({ title: 'Test Completed', description: 'Template test completed successfully' });
      } else {
        toast({
          title: 'Test Failed',
          description: data.error || 'Template test failed',
          variant: 'destructive',
        });
      }
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sectionType: '',
      complexity: 'simple',
      generativePrompt: '',
      evaluativePrompt: '',
      improvementPrompt: '',
      estimatedTokens: 500,
      recommendedModel: 'gpt-4.1-nano',
    });
    setSelectedTemplate(null);
  };

  const handleCreateTemplate = () => {
    if (!formData.name || !formData.sectionType || !formData.generativePrompt) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createTemplateMutation.mutate(formData);
  };

  const _handleUpdateTemplate = () => {
    if (!selectedTemplate) {return;}

    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      ...formData,
    });
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      sectionType: template.sectionType,
      complexity: template.complexity,
      generativePrompt: template.generativePrompt,
      evaluativePrompt: template.evaluativePrompt,
      improvementPrompt: template.improvementPrompt,
      estimatedTokens: template.metadata.estimatedTokens,
      recommendedModel: template.metadata.recommendedModel,
    });
    setIsEditDialogOpen(true);
  };

  const handleTestTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setTestResult(null);
    setTestTerm('');
    setIsTestDialogOpen(true);
  };

  const runTemplateTest = () => {
    if (!selectedTemplate || !testTerm) {
      toast({
        title: 'Missing Information',
        description: 'Please select a template and enter a test term',
        variant: 'destructive',
      });
      return;
    }

    testTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      termName: testTerm,
    });
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'generation':
        return <Brain className="w-4 h-4" />;
      case 'evaluation':
        return <Target className="w-4 h-4" />;
      case 'improvement':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Template Management</h2>
          <p className="text-muted-foreground">
            Manage AI prompt templates for the Enhanced Content Generation System
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['prompt-templates'] })}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">All Templates</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Templates</CardTitle>
              <CardDescription>
                Manage templates for the Generate → Evaluate → Improve pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Section Type</TableHead>
                      <TableHead>Complexity</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templatesData?.data?.map((template: PromptTemplate) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(template.category)}
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {template.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.sectionType.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getComplexityColor(template.complexity)}>
                            {template.complexity}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {template.metadata.recommendedModel}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{template.metadata.usageCount || 0} uses</div>
                            {template.metadata.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestTemplate(template)}
                            >
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTemplateMutation.mutate(template.id)}
                              disabled={template.metadata.isDefault}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templatesData?.data?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Simple Templates</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {templatesData?.data?.filter((t: PromptTemplate) => t.complexity === 'simple')
                    .length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moderate Templates</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {templatesData?.data?.filter((t: PromptTemplate) => t.complexity === 'moderate')
                    .length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Complex Templates</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {templatesData?.data?.filter((t: PromptTemplate) => t.complexity === 'complex')
                    .length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new prompt template for the Enhanced Content Generation System
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name..."
                />
              </div>
              <div>
                <Label htmlFor="section-type">Section Type</Label>
                <Select
                  value={formData.sectionType}
                  onValueChange={value => setFormData(prev => ({ ...prev, sectionType: value }))}
                >
                  <SelectTrigger id="section-type">
                    <SelectValue placeholder="Select section type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-description">Description</Label>
              <Input
                id="template-description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter template description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complexity">Complexity Level</Label>
                <Select
                  value={formData.complexity}
                  onValueChange={(value: any) =>
                    setFormData(prev => ({ ...prev, complexity: value }))
                  }
                >
                  <SelectTrigger id="complexity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLEXITY_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div>{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recommended-model">Recommended Model</Label>
                <Select
                  value={formData.recommendedModel}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, recommendedModel: value }))
                  }
                >
                  <SelectTrigger id="recommended-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECOMMENDED_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div>{model.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {model.cost} • {model.use}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="generative-prompt">Generative Prompt</Label>
              <Textarea
                id="generative-prompt"
                value={formData.generativePrompt}
                onChange={e => setFormData(prev => ({ ...prev, generativePrompt: e.target.value }))}
                placeholder="Enter the generative prompt..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="evaluative-prompt">Evaluative Prompt</Label>
              <Textarea
                id="evaluative-prompt"
                value={formData.evaluativePrompt}
                onChange={e => setFormData(prev => ({ ...prev, evaluativePrompt: e.target.value }))}
                placeholder="Enter the evaluative prompt..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="improvement-prompt">Improvement Prompt</Label>
              <Textarea
                id="improvement-prompt"
                value={formData.improvementPrompt}
                onChange={e =>
                  setFormData(prev => ({ ...prev, improvementPrompt: e.target.value }))
                }
                placeholder="Enter the improvement prompt..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                {createTemplateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Template Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Test Template</DialogTitle>
            <DialogDescription>
              Test the template with a sample term to see how it performs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="test-term">Test Term</Label>
              <Input
                id="test-term"
                value={testTerm}
                onChange={e => setTestTerm(e.target.value)}
                placeholder="Enter a term name to test with..."
              />
            </div>

            <Button
              onClick={runTemplateTest}
              disabled={testTemplateMutation.isPending || !testTerm}
            >
              {testTemplateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>

            {testResult && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Test {testResult.success ? 'completed successfully' : 'failed'}
                    {testResult.metadata && (
                      <span>
                        {' '}
                        • Cost: ${testResult.metadata.cost.toFixed(4)} • Time:{' '}
                        {testResult.metadata.processingTime}ms
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                {testResult.generatedContent && (
                  <div>
                    <Label>Generated Content</Label>
                    <Textarea
                      value={testResult.generatedContent}
                      readOnly
                      className="min-h-[200px] mt-2"
                    />
                  </div>
                )}

                {testResult.evaluationScore && (
                  <div>
                    <Label>Evaluation Score: {testResult.evaluationScore}/10</Label>
                    <Textarea
                      value={testResult.evaluationFeedback || ''}
                      readOnly
                      className="min-h-[100px] mt-2"
                    />
                  </div>
                )}

                {testResult.improvedContent && (
                  <div>
                    <Label>Improved Content</Label>
                    <Textarea
                      value={testResult.improvedContent}
                      readOnly
                      className="min-h-[200px] mt-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateManagement;
