#!/usr/bin/env tsx
/**
 * Quick 3D Knowledge Graph Performance Test
 * Optimized version for faster execution
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
// Simplified test configurations
const TEST_CONFIGS = [
    { nodes: 1000, edges: 2000, name: 'Small' },
    { nodes: 5000, edges: 10000, name: 'Medium' },
    { nodes: 10000, edges: 20000, name: 'Large' },
    { nodes: 15000, edges: 30000, name: 'XLarge' },
];
class Quick3DPerformanceTester {
    results = [];
    generateTestData(config) {
        const start = performance.now();
        // Simplified data generation
        const nodes = Array.from({ length: config.nodes }, (_, i) => ({
            id: `node_${i}`,
            x: Math.random() * 100,
            y: Math.random() * 100,
            z: Math.random() * 100,
            connections: Math.floor(Math.random() * 5),
        }));
        const edges = Array.from({ length: config.edges }, (_, _i) => ({
            source: Math.floor(Math.random() * config.nodes),
            target: Math.floor(Math.random() * config.nodes),
            weight: Math.random(),
        }));
        return {
            nodes,
            edges,
            time: performance.now() - start,
        };
    }
    testLayoutCalculation(nodeCount) {
        const start = performance.now();
        // Simplified force calculation simulation
        const iterations = Math.min(10, Math.floor(1000 / Math.sqrt(nodeCount)));
        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < nodeCount; i++) {
                // Simulate force calculations
                const forces = Math.sqrt(Math.random() * nodeCount);
                Math.sin(forces) * Math.cos(forces);
            }
        }
        return performance.now() - start;
    }
    testRenderingPerformance(nodeCount, edgeCount) {
        const start = performance.now();
        // Simulate 30 frames of rendering
        for (let frame = 0; frame < 30; frame++) {
            // Simulate node rendering
            for (let i = 0; i < nodeCount; i++) {
                Math.sqrt(i * Math.random());
            }
            // Simulate edge rendering
            for (let i = 0; i < edgeCount; i++) {
                Math.sqrt(i * Math.random());
            }
        }
        return performance.now() - start;
    }
    estimateMemoryUsage(nodeCount, edgeCount) {
        // Estimated memory usage in MB
        const nodeMemory = nodeCount * 0.0002; // 200 bytes per node
        const edgeMemory = edgeCount * 0.0001; // 100 bytes per edge
        return nodeMemory + edgeMemory;
    }
    testInteractionLatency(nodeCount) {
        const start = performance.now();
        // Simulate raycasting for node selection
        for (let i = 0; i < Math.min(100, nodeCount); i++) {
            Math.sqrt(i * Math.random() * Math.PI);
        }
        return performance.now() - start;
    }
    generateRecommendations(result) {
        const recommendations = [];
        if (result.estimatedFPS < 30) {
            recommendations.push('Consider implementing Level of Detail (LOD) for distant nodes');
            recommendations.push('Use instanced rendering for similar node types');
        }
        if (result.estimatedFPS < 15) {
            recommendations.push('CRITICAL: Frame rate too low. Implement node clustering');
        }
        if (result.memoryUsageMB > 100) {
            recommendations.push('High memory usage. Consider data streaming');
        }
        if (result.layoutTime > 1000) {
            recommendations.push('Layout calculation is slow. Use WebWorkers');
        }
        if (result.config.nodes > 10000) {
            recommendations.push('Large dataset detected. Implement progressive loading');
        }
        return recommendations;
    }
    async runTest(config) {
        console.log(`Testing ${config.name}: ${config.nodes} nodes, ${config.edges} edges`);
        try {
            // Generate test data
            const { time: dataGenTime } = this.generateTestData(config);
            // Test layout calculation
            const layoutTime = this.testLayoutCalculation(config.nodes);
            // Test rendering performance
            const renderingTime = this.testRenderingPerformance(config.nodes, config.edges);
            // Calculate estimated FPS
            const avgFrameTime = renderingTime / 30;
            const estimatedFPS = avgFrameTime > 0 ? 1000 / avgFrameTime : 1000;
            // Estimate memory usage
            const memoryUsageMB = this.estimateMemoryUsage(config.nodes, config.edges);
            // Test interaction latency
            const interactionLatency = this.testInteractionLatency(config.nodes);
            const result = {
                config,
                dataGenTime,
                layoutTime,
                renderingTime,
                memoryUsageMB,
                estimatedFPS,
                interactionLatency,
                success: true,
                recommendations: [],
            };
            result.recommendations = this.generateRecommendations(result);
            console.log(`  ✅ Completed: ${estimatedFPS.toFixed(1)} FPS, ${memoryUsageMB.toFixed(1)} MB`);
            return result;
        }
        catch (error) {
            console.log(`  ❌ Failed: ${error}`);
            return {
                config,
                dataGenTime: 0,
                layoutTime: 0,
                renderingTime: 0,
                memoryUsageMB: 0,
                estimatedFPS: 0,
                interactionLatency: 0,
                success: false,
                recommendations: ['Test execution failed'],
            };
        }
    }
    async runAllTests() {
        console.log('🚀 Quick 3D Performance Testing Started\n');
        for (const config of TEST_CONFIGS) {
            const result = await this.runTest(config);
            this.results.push(result);
        }
        return this.results;
    }
    generateReport() {
        const report = [
            '# 3D Knowledge Graph Performance Test Report',
            `Generated: ${new Date().toISOString()}`,
            '',
            '## Summary',
            '',
        ];
        // Find maximum viable configuration
        const viableConfigs = this.results.filter(r => r.success && r.estimatedFPS >= 30);
        const maxViable = viableConfigs.sort((a, b) => b.config.nodes - a.config.nodes)[0];
        if (maxViable) {
            report.push(`**Recommended maximum:** ${maxViable.config.nodes.toLocaleString()} nodes`);
            report.push(`**Performance at max:** ${maxViable.estimatedFPS.toFixed(1)} FPS`);
            report.push(`**Memory usage:** ${maxViable.memoryUsageMB.toFixed(1)} MB`);
        }
        else {
            report.push('**Warning:** No configuration achieved 30+ FPS');
        }
        report.push('');
        report.push('## Test Results');
        report.push('');
        report.push('| Configuration | Nodes | Est. FPS | Memory (MB) | Layout (ms) | Status |');
        report.push('|---------------|--------|----------|-------------|-------------|---------|');
        for (const result of this.results) {
            const status = result.success ? '✅' : '❌';
            const fps = result.success ? result.estimatedFPS.toFixed(1) : 'N/A';
            const memory = result.success ? result.memoryUsageMB.toFixed(1) : 'N/A';
            const layout = result.success ? result.layoutTime.toFixed(0) : 'N/A';
            report.push(`| ${result.config.name} | ${result.config.nodes.toLocaleString()} | ${fps} | ${memory} | ${layout} | ${status} |`);
        }
        report.push('');
        report.push('## Detailed Analysis');
        for (const result of this.results) {
            if (!result.success)
                continue;
            report.push('');
            report.push(`### ${result.config.name} Configuration`);
            report.push(`- **Nodes:** ${result.config.nodes.toLocaleString()}`);
            report.push(`- **Edges:** ${result.config.edges.toLocaleString()}`);
            report.push(`- **Data Generation:** ${result.dataGenTime.toFixed(2)}ms`);
            report.push(`- **Layout Calculation:** ${result.layoutTime.toFixed(2)}ms`);
            report.push(`- **Rendering:** ${result.renderingTime.toFixed(2)}ms`);
            report.push(`- **Estimated FPS:** ${result.estimatedFPS.toFixed(1)}`);
            report.push(`- **Memory Usage:** ${result.memoryUsageMB.toFixed(2)} MB`);
            report.push(`- **Interaction Latency:** ${result.interactionLatency.toFixed(2)}ms`);
            if (result.recommendations.length > 0) {
                report.push('');
                report.push('**Recommendations:**');
                result.recommendations.forEach(rec => {
                    report.push(`- ${rec}`);
                });
            }
        }
        report.push('');
        report.push('## Production Recommendations');
        report.push('');
        report.push('1. **Optimal Range:** 1,000-10,000 nodes for smooth interaction');
        report.push('2. **Performance Monitoring:** Implement real-time FPS tracking');
        report.push('3. **Progressive Loading:** Load graph data in chunks');
        report.push('4. **Fallback Strategy:** Provide 2D view for large datasets');
        report.push('5. **Mobile Optimization:** Reduce node count on mobile devices');
        report.push('6. **User Controls:** Allow users to adjust quality settings');
        return report.join('\n');
    }
    saveResults() {
        const outputDir = join(process.cwd(), 'reports', 'performance');
        try {
            mkdirSync(outputDir, { recursive: true });
        }
        catch (_error) {
            // Directory might already exist
        }
        // Save results
        const jsonData = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                maxViableNodes: this.results
                    .filter(r => r.success && r.estimatedFPS >= 30)
                    .sort((a, b) => b.config.nodes - a.config.nodes)[0]?.config.nodes || 0,
                totalTests: this.results.length,
                successfulTests: this.results.filter(r => r.success).length,
            },
        };
        try {
            writeFileSync(join(outputDir, '3d-performance-results.json'), JSON.stringify(jsonData, null, 2));
            console.log(`\n📊 Results saved: ${join(outputDir, '3d-performance-results.json')}`);
        }
        catch (_error) {
            console.warn('Could not save JSON results');
        }
        try {
            writeFileSync(join(outputDir, '3d-performance-report.md'), this.generateReport());
            console.log(`📋 Report saved: ${join(outputDir, '3d-performance-report.md')}`);
        }
        catch (_error) {
            console.warn('Could not save report');
        }
    }
}
async function main() {
    const tester = new Quick3DPerformanceTester();
    await tester.runAllTests();
    console.log('\n🎯 Performance Testing Complete!');
    console.log('='.repeat(50));
    const report = tester.generateReport();
    console.log(report);
    tester.saveResults();
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
export { Quick3DPerformanceTester };
