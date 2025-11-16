# Content Generation API Documentation

**Version**: 2.0
**Last Updated**: November 16, 2025
**Status**: Production Ready

---

## Overview

The AIGlossaryPro Content Generation API provides AI-powered content creation with quality evaluation, state management, and cost tracking.

### Key Features

- ✅ **Multi-Model Support**: GPT-4.1, GPT-4o, O1, and more
- ✅ **Quality Evaluation**: 6-dimensional scoring system
- ✅ **State Management**: Complete content lifecycle tracking
- ✅ **Cost Tracking**: Accurate per-operation cost calculation
- ✅ **Batch Processing**: Recoverable bulk operations with checkpointing
- ✅ **Monitoring**: Real-time dashboards and alerts

---

## Base URL

```
Production: https://d1m7nnfj3im4kp.cloudfront.net/api
Development: http://localhost:8080/api
```

---

## Authentication

All endpoints require Firebase Authentication token:

```http
Authorization: Bearer <firebase-id-token>
```

---

## Content Generation Endpoints

### 1. Generate Single Section

Generate content for a specific section of a term.

**Endpoint**: `POST /admin/ai/generate`

**Request Body**:
```json
{
  "termId": "uuid",
  "sectionName": "definition",
  "model": "gpt-4.1-mini",
  "temperature": 0.7,
  "maxTokens": 500,
  "regenerate": false,
  "storeAsVersion": false
}
```

**Response**:
```json
{
  "success": true,
  "content": "Generated content...",
  "metadata": {
    "model": "gpt-4.1-mini",
    "tokens": {
      "input": 150,
      "output": 300,
      "total": 450
    },
    "cost": 0.0003,
    "qualityScore": 8.2,
    "qualityTier": "good",
    "generationTime": 2.5
  },
  "state": "APPROVED"
}
```

**Error Responses**:
- `400`: Invalid request parameters
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Generation failed

---

### 2. Generate Multi-Model Comparison

Generate content with multiple models and compare results.

**Endpoint**: `POST /admin/ai/generate/multi-model`

**Request Body**:
```json
{
  "termId": "uuid",
  "sectionName": "definition",
  "models": ["gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o-mini"],
  "temperature": 0.7
}
```

**Response**:
```json
{
  "success": true,
  "versions": [
    {
      "model": "gpt-4.1-mini",
      "content": "...",
      "qualityScore": 8.2,
      "cost": 0.0006,
      "selected": true
    },
    {
      "model": "gpt-4.1-nano",
      "content": "...",
      "qualityScore": 7.5,
      "cost": 0.0001,
      "selected": false
    },
    {
      "model": "gpt-4o-mini",
      "content": "...",
      "qualityScore": 8.0,
      "cost": 0.0003,
      "selected": false
    }
  ],
  "recommendation": {
    "bestQuality": "gpt-4.1-mini",
    "bestValue": "gpt-4o-mini",
    "cheapest": "gpt-4.1-nano"
  }
}
```

---

### 3. Bulk Generation

Generate multiple sections for one or more terms.

**Endpoint**: `POST /admin/ai/generate/bulk`

**Request Body**:
```json
{
  "termIds": ["uuid1", "uuid2", "uuid3"],
  "sectionNames": ["definition", "examples", "best-practices"],
  "model": "gpt-4.1-mini",
  "config": {
    "chunkSize": 10,
    "maxConcurrent": 3,
    "checkpointInterval": 50,
    "retryAttempts": 3
  }
}
```

**Response**:
```json
{
  "success": true,
  "batchId": "batch_123456",
  "status": "RUNNING",
  "progress": {
    "totalItems": 300,
    "processedItems": 0,
    "progressPercent": 0
  },
  "estimatedCost": 0.45,
  "estimatedDuration": 600
}
```

**Check Batch Status**:
```http
GET /admin/ai/batch/:batchId/status
```

---

### 4. Resume Batch from Checkpoint

Resume a failed or paused batch operation.

**Endpoint**: `POST /admin/ai/batch/:batchId/resume`

**Response**:
```json
{
  "success": true,
  "batchId": "batch_123456",
  "resumedFrom": {
    "checkpointNumber": 3,
    "processedItems": 150
  },
  "remainingItems": 150
}
```

---

## 295-Column Content Endpoints

### 5. Generate Single Column

Generate content for a specific 295-column definition.

**Endpoint**: `POST /enhanced-295/generate-single`

**Request Body**:
```json
{
  "termId": "uuid",
  "columnId": "col_mathematical_formulation",
  "termName": "Gradient Descent",
  "pipelineMode": "full-pipeline"
}
```

**Pipeline Modes**:
- `generate-only`: Just generate content
- `generate-evaluate`: Generate + evaluate quality
- `full-pipeline`: Generate → Evaluate → Improve (if needed)

**Response**:
```json
{
  "success": true,
  "content": "...",
  "pipeline": {
    "stage1_generate": { "completed": true, "cost": 0.0002 },
    "stage2_evaluate": { "completed": true, "score": 6.5 },
    "stage3_improve": { "completed": true, "finalScore": 8.1 }
  },
  "finalQualityScore": 8.1,
  "totalCost": 0.0006
}
```

---

### 6. Batch Column Generation

Generate same column for multiple terms.

**Endpoint**: `POST /enhanced-295/generate-batch`

**Request Body**:
```json
{
  "columnId": "col_use_cases",
  "termIds": ["uuid1", "uuid2", "uuid3"],
  "pipelineMode": "full-pipeline",
  "config": {
    "batchSize": 5,
    "qualityThreshold": 7.0
  }
}
```

---

## Quality Evaluation Endpoints

### 7. Evaluate Content Quality

Manually evaluate existing content.

**Endpoint**: `POST /admin/content/evaluate`

**Request Body**:
```json
{
  "contentId": "content_123",
  "evaluationModel": "gpt-4o-mini"
}
```

**Response**:
```json
{
  "success": true,
  "evaluation": {
    "overallScore": 8.2,
    "dimensions": {
      "accuracy": 8.5,
      "clarity": 8.0,
      "completeness": 8.3,
      "relevance": 8.4,
      "style": 7.8,
      "engagement": 7.9
    },
    "qualityTier": "good",
    "feedback": {
      "strengths": ["Clear explanations", "Good examples"],
      "weaknesses": ["Could add more technical depth"],
      "suggestions": ["Include code examples", "Add visual diagrams"]
    }
  }
}
```

---

## State Management Endpoints

### 8. Get Content State

**Endpoint**: `GET /admin/content/:contentId/state`

**Response**:
```json
{
  "contentId": "content_123",
  "state": "APPROVED",
  "previousState": "EVALUATING",
  "transitionedAt": "2025-11-16T10:30:00Z",
  "qualityScore": 8.2,
  "canPublish": true,
  "validNextStates": ["PUBLISHED", "FLAGGED"]
}
```

---

### 9. Transition Content State

**Endpoint**: `POST /admin/content/:contentId/transition`

**Request Body**:
```json
{
  "to": "PUBLISHED",
  "reason": "Manual approval by admin",
  "metadata": {
    "reviewedBy": "admin@example.com"
  }
}
```

---

## Monitoring Endpoints

### 10. Dashboard Metrics

Get real-time dashboard metrics.

**Endpoint**: `GET /admin/monitoring/dashboard`

**Response**:
```json
{
  "totalGenerated": 12500,
  "generatedToday": 150,
  "averageQualityScore": 7.8,
  "qualityDistribution": {
    "excellent": 3200,
    "good": 5800,
    "acceptable": 3000,
    "poor": 500
  },
  "totalCostToday": 2.45,
  "totalCostThisMonth": 48.20,
  "projectedMonthlyCost": 52.30,
  "successRate": 96.5,
  "activeAlerts": [
    {
      "severity": "warning",
      "type": "cost",
      "message": "Daily cost approaching limit"
    }
  ]
}
```

---

### 11. Quality Trend

**Endpoint**: `GET /admin/monitoring/quality-trend?period=week`

**Response**:
```json
{
  "period": "week",
  "dataPoints": [
    { "timestamp": "2025-11-09", "value": 7.5 },
    { "timestamp": "2025-11-10", "value": 7.8 },
    { "timestamp": "2025-11-11", "value": 8.0 }
  ],
  "trend": "improving",
  "trendStrength": 0.6,
  "averageScore": 7.8
}
```

---

### 12. Cost Trend

**Endpoint**: `GET /admin/monitoring/cost-trend?period=month`

**Response**:
```json
{
  "period": "month",
  "totalCost": 48.20,
  "averageDailyCost": 1.61,
  "projectedMonthlyCost": 52.30,
  "costByModel": {
    "gpt-4.1-mini": 30.50,
    "gpt-4.1-nano": 12.20,
    "gpt-4o-mini": 5.50
  },
  "trend": "stable"
}
```

---

### 13. Model Comparison

**Endpoint**: `GET /admin/monitoring/model-comparison`

**Response**:
```json
[
  {
    "model": "gpt-4.1-mini",
    "usageCount": 5000,
    "averageCost": 0.0006,
    "totalCost": 3.00,
    "averageQuality": 8.1,
    "averageLatency": 2.5,
    "errorRate": 2.1,
    "costEfficiencyScore": 13.5,
    "recommendationScore": 95
  },
  {
    "model": "gpt-4.1-nano",
    "usageCount": 3000,
    "averageCost": 0.0001,
    "totalCost": 0.30,
    "averageQuality": 7.2,
    "averageLatency": 1.8,
    "errorRate": 3.5,
    "costEfficiencyScore": 72.0,
    "recommendationScore": 85
  }
]
```

---

## Cost Calculator Utilities

### 14. Estimate Cost

**Endpoint**: `POST /admin/cost/estimate`

**Request Body**:
```json
{
  "model": "gpt-4.1-mini",
  "estimatedInputTokens": 1000,
  "estimatedOutputTokens": 500
}
```

**Response**:
```json
{
  "estimatedCost": 0.0006,
  "breakdown": {
    "inputCost": 0.0002,
    "outputCost": 0.0004
  },
  "formatted": "$0.000600"
}
```

---

### 15. Compare Model Costs

**Endpoint**: `POST /admin/cost/compare`

**Request Body**:
```json
{
  "inputTokens": 1000,
  "outputTokens": 500,
  "models": ["gpt-4.1-nano", "gpt-4.1-mini", "gpt-4o-mini"]
}
```

**Response**:
```json
[
  {
    "model": "gpt-4.1-nano",
    "cost": 0.00015,
    "savings": 0.00045,
    "savingsPercent": 75.0
  },
  {
    "model": "gpt-4o-mini",
    "cost": 0.00045,
    "savings": 0.00015,
    "savingsPercent": 25.0
  },
  {
    "model": "gpt-4.1-mini",
    "cost": 0.0006,
    "savings": 0,
    "savingsPercent": 0
  }
]
```

---

## Webhooks (Future)

### Content State Change Webhook

Subscribe to state change events.

**Endpoint**: `POST /admin/webhooks/subscribe`

**Request Body**:
```json
{
  "url": "https://your-app.com/webhooks/content-state",
  "events": ["content.approved", "content.published", "content.flagged"]
}
```

**Webhook Payload**:
```json
{
  "event": "content.approved",
  "timestamp": "2025-11-16T10:30:00Z",
  "data": {
    "contentId": "content_123",
    "termId": "uuid",
    "state": "APPROVED",
    "qualityScore": 8.2
  }
}
```

---

## Rate Limits

| Endpoint Type | Rate Limit | Window |
|--------------|------------|--------|
| Generation (single) | 60 requests | 1 minute |
| Generation (bulk) | 10 requests | 1 minute |
| Monitoring | 100 requests | 1 minute |
| Utilities | 200 requests | 1 minute |

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_MODEL` | Specified model not supported |
| `COST_LIMIT_EXCEEDED` | Operation exceeds cost limit |
| `QUALITY_TOO_LOW` | Generated content below quality threshold |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `BATCH_NOT_FOUND` | Batch ID not found |
| `INVALID_STATE_TRANSITION` | Cannot transition to specified state |
| `CHECKPOINT_NOT_FOUND` | No checkpoint available for resume |

---

## Best Practices

### 1. Model Selection

- **For definitions**: Use `gpt-4.1-mini` (best balance)
- **For code examples**: Use `gpt-4.1-mini` or `gpt-4o-mini`
- **For quick drafts**: Use `gpt-4.1-nano` (cheapest)
- **For complex reasoning**: Use `o1-mini`

### 2. Quality Management

- Set quality threshold to **7.0** for auto-approval
- Review content with scores **5.5-6.9** manually
- Reject content with scores **< 5.5**
- Use multi-model comparison for critical content

### 3. Cost Optimization

- Use `gpt-4.1-nano` for bulk operations
- Enable caching for repeated prompts
- Set `maxTokens` appropriately (500-1000 for most content)
- Use temperature **0.7** for balanced creativity/consistency

### 4. Batch Processing

- Use chunk size **10** for optimal throughput
- Set checkpoint interval to **50** to minimize overhead
- Enable retry logic with **3 attempts**
- Monitor batch progress via status endpoint

### 5. State Management

- Always check `validNextStates` before transition
- Include `reason` for audit trail
- Use quality-based auto-transitions when possible
- Review flagged content within 24 hours

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://d1m7nnfj3im4kp.cloudfront.net/api',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`
  }
});

// Generate content
const response = await api.post('/admin/ai/generate', {
  termId: 'abc-123',
  sectionName: 'definition',
  model: 'gpt-4.1-mini'
});

console.log(response.data.content);
console.log(`Quality: ${response.data.metadata.qualityScore}/10`);
console.log(`Cost: $${response.data.metadata.cost.toFixed(6)}`);
```

### Python

```python
import requests

headers = {'Authorization': f'Bearer {firebase_token}'}
base_url = 'https://d1m7nnfj3im4kp.cloudfront.net/api'

response = requests.post(
    f'{base_url}/admin/ai/generate',
    headers=headers,
    json={
        'termId': 'abc-123',
        'sectionName': 'definition',
        'model': 'gpt-4.1-mini'
    }
)

data = response.json()
print(f"Content: {data['content']}")
print(f"Quality: {data['metadata']['qualityScore']}/10")
```

---

## Support

For questions or issues:
- Documentation: `/docs/content-generation`
- Support Email: support@aiglossarypro.com
- GitHub Issues: https://github.com/pranaysuyash/aiglossarypro/issues

---

**Last Updated**: November 16, 2025
**API Version**: 2.0
