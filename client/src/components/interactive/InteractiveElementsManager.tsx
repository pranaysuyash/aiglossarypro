import { ExternalLink, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IInteractiveElement } from '@/interfaces/interfaces';
import CodeBlock from './CodeBlock';
import InteractiveQuiz from './InteractiveQuiz';
import MermaidDiagram from './MermaidDiagram';

interface InteractiveElementsManagerProps {
  elements: IInteractiveElement[];
  onInteraction?: (elementId: string, interactionType: string, data?: any) => void;
  className?: string;
}

export default function InteractiveElementsManager({
  elements,
  onInteraction,
  className = '',
}: InteractiveElementsManagerProps) {
  const handleInteraction = (elementId: string, type: string, data?: any) => {
    if (onInteraction) {
      onInteraction(elementId, type, data);
    }
  };

  const renderElement = (element: IInteractiveElement) => {
    const { elementType, elementData } = element;

    switch (elementType) {
      case 'mermaid':
        return (
          <MermaidDiagram
            diagram={elementData.diagram || ''}
            title={elementData.title}
            description={elementData.description}
            className="mb-4"
          />
        );

      case 'code':
        return (
          <CodeBlock
            code={elementData.code || ''}
            language={elementData.language || 'text'}
            title={elementData.title}
            description={elementData.description}
            executable={elementData.executable || false}
            highlightLines={elementData.highlightLines || []}
            className="mb-4"
          />
        );

      case 'quiz':
        return (
          <InteractiveQuiz
            questions={elementData.questions || []}
            title={elementData.title || 'Quiz'}
            description={elementData.description}
            timeLimit={elementData.timeLimit}
            showExplanations={elementData.showExplanations !== false}
            allowRetry={elementData.allowRetry !== false}
            onComplete={(result) => handleInteraction(element.id, 'quiz_completed', result)}
            className="mb-4"
          />
        );

      case 'demo':
        return (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>{elementData.title || 'Interactive Demo'}</span>
                  </CardTitle>
                  {elementData.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {elementData.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">Demo</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {elementData.demoUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden border">
                    <iframe
                      src={elementData.demoUrl}
                      className="w-full h-full"
                      title={elementData.title || 'Interactive Demo'}
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => window.open(elementData.demoUrl, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open in New Tab</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Demo content not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'simulation':
        return (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>{elementData.title || 'Interactive Simulation'}</span>
                  </CardTitle>
                  {elementData.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {elementData.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">Simulation</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Simulation functionality coming soon</p>
                <p className="text-xs mt-1">This would integrate with simulation frameworks</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Unknown Interactive Element</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Unsupported element type: {elementType}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  if (!elements || elements.length === 0) {
    return null;
  }

  // Sort elements by display order
  const sortedElements = [...elements].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className={className}>
      {sortedElements
        .filter((element) => element.isActive)
        .map((element) => (
          <div key={element.id}>{renderElement(element)}</div>
        ))}
    </div>
  );
}
