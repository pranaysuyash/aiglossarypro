import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeMermaidHTML } from '@/utils/sanitize';

interface MermaidDiagramProps {
  diagram: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function MermaidDiagram({ 
  diagram, 
  title, 
  description, 
  className = '' 
}: MermaidDiagramProps) {
  const [diagramSvg, setDiagramSvg] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(1);
  const diagramRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const renderDiagram = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Initialize mermaid with custom config
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          themeVariables: {
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          },
        });

        // Generate unique ID for this diagram
        const diagramId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(diagramId, diagram);
        setDiagramSvg(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram. Please check the diagram syntax.');
      } finally {
        setIsLoading(false);
      }
    };

    if (diagram) {
      renderDiagram();
    }
  }, [diagram]);

  const handleCopyDiagram = async () => {
    try {
      await navigator.clipboard.writeText(diagram);
      toast({
        title: 'Diagram copied',
        description: 'Mermaid diagram code has been copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy diagram to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadSvg = () => {
    if (!diagramSvg) return;

    const blob = new Blob([diagramSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'diagram'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <details className="mt-2">
              <summary className="text-red-600 dark:text-red-400 cursor-pointer text-xs">
                Show diagram code
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {diagram}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetZoom}
            className="text-xs px-2"
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyDiagram}
            className="h-8 w-8"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadSvg}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="overflow-auto border rounded bg-white dark:bg-gray-50 p-4"
          style={{ maxHeight: '600px' }}
        >
          <div
            ref={diagramRef}
            className="flex justify-center"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-in-out'
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeMermaidHTML(diagramSvg) }}
          />
        </div>
      </CardContent>
    </Card>
  );
}