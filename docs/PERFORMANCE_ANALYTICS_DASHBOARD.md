# Performance Analytics Dashboard

A comprehensive real-time performance monitoring dashboard for the AI/ML Glossary application.

## Overview

The Performance Analytics Dashboard provides real-time insights into system health, database performance, and resource utilization. It helps administrators monitor, analyze, and optimize application performance.

## Features

### 1. Real-Time Monitoring
- **Live Updates**: Server-sent events (SSE) for real-time metrics
- **Auto-refresh**: Configurable automatic data refresh
- **Connection Status**: Visual indicators for live vs polling mode

### 2. System Health Overview
- **Health Status**: Automatic health assessment (healthy/degraded/critical)
- **Key Metrics**: Response time, connection usage, memory usage
- **Visual Indicators**: Color-coded status badges and progress bars

### 3. Database Metrics
- **Connection Pool**:
  - Active connections
  - Idle connections  
  - Waiting requests
  - Average acquire time
  - Peak connections
  - Connection lifecycle stats

### 4. System Resources
- **Memory Usage**:
  - RSS (Resident Set Size)
  - Heap total and used
  - External memory
- **CPU Usage**:
  - User CPU time
  - System CPU time
- **Uptime**: System uptime tracking

### 5. Performance Trends
- Placeholder for historical performance data
- Future: Time-series graphs and trend analysis

## Access

The dashboard is available in the Admin panel under:
- **Analytics & Monitoring → System Performance**
- **Analytics & Monitoring → Database & Pool**

## Usage

### Prerequisites
- Admin authentication required
- Monitoring endpoints must be configured
- Database connection pool monitoring enabled

### Navigation
1. Log in as an admin user
2. Navigate to the Admin panel
3. Select "Analytics & Monitoring" from the sidebar
4. Choose either "System Performance" or "Database & Pool"

### Controls
- **Pause/Resume**: Toggle auto-refresh
- **Manual Refresh**: Force data update
- **Tab Navigation**: Switch between Database, System, and Trends views

## Thresholds and Alerts

### Response Time
- **Good**: < 100ms (green)
- **Warning**: 100-500ms (yellow)
- **Critical**: > 500ms (red)

### Connection Usage
- **Good**: < 75% (green)
- **Warning**: 75-90% (yellow)
- **Critical**: > 90% (red)

### Memory Usage
- **Good**: < 70% (green)
- **Warning**: 70-85% (yellow)
- **Critical**: > 85% (red)

## Recommendations

The dashboard provides automatic recommendations when performance issues are detected:
- High connection acquire time → Increase pool size
- Multiple waiting requests → Scale up connection pool
- High memory usage → Optimize queries or increase resources

## API Endpoints

The dashboard consumes the following monitoring endpoints:

### GET /api/monitoring/system
Returns combined system and database metrics:
```json
{
  "success": true,
  "data": {
    "database": {
      "pool": { /* pool metrics */ },
      "health": { /* health status */ }
    },
    "system": {
      "memory": { /* memory stats */ },
      "cpu": { /* cpu stats */ },
      "uptime": "12345 seconds"
    }
  }
}
```

### GET /api/monitoring/pool/stream
Server-sent events stream for real-time pool metrics updates.

## Implementation Details

### Component Location
`client/src/components/admin/PerformanceAnalyticsDashboard.tsx`

### Key Dependencies
- React hooks for state management
- Lucide React for icons
- Custom UI components (Card, Badge, Progress, Alert, Tabs)
- Fetch API for data retrieval
- EventSource API for SSE

### State Management
- `poolMetrics`: Database connection pool statistics
- `systemMetrics`: System resource utilization
- `performanceMetrics`: Calculated performance indicators
- `streamConnected`: SSE connection status
- `autoRefresh`: Auto-refresh toggle state

## Future Enhancements

1. **Historical Data**
   - Time-series graphs for all metrics
   - Customizable time ranges
   - Data export functionality

2. **Advanced Analytics**
   - Anomaly detection
   - Predictive alerts
   - Capacity planning

3. **Integration**
   - Webhook notifications
   - External monitoring services
   - Custom alert rules

4. **Visualization**
   - Real-time charts
   - Heat maps for usage patterns
   - Geographic distribution

## Troubleshooting

### No Data Displayed
- Verify admin authentication
- Check monitoring endpoint accessibility
- Ensure database pool monitoring is enabled

### SSE Connection Failed
- Dashboard falls back to polling mode
- Check browser SSE support
- Verify server SSE configuration

### Performance Recommendations Not Showing
- Only displayed when health status is degraded/critical
- Check threshold configurations
- Verify metric calculations