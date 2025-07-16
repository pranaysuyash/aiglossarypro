# Redis Caching - Quick Start Guide

## Adding Cache to an Endpoint (2 minutes)

### 1. Import the middleware
```typescript
import { cacheConfigs } from '../middleware/cacheMiddleware';
```

### 2. Add to GET endpoint
```typescript
// Before
app.get('/api/categories', async (req, res) => {
  const categories = await getCategories();
  res.json(categories);
});

// After - with caching
app.get('/api/categories', cacheConfigs.categoriesList, async (req, res) => {
  const categories = await getCategories();
  res.json(categories);
});
```

That's it! The endpoint now has caching enabled.

## Custom Cache Configuration

### Create custom cache config
```typescript
const myCustomCache = cache({
  ttl: 1800, // 30 minutes
  keyGenerator: (req) => `custom:${req.params.id}:${req.query.filter}`
});

app.get('/api/custom/:id', myCustomCache, handler);
```

## Cache Invalidation

### Add to PUT/POST/DELETE endpoints
```typescript
import { invalidateCache, invalidationPatterns } from '../middleware/cacheMiddleware';

app.put('/api/terms/:id',
  invalidateCache((req) => [
    `term:${req.params.id}`,
    'terms:list:*'
  ]),
  async (req, res) => {
    // Update logic
  }
);
```

## Testing Cache

1. Make first request - check for `X-Cache: MISS` header
2. Make second request - check for `X-Cache: HIT` header
3. Cache is working! 🎉

## Common Patterns

### User-specific cache
```typescript
cache({
  keyGenerator: (req) => `user:${req.user.id}:data`,
  condition: (req) => !!req.user
})
```

### Query-based cache
```typescript
cache({
  keyGenerator: (req) => {
    const { page = 1, limit = 20, sort, filter } = req.query;
    return `list:${page}:${limit}:${sort}:${filter}`;
  }
})
```

### Short-lived cache for trending data
```typescript
cache({
  ttl: 300, // 5 minutes
  keyGenerator: () => 'trending:now'
})
```

## Debug Tips

- Check response headers for cache status
- Use `redis-cli` or Upstash console to inspect keys
- Enable debug logging: `DEBUG=cache:*`
- Monitor cache hit rate in production