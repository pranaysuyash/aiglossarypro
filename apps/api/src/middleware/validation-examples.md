# Validation Middleware Usage Examples

This document provides examples of how to use the validation middleware with the schemas from `engagementValidation.ts`.

## Import Required Modules

```typescript
import { validate } from '../middleware/validationMiddleware';
import { 
  engagementSchemas, 
  referralSchemas, 
  newsletterSchemas, 
  progressSchemas, 
  searchSchemas 
} from '../schemas/engagementValidation';
import { z } from 'zod';
```

## Newsletter Routes

### Subscribe to Newsletter
```typescript
router.post('/subscribe', 
  validate.body(newsletterSchemas.subscribe, { 
    sanitizeHtml: true,
    logErrors: true 
  }),
  async (req, res) => {
    const { email, preferences, marketingConsent } = req.body;
    // Implementation
  }
);
```

### Update Newsletter Preferences
```typescript
router.put('/preferences', 
  validate.body(newsletterSchemas.updatePreferences, { 
    sanitizeHtml: true,
    allowPartial: true 
  }),
  async (req, res) => {
    const { frequency, topics, active } = req.body;
    // Implementation
  }
);
```

### Unsubscribe
```typescript
router.post('/unsubscribe', 
  validate.body(newsletterSchemas.unsubscribe, { 
    sanitizeHtml: true 
  }),
  async (req, res) => {
    const { token, reason } = req.body;
    // Implementation
  }
);
```

## Progress Tracking Routes

### Update Progress
```typescript
app.post('/api/progress/update', 
  validate.body(progressSchemas.updateProgress, { 
    logErrors: true 
  }),
  async (req, res) => {
    const { termId, progress, completed, timeSpent } = req.body;
    // Implementation
  }
);
```

### Batch Update Progress
```typescript
app.post('/api/progress/batch-update', 
  validate.body(progressSchemas.batchUpdateProgress, { 
    logErrors: true 
  }),
  async (req, res) => {
    const { updates } = req.body;
    // Process batch updates
  }
);
```

### Get Progress with Filters
```typescript
app.get('/api/progress', 
  validate.query(progressSchemas.getProgress),
  async (req, res) => {
    const { termIds, category, minProgress } = req.query;
    // Implementation
  }
);
```

## Search Routes

### Main Search
```typescript
app.get('/api/search', 
  validate.query(searchSchemas.search, { 
    sanitizeHtml: true,
    logErrors: true 
  }),
  async (req, res) => {
    const { q, filters, page, limit, sort } = req.query;
    // Implementation
  }
);
```

### Search Suggestions
```typescript
app.get('/api/search/suggestions', 
  validate.query(searchSchemas.suggest, { 
    sanitizeHtml: true 
  }),
  async (req, res) => {
    const { q, limit } = req.query;
    // Implementation
  }
);
```

### Track Search Analytics
```typescript
app.post('/api/search/track', 
  validate.body(searchSchemas.trackSearch, { 
    logErrors: true 
  }),
  async (req, res) => {
    const { query, resultsCount, clickedResult, position, timeToClick } = req.body;
    // Implementation
  }
);
```

## Engagement Routes

### Track Interaction
```typescript
app.post('/api/engagement/track', 
  validate.body(engagementSchemas.trackInteraction, { 
    sanitizeHtml: true,
    logErrors: true 
  }),
  async (req, res) => {
    const { sessionId, termId, interactionType, duration, metadata } = req.body;
    // Implementation
  }
);
```

### Track Reading Progress
```typescript
app.post('/api/engagement/reading-progress', 
  validate.body(engagementSchemas.trackReadingProgress, { 
    logErrors: true 
  }),
  async (req, res) => {
    const { sessionId, termId, scrollDepth, readingProgress, timeOnContent } = req.body;
    // Implementation
  }
);
```

### Get Engagement Metrics
```typescript
app.get('/api/engagement/metrics', 
  validate.query(engagementSchemas.getEngagementMetrics),
  async (req, res) => {
    const { termId, startDate, endDate, metricType, groupBy } = req.query;
    // Implementation
  }
);
```

## Referral Routes

### Generate Referral Link
```typescript
app.post('/api/referral/generate', 
  validate.body(referralSchemas.generateLink),
  async (req, res) => {
    const { campaignName } = req.body;
    // Implementation
  }
);
```

### Track Referral Click
```typescript
app.post('/api/referral/track-click', 
  validate.body(referralSchemas.trackClick, { 
    sanitizeHtml: true 
  }),
  async (req, res) => {
    const { referralCode, utm } = req.body;
    // Implementation
  }
);
```

## Custom Validation Schemas

### Creating Custom Schemas
```typescript
const customSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
  email: z.string().email(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

app.post('/api/custom', 
  validate.body(customSchema, { 
    sanitizeHtml: true,
    sanitizeSql: true,
    logErrors: true 
  }),
  async (req, res) => {
    // Implementation
  }
);
```

### Combined Validation (Body, Query, Params)
```typescript
app.put('/api/resource/:id', 
  validate.validate({
    params: z.object({
      id: z.string().uuid()
    }),
    query: z.object({
      include: z.enum(['details', 'summary']).optional()
    }),
    body: z.object({
      name: z.string().min(1),
      description: z.string().optional()
    })
  }, { sanitizeHtml: true }),
  async (req, res) => {
    const { id } = req.params;
    const { include } = req.query;
    const { name, description } = req.body;
    // Implementation
  }
);
```

## Validation Options

### Available Options
- `sanitizeHtml`: Remove potentially dangerous HTML content
- `sanitizeSql`: Escape SQL injection attempts
- `allowPartial`: Allow partial objects (useful for PATCH requests)
- `logErrors`: Log validation errors for debugging

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

## Best Practices

1. **Always validate user input**: Never trust data from clients
2. **Use appropriate sanitization**: Enable HTML sanitization for user-generated content
3. **Log validation errors**: Enable error logging in development/staging
4. **Provide clear error messages**: Help users understand what went wrong
5. **Use type coercion**: Use `z.coerce` for query parameters that should be numbers
6. **Set reasonable limits**: Limit string lengths and array sizes to prevent abuse
7. **Validate relationships**: Ensure referenced IDs exist before processing

## Common Patterns

### Optional Query Parameters with Defaults
```typescript
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('desc')
});
```

### Date Range Validation
```typescript
const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'Start date must be before end date'
});
```

### Array with Size Limits
```typescript
const batchSchema = z.object({
  items: z.array(z.string()).min(1).max(100)
});
```

### Conditional Validation
```typescript
const userSchema = z.object({
  role: z.enum(['admin', 'user']),
  permissions: z.array(z.string()).optional()
}).refine(data => {
  if (data.role === 'admin' && (!data.permissions || data.permissions.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Admin users must have at least one permission'
});
```