#!/usr/bin/env tsx

/**
 * Performance Dashboard Server
 * Creates a real-time performance monitoring dashboard
 */

import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PerformanceMetric {
  timestamp: number;
  component: string;
  renderTime: number;
  renderCount: number;
  memoryUsage: number;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

interface DashboardData {
  liveMetrics: PerformanceMetric[];
  summary: {
    totalRenders: number;
    averageRenderTime: number;
    uniqueComponents: number;
    slowRenders: number;
  };
  componentStats: Array<{
    component: string;
    renderCount: number;
    avgRenderTime: number;
    maxRenderTime: number;
    memoryUsage: number;
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>;
}

class PerformanceDashboard {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private reportsDir: string;
  private port: number;
  private updateInterval: number;

  constructor(port: number = 3002, updateInterval: number = 1000) {
    this.port = port;
    this.updateInterval = updateInterval;
    this.reportsDir = path.join(__dirname, '..', 'performance-reports');

    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupRoutes();
    this.setupSocketIO();
  }

  private setupRoutes(): void {
    // Serve static files
    this.app.use('/static', express.static(path.join(__dirname, 'dashboard-assets')));

    // API endpoints
    this.app.get('/api/metrics', async (_req, res) => {
      try {
        const data = await this.getDashboardData();
        res.json(data);
      } catch (_error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    });

    this.app.get('/api/metrics/live', async (_req, res) => {
      try {
        const liveMetrics = await this.getLiveMetrics();
        res.json(liveMetrics);
      } catch (_error) {
        res.status(500).json({ error: 'Failed to fetch live metrics' });
      }
    });

    // Main dashboard page
    this.app.get('/', (_req, res) => {
      res.send(this.generateDashboardHTML());
    });
  }

  private setupSocketIO(): void {
    this.io.on('connection', socket => {
      console.log('📊 Dashboard client connected');

      // Send initial data
      this.getDashboardData().then(data => {
        socket.emit('dashboard-data', data);
      });

      socket.on('disconnect', () => {
        console.log('📊 Dashboard client disconnected');
      });
    });
  }

  private async getDashboardData(): Promise<DashboardData> {
    const metrics = await this.loadPerformanceMetrics();
    const liveMetrics = metrics.slice(0, 100); // Last 100 metrics

    const summary = this.calculateSummary(metrics);
    const componentStats = this.calculateComponentStats(metrics);
    const alerts = this.generateAlerts(metrics);

    return {
      liveMetrics,
      summary,
      componentStats,
      alerts,
    };
  }

  private async getLiveMetrics(): Promise<PerformanceMetric[]> {
    const metrics = await this.loadPerformanceMetrics();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    return metrics.filter(metric => metric.timestamp > fiveMinutesAgo);
  }

  private async loadPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      const files = await fs.readdir(this.reportsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const allMetrics: PerformanceMetric[] = [];

      for (const file of jsonFiles) {
        const filePath = path.join(this.reportsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          allMetrics.push(...data);
        } else if (data.metrics) {
          allMetrics.push(...data.metrics);
        }
      }

      return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
      return [];
    }
  }

  private calculateSummary(metrics: PerformanceMetric[]) {
    const totalRenders = metrics.length;
    const totalRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0);
    const averageRenderTime = totalRenderTime / totalRenders || 0;
    const uniqueComponents = new Set(metrics.map(m => m.component)).size;
    const slowRenders = metrics.filter(m => m.renderTime > 50).length;

    return {
      totalRenders,
      averageRenderTime,
      uniqueComponents,
      slowRenders,
    };
  }

  private calculateComponentStats(metrics: PerformanceMetric[]) {
    const componentMap = new Map<string, PerformanceMetric[]>();

    metrics.forEach(metric => {
      if (!componentMap.has(metric.component)) {
        componentMap.set(metric.component, []);
      }
      componentMap.get(metric.component)?.push(metric);
    });

    return Array.from(componentMap.entries())
      .map(([component, items]) => ({
        component,
        renderCount: items.length,
        avgRenderTime: items.reduce((sum, item) => sum + item.renderTime, 0) / items.length,
        maxRenderTime: Math.max(...items.map(item => item.renderTime)),
        memoryUsage: items.reduce((sum, item) => sum + item.memoryUsage, 0) / items.length,
      }))
      .sort((a, b) => b.avgRenderTime - a.avgRenderTime)
      .slice(0, 20); // Top 20 components
  }

  private generateAlerts(metrics: PerformanceMetric[]) {
    const alerts = [];
    const now = Date.now();

    // Check for recent slow renders
    const recentSlowRenders = metrics.filter(
      m => m.renderTime > 100 && now - m.timestamp < 60000 // Last minute
    );

    if (recentSlowRenders.length > 0) {
      alerts.push({
        type: 'warning' as const,
        message: `${recentSlowRenders.length} slow renders detected in the last minute`,
        timestamp: now,
      });
    }

    // Check for memory issues
    const highMemoryUsage = metrics.filter(
      m => m.memoryUsage > 100 && now - m.timestamp < 300000 // Last 5 minutes
    );

    if (highMemoryUsage.length > 0) {
      alerts.push({
        type: 'error' as const,
        message: `High memory usage detected: ${highMemoryUsage.length} components using >100MB`,
        timestamp: now,
      });
    }

    // Check for frequent re-renders
    const componentRenderCounts = new Map<string, number>();
    const recentMetrics = metrics.filter(m => now - m.timestamp < 60000); // Last minute

    recentMetrics.forEach(m => {
      componentRenderCounts.set(m.component, (componentRenderCounts.get(m.component) || 0) + 1);
    });

    const frequentlyRenderingComponents = Array.from(componentRenderCounts.entries())
      .filter(([, count]) => count > 5)
      .sort((a, b) => b[1] - a[1]);

    if (frequentlyRenderingComponents.length > 0) {
      const [component, count] = frequentlyRenderingComponents[0];
      alerts.push({
        type: 'warning' as const,
        message: `${component} rendered ${count} times in the last minute`,
        timestamp: now,
      });
    }

    return alerts;
  }

  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Performance Dashboard</title>
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #0d1117; 
            color: #c9d1d9;
        }
        .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
        .widget { 
            background: #161b22; 
            border: 1px solid #30363d; 
            border-radius: 8px; 
            padding: 20px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .widget h2 { color: #58a6ff; margin-bottom: 15px; font-size: 1.2rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .stat-card { 
            background: #21262d; 
            padding: 15px; 
            border-radius: 6px; 
            text-align: center; 
            border: 1px solid #30363d;
        }
        .stat-value { font-size: 2rem; font-weight: bold; color: #58a6ff; }
        .stat-label { color: #8b949e; font-size: 0.9rem; margin-top: 5px; }
        .component-list { max-height: 300px; overflow-y: auto; }
        .component-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px; 
            border-bottom: 1px solid #30363d;
        }
        .component-item:last-child { border-bottom: none; }
        .component-name { color: #f0f6fc; }
        .component-time { color: #ffa657; font-weight: bold; }
        .component-time.slow { color: #f85149; }
        .component-time.fast { color: #3fb950; }
        .alerts { margin-bottom: 20px; }
        .alert { 
            padding: 10px; 
            border-radius: 4px; 
            margin: 5px 0; 
            border-left: 4px solid;
        }
        .alert.warning { background: #1e1e1e; border-left-color: #ffa657; }
        .alert.error { background: #1e1e1e; border-left-color: #f85149; }
        .alert.info { background: #1e1e1e; border-left-color: #58a6ff; }
        .chart-container { height: 300px; margin-top: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #f0f6fc; font-size: 2.5rem; margin-bottom: 10px; }
        .header .status { color: #3fb950; font-size: 1.1rem; }
        .refresh-indicator { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #238636; 
            color: white; 
            padding: 5px 10px; 
            border-radius: 4px; 
            font-size: 0.8rem;
            opacity: 0;
            transition: opacity 0.3s;
        }
        .refresh-indicator.show { opacity: 1; }
    </style>
</head>
<body>
    <div class="refresh-indicator" id="refreshIndicator">Live Update</div>
    
    <div class="header">
        <h1>🚀 React Performance Dashboard</h1>
        <div class="status">Real-time monitoring active</div>
    </div>
    
    <div class="alerts" id="alerts"></div>
    
    <div class="dashboard">
        <div class="widget">
            <h2>📊 Performance Overview</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="totalRenders">0</div>
                    <div class="stat-label">Total Renders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="avgRenderTime">0ms</div>
                    <div class="stat-label">Average Render Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="uniqueComponents">0</div>
                    <div class="stat-label">Unique Components</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="slowRenders">0</div>
                    <div class="stat-label">Slow Renders</div>
                </div>
            </div>
        </div>
        
        <div class="widget">
            <h2>🔥 Render Time Trends</h2>
            <div class="chart-container">
                <canvas id="renderTimeChart"></canvas>
            </div>
        </div>
        
        <div class="widget">
            <h2>🧩 Component Performance</h2>
            <div class="component-list" id="componentList"></div>
        </div>
        
        <div class="widget">
            <h2>💾 Memory Usage</h2>
            <div class="chart-container">
                <canvas id="memoryChart"></canvas>
            </div>
        </div>
    </div>
    
    <script>
        const socket = io();
        
        // Chart instances
        let renderTimeChart = null;
        let memoryChart = null;
        
        // Initialize charts
        function initializeCharts() {
            const renderTimeCtx = document.getElementById('renderTimeChart').getContext('2d');
            renderTimeChart = new Chart(renderTimeCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Render Time (ms)',
                        data: [],
                        borderColor: '#58a6ff',
                        backgroundColor: 'rgba(88, 166, 255, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#c9d1d9' } }
                    },
                    scales: {
                        x: { ticks: { color: '#8b949e' } },
                        y: { ticks: { color: '#8b949e' } }
                    }
                }
            });
            
            const memoryCtx = document.getElementById('memoryChart').getContext('2d');
            memoryChart = new Chart(memoryCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Memory Usage (MB)',
                        data: [],
                        borderColor: '#ffa657',
                        backgroundColor: 'rgba(255, 166, 87, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#c9d1d9' } }
                    },
                    scales: {
                        x: { ticks: { color: '#8b949e' } },
                        y: { ticks: { color: '#8b949e' } }
                    }
                }
            });
        }
        
        // Update dashboard with new data
        function updateDashboard(data) {
            // Update summary stats
            document.getElementById('totalRenders').textContent = data.summary.totalRenders;
            document.getElementById('avgRenderTime').textContent = data.summary.averageRenderTime.toFixed(2) + 'ms';
            document.getElementById('uniqueComponents').textContent = data.summary.uniqueComponents;
            document.getElementById('slowRenders').textContent = data.summary.slowRenders;
            
            // Update alerts
            const alertsContainer = document.getElementById('alerts');
            alertsContainer.innerHTML = data.alerts.map(alert => 
                \`<div class="alert \${alert.type}">\${alert.message}</div>\`
            ).join('');
            
            // Update component list
            const componentList = document.getElementById('componentList');
            componentList.innerHTML = data.componentStats.map(comp => 
                \`<div class="component-item">
                    <span class="component-name">\${comp.component}</span>
                    <span class="component-time \${comp.avgRenderTime > 50 ? 'slow' : comp.avgRenderTime > 16 ? 'medium' : 'fast'}">\${comp.avgRenderTime.toFixed(2)}ms</span>
                </div>\`
            ).join('');
            
            // Update charts
            updateCharts(data.liveMetrics);
            
            // Show refresh indicator
            showRefreshIndicator();
        }
        
        // Update charts with new data
        function updateCharts(metrics) {
            const last20Metrics = metrics.slice(0, 20).reverse();
            
            // Update render time chart
            renderTimeChart.data.labels = last20Metrics.map((_, i) => i);
            renderTimeChart.data.datasets[0].data = last20Metrics.map(m => m.renderTime);
            renderTimeChart.update('none');
            
            // Update memory chart
            memoryChart.data.labels = last20Metrics.map((_, i) => i);
            memoryChart.data.datasets[0].data = last20Metrics.map(m => m.memoryUsage);
            memoryChart.update('none');
        }
        
        // Show refresh indicator
        function showRefreshIndicator() {
            const indicator = document.getElementById('refreshIndicator');
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 1000);
        }
        
        // Socket event handlers
        socket.on('dashboard-data', updateDashboard);
        
        // Initialize
        initializeCharts();
    </script>
</body>
</html>
    `;
  }

  public async start(): Promise<void> {
    // Create output directory
    await fs.mkdir(path.join(__dirname, 'dashboard-assets'), { recursive: true });

    // Start the server
    this.server.listen(this.port, () => {
      console.log(`🚀 Performance Dashboard running at http://localhost:${this.port}`);
    });

    // Start real-time updates
    this.startRealTimeUpdates();
  }

  private startRealTimeUpdates(): void {
    setInterval(async () => {
      try {
        const data = await this.getDashboardData();
        this.io.emit('dashboard-data', data);
      } catch (error) {
        console.error('Error updating dashboard:', error);
      }
    }, this.updateInterval);
  }

  public stop(): void {
    this.server.close();
    console.log('📊 Performance Dashboard stopped');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const port = args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1]) : 3002;
  const updateInterval = args.includes('--interval')
    ? parseInt(args[args.indexOf('--interval') + 1])
    : 1000;

  const dashboard = new PerformanceDashboard(port, updateInterval);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📊 Shutting down performance dashboard...');
    dashboard.stop();
    process.exit(0);
  });

  await dashboard.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PerformanceDashboard;
