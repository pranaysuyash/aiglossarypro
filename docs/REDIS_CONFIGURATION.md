# Redis Configuration for AI Glossary Pro

## 🎯 Overview

Redis is used as the primary caching layer for AI Glossary Pro, providing high-performance data storage and retrieval. This document covers setup, configuration, and usage patterns for both development and production environments.

## 🏗️ Architecture

### Redis Usage Patterns

1. **Application Cache**: Enhanced term storage, search results, user preferences
2. **Job Queue**: Background processing with BullMQ
3. **Session Storage**: User session data (optional)
4. **Stale-While-Revalidate**: Advanced caching strategy for optimal performance

### Database Layout

- **DB 0**: Application cache (default)
- **DB 1**: Job queue data
- **DB 2**: Session storage (if enabled)
- **DB 15**: Development/testing

## 🚀 Quick Setup

### Development (Local)

```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis
redis-server

# Test connection
redis-cli ping
```

### Production Setup

```bash
# Run the production setup script
./scripts/setup-redis-production.sh

# Or manually configure
sudo systemctl enable redis-aiglossary
sudo systemctl start redis-aiglossary
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Redis Connection
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0

# Alternative: Redis URL
REDIS_URL=redis://username:password@hostname:port/database

# Cache Configuration
ENABLE_REDIS_CACHE=true
REDIS_CACHE_TTL=3600
REDIS_CACHE_PREFIX=aiglossary:

# Job Queue Configuration
REDIS_QUEUE_DB=1
REDIS_QUEUE_PREFIX=queue:

# Performance Tuning
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
REDIS_RETRY_DELAY=100
REDIS_MAX_RETRIES=3
```

### Production Configuration

#### Redis Server Configuration (`/etc/redis/redis.conf`)

```bash
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Memory Management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Security
requirepass your-strong-password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

## 🎨 Usage Patterns

### Basic Cache Operations

```javascript
import { redis, redisCache } from '../server/config/redis.js';

// Simple key-value operations
await redis.set('key', 'value', 3600); // TTL in seconds
const value = await redis.get('key');

// JSON data caching
await redisCache.set('user:123', { name: 'John', email: 'john@example.com' }, 300);
const user = await redisCache.get('user:123');
```

### Stale-While-Revalidate Pattern

```javascript
import { redisCache, CacheKeys } from '../server/config/redis.js';

const getUserData = async (userId) => {
  return await redisCache.getStaleWhileRevalidate(
    CacheKeys.userPreferences(userId),
    async () => {
      // Expensive database operation
      return await db.getUserPreferences(userId);
    },
    CacheKeys.SWR_CONFIG.MEDIUM_FREQUENCY
  );
};
```

### Cache Key Patterns

```javascript
import { CacheKeys } from '../server/config/redis.js';

// Pre-defined cache keys
const termKey = CacheKeys.enhancedTerm('term-123');
const searchKey = CacheKeys.searchResults('neural networks', 'category:deep-learning');
const userKey = CacheKeys.userPreferences('user-456');
const analyticsKey = CacheKeys.searchMetrics('daily');

// Custom cache keys
const customKey = `custom:${Date.now()}:${userId}`;
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Basic health check
redis-cli ping

# Connection info
redis-cli INFO server

# Memory usage
redis-cli INFO memory

# Performance stats
redis-cli INFO stats

# Keyspace information
redis-cli INFO keyspace
```

### Monitoring Scripts

```bash
# Comprehensive monitoring
./scripts/redis-monitor.sh

# Performance test
node scripts/test-redis-setup.js

# Backup Redis data
./scripts/redis-backup.sh
```

### Key Monitoring Metrics

1. **Memory Usage**: `used_memory_human`, `maxmemory_human`
2. **Hit Rate**: `keyspace_hits / (keyspace_hits + keyspace_misses)`
3. **Connections**: `connected_clients`
4. **Operations**: `instantaneous_ops_per_sec`
5. **Slow Queries**: `SLOWLOG GET 10`

## 🔒 Security Best Practices

### Authentication

```bash
# Set password in redis.conf
requirepass your-strong-password-here

# Use AUTH command
redis-cli AUTH your-strong-password-here
```

### Network Security

```bash
# Bind to specific interfaces
bind 127.0.0.1 192.168.1.100

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command EVAL ""
rename-command DEBUG ""
rename-command SHUTDOWN SHUTDOWN_AIGLOSSARY
```

### Access Control

```bash
# Create user with limited permissions
ACL SETUSER cache_user +@read +@write -@dangerous
ACL SETUSER queue_user +@read +@write +@stream -@dangerous
```

## ⚡ Performance Optimization

### Memory Optimization

```bash
# Configure memory policy
maxmemory 512mb
maxmemory-policy allkeys-lru

# Enable compression
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
```

### Connection Pooling

```javascript
// Production Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB,
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: 5,
  connectTimeout: 30000,
  commandTimeout: 15000,
  enableOfflineQueue: true,
  lazyConnect: true,
};
```

### Cache Strategies

#### TTL Configuration

```javascript
// Cache duration constants
const CacheKeys = {
  SHORT_CACHE_TTL: 5 * 60,    // 5 minutes
  MEDIUM_CACHE_TTL: 30 * 60,  // 30 minutes
  LONG_CACHE_TTL: 60 * 60,    // 1 hour
};
```

#### Stale-While-Revalidate Configurations

```javascript
const SWR_CONFIG = {
  HIGH_FREQUENCY: {
    ttl: 2 * 60,        // 2 minutes fresh
    staleTtl: 10 * 60,  // 10 minutes stale
    revalidateThreshold: 0.7
  },
  MEDIUM_FREQUENCY: {
    ttl: 15 * 60,       // 15 minutes fresh
    staleTtl: 60 * 60,  // 1 hour stale
    revalidateThreshold: 0.8
  },
  LOW_FREQUENCY: {
    ttl: 60 * 60,       // 1 hour fresh
    staleTtl: 4 * 60 * 60, // 4 hours stale
    revalidateThreshold: 0.9
  }
};
```

## 🔄 Backup and Recovery

### Automated Backups

```bash
# Daily backup cron job
0 2 * * * /usr/local/bin/redis-backup.sh

# Manual backup
redis-cli BGSAVE
```

### Recovery

```bash
# Stop Redis
sudo systemctl stop redis-aiglossary

# Replace RDB file
sudo cp /var/backups/redis/dump.rdb /var/lib/redis/

# Start Redis
sudo systemctl start redis-aiglossary
```

## 🐛 Troubleshooting

### Common Issues

#### Connection Failures

```bash
# Check Redis status
sudo systemctl status redis-aiglossary

# Check logs
tail -f /var/log/redis/redis-server.log

# Test connection
redis-cli ping
```

#### Memory Issues

```bash
# Check memory usage
redis-cli INFO memory

# Clear cache if needed
redis-cli FLUSHDB  # Careful: deletes all data

# Monitor memory usage
redis-cli --bigkeys
```

#### Performance Issues

```bash
# Check slow queries
redis-cli SLOWLOG GET 10

# Monitor operations
redis-cli --latency

# Check fragmentation
redis-cli INFO memory | grep mem_fragmentation_ratio
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=redis:* node server/index.js

# Redis client debug
redis-cli --verbose
```

## 📈 Scaling Considerations

### High Availability

```bash
# Redis Sentinel configuration
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 10000
```

### Clustering

```bash
# Redis Cluster nodes
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 --cluster-replicas 1
```

### Monitoring Solutions

- **Redis Exporter**: For Prometheus monitoring
- **RedisInsight**: GUI for Redis management
- **Custom monitoring**: Application-specific metrics

## 🧪 Testing

### Test Scripts

```bash
# Test Redis setup
node scripts/test-redis-setup.js

# Performance benchmarks
redis-benchmark -h localhost -p 6379 -n 100000

# Connection stress test
redis-benchmark -h localhost -p 6379 -c 50 -n 10000
```

### Test Data Management

```javascript
// Clean test data
await redis.flushdb();

// Create test data
await redisCache.set('test:key', { test: 'data' }, 60);

// Verify test data
const testData = await redisCache.get('test:key');
```

## 📝 Development Tips

### Mock Redis for Testing

```javascript
// The Redis client automatically uses mock implementation
// when Redis is not available in development
if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
  // Uses MockRedisClient automatically
}
```

### Cache Invalidation

```javascript
// Pattern-based invalidation
await redisCache.invalidatePattern('user:*');

// Specific key invalidation
await redisCache.del('user:123');

// Clear all cache
await redisCache.clear();
```

### Debugging Cache Issues

```javascript
// Check if key exists
const exists = await redisCache.exists('key');

// Get TTL
const ttl = await redis.ttl('key');

// Get all keys matching pattern
const keys = await redis.keys('pattern:*');
```

## 🎯 Best Practices

### Cache Key Design

```javascript
// Good: Structured, predictable keys
const termKey = `term:${termId}:v2`;
const userKey = `user:${userId}:preferences`;
const searchKey = `search:${hash(query)}:${filters}`;

// Bad: Ambiguous or unpredictable keys
const badKey = `data_${Math.random()}`;
```

### TTL Strategy

```javascript
// Use appropriate TTL for different data types
const TTL_STRATEGY = {
  userSessions: 30 * 60,      // 30 minutes
  searchResults: 5 * 60,      // 5 minutes
  termContent: 60 * 60,       // 1 hour
  analytics: 24 * 60 * 60,    // 24 hours
};
```

### Error Handling

```javascript
try {
  const data = await redisCache.get('key');
  return data || await fallbackDataSource();
} catch (error) {
  console.error('Cache error:', error);
  // Always provide fallback
  return await fallbackDataSource();
}
```

## 📊 Metrics and Alerts

### Key Metrics to Monitor

1. **Memory Usage**: Should stay below 80% of maxmemory
2. **Hit Rate**: Should be above 90% for cached data
3. **Connection Count**: Monitor for connection leaks
4. **Slow Queries**: Should be minimal
5. **Persistence**: RDB/AOF save success

### Alert Thresholds

```yaml
# Example alerting thresholds
memory_usage: > 80%
hit_rate: < 90%
slow_queries: > 10 per minute
connection_count: > 1000
save_failures: > 0
```

## 🔮 Future Enhancements

### Planned Features

1. **Redis Streams**: For real-time event processing
2. **Pub/Sub**: For real-time notifications
3. **Redis Modules**: For advanced data types
4. **Clustering**: For horizontal scaling
5. **Geo-replication**: For global deployment

### Performance Improvements

1. **Pipeline Operations**: Batch multiple commands
2. **Lua Scripts**: For complex atomic operations
3. **Compression**: For large cached objects
4. **Connection Optimization**: Fine-tune connection pool

---

*This Redis configuration provides a robust, scalable caching solution for AI Glossary Pro, ensuring optimal performance and reliability in both development and production environments.*