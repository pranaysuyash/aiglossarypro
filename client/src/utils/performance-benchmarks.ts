// Performance benchmarking utilities for hierarchical navigation testing
import * as React from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  searchTime: number;
  expandCollapseTime: number;
  scrollPerformance: number;
  interactionLatency: number;
  componentMountTime: number;
  updateTime: number;
}

export interface BenchmarkResult {
  testName: string;
  timestamp: number;
  metrics: PerformanceMetrics;
  datasetSize: {
    sections: number;
    totalNodes: number;
    maxDepth: number;
  };
  environment: {
    userAgent: string;
    viewport: { width: number; height: number };
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
}

export class PerformanceBenchmark {
  private startTime: number = 0;
  private measurements: Map<string, number> = new Map();
  private memoryBaseline: number = 0;

  constructor() {
    this.memoryBaseline = this.getMemoryUsage();
  }

  // Start timing a specific operation
  startTiming(operation: string): void {
    this.startTime = performance.now();
    this.measurements.set(`${operation}_start`, this.startTime);
  }

  // End timing and record the duration
  endTiming(operation: string): number {
    const endTime = performance.now();
    const startTime = this.measurements.get(`${operation}_start`) || this.startTime;
    const duration = endTime - startTime;
    this.measurements.set(operation, duration);
    return duration;
  }

  // Measure memory usage
  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  // Measure current memory delta from baseline
  getMemoryDelta(): number {
    return this.getMemoryUsage() - this.memoryBaseline;
  }

  // Clear measurements
  clear(): void {
    this.measurements.clear();
    this.startTime = 0;
    this.memoryBaseline = this.getMemoryUsage();
  }

  // Get all measurements
  getAllMeasurements(): Map<string, number> {
    return new Map(this.measurements);
  }
}

// Component performance wrapper
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const benchmark = React.useRef(new PerformanceBenchmark());
    const mountTimeRef = React.useRef<number>(0);

    React.useEffect(() => {
      // Track component mount time
      mountTimeRef.current = performance.now();
      benchmark.current.startTiming('mount');

      return () => {
        benchmark.current.endTiming('mount');
        console.log(
          `${componentName} mount time:`,
          benchmark.current.getAllMeasurements().get('mount')
        );
      };
    }, [componentName]);

    React.useEffect(() => {
      // Track updates
      benchmark.current.startTiming('update');

      return () => {
        const updateTime = benchmark.current.endTiming('update');
        if (updateTime > 0) {
          console.log(`${componentName} update time:`, updateTime);
        }
      };
    });

    return React.createElement(Component, props);
  });
};

// Search performance testing
export const benchmarkSearch = async (
  searchFunction: (query: string) => Promise<any[]> | any[],
  queries: string[],
  iterations: number = 5
): Promise<{
  averageTime: number;
  results: Array<{ query: string; time: number; resultCount: number }>;
}> => {
  const results: Array<{ query: string; time: number; resultCount: number }> = [];

  for (const query of queries) {
    const times: number[] = [];
    let lastResultCount = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const searchResults = await searchFunction(query);
      const endTime = performance.now();

      times.push(endTime - startTime);
      lastResultCount = Array.isArray(searchResults) ? searchResults.length : 0;
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    results.push({ query, time: averageTime, resultCount: lastResultCount });
  }

  const overallAverage = results.reduce((sum, result) => sum + result.time, 0) / results.length;
  return { averageTime: overallAverage, results };
};

// Render performance testing
export const benchmarkRender = (
  renderFunction: () => void,
  iterations: number = 10
): { averageTime: number; times: number[] } => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    renderFunction();
    const endTime = performance.now();
    times.push(endTime - startTime);
  }

  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  return { averageTime, times };
};

// Scroll performance testing
export const benchmarkScrolling = (
  container: HTMLElement,
  scrollDistance: number = 1000,
  duration: number = 2000
): Promise<{ frameRate: number; scrollJank: number }> => {
  return new Promise((resolve) => {
    let _frameCount = 0;
    let lastTimestamp = 0;
    const frameTimes: number[] = [];
    const startTime = performance.now();

    const measureFrame = (timestamp: number) => {
      if (lastTimestamp > 0) {
        const frameTime = timestamp - lastTimestamp;
        frameTimes.push(frameTime);
        _frameCount++;
      }
      lastTimestamp = timestamp;

      if (timestamp - startTime < duration) {
        requestAnimationFrame(measureFrame);
      } else {
        const averageFrameTime =
          frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        const frameRate = 1000 / averageFrameTime;
        const scrollJank = frameTimes.filter((time) => time > 16.67).length / frameTimes.length;

        resolve({ frameRate, scrollJank });
      }
    };

    // Start scrolling animation
    const startScroll = container.scrollTop;
    const endScroll = startScroll + scrollDistance;
    const scrollStart = performance.now();

    const scroll = () => {
      const elapsed = performance.now() - scrollStart;
      const progress = Math.min(elapsed / duration, 1);
      const currentScroll = startScroll + (endScroll - startScroll) * progress;

      container.scrollTop = currentScroll;

      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(measureFrame);
    requestAnimationFrame(scroll);
  });
};

// Memory leak detection
export const detectMemoryLeaks = async (
  operation: () => Promise<void> | void,
  iterations: number = 50
): Promise<{
  initialMemory: number;
  finalMemory: number;
  memoryGrowth: number;
  leaked: boolean;
}> => {
  // Force garbage collection if available
  if (window.gc) {
    window.gc();
  }

  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

  for (let i = 0; i < iterations; i++) {
    await operation();

    // Periodic garbage collection
    if (i % 10 === 0 && window.gc) {
      window.gc();
    }
  }

  // Final garbage collection
  if (window.gc) {
    window.gc();
  }

  await new Promise((resolve) => setTimeout(resolve, 100)); // Allow GC to complete

  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const memoryGrowth = finalMemory - initialMemory;
  const leaked = memoryGrowth > 1024 * 1024; // Consider >1MB growth as potential leak

  return { initialMemory, finalMemory, memoryGrowth, leaked };
};

// Comprehensive benchmark suite
export const runComprehensiveBenchmark = async (
  component: HTMLElement,
  testData: any,
  operations: {
    render: () => void;
    search: (query: string) => Promise<any[]>;
    expand: (nodeId: string) => void;
    collapse: (nodeId: string) => void;
  }
): Promise<BenchmarkResult> => {
  const benchmark = new PerformanceBenchmark();
  const testName = `Navigation_${testData.sections?.length || 0}_sections`;

  // Environment info
  const environment = {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };

  // Dataset size analysis
  const countNodes = (sections: any[]): number => {
    return sections.reduce((count, section) => {
      let nodeCount = 1; // Count the section itself
      if (section.subsections) {
        nodeCount += countNodes(section.subsections);
      }
      return count + nodeCount;
    }, 0);
  };

  const getMaxDepth = (sections: any[], currentDepth: number = 0): number => {
    return sections.reduce((maxDepth, section) => {
      const depth = currentDepth + 1;
      if (section.subsections) {
        return Math.max(maxDepth, getMaxDepth(section.subsections, depth));
      }
      return Math.max(maxDepth, depth);
    }, 0);
  };

  const datasetSize = {
    sections: testData.sections?.length || 0,
    totalNodes: countNodes(testData.sections || []),
    maxDepth: getMaxDepth(testData.sections || []),
  };

  // Benchmark rendering
  benchmark.startTiming('render');
  operations.render();
  const renderTime = benchmark.endTiming('render');

  // Benchmark search
  const searchQueries = ['test', 'machine', 'learning', 'algorithm'];
  const searchResults = await benchmarkSearch(operations.search, searchQueries, 3);
  const searchTime = searchResults.averageTime;

  // Benchmark expand/collapse
  benchmark.startTiming('expand');
  operations.expand('test-node-1');
  const expandTime = benchmark.endTiming('expand');

  benchmark.startTiming('collapse');
  operations.collapse('test-node-1');
  const collapseTime = benchmark.endTiming('collapse');

  const expandCollapseTime = (expandTime + collapseTime) / 2;

  // Benchmark scrolling
  const scrollContainer = component.querySelector('[role="tree"], .overflow-auto') as HTMLElement;
  let scrollPerformance = 0;
  if (scrollContainer) {
    const scrollResult = await benchmarkScrolling(scrollContainer);
    scrollPerformance = scrollResult.frameRate;
  }

  // Memory usage
  const memoryUsage = benchmark.getMemoryDelta();

  const metrics: PerformanceMetrics = {
    renderTime,
    memoryUsage,
    searchTime,
    expandCollapseTime,
    scrollPerformance,
    interactionLatency: expandCollapseTime, // Use expand/collapse as interaction latency proxy
    componentMountTime: renderTime,
    updateTime: expandCollapseTime,
  };

  return {
    testName,
    timestamp: Date.now(),
    metrics,
    datasetSize,
    environment,
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = (_componentName: string) => {
  const benchmark = React.useRef(new PerformanceBenchmark());
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});

  const startOperation = React.useCallback((operation: string) => {
    benchmark.current.startTiming(operation);
  }, []);

  const endOperation = React.useCallback((operation: string) => {
    const time = benchmark.current.endTiming(operation);
    setMetrics((prev) => ({ ...prev, [operation]: time }));
    return time;
  }, []);

  const getMemoryUsage = React.useCallback(() => {
    return benchmark.current.getMemoryDelta();
  }, []);

  return {
    startOperation,
    endOperation,
    getMemoryUsage,
    metrics,
    clearMetrics: () => {
      benchmark.current.clear();
      setMetrics({});
    },
  };
};

// Export performance testing utilities
export const PerformanceUtils = {
  benchmark: PerformanceBenchmark,
  withTracking: withPerformanceTracking,
  benchmarkSearch,
  benchmarkRender,
  benchmarkScrolling,
  detectMemoryLeaks,
  runComprehensiveBenchmark,
};

export default PerformanceUtils;
