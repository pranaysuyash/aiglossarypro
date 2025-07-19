# Database Connection Pool Monitoring

A comprehensive monitoring solution for PostgreSQL connection pool management in the AI/ML Glossary application.

## Overview

The connection pool monitoring system provides real-time insights into database connection usage, performance metrics, and health status. It helps identify bottlenecks, optimize pool configuration, and prevent connection exhaustion.

## Features

### 1. Real-time Metrics Collection
- **Connection tracking**: Total, idle, and waiting connections
- **Performance metrics**: Average acquire time, query execution time
- **Health monitoring**: Automatic health status detection (healthy/degraded/critical)
- **Peak usage tracking**: Historical peak connection count
- **Error tracking**: Connection and query errors

### 2. Event-based Monitoring
- Connection creation/destruction events
- Query execution tracking
- Error logging with context
- Slow connection acquire warnings

### 3. Dynamic Pool Optimization
- Automatic pool size recommendations based on usage patterns
- Peak load analysis
- Configuration suggestions

## Usage

### 1. Using the Monitored Pool in Code

```typescript
import { db, pool, checkDatabaseHealth } from './server/db-monitored';

// Get current pool statistics
const stats = pool.getStats();
console.log('Current connections:', stats.totalConnections);

// Check database health
const health = await checkDatabaseHealth();
if (health.status === 'critical') {
  console.error('Database health critical!', health.recommendations);
}

// Listen for metrics events
pool.onMetrics((metrics) => {
  console.log('Pool metrics update:', metrics);
});
```

### 2. CLI Monitoring Tool

```bash
# Start the pool monitor
npm run db:monitor

# Start with simulated load for testing
npm run db:monitor:test
```

The CLI tool provides a real-time dashboard showing:
- Current connection statistics
- Performance metrics
- Health status with color coding
- Automatic recommendations
- Warning alerts

### 3. HTTP Monitoring Endpoints

Add to your Express server:

```typescript
import monitoringRoutes from './routes/monitoring';
app.use('/api/monitoring', monitoringRoutes);
```

Available endpoints:
- `GET /api/monitoring/pool` - Current pool metrics
- `GET /api/monitoring/database` - Database health check
- `GET /api/monitoring/system` - Combined system metrics
- `GET /api/monitoring/pool/stream` - Server-sent events for real-time updates

### 4. Environment Configuration

```env
# Connection pool configuration
DB_POOL_MAX=20              # Maximum pool size
DB_IDLE_TIMEOUT=30000       # Idle connection timeout (ms)
DB_CONNECTION_TIMEOUT=5000  # Connection timeout (ms)
```

## Metrics Explained

### Connection Metrics
- **Total Connections**: Current number of active connections
- **Idle Connections**: Connections available for use
- **Waiting Requests**: Queries waiting for a connection
- **Peak Connections**: Maximum connections ever used

### Performance Metrics
- **Average Acquire Time**: Time to obtain a connection from pool
- **Query Count**: Number of queries executed per connection
- **Total Query Time**: Cumulative query execution time

### Health Status
- **Healthy**: Normal operation
- **Degraded**: High wait times or many waiting requests
- **Critical**: Very high wait times or connection failures

## Thresholds and Alerts

| Metric | Warning | Critical |
|--------|---------|----------|
| Waiting Requests | >10 | >20 |
| Avg Acquire Time | >500ms | >1000ms |
| Connection Errors | >5/min | >10/min |

## Best Practices

1. **Monitor Regularly**: Check pool metrics during peak usage
2. **Adjust Pool Size**: Use recommendations to optimize configuration
3. **Watch for Patterns**: Look for recurring performance issues
4. **Set Up Alerts**: Configure monitoring for critical thresholds
5. **Review Logs**: Check error logs for connection issues

## Troubleshooting

### High Wait Times
- Increase `DB_POOL_MAX` 
- Optimize slow queries
- Check for connection leaks

### Connection Exhaustion
- Review peak usage patterns
- Implement connection pooling at application level
- Consider read replicas for heavy read workloads

### Degraded Performance
- Run database query analyzer: `npm run db:analyze`
- Check for missing indexes
- Review connection timeout settings

## Integration with Monitoring Services

The pool monitoring can be integrated with external monitoring services:

```typescript
pool.onMetrics((metrics) => {
  // Send to Datadog, New Relic, etc.
  monitoringService.gauge('db.pool.connections', metrics.totalConnections);
  monitoringService.gauge('db.pool.acquire_time', metrics.avgAcquireTime);
});
```

## Future Enhancements

- [ ] Automatic pool size adjustment
- [ ] Historical metrics storage
- [ ] Predictive scaling based on patterns
- [ ] Integration with Grafana dashboards
- [ ] Alerting via email/Slack