import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, Copy, Loader2, Sparkles } from '@/components/ui/icons';
import { useToast } from '../hooks/use-toast';
import { useLiveRegion } from './accessibility/LiveRegion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface AIDefinitionGeneratorProps {
  onDefinitionGenerated?: (definition: any) => void;
  initialTerm?: string;
  initialCategory?: string;
}

interface AIDefinitionResponse {
  shortDefinition: string;
  definition: string;
  characteristics?: string[];
  applications?: {
    name: string;
    description: string;
  }[];
  relatedTerms?: string[];
  mathFormulation?: string;
}

export function AIDefinitionGenerator({
  onDefinitionGenerated,
  initialTerm = '',
  initialCategory = '',
}: AIDefinitionGeneratorProps) {
  const [term, setTerm] = useState(initialTerm);
  const [category, setCategory] = useState(initialCategory);
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDefinition, setGeneratedDefinition] = useState<AIDefinitionResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();
  const { announce } = useLiveRegion();

  // Fetch available categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {throw new Error('Failed to fetch categories');}
      return response.json();
    },
  });

  const generateDefinition = async () => {
    if (!term.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a term to define.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    announce(`Generating AI definition for ${term.trim()}`, 'polite');
    try {
      const response = await fetch('/api/ai/generate-definition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: term.trim(),
          category: category || undefined,
          context: context.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate definition');
      }

      const result = await response.json();

      if (result.success) {
        setGeneratedDefinition(result.data);
        onDefinitionGenerated?.(result.data);
        announce(`AI definition for ${term.trim()} generated successfully`, 'polite');
        toast({
          title: 'Success',
          description: 'AI definition generated successfully!',
        });
      } else {
        throw new Error(result.error || 'Failed to generate definition');
      }
    } catch (error: Error | unknown) {
      console.error('Error generating definition:', error);
      announce(`Failed to generate definition for ${term.trim()}`, 'assertive');
      toast({
        title: 'Error',
        description: error instanceof Error ? error?.message : 'Failed to generate definition',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: 'Copied',
        description: 'Content copied to clipboard',
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Definition Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive definitions for AI/ML terms using artificial intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Input
                placeholder="Enter AI/ML term (e.g., Neural Network)"
                value={term}
                onChange={e => setTerm(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category (Optional)</label>
              <Select
                value={category || 'none'}
                onValueChange={value => setCategory(value === 'none' ? '' : value)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific category</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Context (Optional)</label>
            <Textarea
              placeholder="Provide additional context or specific focus for the definition..."
              value={context}
              onChange={e => setContext(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
          </div>

          <Button
            onClick={generateDefinition}
            disabled={isGenerating || !term.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Definition...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Definition
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedDefinition && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Definition</CardTitle>
            <CardDescription>AI-generated comprehensive definition for "{term}"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Short Definition */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Short Definition</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedDefinition.shortDefinition, 'short')}
                >
                  {copiedField === 'short' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm">{generatedDefinition.shortDefinition}</p>
              </div>
            </div>

            {/* Detailed Definition */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Detailed Definition</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedDefinition.definition, 'detailed')}
                >
                  {copiedField === 'detailed' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm">{generatedDefinition.definition}</p>
              </div>
            </div>

            {/* Characteristics */}
            {generatedDefinition.characteristics &&
              generatedDefinition.characteristics.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key Characteristics</label>
                  <div className="flex flex-wrap gap-2">
                    {generatedDefinition.characteristics.map((char, index) => (
                      <Badge key={index} variant="secondary">
                        {char}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Applications */}
            {generatedDefinition.applications && generatedDefinition.applications.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Applications</label>
                <div className="space-y-2">
                  {generatedDefinition.applications.map((app, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-md">
                      <h4 className="font-medium text-sm">{app.name}</h4>
                      <p className="text-sm text-gray-600">{app.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mathematical Formulation */}
            {generatedDefinition.mathFormulation && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mathematical Formulation</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedDefinition.mathFormulation!, 'math')}
                  >
                    {copiedField === 'math' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-yellow-50 rounded-md">
                  <code className="text-sm">{generatedDefinition.mathFormulation}</code>
                </div>
              </div>
            )}

            {/* Related Terms */}
            {generatedDefinition.relatedTerms && generatedDefinition.relatedTerms.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Related Terms</label>
                <div className="flex flex-wrap gap-2">
                  {generatedDefinition.relatedTerms.map((relatedTerm, index) => (
                    <Badge key={index} variant="outline">
                      {relatedTerm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
