# Cache Performance Monitoring Guide

## Overview

The AIGlossaryPro cache monitoring system provides comprehensive performance tracking, real-time analytics, and automated health checks for the application's caching infrastructure.

## Features

### 1. Performance Metrics Collection
- **Hit/Miss Rates**: Track cache effectiveness across different cache types
- **Response Times**: Monitor cache operation latency
- **Eviction Rates**: Identify memory pressure and sizing issues
- **Memory Usage**: Track cache memory consumption

### 2. Real-time Monitoring
- Live operations tracking
- WebSocket-based real-time updates
- Operations per second metrics
- Active key monitoring

### 3. Historical Analytics
- Time-series data storage
- Aggregated metrics (minute/hour/day)
- Trend analysis
- Performance comparisons

### 4. Health Checks & Alerts
- Automated health assessments
- Configurable alert thresholds
- Proactive issue detection
- Automated remediation actions

### 5. Cache Analytics Dashboard
- Visual performance monitoring
- Interactive charts and graphs
- Key analysis (hot/cold keys)
- Optimization recommendations

## API Endpoints

### Cache Statistics
```
GET /api/cache-analytics/stats
```
Returns current cache statistics for all cache types.

### Real-time Metrics
```
GET /api/cache-analytics/real-time
```
Provides real-time operational metrics.

### Health Status
```
GET /api/cache-analytics/health
```
Returns cache health status with warnings and recommendations.

### Historical Data
```
GET /api/cache-analytics/historical?startDate={date}&endDate={date}&interval={minute|hour|day}
```
Retrieves historical performance metrics.

### Performance Report
```
GET /api/cache-analytics/report
```
Generates comprehensive performance report with trends and recommendations.

### Clear Cache
```
POST /api/cache-analytics/clear
Body: { "cacheType": "query|search|user|all" }
```
Clears specified cache with metrics tracking.

## Configuration

### Thresholds
Configure alert thresholds in `server/monitoring/cacheMonitoring.ts`:

```typescript
private readonly THRESHOLDS = {
  MIN_HIT_RATE: 0.5,          // 50%
  MAX_EVICTION_RATE: 0.2,     // 20%
  MAX_RESPONSE_TIME: 100,     // 100ms
  MIN_CACHE_EFFICIENCY: 0.7,  // 70%
  MAX_MEMORY_USAGE: 500 * 1024 * 1024, // 500MB
};
```

### Metrics Retention
Configure retention period in `server/cache/CacheMetrics.ts`:

```typescript
private readonly METRICS_RETENTION_DAYS = 30;
private readonly FLUSH_INTERVAL_MS = 60000; // 1 minute
```

## Integration with Monitoring Systems

### Prometheus Export
Access Prometheus-compatible metrics:
```
GET /api/cache-analytics/metrics
```

### Custom Integrations
The monitoring service emits events for integration with external services:

```typescript
cacheMonitor.on('alert', (alert) => {
  // Send to external monitoring service
  // e.g., Datadog, New Relic, PagerDuty
});
```

## Best Practices

### 1. Regular Health Checks
- Monitor the health endpoint regularly
- Set up alerts for degraded performance
- Review recommendations weekly

### 2. Cache Sizing
- Monitor eviction rates
- Adjust cache sizes based on usage patterns
- Use hot key analysis to optimize

### 3. Performance Optimization
- Target > 80% hit rate
- Keep response times < 50ms
- Monitor memory usage trends

### 4. Maintenance
- Clear cold entries periodically
- Review and implement recommendations
- Update thresholds based on usage

## Troubleshooting

### Low Hit Rate
1. Check cache key generation
2. Review TTL settings
3. Implement cache warming
4. Analyze request patterns

### High Eviction Rate
1. Increase cache size limits
2. Implement tiered caching
3. Review memory allocation
4. Optimize data structures

### High Response Times
1. Check cache key complexity
2. Review data serialization
3. Monitor system resources
4. Consider in-memory caching

## Automated Actions

The system can take automated actions based on alerts:

- **Cache Warming**: Triggered on low hit rates
- **Cold Entry Cleanup**: Triggered on high memory usage
- **Size Recommendations**: Based on eviction patterns

## Monitoring Dashboard

Access the cache monitoring dashboard at:
```
/admin/cache-monitoring
```

Features:
- Real-time performance graphs
- Cache distribution charts
- Health status indicators
- Manual cache management
- Historical trend analysis

## Database Schema

Cache metrics are stored in the `cache_metrics` table:

```sql
CREATE TABLE cache_metrics (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  cache_type VARCHAR(50) NOT NULL,
  hit_count INTEGER NOT NULL,
  miss_count INTEGER NOT NULL,
  eviction_count INTEGER NOT NULL,
  hit_rate INTEGER NOT NULL,
  avg_response_time INTEGER,
  cache_size INTEGER NOT NULL,
  memory_usage INTEGER,
  metadata JSONB,
  created_at TIMESTAMP
);
```

## Performance Impact

The monitoring system has minimal performance impact:
- < 1% CPU overhead
- < 10MB memory usage
- Asynchronous metric collection
- Batched database writes

## Future Enhancements

Planned improvements:
- Machine learning for anomaly detection
- Predictive cache warming
- Multi-region cache synchronization
- Advanced visualization options