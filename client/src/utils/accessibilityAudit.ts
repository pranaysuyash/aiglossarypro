/**
 * Accessibility Audit Utilities
 * Tools for checking and improving accessibility compliance
 */

interface AccessibilityIssue {
    type: 'error' | 'warning' | 'info';
    rule: string;
    message: string;
    element?: Element;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

interface AccessibilityAuditResult {
    issues: AccessibilityIssue[];
    score: number;
    summary: {
        critical: number;
        serious: number;
        moderate: number;
        minor: number;
    };
}

/**
 * Performs a basic accessibility audit on the current page
 */
export function auditAccessibility(): AccessibilityAuditResult {
    const issues: AccessibilityIssue[] = [];

    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
            issues.push({
                type: 'error',
                rule: 'img-alt',
                message: 'Image missing alt text',
                element: img,
                severity: 'serious',
            });
        }
    });

    // Check for missing form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
            input.getAttribute('aria-label') ||
            input.getAttribute('aria-labelledby');

        if (!hasLabel && input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
            issues.push({
                type: 'error',
                rule: 'label-missing',
                message: 'Form control missing label',
                element: input,
                severity: 'critical',
            });
        }
    });

    // Check for missing heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let hasH1 = false;
    let previousLevel = 0;

    headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));

        if (level === 1) {
            if (hasH1) {
                issues.push({
                    type: 'warning',
                    rule: 'multiple-h1',
                    message: 'Multiple H1 elements found',
                    element: heading,
                    severity: 'moderate',
                });
            }
            hasH1 = true;
        }

        if (previousLevel > 0 && level > previousLevel + 1) {
            issues.push({
                type: 'warning',
                rule: 'heading-skip',
                message: `Heading level skipped from H${previousLevel} to H${level}`,
                element: heading,
                severity: 'moderate',
            });
        }

        previousLevel = level;
    });

    if (!hasH1) {
        issues.push({
            type: 'error',
            rule: 'no-h1',
            message: 'Page missing H1 element',
            severity: 'serious',
        });
    }

    // Check for missing focus indicators
    const focusableElements = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
        // Note: jsdom doesn't support pseudo-elements, so we check base styles
        // In a real browser, we would check :focus pseudo-element
        let computedStyle;
        try {
            computedStyle = window.getComputedStyle(element);
        } catch (error) {
            // Fallback for testing environments
            return;
        }
        
        const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '0px';
        const hasBoxShadow = computedStyle.boxShadow !== 'none';
        const hasBorder = computedStyle.borderWidth !== '0px';

        if (!hasOutline && !hasBoxShadow && !hasBorder) {
            issues.push({
                type: 'warning',
                rule: 'focus-indicator',
                message: 'Element may be missing focus indicator',
                element: element,
                severity: 'moderate',
            });
        }
    });

    // Check for color contrast (basic check)
    const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6');
    textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;

        // This is a simplified check - in production, you'd use a proper contrast ratio calculator
        if (color === backgroundColor) {
            issues.push({
                type: 'error',
                rule: 'color-contrast',
                message: 'Text color same as background color',
                element: element,
                severity: 'critical',
            });
        }
    });

    // Check for missing ARIA landmarks
    const landmarks = document.querySelectorAll('[role="main"], main, [role="navigation"], nav, [role="banner"], header, [role="contentinfo"], footer');
    if (landmarks.length === 0) {
        issues.push({
            type: 'warning',
            rule: 'landmarks',
            message: 'Page missing ARIA landmarks',
            severity: 'moderate',
        });
    }

    // Check for keyboard accessibility
    const interactiveElements = document.querySelectorAll('div[onclick], span[onclick]');
    interactiveElements.forEach(element => {
        if (!element.getAttribute('tabindex') && !element.getAttribute('role')) {
            issues.push({
                type: 'error',
                rule: 'keyboard-access',
                message: 'Interactive element not keyboard accessible',
                element: element,
                severity: 'serious',
            });
        }
    });

    // Calculate summary
    const summary = {
        critical: issues.filter(i => i.severity === 'critical').length,
        serious: issues.filter(i => i.severity === 'serious').length,
        moderate: issues.filter(i => i.severity === 'moderate').length,
        minor: issues.filter(i => i.severity === 'minor').length,
    };

    // Calculate score (100 - weighted penalty)
    const score = Math.max(0, 100 - (
        summary.critical * 25 +
        summary.serious * 10 +
        summary.moderate * 5 +
        summary.minor * 1
    ));

    return {
        issues,
        score,
        summary,
    };
}

/**
 * Checks if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if the user prefers high contrast
 */
export function prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Gets the user's preferred color scheme
 */
export function getPreferredColorScheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Announces a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
        if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
        }
    }, 1000);
}

/**
 * Manages focus for modal dialogs and overlays
 */
export class FocusManager {
    private previousActiveElement: Element | null = null;
    private focusableElements: Element[] = [];

    constructor(private container: Element) {
        this.updateFocusableElements();
    }

    private updateFocusableElements() {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        this.focusableElements = Array.from(
            this.container.querySelectorAll(focusableSelectors)
        ).filter(element => {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
    }

    trapFocus() {
        this.previousActiveElement = document.activeElement;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            this.updateFocusableElements();

            if (this.focusableElements.length === 0) return;

            const firstElement = this.focusableElements[0] as HTMLElement;
            const lastElement = this.focusableElements[this.focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Focus first element
        if (this.focusableElements.length > 0) {
            (this.focusableElements[0] as HTMLElement).focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }

    restoreFocus() {
        if (this.previousActiveElement && 'focus' in this.previousActiveElement) {
            (this.previousActiveElement as HTMLElement).focus();
        }
    }
}

/**
 * Calculates color contrast ratio
 */
export function calculateContrastRatio(color1: string, color2: string): number {
    // This is a simplified implementation
    // In production, you'd use a proper color contrast library

    const getLuminance = (color: string): number => {
        // Convert color to RGB and calculate relative luminance
        // This is a placeholder - implement proper luminance calculation
        return 0.5; // Placeholder
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if color contrast meets WCAG guidelines
 */
export function meetsContrastRequirements(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
    size: 'normal' | 'large' = 'normal'
): boolean {
    const ratio = calculateContrastRatio(foreground, background);

    if (level === 'AAA') {
        return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    } else {
        return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    }
}

/**
 * Runs accessibility audit and logs results
 */
export function runAccessibilityAudit(): void {
    if (import.meta.env.DEV) {
        const result = auditAccessibility();

        console.group('🔍 Accessibility Audit Results');
        console.log(`Score: ${result.score}/100`);
        console.log('Summary:', result.summary);

        if (result.issues.length > 0) {
            console.group('Issues Found:');
            result.issues.forEach(issue => {
                const logLevel = issue.severity === 'critical' ? 'error' :
                    issue.severity === 'serious' ? 'warn' : 'info';
                console[logLevel](`[${issue.rule}] ${issue.message}`, issue.element);
            });
            console.groupEnd();
        } else {
            console.log('✅ No accessibility issues found!');
        }

        console.groupEnd();
    }
}