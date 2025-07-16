import React, { useEffect, useState } from 'react';
import katex from 'katex';
// Remove the static import of KaTeX CSS
// import 'katex/dist/katex.min.css';

interface MathRendererProps {
  expression: string;
  displayMode?: boolean;
  className?: string;
  throwOnError?: boolean;
}

// Lazy load KaTeX CSS only when needed
const loadKatexCSS = () => {
  if (!document.getElementById('katex-css')) {
    const link = document.createElement('link');
    link.id = 'katex-css';
    link.rel = 'stylesheet';
    link.href = '/assets/vendor-math-CIur2ABi.css'; // Use the already bundled version
    document.head.appendChild(link);
  }
};

export const MathRenderer: React.FC<MathRendererProps> = ({
  expression,
  displayMode = false,
  className = '',
  throwOnError = false,
}) => {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    // Load CSS on first render
    if (!cssLoaded) {
      loadKatexCSS();
      setCssLoaded(true);
    }

    try {
      const rendered = katex.renderToString(expression, {
        displayMode,
        throwOnError,
        output: 'html',
        trust: false,
        strict: 'ignore',
      });
      setHtml(rendered);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render expression');
      setHtml('');
    }
  }, [expression, displayMode, throwOnError, cssLoaded]);

  if (error) {
    return (
      <span className={`math-renderer math-error ${className}`}>
        <span className="katex-error" title={error}>
          {expression}
        </span>
      </span>
    );
  }

  if (!cssLoaded) {
    return (
      <span className={`math-renderer loading ${className}`}>
        {expression}
      </span>
    );
  }

  return (
    <span
      className={`math-renderer ${displayMode ? 'math-display' : 'math-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      role="img"
      aria-label={`Mathematical expression: ${expression}`}
    />
  );
};