/**
 * Preload utility for critical components
 *
 * This utility helps preload components that are likely to be needed
 * based on user interaction patterns and route priority.
 */

// Import functions for dynamic loading
const preloadMap = new Map<string, () => Promise<any>>();

// Register preloadable components
preloadMap.set('terms', () => import('@/pages/Terms'));
preloadMap.set('categories', () => import('@/pages/Categories'));
preloadMap.set('dashboard', () => import('@/pages/Dashboard'));
preloadMap.set('term-detail', () => import('@/pages/EnhancedTermDetail'));
preloadMap.set('admin', () => import('@/pages/Admin'));
preloadMap.set('analytics', () => import('@/pages/AnalyticsDashboard'));
preloadMap.set('ai-tools', () => import('@/pages/AITools'));
preloadMap.set('favorites', () => import('@/pages/Favorites'));

// Register heavy components
preloadMap.set('ai-feedback-dashboard', () => import('@/components/AIFeedbackDashboard'));
preloadMap.set('virtualized-term-list', () => import('@/components/VirtualizedTermList'));
preloadMap.set('advanced-search', () => import('@/components/search/AdvancedSearch'));
preloadMap.set('chart-components', () => import('recharts'));
preloadMap.set('mermaid-diagram', () => import('@/components/interactive/MermaidDiagram'));

// Preload function
export async function preloadComponent(key: string): Promise<void> {
  const loader = preloadMap.get(key);
  if (loader) {
    try {
      await loader();
      console.log(`✅ Preloaded component: ${key}`);
    } catch (error) {
      console.warn(`⚠️  Failed to preload component: ${key}`, error);
    }
  }
}

// Preload multiple components
export async function preloadComponents(keys: string[]): Promise<void> {
  const promises = keys.map(key => preloadComponent(key));
  await Promise.allSettled(promises);
}

// Preload based on user authentication status
export async function preloadForAuthenticatedUser(): Promise<void> {
  await preloadComponents(['dashboard', 'favorites', 'term-detail', 'ai-feedback-dashboard']);
}

// Preload based on admin role
export async function preloadForAdmin(): Promise<void> {
  await preloadComponents([
    'admin',
    'analytics',
    'ai-feedback-dashboard',
    'virtualized-term-list',
    'chart-components',
  ]);
}

// Preload critical components on idle
export function preloadOnIdle(): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponents(['terms', 'categories', 'term-detail']);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadComponents(['terms', 'categories', 'term-detail']);
    }, 1000);
  }
}

// Preload on mouse enter for specific elements
export function preloadOnHover(element: HTMLElement, componentKey: string): void {
  let hasPreloaded = false;

  const handleMouseEnter = () => {
    if (!hasPreloaded) {
      hasPreloaded = true;
      preloadComponent(componentKey);
    }
  };

  element.addEventListener('mouseenter', handleMouseEnter, { once: true });
}

// Preload based on intersection (viewport proximity)
export function preloadOnIntersection(
  element: HTMLElement,
  componentKey: string,
  rootMargin = '50px'
): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            preloadComponent(componentKey);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin }
    );

    observer.observe(element);
  }
}

// Get preload status
export function getPreloadStatus(): { loaded: string[]; pending: string[] } {
  const loaded: string[] = [];
  const pending: string[] = [];

  for (const key of preloadMap.keys()) {
    // This is a simplified check - in practice you'd track loading state
    if (Math.random() > 0.5) {
      // Placeholder logic
      loaded.push(key);
    } else {
      pending.push(key);
    }
  }

  return { loaded, pending };
}
