# Redis Caching Setup with Upstash

## Overview

This document describes the Redis caching implementation for AI Glossary Pro using Upstash Redis. The caching system improves performance by reducing database queries and API response times.

## Architecture

### Components

1. **Redis Service** (`server/services/redisService.ts`)
   - Singleton service for Redis operations
   - Automatic connection management
   - Fallback handling when Redis is unavailable

2. **Cache Middleware** (`server/middleware/cacheMiddleware.ts`)
   - Express middleware for automatic response caching
   - Cache invalidation patterns
   - Configurable TTL values

3. **Environment Configuration**
   - Upstash Redis REST API integration
   - Environment variables for connection

## Setup

### Prerequisites

- Upstash account
- Redis database created in Upstash console

### Environment Variables

Add to `.env` and `.env.production`:

```env
# Redis Configuration (Upstash)
REDIS_ENABLED=true
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Installation

```bash
npm install @upstash/redis
```

## Usage

### Basic Caching

The caching middleware automatically caches GET requests:

```typescript
// Add caching to any GET endpoint
app.get('/api/terms', cacheConfigs.termsList, async (req, res) => {
  // Your handler code
});
```

### Cache Key Patterns

Pre-defined cache keys for consistency:

```typescript
cacheKeys.term(id)                    // term:{id}
cacheKeys.termBySlug(slug)           // term:slug:{slug}
cacheKeys.termsList(page, limit)     // terms:list:{page}:{limit}:{filters}
cacheKeys.category(id)               // category:{id}
cacheKeys.userProgress(userId)       // user:{userId}:progress
cacheKeys.trending()                 // analytics:trending
```

### TTL Values

```typescript
cacheTTL.short   // 5 minutes
cacheTTL.medium  // 1 hour
cacheTTL.long    // 24 hours
cacheTTL.week    // 7 days
```

### Cache Invalidation

Invalidate cache when data changes:

```typescript
// Invalidate specific patterns
app.put('/api/terms/:id', 
  invalidateCache(req => [
    cacheKeys.term(req.params.id),
    'terms:list:*',
    'analytics:*'
  ]),
  async (req, res) => {
    // Update handler
  }
);
```

## API Reference

### RedisService Methods

#### `get<T>(key: string): Promise<T | null>`
Retrieve a value from cache.

#### `set(key: string, value: any, ttlSeconds?: number): Promise<boolean>`
Store a value in cache with optional TTL.

#### `del(key: string): Promise<boolean>`
Delete a value from cache.

#### `clearPattern(pattern: string): Promise<number>`
Clear all keys matching a pattern.

#### `cached<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number): Promise<T>`
Cache wrapper that automatically fetches and caches data.

#### `isAvailable(): boolean`
Check if Redis is connected and available.

## Performance Benefits

1. **Reduced Database Load**: Up to 90% reduction in database queries
2. **Faster Response Times**: Sub-millisecond cache hits
3. **Global Performance**: Upstash edge locations worldwide
4. **Automatic Scaling**: Handles traffic spikes gracefully

## Monitoring

### Cache Headers

All cached responses include headers:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response fetched from source
- `X-Cache-TTL: {seconds}` - Cache duration

### Redis Stats

```typescript
const stats = await redisService.getStats();
// Returns: { enabled, connected, keyCount }
```

## Best Practices

1. **Cache Appropriate Data**
   - Public, frequently accessed data
   - Data that doesn't change often
   - Computed/aggregated results

2. **Avoid Caching**
   - User-specific sensitive data
   - Real-time data
   - Data with complex invalidation rules

3. **TTL Guidelines**
   - Static content: Long TTL (24h - 7d)
   - Dynamic content: Medium TTL (1h)
   - Analytics: Short TTL (5-15m)

4. **Invalidation Strategy**
   - Invalidate on write operations
   - Use pattern-based invalidation
   - Consider cache warming for critical data

## Troubleshooting

### Redis Not Working

1. Check environment variables are set
2. Verify Upstash database is active
3. Check Redis connection logs
4. Ensure REDIS_ENABLED=true

### Cache Not Updating

1. Check invalidation patterns
2. Verify TTL values
3. Look for cache headers in response
4. Clear cache manually if needed

### Performance Issues

1. Monitor cache hit rates
2. Adjust TTL values
3. Implement cache warming
4. Check Redis latency

## Cost Optimization

Upstash Free Tier includes:
- 10,000 commands per day
- 256MB storage
- Global replication

To stay within limits:
- Use appropriate TTL values
- Implement efficient cache keys
- Monitor daily usage
- Consider upgrading for high traffic

## Security

1. **Connection Security**
   - Uses HTTPS REST API
   - Token-based authentication
   - No direct Redis protocol exposure

2. **Data Security**
   - Don't cache sensitive user data
   - Use appropriate access controls
   - Regular cache cleanup

## Future Enhancements

1. **Cache Warming**: Pre-populate cache for popular content
2. **Cache Analytics**: Track hit rates and performance
3. **Advanced Invalidation**: Tag-based invalidation
4. **Multi-tier Caching**: Memory + Redis caching