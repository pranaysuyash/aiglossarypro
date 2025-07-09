'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  message?: string;
  level?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * LiveRegion Component
 *
 * A general-purpose live region for screen reader announcements.
 * Use this for dynamic content updates that need to be announced to screen readers.
 */
export function LiveRegion({
  message,
  level = 'polite',
  atomic = true,
  className,
  children,
}: LiveRegionProps) {
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

  if (!liveMessage && !children) return null;

  return (
    <div
      role={level === 'assertive' ? 'alert' : level === 'off' ? undefined : 'status'}
      aria-live={level}
      aria-atomic={atomic}
      className={cn(
        'sr-only', // Screen reader only by default
        className
      )}
    >
      {liveMessage || children}
    </div>
  );
}

/**
 * useLiveRegion Hook
 *
 * Custom hook to manage live region announcements.
 * Provides utilities for announcing dynamic content changes.
 */
export function useLiveRegion() {
  const [message, setMessage] = React.useState<string>('');
  const [level, setLevel] = React.useState<'polite' | 'assertive'>('polite');

  const announce = React.useCallback(
    (newMessage: string, priority: 'polite' | 'assertive' = 'polite') => {
      setLevel(priority);
      setMessage(newMessage);

      // Auto-clear after announcement
      setTimeout(() => {
        setMessage('');
      }, 3000);
    },
    []
  );

  const announceError = React.useCallback(
    (errorMessage: string) => {
      announce(errorMessage, 'assertive');
    },
    [announce]
  );

  const announceSuccess = React.useCallback(
    (successMessage: string) => {
      announce(successMessage, 'polite');
    },
    [announce]
  );

  const announceLoading = React.useCallback(
    (loadingMessage: string = 'Loading...') => {
      announce(loadingMessage, 'polite');
    },
    [announce]
  );

  const announceComplete = React.useCallback(
    (completeMessage: string = 'Complete') => {
      announce(completeMessage, 'polite');
    },
    [announce]
  );

  const clear = React.useCallback(() => {
    setMessage('');
  }, []);

  return {
    message,
    level,
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    announceComplete,
    clear,
    LiveRegion: () => <LiveRegion message={message} level={level} />,
  };
}

/**
 * StatusAnnouncer Component
 *
 * A component that announces status changes for dynamic content.
 * Useful for loading states, form submissions, etc.
 */
interface StatusAnnouncerProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
}

export function StatusAnnouncer({
  status,
  message,
  loadingMessage = 'Loading...',
  successMessage = 'Success',
  errorMessage = 'Error occurred',
  className,
}: StatusAnnouncerProps) {
  const getCurrentMessage = () => {
    if (message) return message;

    switch (status) {
      case 'loading':
        return loadingMessage;
      case 'success':
        return successMessage;
      case 'error':
        return errorMessage;
      default:
        return '';
    }
  };

  const getCurrentLevel = (): 'polite' | 'assertive' => {
    return status === 'error' ? 'assertive' : 'polite';
  };

  return (
    <LiveRegion message={getCurrentMessage()} level={getCurrentLevel()} className={className} />
  );
}

/**
 * NavigationAnnouncer Component
 *
 * Announces navigation changes for better accessibility.
 * Helps screen reader users understand when the content or page changes.
 */
interface NavigationAnnouncerProps {
  currentPage?: string;
  totalPages?: number;
  currentSection?: string;
  className?: string;
}

export function NavigationAnnouncer({
  currentPage,
  totalPages,
  currentSection,
  className,
}: NavigationAnnouncerProps) {
  const [announcementMessage, setAnnouncementMessage] = React.useState<string>('');

  React.useEffect(() => {
    let message = '';

    if (currentSection) {
      message = `Navigated to ${currentSection}`;
    }

    if (currentPage && totalPages) {
      message += message
        ? `, page ${currentPage} of ${totalPages}`
        : `Page ${currentPage} of ${totalPages}`;
    } else if (currentPage) {
      message += message ? `, page ${currentPage}` : `Page ${currentPage}`;
    }

    if (message) {
      setAnnouncementMessage(message);

      // Clear after announcement
      setTimeout(() => {
        setAnnouncementMessage('');
      }, 2000);
    }
  }, [currentPage, totalPages, currentSection]);

  return <LiveRegion message={announcementMessage} level="polite" className={className} />;
}

export default LiveRegion;
