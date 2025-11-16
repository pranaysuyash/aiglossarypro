# Content Generation System Consolidation - Implementation Roadmap

## TLDR: What You Need to Know

**Current State**: You have 2 ACTIVE systems that both work:
1. **aiContentGenerationService** - 10 endpoints, used daily
2. **enhanced295AIService** - 3 endpoints, used for batch operations

**The Problem**: They duplicate logic, have inconsistent cost calculations, and store data in overlapping tables.

**The Solution**: Consolidate into ONE `UnifiedContentGenerationService` over 4-5 weeks with zero downtime.

---

## PHASE 0: ASSESSMENT (Week 1 - 2 days)

### What to Do:
1. **Audit Frontend Usage**: Which endpoints does frontend actually use?
   ```bash
   grep -r "/api/admin/ai\|/api/enhanced-295" frontend/src
   ```

2. **Check Admin Panel**: Which buttons/features exist in admin UI?
   - Simple content generation?
   - Bulk operations?
   - Multi-model comparison?
   - 295-column batch processing?

3. **Production Data Check**:
   ```sql
   -- How much data in each table?
   SELECT COUNT(*) FROM section_items;
   SELECT COUNT(*) FROM model_content_versions;
   SELECT COUNT(*) FROM ai_usage_analytics;
   SELECT COUNT(*) FROM ai_content_verification;
   ```

4. **Backup Database**: Critical before any changes
   ```bash
   pg_dump aiglossarypro > backup_$(date +%Y%m%d).sql
   ```

---

## PHASE 1: DESIGN (Week 1 - 3 days)

### Create UnifiedContentGenerationService Interface

**File to Create**: `/apps/api/src/services/unifiedContentGenerationService.ts`

```typescript
export interface UnifiedContentGenerationRequest {
  termId: string;
  model?: string;
  mode: 'section' | 'column' | 'batch';  // Which system to use
  
  // For section-based generation
  sectionName?: string;
  
  // For 295-column generation
  columnId?: string;
  termName?: string;
  pipelineMode?: 'generate-only' | 'generate-evaluate' | 'full-pipeline';
  
  // Common options
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  regenerate?: boolean;
  storeAsVersion?: boolean;
}

export class UnifiedContentGenerationService {
  async generate(request: UnifiedContentGenerationRequest): Promise<GenerationResult> {
    switch(request.mode) {
      case 'section':
        return this.generateSection(request);
      case 'column':
        return this.generateColumn(request);
      case 'batch':
        return this.generateBatch(request);
    }
  }
  
  private async generateSection(request: UnifiedContentGenerationRequest): Promise<GenerationResult> {
    // Existing aiContentGenerationService logic
  }
  
  private async generateColumn(request: UnifiedContentGenerationRequest): Promise<GenerationResult> {
    // Existing enhanced295AIService logic
  }
  
  private async generateBatch(request: UnifiedContentGenerationRequest): Promise<GenerationResult> {
    // Batch logic for both systems
  }
}
```

### Create Feature Flags

**File to Create**: `/apps/api/src/config/featureFlags.ts`

```typescript
export const FEATURE_FLAGS = {
  USE_UNIFIED_SERVICE: process.env.USE_UNIFIED_SERVICE === 'true',
  DEPRECATE_OLD_ROUTES: process.env.DEPRECATE_OLD_ROUTES === 'true',
  LOG_BOTH_SYSTEMS: process.env.LOG_BOTH_SYSTEMS === 'true',
};
```

---

## PHASE 2: IMPLEMENTATION (Week 2 - 5 days)

### Step 1: Create Unified Service (2 days)

1. Extract common logic into `BaseContentGenerationService`
   - Cost calculation (fix inconsistencies!)
   - Model selection
   - Token counting
   - Error handling

2. Create `UnifiedContentGenerationService` that extends base
   - Implements both section and column modes
   - Routes calls to appropriate implementation
   - Centralizes logging

3. Create adapter layer for backward compatibility
   ```typescript
   // In old services, delegate to new service with feature flag
   async generateContent(request) {
     if (FEATURE_FLAGS.USE_UNIFIED_SERVICE) {
       return unifiedService.generate({ ...request, mode: 'section' });
     }
     // Fall back to old implementation
     return this.legacyGenerateContent(request);
   }
   ```

### Step 2: Fix Cost Calculation (1 day)

Create centralized pricing config:

**File**: `/apps/api/src/config/modelPricing.ts`

```typescript
export const MODEL_PRICING = {
  'gpt-4.1': { input: 0.025, output: 0.1 },
  'gpt-4.1-mini': { input: 0.0002, output: 0.0008 },
  'gpt-4.1-nano': { input: 0.00005, output: 0.0002 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'o1-mini': { input: 0.003, output: 0.012 },
} as const;

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
  if (!pricing) throw new Error(`Unknown model: ${model}`);
  
  return (inputTokens * pricing.input + outputTokens * pricing.output);
}
```

### Step 3: Create New Unified Endpoints (2 days)

**File**: `/apps/api/src/routes/admin/unifiedContent.ts`

```typescript
// New unified endpoints (keep old ones working in parallel)
router.post('/v2/generate', async (req, res) => {
  // Accept both formats
  const request = req.body;
  const result = await unifiedService.generate(request);
  res.json(result);
});

// With deprecation warnings
router.post('/v2/generate-section', async (req, res) => {
  if (FEATURE_FLAGS.DEPRECATE_OLD_ROUTES) {
    res.set('Warning', '299 - "/api/v2/generate-section" is deprecated, use "/api/v2/generate"');
  }
  // Route to unified service
});
```

---

## PHASE 3: MIGRATION (Week 3 - 4 days)

### Step 1: Dual-Write Testing (2 days)

Enable `LOG_BOTH_SYSTEMS` flag to run both implementations:

```typescript
async generate(request) {
  if (FEATURE_FLAGS.LOG_BOTH_SYSTEMS) {
    // Run new unified service
    const newResult = await unifiedService.generate(request);
    
    // Run old service
    const oldResult = await oldService.generate(request);
    
    // Compare results
    if (newResult.cost !== oldResult.cost) {
      logger.warn('Cost difference detected', {
        newCost: newResult.cost,
        oldCost: oldResult.cost,
        difference: Math.abs(newResult.cost - oldResult.cost),
      });
    }
    
    // Return new result, log old result for verification
    return newResult;
  }
  
  return oldService.generate(request);  // Default fallback
}
```

**What to Test**:
- [ ] Content generation matches exactly
- [ ] Cost calculations match (or better)
- [ ] Token counts match
- [ ] Database writes are identical
- [ ] Error handling is equivalent

### Step 2: Gradual Rollout (2 days)

Start with 5% of traffic:

```typescript
const shouldUseUnified = () => {
  // Percentage-based rollout
  const percentage = parseInt(process.env.UNIFIED_SERVICE_ROLLOUT || '0', 10);
  const random = Math.random() * 100;
  return random < percentage;
};

async generate(request) {
  if (shouldUseUnified()) {
    return unifiedService.generate(request);
  }
  return oldService.generate(request);
}
```

**Rollout Plan**:
- Day 1: 5% traffic → monitor for 24 hours
- Day 2: 25% traffic → monitor for 24 hours
- Day 3: 50% traffic → monitor for 24 hours
- Day 4: 100% traffic → old services in read-only mode

---

## PHASE 4: CLEANUP (Week 4 - 3 days)

### Step 1: Remove Old Services (1 day)

Once unified service is stable (1 week+ at 100%):

1. Delete files:
   ```bash
   rm /apps/api/src/services/aiContentGenerationService.ts
   rm /apps/api/src/services/enhancedAIContentService.ts
   rm /apps/api/src/services/enhanced295ContentService.ts
   ```

2. Delete old routes:
   ```bash
   rm /apps/api/src/routes/admin/aiGeneration.ts
   rm /apps/api/src/routes/admin/enhancedContentGeneration.ts
   # Keep enhanced295Routes.ts until no callers remain
   ```

3. Update imports throughout codebase

### Step 2: Database Cleanup (1 day)

After confirming no old code is running:

```sql
-- Merge aiContentVerification into sectionItems (if needed)
ALTER TABLE section_items ADD COLUMN accuracy_score INTEGER;
ALTER TABLE section_items ADD COLUMN completeness_score INTEGER;
ALTER TABLE section_items ADD COLUMN clarity_score INTEGER;

-- Copy data
UPDATE section_items si
SET accuracy_score = acv.accuracy_score,
    completeness_score = acv.completeness_score,
    clarity_score = acv.clarity_score
FROM ai_content_verification acv
WHERE si.term_id = acv.term_id;

-- Can keep aiContentVerification table for history, just don't write to it
-- ALTER TABLE ai_content_verification ADD CONSTRAINT archived CHECK (FALSE);
```

### Step 3: Update Documentation (1 day)

- [ ] Update API documentation with new endpoints
- [ ] Update deployment guides
- [ ] Update admin UI documentation
- [ ] Add migration notes to git history

---

## PHASE 5: OPTIMIZE (Week 5 - Optional)

### Performance Improvements:

1. **Batch Operations**:
   ```typescript
   // Current: Sequential generation of N items
   // Proposed: Parallel generation with rate limiting
   async generateBatch(items) {
     const batchSize = 5;
     for (let i = 0; i < items.length; i += batchSize) {
       await Promise.all(
         items.slice(i, i + batchSize).map(item => this.generate(item))
       );
       await delay(100);  // Rate limiting
     }
   }
   ```

2. **Caching Improvements**:
   ```typescript
   // Cache prompts by model + section
   const cacheKey = `${model}:${sectionName}`;
   const cachedPrompt = await cache.get(cacheKey);
   ```

3. **Cost Forecasting**:
   ```typescript
   // Predict total cost for batch operation
   async forecastBatchCost(items) {
     let estimatedCost = 0;
     for (const item of items) {
       const tokens = await this.estimateTokens(item);
       estimatedCost += this.calculateCost(item.model, tokens.input, tokens.output);
     }
     return estimatedCost;
   }
   ```

---

## ROLLBACK PLAN

If something goes wrong at any phase:

```bash
# Phase 1-2: Reset feature flag
export USE_UNIFIED_SERVICE=false
export LOG_BOTH_SYSTEMS=false
# Restart server

# Phase 3: Reduce traffic to unified service
export UNIFIED_SERVICE_ROLLOUT=0
# Requests will go to old service

# Phase 4: Restore old services from git
git checkout HEAD^ -- apps/api/src/services/aiContentGenerationService.ts
git checkout HEAD^ -- apps/api/src/services/enhancedAIContentService.ts
npm install
npm run build

# Phase 5: Restore database (if needed)
psql aiglossarypro < backup_YYYYMMDD.sql
```

---

## SUCCESS CRITERIA

After consolidation, you should have:

- ✅ One service handling all content generation
- ✅ Consistent cost calculations (verified with historical data)
- ✅ 10-50% code reduction (remove duplication)
- ✅ Same or faster response times
- ✅ Zero production downtime
- ✅ All tests passing
- ✅ Backward compatibility maintained for 2 weeks

---

## ESTIMATED EFFORT

| Phase | Duration | Effort | Risk |
|-------|----------|--------|------|
| Assessment | 2 days | 16 hrs | Very Low |
| Design | 3 days | 24 hrs | Low |
| Implementation | 5 days | 40 hrs | Medium |
| Migration | 4 days | 32 hrs | Medium |
| Cleanup | 3 days | 24 hrs | Low |
| Optimize | 5 days | 40 hrs | Low |
| **Total** | **22 days** | **176 hrs** | **Medium** |

**For 1 developer**: ~4-5 weeks (20 hours/week on this)  
**For 2 developers**: ~2-3 weeks  
**For 3+ developers**: ~2 weeks (parallel work on routes/jobs/tests)

---

## METRICS TO TRACK

During migration, monitor:

```
1. Error Rate
   - Before: X% of generations fail
   - Target: Same or lower
   
2. Cost per Generation
   - Before: $X.XX average
   - Target: Same (fixed inconsistencies)
   
3. Response Time
   - Before: X ms average
   - Target: Same or faster (within 5%)
   
4. Code Coverage
   - Before: X%
   - Target: Same or higher
   
5. Uptime
   - Target: 99.99% (zero downtime)
```

---

## Recommendation

**Start with Phase 0 (Assessment) IMMEDIATELY** - it's low risk and gives you data to decide:

1. Is consolidation worth it?
2. How long will it take?
3. What's the right phasing strategy?

**If assessment shows consolidation is worth it**, execute Phases 1-4 as described above.

**If assessment shows consolidation is risky**, at minimum:
- Fix cost calculation inconsistencies (1 day)
- Document which system is primary
- Add monitoring to track system usage

---

## Questions Before You Start

Before committing to this roadmap, confirm:

1. **Frontend Usage**: Does frontend code directly call both `/api/admin/ai` AND `/api/enhanced-295`?
   - If YES: Both systems are important, must maintain backward compatibility
   - If NO: Can be more aggressive about migration

2. **Admin Panel**: Are there separate UI sections for "Content Generation" vs "295-Column Generation"?
   - If YES: Users expect both to exist
   - If NO: Can consolidate UX too

3. **Batch Operations**: Is batch generation a critical feature?
   - If YES: aiBatchProcessingProcessor must keep working
   - If NO: Can simplify implementation

4. **Quality Evaluation**: Is automatic quality evaluation (295-column system) actively used?
   - If YES: Need to ensure this still works
   - If NO: Can simplify to simpler generation-only approach

**Answer these 4 questions before starting Phase 1!**

