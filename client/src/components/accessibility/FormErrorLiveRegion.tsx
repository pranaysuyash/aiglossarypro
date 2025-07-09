'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormErrorLiveRegionProps {
  message?: string;
  className?: string;
  level?: 'polite' | 'assertive';
}

/**
 * FormErrorLiveRegion Component
 *
 * Provides live region announcements for form errors to improve accessibility.
 * Screen readers will announce the error message when it changes.
 */
export function FormErrorLiveRegion({
  message,
  className,
  level = 'assertive',
}: FormErrorLiveRegionProps) {
  const [liveMessage, setLiveMessage] = React.useState<string>('');

  React.useEffect(() => {
    if (message) {
      // Small delay to ensure screen readers pick up the change
      const timer = setTimeout(() => {
        setLiveMessage(message);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setLiveMessage('');
    }
  }, [message]);

  if (!liveMessage) return null;

  return (
    <div
      role="alert"
      aria-live={level}
      aria-atomic="true"
      className={cn(
        'sr-only', // Screen reader only by default
        className
      )}
    >
      {liveMessage}
    </div>
  );
}

interface FormErrorDisplayProps {
  message?: string;
  className?: string;
  showVisually?: boolean;
}

/**
 * FormErrorDisplay Component
 *
 * Displays form errors both visually and via live regions.
 * Combines visual error display with accessibility announcements.
 */
export function FormErrorDisplay({
  message,
  className,
  showVisually = true,
}: FormErrorDisplayProps) {
  if (!message) return null;

  return (
    <>
      {/* Live region for screen readers */}
      <FormErrorLiveRegion message={message} />

      {/* Visual error display */}
      {showVisually && (
        <div
          className={cn(
            'text-sm text-red-500 mt-1 min-h-[1.25rem] flex items-center gap-1',
            className
          )}
          id="form-error"
          aria-describedby="form-error-live"
        >
          <span className="inline-block w-4 h-4 text-red-500" aria-hidden="true">
            ⚠
          </span>
          <span>{message}</span>
        </div>
      )}
    </>
  );
}

/**
 * useFormErrorAnnouncement Hook
 *
 * Custom hook to manage form error announcements.
 * Provides utilities for announcing form errors to screen readers.
 */
export function useFormErrorAnnouncement() {
  const [currentError, setCurrentError] = React.useState<string>('');

  const announceError = React.useCallback((message: string) => {
    setCurrentError(message);
  }, []);

  const clearError = React.useCallback(() => {
    setCurrentError('');
  }, []);

  const announceSuccess = React.useCallback((message: string) => {
    // Clear any existing error first
    setCurrentError('');

    // Announce success after a brief delay
    setTimeout(() => {
      setCurrentError(message);
    }, 100);
  }, []);

  return {
    currentError,
    announceError,
    clearError,
    announceSuccess,
    ErrorRegion: () => <FormErrorLiveRegion message={currentError} />,
    ErrorDisplay: (props: Omit<FormErrorDisplayProps, 'message'>) => (
      <FormErrorDisplay {...props} message={currentError} />
    ),
  };
}

/**
 * FormFieldWithError Component
 *
 * A complete form field wrapper with integrated error handling and announcements.
 */
interface FormFieldWithErrorProps {
  children: React.ReactNode;
  error?: string;
  label?: string;
  id?: string;
  className?: string;
  required?: boolean;
}

export function FormFieldWithError({
  children,
  error,
  label,
  id,
  className,
  required = false,
}: FormFieldWithErrorProps) {
  const fieldId = id || `field-${React.useId()}`;
  const errorId = `${fieldId}-error`;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': error ? errorId : undefined,
          'aria-invalid': error ? 'true' : 'false',
          className: cn(
            (children as React.ReactElement).props.className,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          ),
        })}
      </div>

      {error && <FormErrorDisplay message={error} className="mt-1" />}
    </div>
  );
}

export default FormErrorLiveRegion;
