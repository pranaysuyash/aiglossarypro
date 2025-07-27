#!/usr/bin/env tsx
/**
 * Generate Performance Report
 * Creates comprehensive performance reports from React Scan data
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PerformanceData {
  timestamp: number;
  component: string;
  renderTime: number;
  renderCount: number;
  memoryUsage: number;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  stackTrace?: string;
}

interface ReportConfig {
  timeRange: 'last-hour' | 'last-day' | 'last-week' | 'all';
  includeStackTraces: boolean;
  format: 'json' | 'html' | 'csv' | 'markdown';
  outputDir: string;
}

class PerformanceReporter {
  private reportsDir: string;
  private config: ReportConfig;

  constructor(config: Partial<ReportConfig> = {}) {
    this.reportsDir = path.join(__dirname, '..', 'performance-reports');
    this.config = {
      timeRange: 'last-day',
      includeStackTraces: false,
      format: 'html',
      outputDir: path.join(__dirname, '..', 'performance-output'),
      ...config,
    };
  }

  async generateReport(): Promise<void> {
    console.log('📊 Generating performance report...');

    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // Load performance data
      const data = await this.loadPerformanceData();

      if (data.length === 0) {
        console.log('❌ No performance data found. Run React Scan first.');
        return;
      }

      // Filter data based on time range
      const filteredData = this.filterByTimeRange(data);

      // Generate report based on format
      switch (this.config.format) {
        case 'json':
          await this.generateJSONReport(filteredData);
          break;
        case 'html':
          await this.generateHTMLReport(filteredData);
          break;
        case 'csv':
          await this.generateCSVReport(filteredData);
          break;
        case 'markdown':
          await this.generateMarkdownReport(filteredData);
          break;
      }

      console.log(`✅ Performance report generated in ${this.config.outputDir}`);
    } catch (error) {
      console.error('❌ Error generating performance report:', error);
      process.exit(1);
    }
  }

  private async loadPerformanceData(): Promise<PerformanceData[]> {
    const data: PerformanceData[] = [];

    try {
      const files = await fs.readdir(this.reportsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(this.reportsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
          data.push(...parsed);
        } else if (parsed.metrics) {
          data.push(...parsed.metrics);
        }
      }

      return data.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error loading performance data:', error);
      return [];
    }
  }

  private filterByTimeRange(data: PerformanceData[]): PerformanceData[] {
    const now = Date.now();
    const timeRanges = {
      'last-hour': 60 * 60 * 1000,
      'last-day': 24 * 60 * 60 * 1000,
      'last-week': 7 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    const rangeMs = timeRanges[this.config.timeRange];
    return data.filter(item => now - item.timestamp <= rangeMs);
  }

  private async generateJSONReport(data: PerformanceData[]): Promise<void> {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange: this.config.timeRange,
      totalEntries: data.length,
      summary: this.generateSummary(data),
      data: this.config.includeStackTraces ? data : data.map(({ stackTrace, ...rest }) => rest),
    };

    const filename = `performance-report-${Date.now()}.json`;
    const filepath = path.join(this.config.outputDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${filename}`);
  }

  private async generateHTMLReport(data: PerformanceData[]): Promise<void> {
    const summary = this.generateSummary(data);
    const componentStats = this.generateComponentStats(data);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Performance Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2rem; font-weight: 700; color: #2d3748; }
        .stat-label { color: #718096; font-size: 0.9rem; margin-top: 5px; }
        .section { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .section h2 { color: #2d3748; margin-bottom: 20px; font-size: 1.5rem; }
        .component-table { width: 100%; border-collapse: collapse; }
        .component-table th, .component-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .component-table th { background: #f7fafc; font-weight: 600; color: #4a5568; }
        .render-time { font-weight: 600; }
        .render-time.slow { color: #e53e3e; }
        .render-time.medium { color: #dd6b20; }
        .render-time.fast { color: #38a169; }
        .chart-container { height: 300px; margin: 20px 0; }
        .alert { padding: 15px; border-radius: 6px; margin: 10px 0; }
        .alert.warning { background: #fed7d7; color: #c53030; border: 1px solid #feb2b2; }
        .alert.info { background: #bee3f8; color: #2b6cb0; border: 1px solid #90cdf4; }
        .alert.success { background: #c6f6d5; color: #276749; border: 1px solid #9ae6b4; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 React Performance Report</h1>
            <p>Generated on ${new Date().toLocaleString()} • Time Range: ${this.config.timeRange}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${summary.totalRenders}</div>
                <div class="stat-label">Total Renders</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summary.averageRenderTime.toFixed(2)}ms</div>
                <div class="stat-label">Average Render Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summary.uniqueComponents}</div>
                <div class="stat-label">Unique Components</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${summary.slowRenders}</div>
                <div class="stat-label">Slow Renders (>50ms)</div>
            </div>
        </div>
        
        ${this.generateAlerts(summary)}
        
        <div class="section">
            <h2>📊 Component Performance</h2>
            <table class="component-table">
                <thead>
                    <tr>
                        <th>Component</th>
                        <th>Renders</th>
                        <th>Avg Time</th>
                        <th>Max Time</th>
                        <th>Memory Usage</th>
                    </tr>
                </thead>
                <tbody>
                    ${componentStats
                      .map(
                        stat => `
                        <tr>
                            <td>${stat.component}</td>
                            <td>${stat.renderCount}</td>
                            <td class="render-time ${this.getRenderTimeClass(stat.avgRenderTime)}">${stat.avgRenderTime.toFixed(2)}ms</td>
                            <td class="render-time ${this.getRenderTimeClass(stat.maxRenderTime)}">${stat.maxRenderTime.toFixed(2)}ms</td>
                            <td>${stat.avgMemoryUsage.toFixed(2)}MB</td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>📈 Performance Trends</h2>
            <div class="chart-container">
                <p>Interactive charts would be rendered here with a charting library like Chart.js</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    const filename = `performance-report-${Date.now()}.html`;
    const filepath = path.join(this.config.outputDir, filename);

    await fs.writeFile(filepath, html);
    console.log(`📄 HTML report saved: ${filename}`);
  }

  private async generateCSVReport(data: PerformanceData[]): Promise<void> {
    const headers = ['timestamp', 'component', 'renderTime', 'renderCount', 'memoryUsage'];
    const rows = data.map(item => [
      new Date(item.timestamp).toISOString(),
      item.component,
      item.renderTime,
      item.renderCount,
      item.memoryUsage,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const filename = `performance-report-${Date.now()}.csv`;
    const filepath = path.join(this.config.outputDir, filename);

    await fs.writeFile(filepath, csv);
    console.log(`📄 CSV report saved: ${filename}`);
  }

  private async generateMarkdownReport(data: PerformanceData[]): Promise<void> {
    const summary = this.generateSummary(data);
    const componentStats = this.generateComponentStats(data);

    const markdown = `
# React Performance Report

**Generated:** ${new Date().toLocaleString()}  
**Time Range:** ${this.config.timeRange}  
**Total Entries:** ${data.length}

## Summary

- **Total Renders:** ${summary.totalRenders}
- **Average Render Time:** ${summary.averageRenderTime.toFixed(2)}ms
- **Unique Components:** ${summary.uniqueComponents}
- **Slow Renders (>50ms):** ${summary.slowRenders}

## Component Performance

| Component | Renders | Avg Time | Max Time | Memory Usage |
|-----------|---------|----------|----------|--------------|
${componentStats
  .map(
    stat =>
      `| ${stat.component} | ${stat.renderCount} | ${stat.avgRenderTime.toFixed(2)}ms | ${stat.maxRenderTime.toFixed(2)}ms | ${stat.avgMemoryUsage.toFixed(2)}MB |`
  )
  .join('\n')}

## Performance Insights

${this.generateInsights(summary, componentStats)}
    `;

    const filename = `performance-report-${Date.now()}.md`;
    const filepath = path.join(this.config.outputDir, filename);

    await fs.writeFile(filepath, markdown);
    console.log(`📄 Markdown report saved: ${filename}`);
  }

  private generateSummary(data: PerformanceData[]) {
    const totalRenders = data.length;
    const totalRenderTime = data.reduce((sum, item) => sum + item.renderTime, 0);
    const averageRenderTime = totalRenderTime / totalRenders;
    const uniqueComponents = new Set(data.map(item => item.component)).size;
    const slowRenders = data.filter(item => item.renderTime > 50).length;

    return {
      totalRenders,
      averageRenderTime,
      uniqueComponents,
      slowRenders,
    };
  }

  private generateComponentStats(data: PerformanceData[]) {
    const componentMap = new Map<string, PerformanceData[]>();

    data.forEach(item => {
      if (!componentMap.has(item.component)) {
        componentMap.set(item.component, []);
      }
      componentMap.get(item.component)?.push(item);
    });

    return Array.from(componentMap.entries())
      .map(([component, items]) => ({
        component,
        renderCount: items.length,
        avgRenderTime: items.reduce((sum, item) => sum + item.renderTime, 0) / items.length,
        maxRenderTime: Math.max(...items.map(item => item.renderTime)),
        avgMemoryUsage: items.reduce((sum, item) => sum + item.memoryUsage, 0) / items.length,
      }))
      .sort((a, b) => b.avgRenderTime - a.avgRenderTime);
  }

  private getRenderTimeClass(time: number): string {
    if (time > 50) return 'slow';
    if (time > 16) return 'medium';
    return 'fast';
  }

  private generateAlerts(summary: any): string {
    const alerts = [];

    if (summary.averageRenderTime > 50) {
      alerts.push(
        `<div class="alert warning">⚠️ Average render time (${summary.averageRenderTime.toFixed(2)}ms) is high. Consider optimizing component rendering.</div>`
      );
    }

    if (summary.slowRenders > summary.totalRenders * 0.1) {
      alerts.push(
        `<div class="alert warning">⚠️ ${summary.slowRenders} slow renders detected (${((summary.slowRenders / summary.totalRenders) * 100).toFixed(1)}% of total).</div>`
      );
    }

    if (summary.averageRenderTime < 16) {
      alerts.push(
        `<div class="alert success">✅ Great performance! Average render time is within the 60fps target.</div>`
      );
    }

    return alerts.length > 0
      ? alerts.join('')
      : '<div class="alert info">ℹ️ No performance issues detected.</div>';
  }

  private generateInsights(summary: any, componentStats: unknown[]): string {
    const insights = [];

    const slowestComponent = componentStats[0];
    if (slowestComponent && slowestComponent.avgRenderTime > 50) {
      insights.push(
        `- **Slowest Component:** ${slowestComponent.component} (${slowestComponent.avgRenderTime.toFixed(2)}ms avg)`
      );
    }

    const mostRenderedComponent = componentStats.reduce(
      (max, comp) => (comp.renderCount > max.renderCount ? comp : max),
      componentStats[0]
    );
    if (mostRenderedComponent && mostRenderedComponent.renderCount > 10) {
      insights.push(
        `- **Most Rendered:** ${mostRenderedComponent.component} (${mostRenderedComponent.renderCount} renders)`
      );
    }

    if (summary.slowRenders > 5) {
      insights.push(
        `- **Recommendation:** Consider implementing React.memo() or useMemo() for components with slow renders`
      );
    }

    return insights.length > 0 ? insights.join('\n') : '- No specific insights available';
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const config: Partial<ReportConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--time-range':
        config.timeRange = args[++i] as ReportConfig['timeRange'];
        break;
      case '--format':
        config.format = args[++i] as ReportConfig['format'];
        break;
      case '--include-stack-traces':
        config.includeStackTraces = true;
        break;
      case '--output-dir':
        config.outputDir = args[++i];
        break;
    }
  }

  const reporter = new PerformanceReporter(config);
  await reporter.generateReport();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PerformanceReporter;
