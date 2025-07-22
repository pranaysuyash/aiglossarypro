/**
 * Diagram Viewer component with Mermaid support
 * Lazy loads Mermaid library to reduce bundle size
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

// Lazy load Mermaid library
const mermaidLoader = lazy(() =>
    import('mermaid').then(module => ({ default: module.default }))
);

interface DiagramViewerProps {
    diagram: string;
    type?: 'mermaid' | 'flowchart' | 'sequence' | 'gantt';
    theme?: 'default' | 'dark' | 'forest' | 'neutral';
    width?: string;
    height?: string;
}

function DiagramLoading() {
    return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md border">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">Loading diagram...</p>
                <p className="mt-1 text-xs text-gray-500">Initializing Mermaid renderer</p>
            </div>
        </div>
    );
}

function MermaidDiagram({
    diagram,
    theme = 'default',
    width = '100%',
    height = 'auto'
}: DiagramViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const renderDiagram = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Dynamically import mermaid
                const mermaid = (await import('mermaid')).default;

                // Initialize mermaid with theme
                mermaid.initialize({
                    startOnLoad: false,
                    theme: theme,
                    securityLevel: 'loose',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                });

                if (containerRef.current && mounted) {
                    // Clear previous content
                    containerRef.current.innerHTML = '';

                    // Generate unique ID for this diagram
                    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    // Render the diagram
                    const { svg } = await mermaid.render(id, diagram);

                    if (mounted && containerRef.current) {
                        containerRef.current.innerHTML = svg;
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to render diagram');
                    setIsLoading(false);
                }
            }
        };

        renderDiagram();

        return () => {
            mounted = false;
        };
    }, [diagram, theme]);

    if (isLoading) {
        return <DiagramLoading />;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-800">Diagram Error</h3>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-700">Show diagram source</summary>
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                        {diagram}
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="diagram-container overflow-auto"
            style={{ width, height }}
        />
    );
}

function SimpleDiagramFallback({ diagram }: { diagram: string }) {
    return (
        <div className="p-4 bg-gray-50 border rounded-md">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Diagram Source</h3>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                {diagram}
            </pre>
            <p className="mt-2 text-xs text-gray-600">
                Diagram rendering is not available. Showing source code instead.
            </p>
        </div>
    );
}

export function DiagramViewer({
    diagram,
    type = 'mermaid',
    theme = 'default',
    width = '100%',
    height = 'auto'
}: DiagramViewerProps) {
    const [showFallback, setShowFallback] = useState(false);

    if (showFallback) {
        return <SimpleDiagramFallback diagram={diagram} />;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                    Diagram ({type})
                </label>
                <div className="flex items-center space-x-2">
                    <select
                        value={theme}
                        onChange={(e) => {
                            // Theme change would be handled by parent component
                        }}
                        className="text-xs border rounded px-2 py-1"
                    >
                        <option value="default">Default</option>
                        <option value="dark">Dark</option>
                        <option value="forest">Forest</option>
                        <option value="neutral">Neutral</option>
                    </select>
                    <button
                        onClick={() => setShowFallback(!showFallback)}
                        className="text-xs text-gray-600 hover:text-gray-800"
                    >
                        {showFallback ? 'Show Diagram' : 'Show Source'}
                    </button>
                </div>
            </div>

            <Suspense fallback={<DiagramLoading />}>
                <MermaidDiagram
                    diagram={diagram}
                    type={type}
                    theme={theme}
                    width={width}
                    height={height}
                />
            </Suspense>
        </div>
    );
}

// Example diagrams for testing
export const exampleDiagrams = {
    flowchart: `
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
  `,
    sequence: `
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob, how are you?
    B-->>A: Great!
    A-)B: See you later!
  `,
    gantt: `
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2024-01-01, 30d
    Another task     :after a1  , 20d
  `
};

export default DiagramViewer;