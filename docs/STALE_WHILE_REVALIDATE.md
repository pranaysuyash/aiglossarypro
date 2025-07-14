# Stale-While-Revalidate Caching Implementation

## Overview

The stale-while-revalidate (SWR) caching strategy provides immediate response times while ensuring data freshness through background updates. This implementation allows serving stale cached data to users while asynchronously fetching fresh data to update the cache.

## How It Works

1. **Cache Hit (Fresh)**: Return cached data immediately
2. **Cache Hit (Stale)**: Return stale data immediately + trigger background refresh  
3. **Cache Miss**: Fetch fresh data, cache it, and return to user

## Benefits

- **Immediate Response**: Users always get instant responses
- **Better UX**: No waiting for database queries on cache hits
- **Data Freshness**: Background updates ensure data stays current
- **Fault Tolerance**: Graceful degradation when cache or database fails

## Implementation

### RedisCache Class Methods

```typescript
// Get data with stale-while-revalidate strategy
const data = await redisCache.getStaleWhileRevalidate(
  cacheKey,
  () => fetchFreshData(), // Revalidation function
  {
    ttl: 300,        // Fresh data TTL (5 minutes)
    staleTtl: 1800,  // Stale data TTL (30 minutes)
    revalidateThreshold: 0.8 // Trigger revalidation at 80% of TTL
  }
);
```

### Cache Key Structure

- **Fresh Cache**: `enhanced_storage:${key}`
- **Stale Cache**: `enhanced_storage:stale:${key}`

### Configuration Presets

```typescript
CacheKeys.SWR_CONFIG = {
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
}
```

## Usage Examples

### Trending Terms (High Frequency)

```typescript
// routes/trending.ts
const trendingTerms = await redisCache.getStaleWhileRevalidate(
  `trending_terms:${JSON.stringify(filters)}`,
  () => getTrendingTerms(filters),
  CacheKeys.SWR_CONFIG.HIGH_FREQUENCY
);
```

### User Preferences (Medium Frequency)

```typescript
const userPrefs = await redisCache.getStaleWhileRevalidate(
  `user_preferences:${userId}`,
  () => getUserPreferences(userId),
  CacheKeys.SWR_CONFIG.MEDIUM_FREQUENCY
);
```

### System Metrics (Low Frequency)

```typescript
const systemStats = await redisCache.getStaleWhileRevalidate(
  'system_metrics',
  () => getSystemMetrics(),
  CacheKeys.SWR_CONFIG.LOW_FREQUENCY
);
```

## Cache Response Headers

The implementation adds cache status to API responses:

```json
{
  "success": true,
  "data": [...],
  "cacheStatus": "hit" | "miss" | "stale"
}
```

## Background Revalidation

- **Deduplication**: Multiple requests for the same key share one revalidation job
- **Non-blocking**: Revalidation happens asynchronously
- **Error Handling**: Failed revalidation doesn't affect current response
- **Memory Management**: Completed jobs are automatically cleaned up

## Monitoring

### Cache Performance Metrics

- Cache hit/miss ratios
- Stale response rates
- Background revalidation success rates
- Response time improvements

### Logs

```
[RedisCache] Serving stale data for key: trending_terms:...
[RedisCache] Starting background revalidation for key: ...
[RedisCache] Background revalidation completed for key: ...
```

## Best Practices

### When to Use SWR

✅ **Good Candidates:**
- Trending/popular content
- Search results
- User preferences
- Analytics dashboards
- System metrics

❌ **Avoid for:**
- Real-time financial data
- Authentication tokens
- User-generated content updates
- Critical system alerts

### Cache Key Design

```typescript
// Good: Structured, predictable keys
`trending_terms:${timeRange}:${category}:${trendType}`

// Bad: Unstructured keys
`${Math.random()}_data`
```

### TTL Configuration

- **Fresh TTL**: How long data is considered current
- **Stale TTL**: Maximum age before forced refresh
- **Revalidate Threshold**: When to trigger background updates

**Rule of thumb**: `staleTtl = 3-5x ttl`

## Error Handling

1. **Cache Failure**: Falls back to direct data fetch
2. **Revalidation Failure**: Continues serving stale data
3. **Data Fetch Failure**: Returns cached data if available
4. **Total Failure**: Returns null, handled by route logic

## Performance Impact

### Expected Improvements

- **95th percentile response time**: 50-80% reduction
- **Database load**: 60-80% reduction during cache hits
- **User perceived performance**: Instant responses for cached data

### Memory Usage

- **Overhead**: ~2x memory usage (fresh + stale copies)
- **Optimization**: Automatic cleanup of expired entries
- **Monitoring**: Redis memory usage metrics

## Future Enhancements

- [ ] Conditional cache updates based on data change detection
- [ ] Intelligent TTL adjustment based on data access patterns
- [ ] Cache warming strategies for predictable data access
- [ ] Cross-instance cache invalidation for multi-server deployments
- [ ] Compression for large cached objects
- [ ] Cache analytics dashboard