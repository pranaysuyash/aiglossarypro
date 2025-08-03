// Polyfills that Node + tests need
declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback);
  observe(element: Element): void;
  disconnect(): void;
}

interface ResizeObserverCallback {
  (entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}

interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
}

// Fix for missing types in Node environment
declare global {
  interface Window {
    ResizeObserver: typeof ResizeObserver;
  }
}

export {};