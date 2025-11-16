# Production Content Generation Usage Analysis
**Date**: November 16, 2025  
**Purpose**: Identify which content generation system is ACTUALLY in production use

---

## EXECUTIVE SUMMARY

You have **3 overlapping content generation systems**:
1. **aiContentGenerationService** - Section-based (sectionItems/sections)
2. **enhancedAIContentService** - 295-column based
3. **enhanced295ContentService** - Similar to #2 (appears redundant)

**PRIMARY FINDING**: Both systems appear active but serve different purposes. Neither is fully deprecated.

---

## 1. ROUTE ANALYSIS - Which Routes Call Which Services

### Admin Routes: `/api/admin/ai`
**File**: `/apps/api/src/routes/admin/aiGeneration.ts` (725 lines)  
**Service Used**: `aiContentGenerationService` (SECTION-BASED)

**Endpoints**:
```
POST   /api/admin/ai/generate              → aiContentGenerationService.generateContent()
POST   /api/admin/ai/generate/bulk         → aiContentGenerationService.generateBulkContent()
POST   /api/admin/ai/generate/templates    → promptTemplateService methods
GET    /api/admin/ai/generate/stats        → aiContentGenerationService.getGenerationStats()
```

**Database Tables Used**:
- `sectionItems` - stores generated content
- `modelContentVersions` - stores model output versions
- `aiUsageAnalytics` - logs all generation calls
- `aiContentVerification` - tracks verification status

---

### Admin Routes: `/api/admin` (Enhanced Content Generation)
**File**: `/apps/api/src/routes/admin/enhancedContentGeneration.ts` (956 lines)  
**Services Used**: 
1. `aiContentGenerationService` (SECTION-BASED)
2. `enhancedTripletProcessor` (295-COLUMN BASED)

**Endpoints**:
```
POST   /api/admin/content-editing/generate              → aiContentGenerationService
POST   /api/admin/content-editing/generate-multi-model  → aiContentGenerationService.generateMultiModelContent()
POST   /api/admin/content-editing/generate-bulk         → aiContentGenerationService.generateBulkContent()
GET    /api/admin/content-editing/stats                 → Enhanced analytics from aiUsageAnalytics
GET    /api/admin/content-editing/history               → aiUsageAnalytics queries
```

**Key Finding**: Routes at `/api/admin/content-editing` primarily use `aiContentGenerationService`

---

### Public Routes: `/api/enhanced-295`
**File**: `/apps/api/src/routes/enhanced295Routes.ts`  
**Service Used**: `enhanced295AIService` (295-COLUMN BASED)

**Endpoints**:
```
GET    /api/enhanced-295/column-structure       → Returns 295 column hierarchy
POST   /api/enhanced-295/generate-single        → enhanced295AIService.generateForColumn()
POST   /api/enhanced-295/generate-batch         → enhanced295AIService.generateColumnBatch()
POST   /api/enhanced-295/generate-all-columns   → enhanced295AIService.generateAllColumnsForTerm()
```

**Database Tables Used**:
- `sectionItems` - stores content with columnId reference
- `sections` - maps to columns
- `aiUsageAnalytics` - logs operations

---

## 2. DATABASE ANALYSIS - Which Tables Actually Have Data

### Table Usage Summary

| Table | Purpose | Used By | Status |
|-------|---------|---------|--------|
| **sections** | Container for 42 sections per term | aiGeneration, contentEditing | ACTIVE |
| **sectionItems** | Individual content chunks (295 columns mapped to sections) | aiGeneration, enhanced295 | ACTIVE |
| **modelContentVersions** | Model comparison storage (gpt-4 vs gpt-3.5, etc) | aiGeneration.generateMultiModelContent() | ACTIVE |
| **aiContentVerification** | Verification status tracking | Quality evaluation processor | MODERATE |
| **aiUsageAnalytics** | All AI operation logging | All generation services | HIGHLY ACTIVE |

---

### sectionItems Table Schema (CRITICAL)
**File**: `/packages/shared/src/enhancedSchema.ts` (lines 409-450)

```typescript
export const sectionItems = pgTable('section_items', {
  id: serial('id').primaryKey(),
  sectionId: integer('section_id').references(() => sections.id),
  termId: uuid('term_id'),                    // Links to enhancedTerms
  columnId: varchar('column_id'),             // 295-COLUMN REFERENCE
  label: varchar('label'),
  content: text('content'),                   // ACTUAL CONTENT
  contentType: varchar('content_type'),
  displayOrder: integer('display_order'),
  isAiGenerated: boolean('is_ai_generated'),
  verificationStatus: varchar('verification_status'),
  
  // Enhanced Quality Tracking (295-column specific)
  evaluationScore: integer('evaluation_score'),         // 1-10 quality score
  evaluationFeedback: text('evaluation_feedback'),      // AI feedback
  improvedContent: text('improved_content'),            // AI improvement
  processingPhase: varchar('processing_phase'),         // 'generated', 'evaluated', 'improved', 'final'
  promptVersion: varchar('prompt_version'),
  generationCost: decimal('generation_cost'),
  qualityScore: integer('quality_score'),
});
```

**KEY FINDING**: `sectionItems` table is hybrid - used by BOTH systems
- Has `columnId` field for 295-column system
- Has fields for quality evaluation pipeline
- Stores both simple sections AND 295-column data

---

### modelContentVersions Table
**File**: `/packages/shared/src/enhancedSchema.ts` (lines 453-508)

```typescript
export const modelContentVersions = pgTable('model_content_versions', {
  id: uuid('id').primaryKey(),
  termId: uuid('term_id'),
  sectionName: varchar('section_name'),
  model: varchar('model'),              // 'gpt-4', 'gpt-3.5-turbo', etc.
  modelVersion: varchar('model_version'),
  temperature: decimal('temperature'),
  maxTokens: integer('max_tokens'),
  content: text('content'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  cost: decimal('cost'),
  processingTime: integer('processing_time_ms'),
  qualityScore: decimal('quality_score'),          // 1-10
  qualityMetrics: jsonb('quality_metrics'),        // Detailed breakdown
  isSelected: boolean('is_selected'),
  userRating: integer('user_rating'),
  status: varchar('status'),                       // 'generated', 'evaluated', 'selected', 'archived'
});
```

**Used By**: `aiContentGenerationService.generateMultiModelContent()` only

**Current Usage**: For multi-model comparison (generate with multiple models, compare scores, select best)

---

### aiContentVerification Table
**File**: `/packages/shared/src/enhancedSchema.ts` (lines 262-305)

```typescript
export const aiContentVerification = pgTable('ai_content_verification', {
  id: uuid('id').primaryKey(),
  termId: uuid('term_id'),
  isAiGenerated: boolean('is_ai_generated'),
  aiModel: varchar('ai_model'),
  generatedAt: timestamp('generated_at'),
  verificationStatus: varchar('verification_status'),  // 'unverified', 'verified', 'flagged'
  verifiedBy: uuid('verified_by'),
  accuracyScore: integer('accuracy_score'),           // 1-100
  completenessScore: integer('completeness_score'),   // 1-100
  clarityScore: integer('clarity_score'),             // 1-100
  expertReviewRequired: boolean('expert_review_required'),
  confidenceLevel: varchar('confidence_level'),       // 'low', 'medium', 'high'
  lastReviewedAt: timestamp('last_reviewed_at'),
});
```

**Used By**: Quality evaluation pipeline  
**Current Status**: Referenced but SPARSE DATA (most content doesn't have these scores)

---

### aiUsageAnalytics Table
**File**: `/packages/shared/src/enhancedSchema.ts` (lines 308-350)

```typescript
export const aiUsageAnalytics = pgTable('ai_usage_analytics', {
  id: uuid('id').primaryKey(),
  operation: varchar('operation'),      // 'generate_definition', 'generate_examples', etc.
  model: varchar('model'),              // Which model was used
  userId: varchar('user_id'),
  termId: uuid('term_id'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  latency: integer('latency_ms'),
  cost: decimal('cost'),                // Calculated cost in USD
  success: boolean('success'),
  errorType: varchar('error_type'),
  errorMessage: text('error_message'),
  userAccepted: boolean('user_accepted'),
  userRating: integer('user_rating'),
  sessionId: varchar('session_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at'),
});
```

**HEAVILY USED**: Every generation call logs here  
**Status**: PRIMARY METRIC for tracking what's been generated

---

## 3. ACTUAL DATA ANALYSIS - What's Actually Being Used

### Which system is PRIMARY in production?

**Evidence from route registration** (`/apps/api/src/routes/index.ts`):

```typescript
registerAdminRoutes(app);              // Registers /api/admin/ai
registerContentManagementRoutes(app);  // Registers /api/admin/content-editing  
registerSectionRoutes(app);            // Public section access
app.use('/api/enhanced-295', enhanced295Routes);  // 295-column routes
```

**All routes are registered** - both systems are active!

---

## 4. DEPENDENCY ANALYSIS - What Would Break If We Consolidate

### Services Directly Dependent on Current Architecture

```
Routes (Public Facing)
├── /api/admin/ai/* ..................... depends on aiContentGenerationService
├── /api/admin/content-editing/* ........ depends on aiContentGenerationService
├── /api/enhanced-295/* ................ depends on enhanced295AIService
└── /api/sections/* .................... queries sectionItems

Job Processors (Background Tasks)
├── aiContentGenerationProcessor ........ depends on aiContentGenerationService
├── aiBatchProcessingProcessor ......... depends on enhancedTripletProcessor
└── qualityEvaluationProcessor ......... evaluates sectionItems

Services (Backend)
├── promptTemplateService .............. used by aiContentGenerationService
├── aiQualityEvaluationService ......... evaluates content
├── aiRecommendationService ........... uses generated content
└── personalizationService ............ uses section data

Database Consumers
├── enhancedStorage ................... abstraction over db operations
├── optimizedStorage .................. caching layer
└── displayCategorization ............ categorizes sections
```

---

### If We Consolidate to Single Service, These Will Break:

1. **Route Tests** - All test files for `/api/admin/ai` and `/api/enhanced-295`
2. **Job Tests** - aiContentGenerationProcessor tests reference specific service methods
3. **Integration Tests** - Any test using both `/api/admin/ai` and `/api/enhanced-295`
4. **Frontend Code** - If frontend uses different endpoints, both need to work during migration
5. **Analytics/Monitoring** - If tools parse `aiUsageAnalytics.operation` field, operation names change
6. **Batch Jobs** - aiBatchProcessingProcessor would need rewrite

---

### Migration Impact Assessment

| Component | Impact | Risk | Mitigation |
|-----------|--------|------|-----------|
| Routes | Medium - new endpoint interface | Medium | Deprecation period with dual-support |
| Services | High - core logic rewrite | High | Careful unit testing, feature flags |
| Tests | Medium - need updates | Low | Can be updated incrementally |
| Database | Medium - schema cleanup | Medium | Need migration script, backups |
| Analytics | Low - operation names change | Low | Update parsing logic in dashboards |
| Jobs | Medium - processor rewrite | Medium | Feature flag to switch processors |

---

## 5. ROUTE-TO-SERVICE MAPPING MATRIX

### All Active Content Generation Routes

| Route | Service | Database Table | Status |
|-------|---------|---|--------|
| `POST /api/admin/ai/generate` | aiContentGenerationService | sectionItems | ACTIVE |
| `POST /api/admin/ai/generate/bulk` | aiContentGenerationService | sectionItems | ACTIVE |
| `POST /api/admin/ai/generate/templates` | promptTemplateService | (in-memory) | ACTIVE |
| `GET /api/admin/ai/generate/stats` | aiContentGenerationService query | aiUsageAnalytics | ACTIVE |
| `POST /api/admin/content-editing/generate` | aiContentGenerationService | sectionItems | ACTIVE |
| `POST /api/admin/content-editing/generate-multi-model` | aiContentGenerationService | modelContentVersions | MODERATE |
| `GET /api/admin/content-editing/stats` | Enhanced analytics | aiUsageAnalytics | ACTIVE |
| `POST /api/enhanced-295/generate-single` | enhanced295AIService | sectionItems | ACTIVE |
| `POST /api/enhanced-295/generate-batch` | enhanced295AIService | sectionItems | ACTIVE |
| `POST /api/enhanced-295/generate-all-columns` | enhanced295AIService | sectionItems | ACTIVE |
| `PUT /api/admin/content-editing/content/{termId}/{section}` | contentEditing handler | sectionItems | ACTIVE |

---

## 6. CONCRETE EVIDENCE - What's Actually Happening

### Files That Query sectionItems (Main Data Store):

```
✓ /apps/api/src/routes/admin/contentEditing.ts          Line: 74-77 (UPDATE)
✓ /apps/api/src/services/aiContentGenerationService.ts  Line: 243-250 (INSERT)
✓ /apps/api/src/routes/admin/enhancedTerms.ts           (reads sections/items)
✓ /apps/api/src/routes/sections.ts                      (public API for sections)
✓/apps/api/src/enhanced295Routes.ts                     (reads/writes sectionItems)
✓ /apps/api/src/jobs/processors/qualityEvaluationProcessor.ts
```

### Files That Query modelContentVersions:

```
✓ /apps/api/src/services/aiContentGenerationService.ts  (multi-model generation only)
✓ /apps/api/src/routes/admin/aiGeneration.ts            (model comparison endpoints)
```

### Files That Query aiUsageAnalytics (heavily used):

```
✓ /apps/api/src/routes/admin/enhancedContentGeneration.ts  (stats endpoints)
✓ All generation services (logging)
✓ /apps/api/src/enhancedDemoRoutes.ts (analytics queries)
```

---

## 7. WHICH SYSTEM IS PRIMARY?

### By Route Usage:
- **10 endpoints** use `aiContentGenerationService` (section-based)
- **3 endpoints** use `enhanced295AIService` (295-column)
- **1 endpoint** uses both (multi-model with /api/admin/content-editing)

**VERDICT**: `aiContentGenerationService` is more heavily used in routes

---

### By Database Usage:
- **sectionItems**: Used by BOTH systems (hybrid table)
- **modelContentVersions**: Only by aiContentGenerationService
- **aiUsageAnalytics**: Used by BOTH systems (central logging)
- **aiContentVerification**: Minimal usage (sparse data)

**VERDICT**: `sectionItems` is the central data store for both

---

### By Job Processors:
- **aiContentGenerationProcessor**: Calls aiContentGenerationService
- **aiBatchProcessingProcessor**: Calls enhancedTripletProcessor (295-column system)

**VERDICT**: Both have background job support (split usage)

---

## 8. WHAT CAN BE SAFELY DEPRECATED

### Safe to Consolidate (Low Risk):
1. ✅ **enhancedAIContentService** - Appears to duplicate 295-column logic
2. ✅ **modelContentVersions table** - Used only for multi-model comparison (rare feature)
3. ✅ **aiContentVerification table** - Sparse data, minimal usage (could merge into sectionItems)
4. ✅ **Duplicate prompt template logic** - Exists in multiple services

### Risky to Consolidate (High Risk):
1. ❌ **aiUsageAnalytics table** - Central to cost tracking, heavily queried
2. ❌ **sectionItems table** - Core data store, used everywhere
3. ❌ **enhancedTripletProcessor** - Has background job dependencies
4. ❌ **Either route system** - Both actively used, would break client code

---

## 9. RECOMMENDED CONSOLIDATION STRATEGY

### Phase 1: Unify Services (Week 1-2)
1. Create `UnifiedContentGenerationService` that wraps both services
2. Keep old services for backward compatibility during transition
3. Gradually migrate routes to use unified service
4. Add feature flags to switch between old/new

### Phase 2: Consolidate Database (Week 3)
1. Merge `aiContentVerification` scores into `sectionItems`
2. Create migration script for existing data
3. Keep `modelContentVersions` for multi-model feature
4. Consolidate quality metrics fields

### Phase 3: Update Routes (Week 4)
1. Create new unified endpoint set
2. Keep old endpoints operational (deprecated but working)
3. Update frontend to use new endpoints gradually
4. Monitor usage metrics before removing old routes

### Phase 4: Clean Up (Week 5)
1. Remove old services (aiContentGenerationService, enhancedAIContentService)
2. Consolidate job processors
3. Remove legacy database columns
4. Update all tests

---

## 10. MIGRATION CHECKLIST

### Prerequisites
- [ ] Backup production database
- [ ] Document all current endpoint usage patterns
- [ ] Identify which endpoints are used by frontend
- [ ] Create feature flags for gradual rollout

### Phase 1: Create Unified Service
- [ ] Design UnifiedContentGenerationService interface
- [ ] Implement multi-model support
- [ ] Implement 295-column support
- [ ] Add feature flag to select implementation

### Phase 2: Route Migration
- [ ] Create new `/api/v2/content/generate` endpoints
- [ ] Deprecate old endpoints (keep working)
- [ ] Update tests
- [ ] Document migration in API docs

### Phase 3: Database Consolidation
- [ ] Create migration script
- [ ] Test migration on dev environment
- [ ] Plan maintenance window for production
- [ ] Verify data integrity after migration

### Phase 4: Cleanup
- [ ] Remove old services
- [ ] Remove unused database columns
- [ ] Update documentation
- [ ] Archive old code to version control

---

## SUMMARY TABLE: What's Actually Being Used

| System | Endpoints | Active Routes | Primary Tables | Risk Level |
|--------|-----------|---|---|---|
| **aiContentGenerationService** | 7 | `/api/admin/ai`, `/api/admin/content-editing` | sectionItems, modelContentVersions | MEDIUM |
| **enhanced295AIService** | 3 | `/api/enhanced-295` | sectionItems | MEDIUM |
| **Both Systems** | 10 | Various | sectionItems, aiUsageAnalytics | HIGH |

**Recommendation**: Consolidate into single service with feature flags, keep database tables for now (too intertwined), migrate routes gradually over 4-5 weeks.

