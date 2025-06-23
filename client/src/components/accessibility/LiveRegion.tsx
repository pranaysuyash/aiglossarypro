import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority: 'polite' | 'assertive';
  clearAfter?: number; // Clear message after X milliseconds
}

export function LiveRegion({ message, priority, clearAfter = 5000 }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && clearAfter) {
      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = '';
        }
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={regionRef}
      className="sr-only"
      aria-live={priority}
      aria-atomic="true"
      role="status"
    >
      {message}
    </div>
  );
}

// Hook for managing live region announcements
export function useLiveRegion() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create temporary live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('class', 'sr-only');
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  };

  return { announce };
}

export default LiveRegion;