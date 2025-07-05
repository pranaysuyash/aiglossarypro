import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Download, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import HierarchicalNavigation from '../navigation/HierarchicalNavigation';
import { 
  createTestDataset, 
  performanceTestData, 
  searchTestScenarios, 
  filterTestScenarios,
  createLargeDataset,
  memoryTestData 
} from '@/data/test-dataset';
import { 
  runComprehensiveBenchmark, 
  BenchmarkResult, 
  PerformanceMetrics,
  usePerformanceMonitoring 
} from '@/utils/performance-benchmarks';
import { ContentNode } from '@/types/content-structure';

interface TestScenario {
  name: string;
  description: string;
  dataset: any;
  expectedPerformance: {
    renderTime: number; // milliseconds
    searchTime: number;
    memoryUsage: number; // bytes
  };
}

const testScenarios: TestScenario[] = [
  {
    name: 'Small Dataset (5 sections)',
    description: 'Baseline performance test with minimal data',
    dataset: performanceTestData.smallDataset,
    expectedPerformance: { renderTime: 50, searchTime: 10, memoryUsage: 1024 * 1024 }
  },
  {
    name: 'Medium Dataset (20 sections)',
    description: 'Realistic dataset size for most use cases',
    dataset: performanceTestData.mediumDataset,
    expectedPerformance: { renderTime: 100, searchTime: 25, memoryUsage: 2 * 1024 * 1024 }
  },
  {
    name: 'Full Dataset (42 sections, ~295 subsections)',
    description: 'Complete dataset as specified in requirements',
    dataset: performanceTestData.fullDataset,
    expectedPerformance: { renderTime: 200, searchTime: 50, memoryUsage: 5 * 1024 * 1024 }
  },
  {
    name: 'Deeply Nested Dataset',
    description: 'Stress test with maximum nesting depth',
    dataset: performanceTestData.deeplyNestedDataset,
    expectedPerformance: { renderTime: 300, searchTime: 75, memoryUsage: 8 * 1024 * 1024 }
  },
  {
    name: 'Large Dataset (10x multiplier)',
    description: 'Extreme load test with 420 sections',
    dataset: createLargeDataset(10),
    expectedPerformance: { renderTime: 500, searchTime: 100, memoryUsage: 20 * 1024 * 1024 }
  }
];

const NavigationPerformanceTest: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const navigationRef = useRef<HTMLDivElement>(null);
  const { startOperation, endOperation, getMemoryUsage, metrics } = usePerformanceMonitoring('NavigationTest');

  // Mock navigation operations for testing
  const handleNavigate = useCallback((path: string, node: any) => {
    startOperation('navigation');
    setSelectedPath(path);
    setTimeout(() => endOperation('navigation'), 0);
  }, [startOperation, endOperation]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    startOperation('expand_collapse');
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
    setTimeout(() => endOperation('expand_collapse'), 0);
  }, [startOperation, endOperation]);

  // Mock search function
  const mockSearch = useCallback(async (query: string): Promise<any[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple mock search - filter nodes by name
        const results: any[] = [];
        const searchInNodes = (nodes: ContentNode[]) => {
          nodes.forEach(node => {
            if (node.name.toLowerCase().includes(query.toLowerCase())) {
              results.push(node);
            }
            if (node.subsections) {
              searchInNodes(node.subsections);
            }
          });
        };
        
        if (currentTest) {
          const scenario = testScenarios.find(s => s.name === currentTest);
          if (scenario?.dataset.sections) {
            searchInNodes(scenario.dataset.sections);
          }
        }
        
        resolve(results);
      }, Math.random() * 20); // Simulate variable search latency
    });
  }, [currentTest]);

  // Run benchmark for a specific scenario
  const runBenchmark = async (scenario: TestScenario) => {
    setIsRunning(true);
    setCurrentTest(scenario.name);
    
    try {
      startOperation('full_benchmark');
      
      // Wait for component to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const operations = {
        render: () => {
          // Force re-render by updating state
          setSelectedPath(`test-${Date.now()}`);
        },
        search: mockSearch,
        expand: (nodeId: string) => handleToggleExpand(nodeId),
        collapse: (nodeId: string) => handleToggleExpand(nodeId)
      };
      
      if (navigationRef.current) {
        const result = await runComprehensiveBenchmark(
          navigationRef.current,
          scenario.dataset,
          operations
        );
        
        setResults(prev => [...prev, result]);
        endOperation('full_benchmark');
      }
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Run all benchmarks
  const runAllBenchmarks = async () => {
    setResults([]);
    for (const scenario of testScenarios) {
      await runBenchmark(scenario);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Export results as JSON
  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      environment: results[0]?.environment,
      results: results,
      summary: generateSummary()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navigation-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate performance summary
  const generateSummary = () => {
    if (results.length === 0) return null;
    
    const avgRenderTime = results.reduce((sum, r) => sum + r.metrics.renderTime, 0) / results.length;
    const avgSearchTime = results.reduce((sum, r) => sum + r.metrics.searchTime, 0) / results.length;
    const avgMemoryUsage = results.reduce((sum, r) => sum + r.metrics.memoryUsage, 0) / results.length;
    const worstPerformer = results.reduce((worst, current) => 
      current.metrics.renderTime > worst.metrics.renderTime ? current : worst
    );
    const bestPerformer = results.reduce((best, current) => 
      current.metrics.renderTime < best.metrics.renderTime ? current : best
    );
    
    return {
      averageMetrics: { renderTime: avgRenderTime, searchTime: avgSearchTime, memoryUsage: avgMemoryUsage },
      worstPerformer: worstPerformer.testName,
      bestPerformer: bestPerformer.testName,
      totalTests: results.length
    };
  };

  // Performance status indicator
  const getPerformanceStatus = (actual: number, expected: number): 'good' | 'warning' | 'poor' => {
    if (actual <= expected) return 'good';
    if (actual <= expected * 1.5) return 'warning';
    return 'poor';
  };

  const formatMemory = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const currentScenario = testScenarios.find(s => s.name === currentTest);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Hierarchical Navigation Performance Testing
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Total Scenarios</h3>
            <p className="text-2xl font-bold text-blue-600">{testScenarios.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100">Completed Tests</h3>
            <p className="text-2xl font-bold text-green-600">{results.length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100">Current Memory</h3>
            <p className="text-2xl font-bold text-purple-600">{formatMemory(getMemoryUsage())}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">Status</h3>
            <p className="text-2xl font-bold text-orange-600">
              {isRunning ? 'Running...' : 'Ready'}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllBenchmarks}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Run All Benchmarks
          </button>
          
          {results.length > 0 && (
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Export Results
            </button>
          )}
        </div>
      </div>

      {/* Test Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
          <div className="space-y-3">
            {testScenarios.map((scenario, index) => {
              const result = results.find(r => r.testName.includes(scenario.name));
              const isRunning = currentTest === scenario.name;
              
              return (
                <div
                  key={scenario.name}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{scenario.name}</h3>
                    <div className="flex items-center gap-2">
                      {result && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {isRunning && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                      <button
                        onClick={() => runBenchmark(scenario)}
                        disabled={isRunning}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Run
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.description}</p>
                  
                  {result && (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Render:</span>
                        <span className={`ml-1 ${
                          getPerformanceStatus(result.metrics.renderTime, scenario.expectedPerformance.renderTime) === 'good' ? 'text-green-600' :
                          getPerformanceStatus(result.metrics.renderTime, scenario.expectedPerformance.renderTime) === 'warning' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {result.metrics.renderTime.toFixed(1)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Search:</span>
                        <span className={`ml-1 ${
                          getPerformanceStatus(result.metrics.searchTime, scenario.expectedPerformance.searchTime) === 'good' ? 'text-green-600' :
                          getPerformanceStatus(result.metrics.searchTime, scenario.expectedPerformance.searchTime) === 'warning' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {result.metrics.searchTime.toFixed(1)}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Memory:</span>
                        <span className={`ml-1 ${
                          getPerformanceStatus(result.metrics.memoryUsage, scenario.expectedPerformance.memoryUsage) === 'good' ? 'text-green-600' :
                          getPerformanceStatus(result.metrics.memoryUsage, scenario.expectedPerformance.memoryUsage) === 'warning' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {formatMemory(result.metrics.memoryUsage)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Navigation Test */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Live Navigation Test</h2>
          <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div ref={navigationRef} className="h-full">
              {currentScenario && (
                <HierarchicalNavigation
                  contentStructure={currentScenario.dataset.sections || []}
                  currentPath={selectedPath}
                  onNavigate={handleNavigate}
                  enableSearch={true}
                  enableFilters={true}
                  enableProgress={true}
                  enableVirtualization={currentScenario.dataset.sections?.length > 100}
                />
              )}
            </div>
          </div>
          
          {/* Real-time metrics */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Navigation Time:</span>
              <span className="ml-2 font-mono">{(metrics.interactionLatency || 0).toFixed(1)}ms</span>
            </div>
            <div>
              <span className="text-gray-500">Expand/Collapse:</span>
              <span className="ml-2 font-mono">{(metrics.expandCollapseTime || 0).toFixed(1)}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2">Test Scenario</th>
                  <th className="text-right py-2">Render Time</th>
                  <th className="text-right py-2">Search Time</th>
                  <th className="text-right py-2">Memory Usage</th>
                  <th className="text-right py-2">Scroll FPS</th>
                  <th className="text-right py-2">Dataset Size</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2">{result.testName}</td>
                    <td className="text-right py-2 font-mono">{result.metrics.renderTime.toFixed(1)}ms</td>
                    <td className="text-right py-2 font-mono">{result.metrics.searchTime.toFixed(1)}ms</td>
                    <td className="text-right py-2 font-mono">{formatMemory(result.metrics.memoryUsage)}</td>
                    <td className="text-right py-2 font-mono">{result.metrics.scrollPerformance.toFixed(1)}</td>
                    <td className="text-right py-2">{result.datasetSize.totalNodes} nodes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationPerformanceTest;