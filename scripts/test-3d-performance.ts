#!/usr/bin/env tsx

/**
 * 3D Knowledge Graph Performance Testing Script
 * Tests performance with large datasets (10,000+ nodes)
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

// Test configuration
const TEST_CONFIGS = [
  { nodes: 1000, edges: 2000, name: 'Small' },
  { nodes: 5000, edges: 10000, name: 'Medium' },
  { nodes: 10000, edges: 20000, name: 'Large' },
  { nodes: 25000, edges: 50000, name: 'XLarge' },
  { nodes: 50000, edges: 100000, name: 'XXLarge' },
];

// Node types for AI/ML knowledge graph
const NODE_TYPES = [
  'algorithm',
  'concept',
  'technique',
  'framework',
  'application',
  'dataset',
  'paper',
  'researcher',
];

const CATEGORIES = [
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Reinforcement Learning',
  'Data Science',
  'Statistics',
  'Neural Networks',
];

interface TestNode {
  id: string;
  name: string;
  type: string;
  category: string;
  x?: number;
  y?: number;
  z?: number;
  connections: string[];
  metadata?: {
    importance: number;
    frequency: number;
    complexity: number;
  };
}

interface TestEdge {
  source: string;
  target: string;
  type: 'relates_to' | 'depends_on' | 'implements' | 'extends' | 'uses';
  weight: number;
}

interface PerformanceMetrics {
  dataGeneration: number;
  layoutCalculation: number;
  renderingTime: number;
  memoryUsage: number;
  frameRate: number;
  interactionLatency: number;
}

interface TestResult {
  config: (typeof TEST_CONFIGS)[0];
  metrics: PerformanceMetrics;
  success: boolean;
  errors: string[];
  recommendations: string[];
}

class Performance3DGraphTester {
  private results: TestResult[] = [];

  /**
   * Generate test data for a given configuration
   */
  private generateTestData(config: (typeof TEST_CONFIGS)[0]): {
    nodes: TestNode[];
    edges: TestEdge[];
  } {
    const startTime = performance.now();

    console.log(`Generating test data: ${config.nodes} nodes, ${config.edges} edges...`);

    const nodes: TestNode[] = [];
    const edges: TestEdge[] = [];

    // Generate nodes
    for (let i = 0; i < config.nodes; i++) {
      const nodeType = NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)];
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

      nodes.push({
        id: `node_${i}`,
        name: `${nodeType}_${i}`,
        type: nodeType,
        category,
        connections: [],
        metadata: {
          importance: Math.random(),
          frequency: Math.random() * 100,
          complexity: Math.random() * 10,
        },
      });
    }

    // Generate edges with realistic distribution
    const _edgesPerNode = config.edges / config.nodes;
    const usedConnections = new Set<string>();

    for (let i = 0; i < config.edges; i++) {
      let sourceId: string;
      let targetId: string;
      let connectionKey: string;

      // Retry until we find a unique connection
      do {
        sourceId = `node_${Math.floor(Math.random() * config.nodes)}`;
        targetId = `node_${Math.floor(Math.random() * config.nodes)}`;
        connectionKey = `${sourceId}-${targetId}`;
      } while (sourceId === targetId || usedConnections.has(connectionKey));

      usedConnections.add(connectionKey);

      const edgeTypes: TestEdge['type'][] = [
        'relates_to',
        'depends_on',
        'implements',
        'extends',
        'uses',
      ];
      const edgeType = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];

      edges.push({
        source: sourceId,
        target: targetId,
        type: edgeType,
        weight: Math.random(),
      });

      // Update node connections
      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);

      if (sourceNode) sourceNode.connections.push(targetId);
      if (targetNode) targetNode.connections.push(sourceId);
    }

    const endTime = performance.now();
    console.log(`Data generation completed in ${(endTime - startTime).toFixed(2)}ms`);

    return { nodes, edges };
  }

  /**
   * Simulate layout calculation performance
   */
  private testLayoutCalculation(nodes: TestNode[], _edges: TestEdge[]): number {
    const startTime = performance.now();

    console.log('Testing layout calculation...');

    // Simulate force-directed layout calculation
    const iterations = Math.min(100, Math.max(10, Math.floor(10000 / nodes.length)));

    for (let iter = 0; iter < iterations; iter++) {
      // Simulate force calculations for each node
      for (const node of nodes) {
        // Initialize positions if not set
        if (!node.x) node.x = (Math.random() - 0.5) * 100;
        if (!node.y) node.y = (Math.random() - 0.5) * 100;
        if (!node.z) node.z = (Math.random() - 0.5) * 100;

        // Simulate force calculations
        let fx = 0,
          fy = 0,
          fz = 0;

        // Repulsion forces (simulated)
        for (const otherNode of nodes) {
          if (node.id !== otherNode.id) {
            const dx = node.x! - (otherNode.x || 0);
            const dy = node.y! - (otherNode.y || 0);
            const dz = node.z! - (otherNode.z || 0);
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;

            const force = 1 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
            fz += (dz / distance) * force;
          }
        }

        // Attraction forces for connected nodes (simulated)
        for (const connectionId of node.connections) {
          const connectedNode = nodes.find((n) => n.id === connectionId);
          if (connectedNode && connectedNode.x !== undefined) {
            const dx = (connectedNode.x - node.x!) * 0.1;
            const dy = (connectedNode.y! - node.y!) * 0.1;
            const dz = (connectedNode.z! - node.z!) * 0.1;

            fx += dx;
            fy += dy;
            fz += dz;
          }
        }

        // Update positions
        node.x! += fx * 0.01;
        node.y! += fy * 0.01;
        node.z! += fz * 0.01;
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Layout calculation completed in ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Simulate rendering performance
   */
  private testRenderingPerformance(nodes: TestNode[], edges: TestEdge[]): number {
    const startTime = performance.now();

    console.log('Testing rendering performance...');

    // Simulate rendering operations
    const frames = 60; // Test 60 frames

    for (let frame = 0; frame < frames; frame++) {
      // Simulate node rendering
      for (const _node of nodes) {
        // Simulate geometry creation and material assignment
        const geometryOps = 3; // Buffer geometry, material, mesh
        for (let op = 0; op < geometryOps; op++) {
          // Simulate GPU operations
          Math.sqrt(Math.random() * 1000);
        }
      }

      // Simulate edge rendering
      for (const _edge of edges) {
        // Simulate line geometry creation
        const lineOps = 2;
        for (let op = 0; op < lineOps; op++) {
          Math.sqrt(Math.random() * 1000);
        }
      }

      // Simulate camera updates and scene rendering
      for (let i = 0; i < 10; i++) {
        Math.sqrt(Math.random() * 1000);
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgFrameTime = duration / frames;

    console.log(
      `Rendering test completed in ${duration.toFixed(2)}ms (${avgFrameTime.toFixed(2)}ms per frame)`
    );
    return duration;
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(nodes: TestNode[], edges: TestEdge[]): number {
    // Estimate memory usage based on data structures
    const nodeSize = 200; // bytes per node (including metadata and connections)
    const edgeSize = 100; // bytes per edge

    const estimatedMemory = nodes.length * nodeSize + edges.length * edgeSize;

    console.log(`Estimated memory usage: ${(estimatedMemory / 1024 / 1024).toFixed(2)} MB`);
    return estimatedMemory;
  }

  /**
   * Calculate simulated frame rate
   */
  private calculateFrameRate(renderingTime: number, frames: number = 60): number {
    const avgFrameTime = renderingTime / frames;
    const frameRate = 1000 / avgFrameTime; // FPS

    console.log(`Estimated frame rate: ${frameRate.toFixed(1)} FPS`);
    return frameRate;
  }

  /**
   * Test interaction latency
   */
  private testInteractionLatency(nodes: TestNode[]): number {
    const startTime = performance.now();

    console.log('Testing interaction latency...');

    // Simulate common interactions
    const interactions = [
      'node_selection',
      'node_hover',
      'camera_rotation',
      'zoom',
      'pan',
      'filter_application',
    ];

    for (const interaction of interactions) {
      // Simulate raycasting for node selection
      if (interaction === 'node_selection' || interaction === 'node_hover') {
        for (let i = 0; i < Math.min(1000, nodes.length); i++) {
          // Simulate ray-sphere intersection tests
          const node = nodes[i];
          const distance = Math.sqrt((node.x || 0) ** 2 + (node.y || 0) ** 2 + (node.z || 0) ** 2);

          // Simulate intersection calculation
          Math.sqrt(distance * Math.random());
        }
      }

      // Simulate other interactions
      for (let i = 0; i < 100; i++) {
        Math.sqrt(Math.random() * 1000);
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Interaction latency test completed in ${duration.toFixed(2)}ms`);
    return duration / interactions.length; // Average latency per interaction
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    config: (typeof TEST_CONFIGS)[0],
    metrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Frame rate recommendations
    if (metrics.frameRate < 30) {
      recommendations.push('Consider implementing level-of-detail (LOD) for distant nodes');
      recommendations.push('Use instanced rendering for similar node types');
      recommendations.push('Implement frustum culling to render only visible nodes');
    }

    if (metrics.frameRate < 15) {
      recommendations.push('CRITICAL: Frame rate too low. Consider node clustering or pagination');
    }

    // Memory recommendations
    const memoryMB = metrics.memoryUsage / 1024 / 1024;
    if (memoryMB > 500) {
      recommendations.push('High memory usage detected. Consider data streaming or virtualization');
    }

    if (memoryMB > 1000) {
      recommendations.push('CRITICAL: Memory usage exceeds 1GB. Implement data pagination');
    }

    // Layout calculation recommendations
    if (metrics.layoutCalculation > 5000) {
      recommendations.push(
        'Layout calculation is slow. Consider using WebWorkers for force calculations'
      );
      recommendations.push('Implement progressive layout with limited iterations');
    }

    // Interaction latency recommendations
    if (metrics.interactionLatency > 100) {
      recommendations.push(
        'Interaction latency is high. Optimize raycasting with spatial indexing'
      );
      recommendations.push('Consider implementing object pooling for UI elements');
    }

    // Node count specific recommendations
    if (config.nodes > 20000) {
      recommendations.push('For very large graphs, consider implementing node clustering');
      recommendations.push('Use canvas-based rendering for node labels instead of DOM elements');
      recommendations.push('Implement zoom-based detail levels');
    }

    if (config.nodes > 50000) {
      recommendations.push(
        'CRITICAL: Node count exceeds recommended limits for real-time 3D rendering'
      );
      recommendations.push('Consider implementing graph summarization techniques');
      recommendations.push('Use 2D mode as fallback for large datasets');
    }

    return recommendations;
  }

  /**
   * Run performance test for a specific configuration
   */
  private async runTest(config: (typeof TEST_CONFIGS)[0]): Promise<TestResult> {
    console.log(
      `\n🔥 Starting performance test: ${config.name} (${config.nodes} nodes, ${config.edges} edges)`
    );

    const errors: string[] = [];
    let success = true;

    try {
      // Generate test data
      const dataGenStart = performance.now();
      const { nodes, edges } = this.generateTestData(config);
      const dataGenTime = performance.now() - dataGenStart;

      // Test layout calculation
      const layoutTime = this.testLayoutCalculation(nodes, edges);

      // Test rendering performance
      const renderingTime = this.testRenderingPerformance(nodes, edges);

      // Estimate memory usage
      const memoryUsage = this.estimateMemoryUsage(nodes, edges);

      // Calculate frame rate
      const frameRate = this.calculateFrameRate(renderingTime);

      // Test interaction latency
      const interactionLatency = this.testInteractionLatency(nodes);

      const metrics: PerformanceMetrics = {
        dataGeneration: dataGenTime,
        layoutCalculation: layoutTime,
        renderingTime,
        memoryUsage,
        frameRate,
        interactionLatency,
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(config, metrics);

      // Determine success based on critical thresholds
      if (frameRate < 10 || memoryUsage > 1024 * 1024 * 1024) {
        success = false;
        errors.push('Critical performance thresholds exceeded');
      }

      return {
        config,
        metrics,
        success,
        errors,
        recommendations,
      };
    } catch (error) {
      console.error(`Test failed for ${config.name}:`, error);
      success = false;
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        config,
        metrics: {
          dataGeneration: 0,
          layoutCalculation: 0,
          renderingTime: 0,
          memoryUsage: 0,
          frameRate: 0,
          interactionLatency: 0,
        },
        success,
        errors,
        recommendations: ['Test execution failed'],
      };
    }
  }

  /**
   * Run all performance tests
   */
  public async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting 3D Knowledge Graph Performance Testing Suite\n');

    for (const config of TEST_CONFIGS) {
      const result = await this.runTest(config);
      this.results.push(result);

      // Add delay between tests to allow system recovery
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return this.results;
  }

  /**
   * Generate performance report
   */
  public generateReport(): string {
    const report = [
      '# 3D Knowledge Graph Performance Test Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Executive Summary',
      '',
    ];

    // Summary statistics
    const successful = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;

    report.push(`- Total tests: ${this.results.length}`);
    report.push(`- Successful: ${successful}`);
    report.push(`- Failed: ${failed}`);
    report.push('');

    // Find maximum viable configuration
    const maxViableConfig = this.results
      .filter((r) => r.success && r.metrics.frameRate >= 30)
      .sort((a, b) => b.config.nodes - a.config.nodes)[0];

    if (maxViableConfig) {
      report.push(
        `**Maximum viable configuration:** ${maxViableConfig.config.name} (${maxViableConfig.config.nodes} nodes, ${maxViableConfig.config.edges} edges)`
      );
      report.push(`**Frame rate:** ${maxViableConfig.metrics.frameRate.toFixed(1)} FPS`);
      report.push(
        `**Memory usage:** ${(maxViableConfig.metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB`
      );
    } else {
      report.push('**No configuration met optimal performance criteria (30+ FPS)**');
    }

    report.push('');
    report.push('## Detailed Results');
    report.push('');

    // Detailed results for each test
    for (const result of this.results) {
      report.push(`### ${result.config.name} Configuration`);
      report.push(`- **Nodes:** ${result.config.nodes.toLocaleString()}`);
      report.push(`- **Edges:** ${result.config.edges.toLocaleString()}`);
      report.push(`- **Status:** ${result.success ? '✅ Success' : '❌ Failed'}`);
      report.push('');

      if (result.success) {
        report.push('**Performance Metrics:**');
        report.push(`- Data Generation: ${result.metrics.dataGeneration.toFixed(2)}ms`);
        report.push(`- Layout Calculation: ${result.metrics.layoutCalculation.toFixed(2)}ms`);
        report.push(`- Rendering Time: ${result.metrics.renderingTime.toFixed(2)}ms`);
        report.push(`- Memory Usage: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
        report.push(`- Frame Rate: ${result.metrics.frameRate.toFixed(1)} FPS`);
        report.push(`- Interaction Latency: ${result.metrics.interactionLatency.toFixed(2)}ms`);
        report.push('');

        if (result.recommendations.length > 0) {
          report.push('**Recommendations:**');
          result.recommendations.forEach((rec) => {
            report.push(`- ${rec}`);
          });
        }
      } else {
        report.push('**Errors:**');
        result.errors.forEach((error) => {
          report.push(`- ${error}`);
        });
      }

      report.push('');
    }

    // Performance comparison table
    report.push('## Performance Comparison');
    report.push('');
    report.push('| Configuration | Nodes | FPS | Memory (MB) | Layout (ms) | Status |');
    report.push('|---------------|--------|-----|-------------|-------------|---------|');

    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      const fps = result.success ? result.metrics.frameRate.toFixed(1) : 'N/A';
      const memory = result.success ? (result.metrics.memoryUsage / 1024 / 1024).toFixed(1) : 'N/A';
      const layout = result.success ? result.metrics.layoutCalculation.toFixed(0) : 'N/A';

      report.push(
        `| ${result.config.name} | ${result.config.nodes.toLocaleString()} | ${fps} | ${memory} | ${layout} | ${status} |`
      );
    }

    report.push('');
    report.push('## Recommendations for Production');
    report.push('');

    // Global recommendations
    const globalRecommendations = [
      '1. **Optimal Configuration**: Use up to 10,000 nodes for real-time interaction',
      '2. **Performance Monitoring**: Implement FPS monitoring in production',
      '3. **Progressive Loading**: Load graph data incrementally based on user navigation',
      '4. **Fallback Strategy**: Provide 2D view for very large datasets',
      '5. **User Controls**: Allow users to adjust detail levels and disable animations',
      '6. **Caching Strategy**: Cache layout calculations for static portions of the graph',
      '7. **Mobile Optimization**: Reduce node count automatically on mobile devices',
      '8. **WebGL Fallback**: Provide canvas-based fallback for WebGL failures',
    ];

    globalRecommendations.forEach((rec) => {
      report.push(rec);
    });

    return report.join('\n');
  }

  /**
   * Save results to files
   */
  public saveResults(): void {
    const outputDir = join(process.cwd(), 'reports', 'performance');

    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create output directory:', error);
    }

    // Save detailed results as JSON
    const jsonResults = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: this.results.length,
        successful: this.results.filter((r) => r.success).length,
        failed: this.results.filter((r) => !r.success).length,
        maxViableNodes:
          this.results
            .filter((r) => r.success && r.metrics.frameRate >= 30)
            .sort((a, b) => b.config.nodes - a.config.nodes)[0]?.config.nodes || 0,
      },
    };

    try {
      writeFileSync(
        join(outputDir, 'performance-test-results.json'),
        JSON.stringify(jsonResults, null, 2)
      );
      console.log(
        `📊 Detailed results saved to: ${join(outputDir, 'performance-test-results.json')}`
      );
    } catch (error) {
      console.warn('Could not save JSON results:', error);
    }

    // Save report as markdown
    try {
      writeFileSync(join(outputDir, 'performance-test-report.md'), this.generateReport());
      console.log(
        `📋 Performance report saved to: ${join(outputDir, 'performance-test-report.md')}`
      );
    } catch (error) {
      console.warn('Could not save markdown report:', error);
    }
  }
}

// Main execution
async function main() {
  const tester = new Performance3DGraphTester();

  try {
    await tester.runAllTests();

    // Generate and display summary
    console.log('\n🎯 Performance Testing Complete!');
    console.log('='.repeat(50));

    const report = tester.generateReport();
    console.log(report);

    // Save results
    tester.saveResults();
  } catch (error) {
    console.error('Performance testing failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { Performance3DGraphTester };
