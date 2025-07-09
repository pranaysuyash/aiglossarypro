import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bot, Edit, FileText, Layers, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { InlineContentEditor } from './InlineContentEditor';

interface Term {
  id: string;
  name: string;
  slug: string;
  shortDefinition?: string;
  difficultyLevel?: string;
}

interface Section {
  id: number;
  name: string;
  displayOrder: number;
  isCompleted: boolean;
}

interface SectionItem {
  id: number;
  sectionId: number;
  label: string;
  content?: string;
  contentType?: string;
  isAiGenerated: boolean;
  verificationStatus?: string;
  metadata?: any;
}

interface ContentMetrics {
  totalTerms: number;
  termsWithContent: number;
  sectionsGenerated: number;
  averageQualityScore: number;
  lastGeneratedAt?: string;
}

// Section definitions from the 42-section architecture
const SECTION_DEFINITIONS = [
  { name: 'definition_overview', label: 'Definition & Overview', priority: 1 },
  { name: 'key_characteristics', label: 'Key Characteristics', priority: 1 },
  { name: 'real_world_applications', label: 'Real-World Applications', priority: 1 },
  { name: 'related_concepts', label: 'Related Concepts', priority: 2 },
  { name: 'tools_technologies', label: 'Tools & Technologies', priority: 2 },
  { name: 'implementation_details', label: 'Implementation Details', priority: 2 },
  { name: 'advantages_benefits', label: 'Advantages & Benefits', priority: 3 },
  { name: 'challenges_limitations', label: 'Challenges & Limitations', priority: 3 },
  { name: 'best_practices', label: 'Best Practices', priority: 3 },
  { name: 'future_directions', label: 'Future Directions', priority: 4 },
];

export function ContentManagementDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('definition_overview');
  const [_viewMode, _setViewMode] = useState<'single' | 'batch'>('single');

  // Fetch terms
  const { data: terms = [], isLoading: loadingTerms } = useQuery({
    queryKey: ['enhanced-terms', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const response = await fetch(`/api/admin/enhanced-terms?${params}`);
      if (!response.ok) throw new Error('Failed to fetch terms');
      return response.json();
    },
  });

  // Fetch content metrics
  const { data: metrics } = useQuery({
    queryKey: ['content-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/content-metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
  });

  // Fetch sections for selected term
  const { data: termSections = [] } = useQuery({
    queryKey: ['term-sections', selectedTerm?.id],
    queryFn: async () => {
      if (!selectedTerm) return [];
      const response = await fetch(`/api/admin/terms/${selectedTerm.id}/sections`);
      if (!response.ok) throw new Error('Failed to fetch sections');
      return response.json();
    },
    enabled: !!selectedTerm,
  });

  // Fetch section content
  const { data: sectionContent, refetch: refetchContent } = useQuery({
    queryKey: ['section-content', selectedTerm?.id, selectedSection],
    queryFn: async () => {
      if (!selectedTerm || !selectedSection) return null;
      const response = await fetch(
        `/api/admin/terms/${selectedTerm.id}/sections/${selectedSection}/content`
      );
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch content');
      }
      return response.json();
    },
    enabled: !!selectedTerm && !!selectedSection,
  });

  // Generate content mutation
  const generateContent = useMutation({
    mutationFn: async (params: {
      termId: string;
      sectionName: string;
      model?: string;
      regenerate?: boolean;
    }) => {
      const response = await fetch('/api/admin/enhanced-content-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to generate content');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content generated successfully',
      });
      refetchContent();
      queryClient.invalidateQueries({ queryKey: ['content-metrics'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Generation failed: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Save content mutation
  const saveContent = useMutation({
    mutationFn: async (params: { termId: string; sectionName: string; content: string }) => {
      const response = await fetch(
        `/api/admin/content-editing/content/${params.termId}/${params.sectionName}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: params.content }),
        }
      );
      if (!response.ok) throw new Error('Failed to save content');
      return response.json();
    },
    onSuccess: () => {
      refetchContent();
    },
  });

  const handleGenerateContent = async () => {
    if (!selectedTerm) return;

    await generateContent.mutateAsync({
      termId: selectedTerm.id,
      sectionName: selectedSection,
      regenerate: true,
    });
  };

  const handleSaveContent = async (content: string) => {
    if (!selectedTerm) return;

    await saveContent.mutateAsync({
      termId: selectedTerm.id,
      sectionName: selectedSection,
      content,
    });
  };

  const getSectionInfo = (sectionName: string) => {
    return (
      SECTION_DEFINITIONS.find((s) => s.name === sectionName) || {
        name: sectionName,
        label: sectionName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        priority: 5,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Management Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Generate, edit, and manage AI-powered glossary content
        </p>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTerms.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Terms with Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.termsWithContent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((metrics.termsWithContent / metrics.totalTerms) * 100)}% complete
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sections Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sectionsGenerated.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageQualityScore.toFixed(1)}/10</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Term Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Select Term
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Terms List */}
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {loadingTerms ? (
                  <div className="text-center py-4 text-muted-foreground">Loading terms...</div>
                ) : terms.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No terms found</div>
                ) : (
                  terms.map((term: Term) => (
                    <div
                      key={term.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTerm?.id === term.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedTerm(term)}
                    >
                      <div className="font-medium">{term.name}</div>
                      {term.shortDefinition && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {term.shortDefinition}
                        </p>
                      )}
                      {term.difficultyLevel && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {term.difficultyLevel}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Content Editor
              </CardTitle>
              {selectedTerm && <Badge variant="outline">{selectedTerm.name}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTerm ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Select a term from the list to view and edit its content
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Section Selector */}
                <div>
                  <Label>Content Section</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_DEFINITIONS.map((section) => (
                        <SelectItem key={section.name} value={section.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{section.label}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              P{section.priority}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Content Editor */}
                <InlineContentEditor
                  termId={selectedTerm.id}
                  termName={selectedTerm.name}
                  sectionName={selectedSection}
                  sectionLabel={getSectionInfo(selectedSection).label}
                  content={sectionContent?.content || ''}
                  isAiGenerated={sectionContent?.isAiGenerated || false}
                  qualityScore={sectionContent?.qualityScore}
                  metadata={sectionContent?.metadata}
                  onSave={handleSaveContent}
                  onRegenerate={handleGenerateContent}
                />

                {/* Action Buttons */}
                {!sectionContent && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleGenerateContent}
                      disabled={generateContent.isPending}
                      size="lg"
                    >
                      {generateContent.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Batch Operations
          </CardTitle>
          <CardDescription>
            Generate or update content for multiple terms or sections at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <a href="/admin/column-batch-operations">Column-wise Generation</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/quality-evaluation">Quality Evaluation</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin/template-management">Manage Templates</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
