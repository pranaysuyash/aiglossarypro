/**
 * Component that safely renders text with both mathematical expressions and HTML highlighting
 * Used for search results and other contexts where we need both math and HTML support
 */

import DOMPurify from 'isomorphic-dompurify';
import React from 'react';
import { MathText } from './MathRenderer';

interface MathAwareTextProps {
  /** Text content that may contain HTML and/or mathematical expressions */
  content: string;
  /** Whether the content is already sanitized HTML */
  isHTML?: boolean;
  /** CSS class for the container */
  className?: string;
  /** CSS class for mathematical expressions */
  mathClassName?: string;
  /** Whether to allow HTML tags (for highlighted search results) */
  allowHTML?: boolean;
}

/**
 * Safely renders text that may contain both HTML (from search highlighting) 
 * and mathematical expressions (LaTeX notation)
 */
export const MathAwareText: React.FC<MathAwareTextProps> = ({
  content,
  isHTML = false,
  className = '',
  mathClassName = '',
  allowHTML = false,
}) => {
  // If it's already HTML (like highlighted search results), parse it carefully
  if (isHTML || allowHTML) {
    // Sanitize HTML first to prevent XSS
    const sanitizedHTML = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['mark', 'strong', 'em', 'span', 'b', 'i'],
      ALLOWED_ATTR: ['class'],
    });

    // Check if the sanitized content contains mathematical expressions
    const hasMath = /\$[^$]+\$|\$\$[\s\S]+?\$\$|\\begin\{[\s\S]*?\\end\{[^}]+\}|\\\\[\s\S]*?\\\\/.test(sanitizedHTML);

    if (hasMath) {
      // For content with both HTML and math, we need to parse more carefully
      return (
        <span className={className}>
          <MathText mathClassName={mathClassName}>
            {sanitizedHTML}
          </MathText>
        </span>
      );
    } else {
      // No math detected, just render the sanitized HTML
      return (
        <span 
          className={className}
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    }
  }

  // For plain text that might contain math
  return (
    <MathText className={className} mathClassName={mathClassName}>
      {content}
    </MathText>
  );
};

/**
 * Hook to detect if text content contains mathematical expressions
 */
export const useHasMath = (content: string): boolean => {
  return React.useMemo(() => {
    return /\$[^$]+\$|\$\$[\s\S]+?\$\$|\\begin\{[\s\S]*?\\end\{[^}]+\}|\\\\[\s\S]*?\\\\/.test(content);
  }, [content]);
};

/**
 * Utility function to extract mathematical expressions from text
 */
export const extractMathExpressions = (text: string): Array<{
  type: 'text' | 'math';
  content: string;
  displayMode?: boolean;
}> => {
  const segments: Array<{ type: 'text' | 'math'; content: string; displayMode?: boolean }> = [];
  
  // Split text by LaTeX delimiters
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$|\\begin\{[\s\S]*?\\end\{[^}]+\}|\\\\[\s\S]*?\\\\)/);
  
  parts.forEach((part) => {
    if (!part) return;
    
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
};

export default MathAwareText;