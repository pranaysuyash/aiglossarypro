import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationProps {
    children: React.ReactNode;
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    className?: string;
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right', currentIndex: number) => void;
    role?: string;
    ariaLabel?: string;
    startIndex?: number;
}

/**
 * KeyboardNavigation Component
 * 
 * Provides keyboard navigation for a group of focusable elements.
 * Supports arrow key navigation with optional wrapping.
 */
export function KeyboardNavigation({
    children,
    orientation = 'vertical',
    wrap = true,
    className,
    onNavigate,
    role = 'group',
    ariaLabel,
    startIndex = 0
}: KeyboardNavigationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentIndexRef = useRef(startIndex);

    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];

        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([aria-disabled="true"])',
            '[role="menuitem"]:not([aria-disabled="true"])',
            '[role="option"]:not([aria-disabled="true"])',
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

    const updateTabIndex = useCallback((activeIndex: number) => {
        const elements = getFocusableElements();
        elements.forEach((element, index) => {
            element.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
        });
    }, [getFocusableElements]);

    const focusElement = useCallback((index: number) => {
        const elements = getFocusableElements();
        if (elements[index]) {
            currentIndexRef.current = index;
            updateTabIndex(index);
            elements[index].focus();
        }
    }, [getFocusableElements, updateTabIndex]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        const currentIndex = currentIndexRef.current;
        let newIndex = currentIndex;
        let direction: 'up' | 'down' | 'left' | 'right' | null = null;

        switch (event.key) {
            case 'ArrowUp':
                if (orientation === 'vertical' || orientation === 'both') {
                    event.preventDefault();
                    direction = 'up';
                    newIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? elements.length - 1 : currentIndex);
                }
                break;

            case 'ArrowDown':
                if (orientation === 'vertical' || orientation === 'both') {
                    event.preventDefault();
                    direction = 'down';
                    newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : (wrap ? 0 : currentIndex);
                }
                break;

            case 'ArrowLeft':
                if (orientation === 'horizontal' || orientation === 'both') {
                    event.preventDefault();
                    direction = 'left';
                    newIndex = currentIndex > 0 ? currentIndex - 1 : (wrap ? elements.length - 1 : currentIndex);
                }
                break;

            case 'ArrowRight':
                if (orientation === 'horizontal' || orientation === 'both') {
                    event.preventDefault();
                    direction = 'right';
                    newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : (wrap ? 0 : currentIndex);
                }
                break;

            case 'Home':
                event.preventDefault();
                newIndex = 0;
                direction = orientation === 'horizontal' ? 'left' : 'up';
                break;

            case 'End':
                event.preventDefault();
                newIndex = elements.length - 1;
                direction = orientation === 'horizontal' ? 'right' : 'down';
                break;
        }

        if (newIndex !== currentIndex && direction) {
            focusElement(newIndex);
            onNavigate?.(direction, newIndex);
        }
    }, [orientation, wrap, getFocusableElements, focusElement, onNavigate]);

    const handleFocus = useCallback((event: FocusEvent) => {
        const elements = getFocusableElements();
        const focusedElement = event.target as HTMLElement;
        const index = elements.indexOf(focusedElement);

        if (index !== -1) {
            currentIndexRef.current = index;
            updateTabIndex(index);
        }
    }, [getFocusableElements, updateTabIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initialize tabindex for all focusable elements
        const elements = getFocusableElements();
        if (elements.length > 0) {
            updateTabIndex(currentIndexRef.current);
        }

        container.addEventListener('keydown', handleKeyDown);
        container.addEventListener('focus', handleFocus, true);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
            container.removeEventListener('focus', handleFocus, true);
        };
    }, [handleKeyDown, handleFocus, getFocusableElements, updateTabIndex]);

    return (
        <div
            ref={containerRef}
            className={cn('focus-within:outline-none', className)}
            role={role}
            aria-label={ariaLabel}
        >
            {children}
        </div>
    );
}

interface MenuNavigationProps {
    children: React.ReactNode;
    className?: string;
    onSelect?: (index: number) => void;
    onClose?: () => void;
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right', currentIndex: number) => void;
}

/**
 * MenuNavigation Component
 * 
 * Specialized keyboard navigation for menu items.
 * Includes support for Enter/Space selection and Escape to close.
 */
export function MenuNavigation({
    children,
    className,
    onSelect,
    onClose,
    onNavigate,
}: MenuNavigationProps) {
    const handleNavigate = useCallback((direction: 'up' | 'down' | 'left' | 'right', currentIndex: number) => {
        // Menu-specific navigation logic can be added here
        onNavigate?.(direction, currentIndex);
    }, [onNavigate]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                const elements = Array.from(
                    (event.currentTarget as HTMLElement).querySelectorAll('[role="menuitem"]')
                ) as HTMLElement[];
                const activeElement = document.activeElement as HTMLElement;
                const index = elements.indexOf(activeElement);
                if (index !== -1) {
                    onSelect?.(index);
                }
                break;

            case 'Escape':
                event.preventDefault();
                onClose?.();
                break;
        }
    }, [onSelect, onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <KeyboardNavigation
            orientation="vertical"
            className={cn('', className)}
            onNavigate={handleNavigate}
            role="menu"
        >
            {children}
        </KeyboardNavigation>
    );
}

interface TabNavigationProps {
    children: React.ReactNode;
    className?: string;
    onTabChange?: (index: number) => void;
    activeIndex?: number;
}

/**
 * TabNavigation Component
 * 
 * Specialized keyboard navigation for tab panels.
 * Implements the ARIA tabs pattern.
 */
export function TabNavigation({
    children,
    className,
    onTabChange,
    activeIndex = 0,
}: TabNavigationProps) {
    const handleNavigate = useCallback((_direction: string, currentIndex: number) => {
        onTabChange?.(currentIndex);
    }, [onTabChange]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const elements = Array.from(
                (event.currentTarget as HTMLElement).querySelectorAll('[role="tab"]')
            ) as HTMLElement[];
            const activeElement = document.activeElement as HTMLElement;
            const index = elements.indexOf(activeElement);
            if (index !== -1) {
                onTabChange?.(index);
            }
        }
    }, [onTabChange]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <KeyboardNavigation
            orientation="horizontal"
            className={cn('', className)}
            onNavigate={handleNavigate}
            role="tablist"
            startIndex={activeIndex}
        >
            {children}
        </KeyboardNavigation>
    );
}

interface GridNavigationProps {
    children: React.ReactNode;
    className?: string;
    columns: number;
    onNavigate?: (row: number, col: number) => void;
}

/**
 * GridNavigation Component
 * 
 * Provides 2D keyboard navigation for grid layouts.
 * Supports arrow keys for moving between cells.
 */
export function GridNavigation({
    children,
    className,
    columns,
    onNavigate,
}: GridNavigationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentPositionRef = useRef({ row: 0, col: 0 });

    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];

        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="gridcell"]:not([aria-disabled="true"])',
        ].join(', ');

        return Array.from(containerRef.current.querySelectorAll(focusableSelectors))
            .filter(element => {
                const style = window.getComputedStyle(element);
                return style.display !== 'none' && style.visibility !== 'hidden';
            }) as HTMLElement[];
    }, []);

    const getPosition = useCallback((index: number) => {
        return {
            row: Math.floor(index / columns),
            col: index % columns,
        };
    }, [columns]);

    const getIndex = useCallback((row: number, col: number) => {
        return row * columns + col;
    }, [columns]);

    const focusCell = useCallback((row: number, col: number) => {
        const elements = getFocusableElements();
        const index = getIndex(row, col);

        if (elements[index]) {
            currentPositionRef.current = { row, col };
            elements.forEach((element, i) => {
                element.setAttribute('tabindex', i === index ? '0' : '-1');
            });
            elements[index].focus();
            onNavigate?.(row, col);
        }
    }, [getFocusableElements, getIndex, onNavigate]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        const { row, col } = currentPositionRef.current;
        const totalRows = Math.ceil(elements.length / columns);
        let newRow = row;
        let newCol = col;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                newRow = row > 0 ? row - 1 : totalRows - 1;
                break;

            case 'ArrowDown':
                event.preventDefault();
                newRow = row < totalRows - 1 ? row + 1 : 0;
                break;

            case 'ArrowLeft':
                event.preventDefault();
                if (col > 0) {
                    newCol = col - 1;
                } else {
                    newRow = row > 0 ? row - 1 : totalRows - 1;
                    newCol = columns - 1;
                }
                break;

            case 'ArrowRight':
                event.preventDefault();
                if (col < columns - 1) {
                    newCol = col + 1;
                } else {
                    newRow = row < totalRows - 1 ? row + 1 : 0;
                    newCol = 0;
                }
                break;

            case 'Home':
                event.preventDefault();
                if (event.ctrlKey) {
                    newRow = 0;
                    newCol = 0;
                } else {
                    newCol = 0;
                }
                break;

            case 'End':
                event.preventDefault();
                if (event.ctrlKey) {
                    newRow = totalRows - 1;
                    newCol = (elements.length - 1) % columns;
                } else {
                    newCol = Math.min(columns - 1, elements.length - 1 - row * columns);
                }
                break;
        }

        // Ensure the new position is valid
        const newIndex = getIndex(newRow, newCol);
        if (newIndex < elements.length) {
            focusCell(newRow, newCol);
        }
    }, [getFocusableElements, columns, getIndex, focusCell]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initialize tabindex
        const elements = getFocusableElements();
        if (elements.length > 0) {
            elements.forEach((element, index) => {
                element.setAttribute('tabindex', index === 0 ? '0' : '-1');
            });
        }

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, getFocusableElements]);

    return (
        <div
            ref={containerRef}
            className={cn('focus-within:outline-none', className)}
            role="grid"
            aria-label="Grid navigation"
        >
            {children}
        </div>
    );
}