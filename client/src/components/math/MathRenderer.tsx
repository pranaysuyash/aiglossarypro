/**
 * Mathematical Expression Renderer using KaTeX
 * Renders LaTeX mathematical expressions in AI/ML term definitions
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';
import React, { useEffect, useRef } from 'react';

interface MathRendererProps {
  math: string;
  displayMode?: boolean;
  className?: string | undefined;
  errorColor?: string;
  macros?: Record<string, string>;
}

/**
 * Component for rendering mathematical expressions using KaTeX
 */
const MathRenderer: React.FC<MathRendererProps> = ({
  math,
  displayMode = false,
  className = '',
  errorColor = '#cc0000',
  macros = {},
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && math) {
      try {
        katex.render(math, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor,
          macros: {
            // Common AI/ML mathematical notation macros
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\C': '\\mathbb{C}',
            '\\E': '\\mathbb{E}',
            '\\Var': '\\mathrm{Var}',
            '\\Cov': '\\mathrm{Cov}',
            '\\argmax': '\\mathop{\\mathrm{argmax}}',
            '\\argmin': '\\mathop{\\mathrm{argmin}}',
            '\\softmax': '\\mathrm{softmax}',
            '\\sigmoid': '\\mathrm{sigmoid}',
            '\\ReLU': '\\mathrm{ReLU}',
            '\\tanh': '\\mathrm{tanh}',
            '\\gradient': '\\nabla',
            '\\loss': '\\mathcal{L}',
            '\\data': '\\mathcal{D}',
            '\\model': '\\mathcal{M}',
            '\\params': '\\boldsymbol{\\theta}',
            '\\weights': '\\mathbf{W}',
            '\\bias': '\\mathbf{b}',
            '\\input': '\\mathbf{x}',
            '\\output': '\\mathbf{y}',
            '\\hidden': '\\mathbf{h}',
            '\\embedding': '\\mathbf{e}',
            '\\attention': '\\mathrm{Attention}',
            '\\transformer': '\\mathrm{Transformer}',
            ...macros,
          },
          trust: true,
          strict: false,
        });
      } catch (error: any) {
        console.warn('KaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = math;
          containerRef.current.style.color = errorColor;
        }
      }
    }
  }, [math, displayMode, errorColor, macros]);

  if (!math) {
    return null;
  }

  return (
    <span
      ref={containerRef}
      className={`math-renderer ${displayMode ? 'math-display' : 'math-inline'} ${className}`}
      role="img"
      aria-label={`Mathematical expression: ${math}`}
    />
  );
};

/**
 * Hook for detecting and parsing mathematical expressions in text
 */
export const useMathParsing = (text: string) => {
  return React.useMemo(() => {
    const segments: Array<{ type: 'text' | 'math'; content: string; displayMode?: boolean }> = [];

    // Split text by LaTeX delimiters
    const parts = text.split(
      /(\$\$[\s\S]*?\$\$|\$[^$]+?\$|\\begin\{[\s\S]*?\\end\{[^}]+\}|\\\\[\s\S]*?\\\\)/
    );

    parts.forEach(part => {
      if (!part) {return;}

      // Display math ($$...$$)
      if (part.startsWith('$$') && part.endsWith('$$')) {
        segments.push({
          type: 'math',
          content: part.slice(2, -2),
          displayMode: true,
        });
      }
      // Inline math ($...$)
      else if (part.startsWith('$') && part.endsWith('$')) {
        segments.push({
          type: 'math',
          content: part.slice(1, -1),
          displayMode: false,
        });
      }
      // LaTeX environments (\begin...\end)
      else if (part.includes('\\begin') && part.includes('\\end')) {
        segments.push({
          type: 'math',
          content: part,
          displayMode: true,
        });
      }
      // Double backslash notation (\\...\\)
      else if (part.startsWith('\\\\') && part.endsWith('\\\\')) {
        segments.push({
          type: 'math',
          content: part.slice(2, -2),
          displayMode: false,
        });
      }
      // Regular text
      else {
        segments.push({
          type: 'text',
          content: part,
        });
      }
    });

    return segments;
  }, [text]);
};

/**
 * Component for rendering text with embedded mathematical expressions
 */
export const MathText: React.FC<{
  children: string;
  className?: string | undefined;
  mathClassName?: string;
}> = ({ children, className = '', mathClassName = '' }) => {
  const segments = useMathParsing(children);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'math') {
          return (
            <MathRenderer
              key={index}
              math={segment.content}
              {...(segment.displayMode !== undefined && { displayMode: segment.displayMode })}
              className={mathClassName}
            />
          );
        } 
          return (
            <span key={index} className={className}>
              {segment.content}
            </span>
          );
        
      })}
    </span>
  );
};

export default MathRenderer;
