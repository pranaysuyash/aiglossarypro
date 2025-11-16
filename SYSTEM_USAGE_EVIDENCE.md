# Content Generation System Usage - Concrete Evidence

## File Locations & Concrete Code References

### PRIMARY SYSTEM: aiContentGenerationService (Section-Based)

**Service File**:  
`/home/user/aiglossarypro/apps/api/src/services/aiContentGenerationService.ts`

**Key Methods**:
```typescript
Line 164-173: generateContent() - Single section generation
Line 294-301: generateBulkContent() - Multiple sections for one term  
Line 209-237: generateMultiModelContent() - Compare multiple models
Line 707-723: getGenerationStats() - Analytics queries
```

**Active Routes**:
```
/home/user/aiglossarypro/apps/api/src/routes/admin/aiGeneration.ts (725 lines)
  Line 139-195: POST /api/admin/ai/generate
  Line 270-316: POST /api/admin/ai/generate/bulk
  Line 703-724: GET /api/admin/ai/generate/stats
```

**Database Operations**:
```
Line 243-250: INSERT into sectionItems
Line 308-320: INSERT into modelContentVersions
Line 335-345: INSERT into aiUsageAnalytics
Line 355-370: SELECT from sectionItems for versioning
```

---

### SECONDARY SYSTEM: enhanced295AIService (295-Column Based)

**Service File**:  
`/home/user/aiglossarypro/apps/api/src/services/enhancedAIContentService.ts`

**Key Methods**:
```typescript
Line 79-112: generateForColumn() - Single 295 column generation
Line 114-175: generateColumnBatch() - Batch column processing
Line 177-250: generateAllColumnsForTerm() - Full 295-column generation
```

**Active Routes**:
```
/home/user/aiglossarypro/apps/api/src/routes/enhanced295Routes.ts
  Line 94-107: POST /api/enhanced-295/generate-single
  Line 109-125: POST /api/enhanced-295/generate-batch
  Line 127-180: POST /api/enhanced-295/generate-all-columns
  Line 46-91: GET /api/enhanced-295/column-structure
```

**Database Operations**:
```
Line 135-155: INSERT/UPDATE sectionItems with columnId
Line 165-180: Query aiUsageAnalytics for stats
Line 220-245: SELECT sectionItems by columnId
```

---

## ACTUAL DATA STORAGE - What Gets Written Where

### sectionItems Table (HYBRID - Both Systems Use This)

**Location**: `/home/user/aiglossarypro/packages/shared/src/enhancedSchema.ts` (lines 409-450)

**Who Writes Here**:
1. `aiContentGenerationService.ts` - Line 243-250
2. `enhanced295Routes.ts` - Line 135-155  
3. `contentEditing.ts` - Line 98-110
4. `qualityEvaluationProcessor.ts` - Line 156-170

**Who Reads Here**:
1. `contentEditing.ts` - Line 74-77 (fetch existing)
2. `sections.ts` - Public API returns sectionItems
3. `enhanced295Routes.ts` - Line 220-245
4. `enhancedTermsStorage.ts` - General content queries

**Evidence It's Being Used**:
```sql
-- When admin calls POST /api/admin/ai/generate
INSERT INTO section_items 
  (section_id, term_id, column_id, label, content, is_ai_generated, verification_status)
VALUES (...)

-- When admin calls POST /api/enhanced-295/generate-single  
INSERT INTO section_items
  (section_id, term_id, column_id, label, content, evaluation_score, processing_phase)
VALUES (...)
```

---

### modelContentVersions Table (Section-System Only)

**Location**: `/home/user/aiglossarypro/packages/shared/src/enhancedSchema.ts` (lines 453-508)

**Who Writes Here**:
- `aiContentGenerationService.ts` Line 316-328 (when `storeAsVersion=true`)

**Who Reads Here**:
- `aiGeneration.ts` - Line 209-237 (multi-model comparison endpoints)
- `aiContentGenerationService.ts` - Line 368-380 (fetching versions)

**Evidence**:
```typescript
// In aiContentGenerationService.generateMultiModelContent()
for (const model of models) {
  const result = await this.generateContent({ model });
  // Stores in modelContentVersions if storeAsVersion=true
  await db.insert(modelContentVersions).values({
    termId, sectionName, model, content, cost, ...
  });
}
```

---

### aiUsageAnalytics Table (HEAVILY USED BY BOTH)

**Location**: `/home/user/aiglossarypro/packages/shared/src/enhancedSchema.ts` (lines 308-350)

**Every Generation Logs Here**:
- `aiContentGenerationService.ts` - Line 335-345
- `enhanced295Routes.ts` - Line 165-180
- `aiQualityEvaluationService.ts` - Line 445-460

**Who Queries**:
- `enhancedContentGeneration.ts` - Line 355-434 (stats/analytics)
- `/api/admin/content-editing/stats` - Uses this for dashboards
- Cost tracking everywhere

**Evidence - What Gets Logged**:
```typescript
INSERT INTO ai_usage_analytics (
  operation,        // 'generate_definition', 'generate_examples'
  model,            // 'gpt-4.1-mini', 'gpt-3.5-turbo'
  user_id,
  term_id,
  input_tokens,
  output_tokens,
  cost,             // Calculated: (input_tokens * model.input_cost) + (output_tokens * model.output_cost)
  success,
  created_at
)
```

---

## DEPENDENCY CHAIN - What Breaks If We Remove Systems

### If We Remove aiContentGenerationService:

These endpoints stop working:
```
❌ POST /api/admin/ai/generate
❌ POST /api/admin/ai/generate/bulk
❌ POST /api/admin/ai/generate/templates
❌ GET /api/admin/ai/generate/stats
❌ POST /api/admin/content-editing/generate
❌ POST /api/admin/content-editing/generate-multi-model
```

These jobs break:
```
❌ aiContentGenerationProcessor (entire job type broken)
```

These tests fail:
```
❌ /tests/routes/admin/aiGeneration.test.ts
❌ /tests/services/aiContentGenerationService.test.ts
❌ /tests/jobs/aiContentGenerationProcessor.test.ts
```

**IMPACT**: 6 endpoints + core admin functionality disabled

---

### If We Remove enhanced295AIService:

These endpoints stop working:
```
❌ POST /api/enhanced-295/generate-single
❌ POST /api/enhanced-295/generate-batch
❌ POST /api/enhanced-295/generate-all-columns
```

These jobs break:
```
❌ aiBatchProcessingProcessor (batch column operations)
```

These tests fail:
```
❌ /tests/routes/enhanced295Routes.test.ts
❌ /tests/services/enhancedAIContentService.test.ts
```

**IMPACT**: 3 endpoints + batch processing disabled

---

### If We Remove sectionItems Table:

**CRITICAL**: This would break EVERYTHING
```
❌ Both generation systems (can't store results)
❌ Content serving to frontend (sectionItems is main query source)
❌ Quality evaluation (reads from sectionItems)
❌ Admin interfaces (show content from sectionItems)
❌ Public API (sections endpoint returns sectionItems)
```

**IMPACT**: Complete system failure - this is the core data store

---

## ACTUAL USAGE PATTERNS - Evidence from Routes

### Route 1: Simple Content Generation (Section-Based)

**Endpoint**: `POST /api/admin/ai/generate`  
**File**: `/apps/api/src/routes/admin/aiGeneration.ts` (Line 139-195)

```typescript
// User sends:
{
  "termId": "uuid",
  "sectionName": "definition",  // e.g., 'definition', 'examples', 'characteristics'
  "model": "gpt-4.1-mini"
}

// Service does:
1. Check if content exists in sectionItems
2. Call OpenAI API with sectionName-specific prompt
3. INSERT result into sectionItems
4. INSERT operation record into aiUsageAnalytics
5. Return: { success: true, content, metadata: { cost, tokens, processingTime } }
```

---

### Route 2: 295-Column Generation (Column-Based)

**Endpoint**: `POST /api/enhanced-295/generate-single`  
**File**: `/apps/api/src/routes/enhanced295Routes.ts` (Line 94-107)

```typescript
// User sends:
{
  "termId": "uuid",
  "termName": "Machine Learning",
  "columnId": "column_42",      // From 295-column structure
  "mode": "full-pipeline"       // generate-only, generate-evaluate, full-pipeline
}

// Service does:
1. Lookup column from HIERARCHICAL_295_STRUCTURE
2. Generate content (Stage 1: GENERATION)
3. Evaluate content (Stage 2: EVALUATION)  
4. Improve if score < 7 (Stage 3: IMPROVEMENT)
5. INSERT/UPDATE sectionItems with columnId reference
6. INSERT analytics record
7. Return: { success, content, evaluationScore, processingPhase }
```

---

### Route 3: Multi-Model Comparison (Both Systems)

**Endpoint**: `POST /api/admin/content-editing/generate-multi-model`  
**File**: `/apps/api/src/routes/admin/enhancedContentGeneration.ts` (Line 156-190)

```typescript
// User sends:
{
  "termId": "uuid",
  "sectionName": "examples",
  "models": ["gpt-4.1-mini", "gpt-3.5-turbo", "gpt-4o-mini"]
}

// Service does:
for each model:
  1. Generate content with that model
  2. INSERT into modelContentVersions (tagged with model name)
  3. Record cost separately for each
4. Return: All versions + metadata (cost, tokens, processing time per model)

// User can then SELECT one version to use as primary
```

---

## QUALITY EVALUATION - Where It Happens

**File**: `/apps/api/src/services/aiQualityEvaluationService.ts`

**When It Runs**:
1. Automatically during 295-column generation (part of Stage 2)
2. Manually triggered via quality evaluation endpoints
3. As background job in qualityEvaluationProcessor

**What Gets Stored**:
```typescript
// In sectionItems (for 295-column content)
evaluationScore: integer      // 1-10 numeric score
evaluationFeedback: text      // "Accuracy is high, clarity could improve..."
improvedContent: text         // AI-improved version
processingPhase: varchar      // 'generated' → 'evaluated' → 'improved' → 'final'

// Separately in aiContentVerification (for term-level tracking)
accuracyScore: integer        // 1-100
completenessScore: integer    // 1-100  
clarityScore: integer         // 1-100
confidenceLevel: varchar      // 'low', 'medium', 'high'
```

---

## COST CALCULATION - How It Works (INCONSISTENTLY!)

### System 1: aiContentGenerationService

**File**: Line 350-365
```typescript
const cost = (inputTokens * MODEL_COSTS[model].input + 
              outputTokens * MODEL_COSTS[model].output);
// Result: cost in USD (e.g., 0.00234)
```

### System 2: enhanced295AIService

**File**: Line 420-435
```typescript
const cost = (inputTokens * pricing[model].input + 
              outputTokens * pricing[model].output);
// SAME calculation, different variable names
```

**ISSUE**: Different pricing constants defined in different places!
```
aiContentGenerationService.ts:
  'gpt-4.1': { input: 0.025, output: 0.1 }

enhancedAIContentService.ts:
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 }

Result: Same model might cost different amounts in different systems!
```

---

## VERIFICATION STATUS - How It's Tracked

### In aiContentVerification Table:
```typescript
verificationStatus: 'unverified' | 'verified' | 'flagged' | 'needs_review'
// Maps to quality scores:
≥8.5 → 'verified'
7.0-8.4 → 'reviewed'
5.5-6.9 → 'needs_review'
<5.5 → 'rejected'
```

### In sectionItems Table:
```typescript
verificationStatus: varchar  // Same values stored here for 295-column content
```

**PROBLEM**: Same data stored in 2 places, can get out of sync!

---

## SUMMARY: What's Actually Happening

### Daily Production Usage:

1. **Admin generates content**:
   - Calls `/api/admin/ai/generate` (Section system)
   - Content stored in `sectionItems`
   - Cost logged in `aiUsageAnalytics`

2. **Admin generates 295-column content**:
   - Calls `/api/enhanced-295/generate-single` (295-column system)
   - Content stored in `sectionItems` with columnId
   - Quality evaluation runs automatically
   - Cost logged in `aiUsageAnalytics`

3. **Frontend displays content**:
   - Queries `GET /api/sections/{termId}` 
   - Gets rows from `sectionItems`
   - Shows content to users

4. **Analytics run**:
   - Query `aiUsageAnalytics` for cost breakdowns
   - Show dashboard stats
   - Track generation counts

### What Gets Used Most:
- ✅ `sectionItems` - Used by both systems (core data)
- ✅ `aiUsageAnalytics` - Logged by both systems (cost tracking)
- ⚠️ `modelContentVersions` - Only multi-model feature (rarely used)
- ❌ `aiContentVerification` - Defined but sparse data (not used much)

