#!/usr/bin/env tsx
/**
 * Performance Analyzer for React Scan
 * Analyzes performance data collected by React Scan and generates insights
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PerformanceMetric {
  component: string;
  renderTime: number;
  renderCount: number;
  memoryUsage: number;
  timestamp: number;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

interface PerformanceReport {
  timestamp: number;
  duration: number;
  totalRenders: number;
  averageRenderTime: number;
  slowestComponents: PerformanceMetric[];
  memoryLeaks: PerformanceMetric[];
  recommendations: string[];
}

class PerformanceAnalyzer {
  private reportsDir: string;
  private outputDir: string;

  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'performance-reports');
    this.outputDir = path.join(__dirname, '..', 'performance-analysis');
  }

  async analyze(): Promise<void> {
    console.log('🔍 Analyzing React Scan performance data...');
    
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // Read all performance reports
      const reports = await this.readPerformanceReports();
      
      if (reports.length === 0) {
        console.log('❌ No performance reports found. Run dev:scan:report first.');
        return;
      }
      
      // Generate analysis
      const analysis = await this.generateAnalysis(reports);
      
      // Save analysis results
      await this.saveAnalysis(analysis);
      
      // Generate HTML report
      await this.generateHTMLReport(analysis);
      
      console.log(`✅ Analysis complete! Reports saved to: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Error analyzing performance data:', error);
      process.exit(1);
    }
  }

  private async readPerformanceReports(): Promise<PerformanceMetric[]> {
    const reports: PerformanceMetric[] = [];
    
    try {
      const files = await fs.readdir(this.reportsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(this.reportsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Handle different report formats
        if (Array.isArray(data)) {
          reports.push(...data);
        } else if (data.metrics && Array.isArray(data.metrics)) {
          reports.push(...data.metrics);
        } else {
          reports.push(data);
        }
      }
      
      console.log(`📊 Loaded ${reports.length} performance metrics from ${jsonFiles.length} files`);
      return reports;
      
    } catch (error) {
      console.error('Error reading performance reports:', error);
      return [];
    }
  }

  private async generateAnalysis(metrics: PerformanceMetric[]): Promise<PerformanceReport> {
    const now = Date.now();
    const totalRenders = metrics.length;
    const totalRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0);
    const averageRenderTime = totalRenderTime / totalRenders;
    
    // Find slowest components
    const slowestComponents = metrics
      .filter(m => m.renderTime > 16) // > 16ms (60fps threshold)
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10);
    
    // Detect potential memory leaks
    const memoryLeaks = metrics
      .filter(m => m.memoryUsage > 50) // > 50MB
      .sort((a, b) => b.memoryUsage - a.memoryUsage)
      .slice(0, 5);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, averageRenderTime);
    
    return {
      timestamp: now,
      duration: this.calculateDuration(metrics),
      totalRenders,
      averageRenderTime,
      slowestComponents,
      memoryLeaks,
      recommendations
    };
  }

  private generateRecommendations(metrics: PerformanceMetric[], averageRenderTime: number): string[] {
    const recommendations: string[] = [];
    
    // Check for frequent re-renders
    const componentRenderCounts = new Map<string, number>();
    metrics.forEach(m => {
      componentRenderCounts.set(m.component, (componentRenderCounts.get(m.component) || 0) + 1);
    });
    
    const frequentlyRenderingComponents = Array.from(componentRenderCounts.entries())
      .filter(([, count]) => count > 10)
      .sort((a, b) => b[1] - a[1]);
    
    if (frequentlyRenderingComponents.length > 0) {
      recommendations.push(
        `Consider optimizing components with frequent re-renders: ${frequentlyRenderingComponents.slice(0, 3).map(([name]) => name).join(', ')}`
      );
    }
    
    // Check for slow renders
    const slowRenders = metrics.filter(m => m.renderTime > 50);
    if (slowRenders.length > 0) {
      recommendations.push(
        `${slowRenders.length} renders took longer than 50ms. Consider using React.memo() or useMemo() for expensive computations.`
      );
    }
    
    // Check average render time
    if (averageRenderTime > 16) {
      recommendations.push(
        `Average render time (${averageRenderTime.toFixed(2)}ms) exceeds 16ms target. Consider code splitting or lazy loading.`
      );
    }
    
    // Check for memory issues
    const highMemoryUsage = metrics.filter(m => m.memoryUsage > 100);
    if (highMemoryUsage.length > 0) {
      recommendations.push(
        `High memory usage detected. Consider implementing proper cleanup in useEffect hooks and removing unused dependencies.`
      );
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great job! No major performance issues detected.');
    }
    
    return recommendations;
  }

  private calculateDuration(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const timestamps = metrics.map(m => m.timestamp).sort((a, b) => a - b);
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  private async saveAnalysis(analysis: PerformanceReport): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-analysis-${timestamp}.json`;
    const filePath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
    console.log(`📝 Analysis saved to: ${filename}`);
  }

  private async generateHTMLReport(analysis: PerformanceReport): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Scan Performance Analysis</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .metric { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #3498db; }
        .warning { border-left-color: #e74c3c; background: #fdf2f2; }
        .success { border-left-color: #27ae60; background: #f0f9f0; }
        .component-list { list-style: none; padding: 0; }
        .component-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between; }
        .render-time { font-weight: bold; color: #e74c3c; }
        .memory-usage { font-weight: bold; color: #f39c12; }
        .recommendations { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #34495e; color: white; padding: 20px; border-radius: 5px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { font-size: 0.9em; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 React Scan Performance Analysis</h1>
        <p><strong>Generated:</strong> ${new Date(analysis.timestamp).toLocaleString()}</p>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${analysis.totalRenders}</div>
                <div class="stat-label">Total Renders</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${analysis.averageRenderTime.toFixed(2)}ms</div>
                <div class="stat-label">Average Render Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(analysis.duration / 1000).toFixed(1)}s</div>
                <div class="stat-label">Analysis Duration</div>
            </div>
        </div>

        <h2>🐌 Slowest Components</h2>
        ${analysis.slowestComponents.length > 0 ? `
            <ul class="component-list">
                ${analysis.slowestComponents.map(comp => `
                    <li class="component-item">
                        <span>${comp.component}</span>
                        <span class="render-time">${comp.renderTime.toFixed(2)}ms</span>
                    </li>
                `).join('')}
            </ul>
        ` : '<p class="success">No slow components detected!</p>'}

        <h2>🧠 Memory Usage</h2>
        ${analysis.memoryLeaks.length > 0 ? `
            <ul class="component-list">
                ${analysis.memoryLeaks.map(comp => `
                    <li class="component-item">
                        <span>${comp.component}</span>
                        <span class="memory-usage">${comp.memoryUsage.toFixed(2)}MB</span>
                    </li>
                `).join('')}
            </ul>
        ` : '<p class="success">No memory issues detected!</p>'}

        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            ${analysis.recommendations.map(rec => `
                <div class="recommendation">• ${rec}</div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-report-${timestamp}.html`;
    const filePath = path.join(this.outputDir, filename);
    
    await fs.writeFile(filePath, html);
    console.log(`📊 HTML report saved to: ${filename}`);
  }
}

// Main execution
async function main() {
  const analyzer = new PerformanceAnalyzer();
  await analyzer.analyze();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PerformanceAnalyzer;