# React Scan Setup for AIGlossaryPro

This document outlines the comprehensive React Scan setup for automated component rendering analysis in the AIGlossaryPro project.

## Overview

React Scan is integrated to provide:
- **Real-time performance monitoring** during development
- **Automated performance reports** with actionable insights
- **CI/CD performance validation** to prevent regressions
- **Integration with existing analytics** (PostHog & GA4)

## Quick Start

### Development Mode

```bash
# Basic React Scan with existing configuration
npm run dev:scan

# React Scan with automated reporting
npm run dev:scan:report

# React Scan with real-time monitoring
npm run dev:scan:monitor

# Performance dashboard (runs on http://localhost:3002)
npm run perf:dashboard
```

### Analysis & Reporting

```bash
# Analyze existing performance data
npm run perf:analyze

# Generate comprehensive performance reports
npm run perf:report --format html --time-range last-day

# Run CI/CD performance check
npm run perf:ci
```

## Configuration

### React Scan Configuration (`react-scan.config.js`)

The configuration file includes:

- **Performance Thresholds**: Customizable limits for render time, memory usage, etc.
- **Reporting Options**: Automated report generation and formats
- **Component Filtering**: Include/exclude specific components
- **Integration Settings**: PostHog, Sentry, and DevTools integration
- **Alert Configuration**: Real-time performance alerts

Key settings:
```javascript
thresholds: {
  renderTime: 16,    // 60fps target
  renderCount: 10,   // Component render count threshold
  memoryUsage: 50,   // Memory usage threshold in MB
}
```

### Analytics Integration

Performance metrics are automatically tracked to:
- **PostHog**: Real-time performance events
- **GA4**: Performance issue alerts and summaries
- **Console**: Development debugging information

## Scripts & Tools

### Performance Scripts

| Script | Description |
|--------|-------------|
| `dev:scan` | Basic React Scan with configuration |
| `dev:scan:report` | React Scan with automated reporting |
| `dev:scan:monitor` | React Scan with real-time monitoring |
| `perf:analyze` | Analyze performance data and generate insights |
| `perf:report` | Generate comprehensive performance reports |
| `perf:dashboard` | Launch real-time performance dashboard |
| `perf:ci` | Run CI/CD performance validation |

### Performance Analysis Tools

1. **Performance Analyzer** (`scripts/performance-analyzer.ts`)
   - Processes React Scan data
   - Generates performance insights
   - Creates HTML and JSON reports

2. **Performance Reporter** (`scripts/generate-performance-report.ts`)
   - Multiple output formats (HTML, JSON, CSV, Markdown)
   - Time-range filtering
   - Component-level analysis

3. **Performance Dashboard** (`scripts/performance-dashboard.ts`)
   - Real-time monitoring interface
   - WebSocket-based live updates
   - Interactive charts and alerts

4. **CI Performance Checker** (`scripts/ci-performance-check.ts`)
   - Automated performance validation
   - Threshold checking
   - GitHub Actions integration

## Performance Thresholds

### Development Thresholds
- **Render Time**: 16ms (60fps target)
- **Memory Usage**: 50MB per component
- **Render Count**: 5 renders per second

### CI/CD Thresholds (More Lenient)
- **Average Render Time**: 25ms
- **Maximum Render Time**: 100ms
- **Slow Render Percentage**: 10%
- **Memory Usage**: 100MB
- **Bundle Size**: 5MB
- **Build Time**: 2 minutes

## Reports & Output

### Report Types

1. **Real-time Dashboard**: Live performance monitoring
2. **HTML Reports**: Comprehensive visual reports with charts
3. **JSON Reports**: Machine-readable performance data
4. **CSV Reports**: Data export for external analysis
5. **Markdown Reports**: Documentation-friendly summaries

### Report Locations

- **Development Reports**: `./performance-reports/`
- **Analysis Output**: `./performance-analysis/`
- **CI Reports**: `./ci-performance-reports/`
- **Dashboard Assets**: `./scripts/dashboard-assets/`

## CI/CD Integration

### GitHub Actions Workflow

The project includes a comprehensive GitHub Actions workflow that:

1. **Runs Performance Checks** on every PR and push
2. **Generates Performance Reports** with detailed metrics
3. **Comments on PRs** with performance analysis
4. **Uploads Artifacts** for historical tracking
5. **Fails Builds** if performance thresholds are exceeded

### Workflow Features

- Automated performance validation
- PR comments with performance metrics
- Artifact upload for report persistence
- Multi-job setup for comprehensive analysis

## Analytics Integration

### Performance Tracking Events

The system tracks the following events to PostHog and GA4:

- `react_performance_metric`: Individual component performance
- `slow_render_detected`: Renders exceeding thresholds
- `memory_leak_detected`: Memory usage issues
- `performance_report_generated`: Report generation events

### Performance Scoring

A dynamic performance score (0-100) is calculated based on:
- Render time performance
- Memory usage efficiency
- Render frequency optimization

## Troubleshooting

### Common Issues

1. **React Scan Not Starting**
   ```bash
   # Ensure dependencies are installed
   npm install
   # Try with explicit configuration
   npx react-scan@latest http://localhost:5173 --config react-scan.config.js
   ```

2. **No Performance Data**
   ```bash
   # Check if development server is running
   npm run dev
   # Verify React Scan is collecting data
   npm run dev:scan:monitor
   ```

3. **Dashboard Not Loading**
   ```bash
   # Ensure performance reports exist
   ls performance-reports/
   # Start dashboard with custom port
   npm run perf:dashboard -- --port 3003
   ```

### Debug Mode

Enable debug mode for detailed logging:
```bash
# Set debug environment variable
DEBUG=react-scan npm run dev:scan
```

## Best Practices

### Development

1. **Regular Monitoring**: Use `npm run dev:scan` during active development
2. **Performance Reviews**: Generate reports before major releases
3. **Threshold Tuning**: Adjust thresholds based on application requirements
4. **Component Optimization**: Focus on components with frequent slow renders

### CI/CD

1. **Performance Gates**: Use CI checks to prevent performance regressions
2. **Historical Tracking**: Archive performance reports for trend analysis
3. **Alert Thresholds**: Set appropriate thresholds for your team's workflow
4. **Report Analysis**: Review performance trends regularly

## Advanced Configuration

### Custom Metrics

Add custom performance metrics by extending the configuration:

```javascript
customMetrics: {
  metrics: [
    {
      name: 'search_performance',
      description: 'Search functionality performance',
      type: 'timing',
      threshold: 200
    }
  ]
}
```

### Integration with External Tools

The setup supports integration with:
- **PostHog**: Real-time analytics
- **Sentry**: Error and performance monitoring
- **Chrome DevTools**: Development debugging
- **Lighthouse**: Web performance audits

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the generated performance reports
3. Examine the console output for error messages
4. Consult the React Scan documentation

## Version History

- **v1.0**: Initial React Scan setup with basic configuration
- **v1.1**: Added automated reporting and dashboard
- **v1.2**: Integrated analytics tracking and CI/CD validation
- **v1.3**: Enhanced with comprehensive performance analysis tools