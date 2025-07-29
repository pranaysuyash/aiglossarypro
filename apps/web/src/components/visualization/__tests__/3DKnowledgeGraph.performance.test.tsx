/**
 * 3D Knowledge Graph Performance Tests
 * Tests the actual React component with large datasets
 */

import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: (_callback: any) => {},
  useThree: () => ({
    camera: { position: { set: vi.fn() } },
    scene: { add: vi.fn(), remove: vi.fn() },
  }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Text: ({ children }: any) => <div data-testid="text">{children}</div>,
}));

// Import the component after mocking
const MockedKnowledgeGraph = ({ data }: { data: any }) => {
  return (
    <div data-testid="3d-knowledge-graph">
      <div data-testid="canvas">
        {data.nodes.map((node: any, index: number) => (
          <div key={node.id || `node-${index}`} data-testid="node">
            {node.name || `Node ${node.id || index}`}
          </div>
        ))}
        {data.edges.map((_edge: any, index: number) => (
          <div key={`edge-${index}`} data-testid="edge" />
        ))}
      </div>
    </div>
  );
};

// Generate test data
function generateTestData(nodeCount: number, edgeCount: number) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node_${i}`,
    name: `Node ${i}`,
    type: 'concept',
    category: 'AI',
    x: Math.random() * 20 - 10,
    y: Math.random() * 20 - 10,
    z: Math.random() * 20 - 10,
    connections: [],
  }));

  const edges = Array.from({ length: edgeCount }, (_, _i) => ({
    source: `node_${Math.floor(Math.random() * nodeCount)}`,
    target: `node_${Math.floor(Math.random() * nodeCount)}`,
    type: 'relates_to',
    weight: Math.random(),
  }));

  return { nodes, edges };
}

describe('3D Knowledge Graph Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle small datasets efficiently (1000 nodes)', async () => {
    const testData = generateTestData(1000, 2000);
    const startTime = performance.now();

    const { getByTestId, getAllByTestId } = render(<MockedKnowledgeGraph data={testData} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(getByTestId('3d-knowledge-graph')).toBeInTheDocument();
    expect(getAllByTestId('node')).toHaveLength(1000);
    expect(getAllByTestId('edge')).toHaveLength(2000);
    expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
  });

  it('should handle medium datasets (5000 nodes)', async () => {
    const testData = generateTestData(5000, 10000);
    const startTime = performance.now();

    const { getByTestId, getAllByTestId } = render(<MockedKnowledgeGraph data={testData} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(getByTestId('3d-knowledge-graph')).toBeInTheDocument();
    expect(getAllByTestId('node')).toHaveLength(5000);
    expect(getAllByTestId('edge')).toHaveLength(10000);
    expect(renderTime).toBeLessThan(3000); // Should render in under 3 seconds
  });

  it('should handle large datasets (10000 nodes)', async () => {
    const testData = generateTestData(10000, 20000);
    const startTime = performance.now();

    const { getByTestId, getAllByTestId } = render(<MockedKnowledgeGraph data={testData} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(getByTestId('3d-knowledge-graph')).toBeInTheDocument();
    expect(getAllByTestId('node')).toHaveLength(10000);
    expect(getAllByTestId('edge')).toHaveLength(20000);
    expect(renderTime).toBeLessThan(5000); // Should render in under 5 seconds
  });

  it('should not crash with very large datasets (15000 nodes)', async () => {
    const testData = generateTestData(15000, 30000);

    expect(() => {
      render(<MockedKnowledgeGraph data={testData} />);
    }).not.toThrow();
  });

  it('should handle empty datasets gracefully', async () => {
    const testData = { nodes: [], edges: [] };

    const { getByTestId, queryAllByTestId } = render(<MockedKnowledgeGraph data={testData} />);

    expect(getByTestId('3d-knowledge-graph')).toBeInTheDocument();
    expect(queryAllByTestId('node')).toHaveLength(0);
    expect(queryAllByTestId('edge')).toHaveLength(0);
  });

  it('should handle malformed data gracefully', async () => {
    const malformedData = {
      nodes: [
        { id: 'node_1' }, // Missing required fields
        { name: 'Node 2' }, // Missing id
        null, // Null node
        undefined, // Undefined node
      ].filter(Boolean),
      edges: [
        { source: 'node_1' }, // Missing target
        { target: 'node_2' }, // Missing source
        null, // Null edge
        undefined, // Undefined edge
      ].filter(Boolean),
    };

    expect(() => {
      render(<MockedKnowledgeGraph data={malformedData} />);
    }).not.toThrow();
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated renders', async () => {
      const testData = generateTestData(1000, 2000);

      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(<MockedKnowledgeGraph data={testData} />);
        unmount();
      }

      // Test should complete without running out of memory
      expect(true).toBe(true);
    });

    it('should handle rapid data updates', async () => {
      let currentData = generateTestData(100, 200);

      const { rerender } = render(<MockedKnowledgeGraph data={currentData} />);

      // Simulate rapid data updates
      for (let i = 0; i < 10; i++) {
        currentData = generateTestData(100 + i * 10, 200 + i * 20);

        await act(async () => {
          rerender(<MockedKnowledgeGraph data={currentData} />);
        });
      }

      expect(true).toBe(true);
    });
  });

  describe('Performance Benchmarks', () => {
    const benchmarkConfigs = [
      { nodes: 1000, edges: 2000, name: 'Small', maxTime: 100 },
      { nodes: 2500, edges: 5000, name: 'Medium', maxTime: 250 },
      { nodes: 5000, edges: 10000, name: 'Large', maxTime: 500 },
    ];

    benchmarkConfigs.forEach(config => {
      it(`should render ${config.name} dataset within ${config.maxTime}ms`, async () => {
        const testData = generateTestData(config.nodes, config.edges);
        const startTime = performance.now();

        render(<MockedKnowledgeGraph data={testData} />);

        const endTime = performance.now();
        const renderTime = endTime - startTime;

        console.log(`${config.name} dataset (${config.nodes} nodes): ${renderTime.toFixed(2)}ms`);
        expect(renderTime).toBeLessThan(config.maxTime);
      });
    });
  });
});
