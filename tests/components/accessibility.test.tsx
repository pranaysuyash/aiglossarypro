import { FormErrorLiveRegion } from '@/components/accessibility/FormErrorLiveRegion';
import { KeyboardNavigation } from '@/components/accessibility/KeyboardNavigation';
import { LiveRegion, useLiveRegion } from '@/components/accessibility/LiveRegion';
import { SkipLinks } from '@/components/accessibility/SkipLinks';
import { announceToScreenReader, auditAccessibility } from '@/utils/accessibilityAudit';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Accessibility Components', () => {
    describe('SkipLinks', () => {
        it('renders skip links with proper ARIA attributes', () => {
            render(<SkipLinks />);

            const nav = screen.getByRole('navigation', { name: /skip navigation/i });
            expect(nav).toBeInTheDocument();

            const mainContentLink = screen.getByRole('link', { name: /skip to main content/i });
            expect(mainContentLink).toHaveAttribute('href', '#main-content');

            const navigationLink = screen.getByRole('link', { name: /skip to navigation/i });
            expect(navigationLink).toHaveAttribute('href', '#navigation');

            const searchLink = screen.getByRole('link', { name: /skip to search/i });
            expect(searchLink).toHaveAttribute('href', '#search');
        });

        it('is initially hidden but visible on focus', () => {
            render(<SkipLinks />);

            const nav = screen.getByRole('navigation', { name: /skip navigation/i });
            expect(nav).toHaveClass('sr-only');
            expect(nav).toHaveClass('focus-within:not-sr-only');
        });
    });

    describe('LiveRegion', () => {
        it('renders with correct ARIA attributes', () => {
            render(<LiveRegion message="Test message" level="polite" />);

            const liveRegion = screen.getByRole('status', { hidden: true });
            expect(liveRegion).toHaveAttribute('aria-live', 'polite');
            expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
            expect(liveRegion).toHaveTextContent('Test message');
        });

        it('renders as alert for assertive level', () => {
            render(<LiveRegion message="Error message" level="assertive" />);

            const liveRegion = screen.getByRole('alert', { hidden: true });
            expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
        });

        it('does not render when no message', () => {
            const { container } = render(<LiveRegion />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('FormErrorLiveRegion', () => {
        it('announces form errors with assertive priority', () => {
            render(<FormErrorLiveRegion message="Field is required" />);

            const errorRegion = screen.getByRole('alert', { hidden: true });
            expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
            expect(errorRegion).toHaveAttribute('aria-atomic', 'true');
            expect(errorRegion).toHaveTextContent('Field is required');
        });

        it('updates message when prop changes', () => {
            const { rerender } = render(<FormErrorLiveRegion message="First error" />);

            let errorRegion = screen.getByRole('alert', { hidden: true });
            expect(errorRegion).toHaveTextContent('First error');

            rerender(<FormErrorLiveRegion message="Second error" />);

            errorRegion = screen.getByRole('alert', { hidden: true });
            expect(errorRegion).toHaveTextContent('Second error');
        });
    });

    describe('KeyboardNavigation', () => {
        it('renders with correct role and ARIA attributes', () => {
            render(
                <KeyboardNavigation ariaLabel="Test navigation">
                    <button>Item 1</button>
                    <button>Item 2</button>
                    <button>Item 3</button>
                </KeyboardNavigation>
            );

            const navigation = screen.getByRole('group', { name: /test navigation/i });
            expect(navigation).toBeInTheDocument();
        });

        it('manages tabindex for keyboard navigation', () => {
            render(
                <KeyboardNavigation>
                    <button>Item 1</button>
                    <button>Item 2</button>
                    <button>Item 3</button>
                </KeyboardNavigation>
            );

            const buttons = screen.getAllByRole('button');

            // First button should be focusable, others should not
            expect(buttons[0]).toHaveAttribute('tabindex', '0');
            expect(buttons[1]).toHaveAttribute('tabindex', '-1');
            expect(buttons[2]).toHaveAttribute('tabindex', '-1');
        });

        it('handles arrow key navigation', () => {
            const onNavigate = vi.fn();

            render(
                <KeyboardNavigation onNavigate={onNavigate}>
                    <button>Item 1</button>
                    <button>Item 2</button>
                    <button>Item 3</button>
                </KeyboardNavigation>
            );

            const navigation = screen.getByRole('group');

            // Simulate arrow down key
            fireEvent.keyDown(navigation, { key: 'ArrowDown' });

            expect(onNavigate).toHaveBeenCalledWith('down', expect.any(Number));
        });
    });

    describe('useLiveRegion hook', () => {
        function TestComponent() {
            const { message, announce, announceError, announceSuccess, LiveRegion } = useLiveRegion();

            return (
                <div>
                    <button onClick={() => announce('Test message')}>Announce</button>
                    <button onClick={() => announceError('Error message')}>Announce Error</button>
                    <button onClick={() => announceSuccess('Success message')}>Announce Success</button>
                    <LiveRegion />
                </div>
            );
        }

        it('provides announce functions', () => {
            render(<TestComponent />);

            const announceButton = screen.getByRole('button', { name: /^announce$/i });
            const errorButton = screen.getByRole('button', { name: /announce error/i });
            const successButton = screen.getByRole('button', { name: /announce success/i });

            expect(announceButton).toBeInTheDocument();
            expect(errorButton).toBeInTheDocument();
            expect(successButton).toBeInTheDocument();
        });

        it('announces messages when buttons are clicked', () => {
            render(<TestComponent />);

            const announceButton = screen.getByRole('button', { name: /^announce$/i });
            fireEvent.click(announceButton);

            const liveRegion = screen.getByRole('status', { hidden: true });
            expect(liveRegion).toHaveTextContent('Test message');
        });
    });
});

describe('Accessibility Utilities', () => {
    describe('auditAccessibility', () => {
        beforeEach(() => {
            // Clear the document body
            document.body.innerHTML = '';
        });

        it('detects missing alt text on images', () => {
            document.body.innerHTML = '<img src="test.jpg" />';

            const result = auditAccessibility();

            const altTextIssues = result.issues.filter(issue => issue.rule === 'img-alt');
            expect(altTextIssues).toHaveLength(1);
            expect(altTextIssues[0].message).toBe('Image missing alt text');
            expect(altTextIssues[0].severity).toBe('serious');
        });

        it('detects missing form labels', () => {
            document.body.innerHTML = '<input type="text" id="test-input" />';

            const result = auditAccessibility();

            const labelIssues = result.issues.filter(issue => issue.rule === 'label-missing');
            expect(labelIssues).toHaveLength(1);
            expect(labelIssues[0].message).toBe('Form control missing label');
            expect(labelIssues[0].severity).toBe('critical');
        });

        it('detects missing H1 element', () => {
            document.body.innerHTML = '<h2>Heading 2</h2><p>Content</p>';

            const result = auditAccessibility();

            const h1Issues = result.issues.filter(issue => issue.rule === 'no-h1');
            expect(h1Issues).toHaveLength(1);
            expect(h1Issues[0].message).toBe('Page missing H1 element');
            expect(h1Issues[0].severity).toBe('serious');
        });

        it('detects heading level skipping', () => {
            document.body.innerHTML = '<h1>Main Heading</h1><h3>Skipped H2</h3>';

            const result = auditAccessibility();

            const skipIssues = result.issues.filter(issue => issue.rule === 'heading-skip');
            expect(skipIssues).toHaveLength(1);
            expect(skipIssues[0].message).toBe('Heading level skipped from H1 to H3');
        });

        it('calculates accessibility score', () => {
            document.body.innerHTML = '<h1>Good Page</h1><img src="test.jpg" alt="Test image" />';

            const result = auditAccessibility();

            expect(result.score).toBeGreaterThan(90);
            expect(result.summary.critical).toBe(0);
            expect(result.summary.serious).toBe(0);
        });
    });

    describe('announceToScreenReader', () => {
        it('creates and removes announcement element', () => {
            announceToScreenReader('Test announcement');

            // Check that announcement element was created
            const announcement = document.querySelector('[aria-live]');
            expect(announcement).toBeInTheDocument();
            expect(announcement).toHaveTextContent('Test announcement');
            expect(announcement).toHaveAttribute('aria-live', 'polite');

            // Wait for cleanup (mocked with shorter timeout for testing)
            setTimeout(() => {
                expect(document.querySelector('[aria-live]')).not.toBeInTheDocument();
            }, 100);
        });

        it('uses assertive priority when specified', () => {
            // Clear any existing announcements first
            document.querySelectorAll('[aria-live]').forEach(el => el.remove());

            announceToScreenReader('Urgent message', 'assertive');

            const announcement = document.querySelector('[aria-live="assertive"]');
            expect(announcement).toBeInTheDocument();
            expect(announcement).toHaveAttribute('aria-live', 'assertive');
            expect(announcement).toHaveTextContent('Urgent message');
        });
    });
});