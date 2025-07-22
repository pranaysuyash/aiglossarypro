/**
 * Math Renderer component with KaTeX support
 * Lazy loads KaTeX library to reduce bundle size
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

// Lazy load KaTeX library and CSS
const katexLoader = lazy(() =>
  import('katex').then(module => ({ default: module.default }))
);

interface MathRendererProps {
  math: string;
  displayMode?: boolean; // true for block math, false for inline
  throwOnError?: boolean;
  fontSize?: 'small' | 'normal' | 'large';
  color?: string;
}

function MathLoading({ displayMode = false }: { displayMode?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${displayMode ? 'h-16' : 'h-6'} bg-gray-50 rounded`}>
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" />
        <span className="text-xs text-gray-600">Loading math...</span>
      </div>
    </div>
  );
}

function KaTeXRenderer({
  math,
  displayMode = false,
  throwOnError = false,
  fontSize = 'normal',
  color
}: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const renderMath = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import KaTeX and CSS
        const [katex] = await Promise.all([
          import('katex'),
          import('katex/dist/katex.min.css') // Import CSS
        ]);

        if (containerRef.current && mounted) {
          // Clear previous content
          containerRef.current.innerHTML = '';

          // Render the math
          katex.default.render(math, containerRef.current, {
            displayMode,
            throwOnError,
            strict: false,
            trust: false,
            macros: {
              "\\RR": "\\mathbb{R}",
              "\\NN": "\\mathbb{N}",
              "\\ZZ": "\\mathbb{Z}",
              "\\QQ": "\\mathbb{Q}",
              "\\CC": "\\mathbb{C}",
            }
          });

          // Apply custom styling
          if (containerRef.current) {
            const mathElement = containerRef.current.querySelector('.katex');
            if (mathElement) {
              // Apply font size
              const fontSizeMap = {
                small: '0.875rem',
                normal: '1rem',
                large: '1.25rem'
              };
              (mathElement as HTMLElement).style.fontSize = fontSizeMap[fontSize];

              // Apply color
              if (color) {
                (mathElement as HTMLElement).style.color = color;
              }
            }
          }

          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to render math');
          setIsLoading(false);
        }
      }
    };

    renderMath();

    return () => {
      mounted = false;
    };
  }, [math, displayMode, throwOnError, fontSize, color]);

  if (isLoading) {
    return <MathLoading displayMode={displayMode} />;
  }

  if (error) {
    return (
      <div className={`p-2 bg-red-50 border border-red-200 rounded ${displayMode ? 'block' : 'inline-block'}`}>
        <span className="text-xs text-red-600">Math Error: {error}</span>
        <details className="mt-1">
          <summary className="cursor-pointer text-xs text-red-700">Show source</summary>
          <code className="text-xs bg-red-100 p-1 rounded">{math}</code>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={displayMode ? 'math-display my-4' : 'math-inline'}
    />
  );
}

function SimpleMathFallback({ math, displayMode = false }: { math: string; displayMode?: boolean }) {
  return (
    <code className={`bg-gray-100 px-2 py-1 rounded font-mono text-sm ${displayMode ? 'block my-2' : 'inline'}`}>
      {math}
    </code>
  );
}

export function MathRenderer({
  math,
  displayMode = false,
  throwOnError = false,
  fontSize = 'normal',
  color
}: MathRendererProps) {
  const [showFallback, setShowFallback] = useState(false);

  if (showFallback) {
    return <SimpleMathFallback math={math} displayMode={displayMode} />;
  }

  return (
    <div className="relative group">
      <Suspense fallback={<MathLoading displayMode={displayMode} />}>
        <KaTeXRenderer
          math={math}
          displayMode={displayMode}
          throwOnError={throwOnError}
          fontSize={fontSize}
          color={color}
        />
      </Suspense>

      {/* Show fallback button on hover */}
      <button
        onClick={() => setShowFallback(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-gray-700 bg-white border rounded px-1"
        title="Show LaTeX source"
      >
        src
      </button>
    </div>
  );
}

// Inline math component
export function InlineMath({ children }: { children: string }) {
  return <MathRenderer math={children} displayMode={false} />;
}

// Block math component
export function BlockMath({ children }: { children: string }) {
  return <MathRenderer math={children} displayMode={true} />;
}

// Alias for backward compatibility
export const MathText = MathRenderer;

// Example math expressions for testing
export const exampleMath = {
  inline: 'E = mc^2',
  quadratic: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  integral: '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
  matrix: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  summation: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
  limit: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1'
};

export default MathRenderer;