import { useCallback, useEffect, useRef } from 'react';

interface FocusOptions {
    preventScroll?: boolean;
    restoreOnUnmount?: boolean;
}

/**
 * Hook for managing focus in an accessible way
 */
export function useAccessibleFocus<T extends HTMLElement = HTMLElement>(
    options: FocusOptions = {}
) {
    const elementRef = useRef<T>(null);
    const previousActiveElementRef = useRef<Element | null>(null);

    const focus = useCallback((focusOptions?: FocusOptions) => {
        if (elementRef.current) {
            // Store the currently focused element
            previousActiveElementRef.current = document.activeElement;

            // Focus the element
            elementRef.current.focus({
                preventScroll: focusOptions?.preventScroll ?? options.preventScroll ?? false,
            });
        }
    }, [options.preventScroll]);

    const blur = useCallback(() => {
        if (elementRef.current) {
            elementRef.current.blur();
        }
    }, []);

    const restoreFocus = useCallback(() => {
        if (previousActiveElementRef.current && 'focus' in previousActiveElementRef.current) {
            (previousActiveElementRef.current as HTMLElement).focus();
        }
    }, []);

    // Restore focus on unmount if requested
    useEffect(() => {
        return () => {
            if (options.restoreOnUnmount) {
                restoreFocus();
            }
        };
    }, [options.restoreOnUnmount, restoreFocus]);

    return {
        ref: elementRef,
        focus,
        blur,
        restoreFocus,
    };
}

/**
 * Hook for trapping focus within a container (useful for modals, dropdowns)
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
    isActive: boolean = true
) {
    const containerRef = useRef<T>(null);
    const previousActiveElementRef = useRef<Element | null>(null);

    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];

        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
        ].join(', ');

        return Array.from(containerRef.current.querySelectorAll(focusableSelectors))
            .filter(element => {
                const style = window.getComputedStyle(element);
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    !element.hasAttribute('aria-hidden')
                );
            }) as HTMLElement[];
    }, []);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!isActive || event.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey) {
            // Shift + Tab
            if (activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }, [isActive, getFocusableElements]);

    const handleEscapeKey = useCallback((event: KeyboardEvent) => {
        if (isActive && event.key === 'Escape') {
            // Allow parent components to handle escape
            event.stopPropagation();
        }
    }, [isActive]);

    useEffect(() => {
        if (isActive) {
            // Store the previously focused element
            previousActiveElementRef.current = document.activeElement;

            // Focus the first focusable element in the container
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }

            // Add event listeners
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keydown', handleEscapeKey);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keydown', handleEscapeKey);

                // Restore focus to the previously focused element
                if (previousActiveElementRef.current && 'focus' in previousActiveElementRef.current) {
                    (previousActiveElementRef.current as HTMLElement).focus();
                }
            };
        }
    }, [isActive, handleKeyDown, handleEscapeKey, getFocusableElements]);

    return {
        ref: containerRef,
        getFocusableElements,
    };
}

/**
 * Hook for managing roving tabindex (useful for toolbars, menus)
 */
export function useRovingTabIndex<T extends HTMLElement = HTMLElement>(
    items: T[],
    orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
    const activeIndexRef = useRef(0);

    const setActiveIndex = useCallback((index: number) => {
        if (index >= 0 && index < items.length) {
            // Remove tabindex from all items
            items.forEach((item, i) => {
                item.setAttribute('tabindex', i === index ? '0' : '-1');
            });

            activeIndexRef.current = index;
            items[index].focus();
        }
    }, [items]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const { key } = event;
        const currentIndex = activeIndexRef.current;
        let newIndex = currentIndex;

        if (orientation === 'horizontal') {
            if (key === 'ArrowLeft') {
                newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            } else if (key === 'ArrowRight') {
                newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            }
        } else {
            if (key === 'ArrowUp') {
                newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            } else if (key === 'ArrowDown') {
                newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            }
        }

        if (key === 'Home') {
            newIndex = 0;
        } else if (key === 'End') {
            newIndex = items.length - 1;
        }

        if (newIndex !== currentIndex) {
            event.preventDefault();
            setActiveIndex(newIndex);
        }
    }, [items, orientation, setActiveIndex]);

    useEffect(() => {
        // Initialize tabindex
        items.forEach((item, index) => {
            item.setAttribute('tabindex', index === 0 ? '0' : '-1');
            item.addEventListener('keydown', handleKeyDown);
        });

        return () => {
            items.forEach(item => {
                item.removeEventListener('keydown', handleKeyDown);
            });
        };
    }, [items, handleKeyDown]);

    return {
        activeIndex: activeIndexRef.current,
        setActiveIndex,
    };
}

/**
 * Hook for managing focus announcements
 */
export function useFocusAnnouncement() {
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
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
    }, []);

    const announceFocusChange = useCallback((elementDescription: string) => {
        announce(`Focused on ${elementDescription}`, 'polite');
    }, [announce]);

    const announceError = useCallback((errorMessage: string) => {
        announce(`Error: ${errorMessage}`, 'assertive');
    }, [announce]);

    const announceSuccess = useCallback((successMessage: string) => {
        announce(`Success: ${successMessage}`, 'polite');
    }, [announce]);

    return {
        announce,
        announceFocusChange,
        announceError,
        announceSuccess,
    };
}

/**
 * Hook for detecting and handling focus visibility
 */
export function useFocusVisible() {
    const hadKeyboardEvent = useRef(true);
    const keyboardThrottleTimeoutRef = useRef<number>();

    useEffect(() => {
        const handlePointerDown = () => {
            hadKeyboardEvent.current = false;
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.altKey || event.ctrlKey) {
                return;
            }
            hadKeyboardEvent.current = true;
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                hadKeyboardEvent.current = true;
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('mousedown', handlePointerDown, true);
        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('touchstart', handlePointerDown, true);
        document.addEventListener('visibilitychange', handleVisibilityChange, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('mousedown', handlePointerDown, true);
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('touchstart', handlePointerDown, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange, true);
        };
    }, []);

    const isFocusVisible = useCallback((event: FocusEvent) => {
        const { target } = event;
        if (!target || !(target instanceof HTMLElement)) {
            return false;
        }

        return (
            hadKeyboardEvent.current ||
            target.matches(':focus-visible') ||
            target.matches('[data-focus-visible-added]')
        );
    }, []);

    return { isFocusVisible };
}