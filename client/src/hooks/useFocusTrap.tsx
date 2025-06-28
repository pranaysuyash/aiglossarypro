import { useEffect, useRef } from 'react';

/**
 * Custom hook for implementing focus trap functionality
 * Ensures keyboard navigation stays within a specific container
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Store the currently focused element
    lastFocusedElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        'area[href]',
        'iframe',
        'object',
        'embed',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable]'
      ].join(',');

      return Array.from(container.querySelectorAll(focusableSelectors))
        .filter(el => {
          const element = el as HTMLElement;
          return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
        }) as HTMLElement[];
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab (reverse)
        if (currentElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab (forward)
        if (currentElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        // Allow parent components to handle escape
        const escapeEvent = new CustomEvent('focustrap:escape', {
          bubbles: true,
          cancelable: true
        });
        container.dispatchEvent(escapeEvent);
      }
    };

    // Focus the first focusable element when activated
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore focus to the previously focused element
      if (lastFocusedElement.current && document.contains(lastFocusedElement.current)) {
        lastFocusedElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing focus lock overlay
 * Prevents interaction with background content when overlay is active
 */
export function useFocusLock(isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const originalBodyStyle = document.body.style.overflow;
    const originalBodyPointerEvents = document.body.style.pointerEvents;
    
    // Prevent scrolling and pointer events on body
    document.body.style.overflow = 'hidden';
    
    // Add aria-hidden to all non-overlay content
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    
    [mainContent, header, footer].forEach(element => {
      if (element) {
        element.setAttribute('aria-hidden', 'true');
        element.style.pointerEvents = 'none';
      }
    });

    return () => {
      // Restore original styles
      document.body.style.overflow = originalBodyStyle;
      document.body.style.pointerEvents = originalBodyPointerEvents;
      
      // Remove aria-hidden from content
      [mainContent, header, footer].forEach(element => {
        if (element) {
          element.removeAttribute('aria-hidden');
          element.style.pointerEvents = '';
        }
      });
    };
  }, [isActive]);
}