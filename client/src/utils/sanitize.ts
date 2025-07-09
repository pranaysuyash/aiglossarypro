import type { Config } from 'dompurify';
import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(dirty: string, options?: Config): string {
  // Configure DOMPurify with safe defaults
  const defaultConfig: Config = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'em',
      'strong',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
      'sup',
      'sub',
      'i',
      'b',
      'u',
      'mark',
      'del',
      'ins',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'id',
      'target',
      'rel',
      'width',
      'height',
      'style',
    ],
    // Allow data: URLs for images
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Ensure links open safely
    ADD_ATTR: ['target', 'rel'],
    // Force target="_blank" and rel="noopener noreferrer" on all links
    FORCE_BODY: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SAFE_FOR_TEMPLATES: true,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    ...options,
  };

  // Sanitize the HTML
  const clean = DOMPurify.sanitize(dirty, defaultConfig);

  // Additional safety: ensure all external links have proper attributes
  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = clean;

    // Add security attributes to all external links
    tempDiv.querySelectorAll('a[href^="http"]').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    return tempDiv.innerHTML;
  }

  return clean;
}

/**
 * Sanitizes HTML for math formulas (allows more tags)
 */
export function sanitizeMathHTML(dirty: string): string {
  return sanitizeHTML(dirty, {
    ADD_TAGS: ['math', 'mrow', 'mn', 'mo', 'mi', 'msup', 'msub', 'mfrac', 'mroot', 'msqrt'],
    ADD_ATTR: ['xmlns', 'display', 'mathvariant'],
  });
}

/**
 * Sanitizes HTML for Mermaid diagrams (SVG content)
 */
export function sanitizeMermaidHTML(dirty: string): string {
  return sanitizeHTML(dirty, {
    ADD_TAGS: [
      'svg',
      'g',
      'path',
      'rect',
      'circle',
      'ellipse',
      'line',
      'polyline',
      'polygon',
      'text',
      'tspan',
      'defs',
      'marker',
    ],
    ADD_ATTR: [
      'viewBox',
      'xmlns',
      'd',
      'fill',
      'stroke',
      'stroke-width',
      'transform',
      'x',
      'y',
      'x1',
      'y1',
      'x2',
      'y2',
      'cx',
      'cy',
      'r',
      'rx',
      'ry',
      'points',
      'markerWidth',
      'markerHeight',
      'markerUnits',
      'refX',
      'refY',
      'orient',
    ],
  });
}
