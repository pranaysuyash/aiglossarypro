import { Check, Loader2, Wand2, X } from 'lucide-react';
import { useState } from 'react';
import { AI_IMPROVEMENT_MESSAGES, GENERIC_MESSAGES } from '../constants/messages';
import { useToast } from '../hooks/use-toast';
import type { ITerm } from '../interfaces/interfaces';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AIDefinitionImproverProps {
  term: ITerm;
  onImprovementApplied?: (improvedTerm: ITerm) => void;
  className?: string | undefined;
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

export function AIDefinitionImprover({
  term,
  onImprovementApplied,
  className = '',
}: AIDefinitionImproverProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [improvements, setImprovements] = useState<AIDefinitionResponse | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const { toast } = useToast();

  const generateImprovements = async () => {
    setIsImproving(true);

    try {
      const response = await fetch(`/api/ai/improve-definition/${term.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate improvements');
      }

      const result = await response.json();

      if (result.success) {
        setImprovements(result.data);
        setShowComparison(true);
        toast(AI_IMPROVEMENT_MESSAGES.SUCCESS);
      } else {
        throw new Error(result.error || 'Failed to generate improvements');
      }
    } catch (error: any) {
      console.error('Error generating improvements:', error);
      toast({
        title: GENERIC_MESSAGES.ERROR.title,
        description: error instanceof Error ? error?.message : 'Failed to generate improvements',
        variant: 'destructive',
      });
    } finally {
      setIsImproving(false);
    }
  };

  const applyImprovements = async () => {
    if (!improvements) {return;}

    setIsApplying(true);

    try {
      const response = await fetch(`/api/ai/apply-improvements/${term.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          improvements,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply improvements');
      }

      const result = await response.json();

      if (result.success) {
        onImprovementApplied?.(result.data);
        toast(AI_IMPROVEMENT_MESSAGES.APPLIED);
        setShowComparison(false);
        setImprovements(null);
      } else {
        throw new Error(result.error || 'Failed to apply improvements');
      }
    } catch (error: any) {
      console.error('Error applying improvements:', error);
      toast({
        title: GENERIC_MESSAGES.ERROR.title,
        description: error instanceof Error ? error?.message : 'Failed to apply improvements',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const dismissImprovements = () => {
    setImprovements(null);
    setShowComparison(false);
    toast(AI_IMPROVEMENT_MESSAGES.DISMISSED);
  };

  const ComparisonSection = ({
    title,
    original,
    improved,
  }: {
    title: string;
    original: string | string[] | null | undefined;
    improved: string | string[] | null | undefined;
  }) => {
    const hasChanges = JSON.stringify(original) !== JSON.stringify(improved);

    if (!hasChanges && !improved) {return null;}

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          {title}
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              Improved
            </Badge>
          )}
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Current</label>
            <div className="p-3 bg-gray-50 rounded-md min-h-[60px]">
              {Array.isArray(original) ? (
                <div className="space-y-1">
                  {original.length > 0 ? (
                    original.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1">
                        {typeof item === 'string' ? item : String(item)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">None</span>
                  )}
                </div>
              ) : (
                <p className="text-sm">{original || <span className="text-gray-400">None</span>}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-green-600 uppercase tracking-wide">AI Improved</label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md min-h-[60px]">
              {Array.isArray(improved) ? (
                <div className="space-y-1">
                  {improved?.length ? (
                    improved.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 border-green-300">
                        {typeof item === 'string' ? item : String(item)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">None</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-800">
                  {improved || <span className="text-gray-400">None</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            AI Definition Improver
          </CardTitle>
          <CardDescription>
            Use AI to enhance and improve the definition for "{term.name}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showComparison ? (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">
                Get AI-powered suggestions to improve this term's definition, characteristics, and
                applications.
              </p>
              <Button onClick={generateImprovements} disabled={isImproving} size="lg">
                {isImproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Definition...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate AI Improvements
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">AI Improvement Suggestions</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={dismissImprovements}
                    disabled={isApplying}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                  <Button size="sm" onClick={applyImprovements} disabled={isApplying}>
                    {isApplying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Apply Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <ComparisonSection
                  title="Short Definition"
                  original={term.shortDefinition}
                  improved={improvements?.shortDefinition}
                />

                <ComparisonSection
                  title="Detailed Definition"
                  original={term.definition}
                  improved={improvements?.definition}
                />

                <ComparisonSection
                  title="Characteristics"
                  original={term.characteristics}
                  improved={improvements?.characteristics}
                />

                {improvements?.mathFormulation && (
                  <ComparisonSection
                    title="Mathematical Formulation"
                    original={term.mathFormulation}
                    improved={improvements.mathFormulation}
                  />
                )}

                {improvements?.applications && improvements.applications.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      Applications
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    </h4>
                    <div className="space-y-2">
                      {improvements.applications.map((app, index) => (
                        <div
                          key={index}
                          className="p-3 bg-blue-50 border border-blue-200 rounded-md"
                        >
                          <h5 className="font-medium text-sm text-blue-800">{app.name}</h5>
                          <p className="text-sm text-blue-700">{app.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {improvements?.relatedTerms && improvements.relatedTerms.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      Related Terms
                      <Badge variant="secondary" className="text-xs">
                        Suggested
                      </Badge>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {improvements.relatedTerms.map((relatedTerm, index) => (
                        <Badge key={index} variant="outline" className="border-blue-300">
                          {relatedTerm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
