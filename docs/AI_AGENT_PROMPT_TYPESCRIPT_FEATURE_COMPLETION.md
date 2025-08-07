# AI Agent Prompt: TypeScript Error Resolution Through Feature Completion

## 🎯 Primary Directive

**NEVER suppress TypeScript errors by removing "unused" code without first investigating if it represents an incomplete feature that would enhance the application.**

## 🔍 Investigation Protocol

When encountering `TS6133` (unused variable) errors, follow this decision tree:

### Step 1: Context Classification
```
Is the unused variable in a:
├── API Route Handler? → Check for missing query/filter functionality
├── Analytics/Stats Function? → Check for incomplete metrics calculation  
├── Database Query? → Check for missing search/filtering features
└── Configuration/Setup? → Check for incomplete feature implementation
```

### Step 2: Feature Completion Assessment
For each unused variable, ask:
1. **Does the frontend expect this functionality?** (Search codebase for usage)
2. **Would implementing this improve user experience?** (Consider admin/user workflows)
3. **Is this part of a larger incomplete feature?** (Look for related unused variables)
4. **Does this represent missing business logic?** (Check for patterns like sorting, filtering, analytics)

### Step 3: Implementation Decision
```
IF (frontend_expects_it OR improves_ux OR part_of_feature OR missing_business_logic):
    IMPLEMENT the missing feature
ELSE:
    Mark as unused (rename with underscore prefix)
```

## 🛠️ Common Patterns & Solutions

### Pattern 1: Route Query Parameters
```typescript
// ❌ DON'T: Just suppress the error
const { sort: _sort, filter: _filter } = req.query;

// ✅ DO: Implement the missing functionality
const { sort, filter, page, limit } = req.query;

const conditions = [];
if (filter) conditions.push(ilike(table.name, `%${filter}%`));

const orderBy = sort === 'desc' ? desc(table.createdAt) : asc(table.createdAt);
const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
```

### Pattern 2: Analytics Calculations
```typescript
// ❌ DON'T: Remove calculated dates
const _lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// ✅ DO: Use them for real analytics
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const weeklyGrowth = await db.select({ count: sql`count(*)` })
  .from(terms).where(gte(terms.createdAt, lastWeek));
```

### Pattern 3: Database Query Functions
```typescript
// ❌ DON'T: Remove unused imports
// import { and, ilike } from 'drizzle-orm'; // Unused

// ✅ DO: Implement missing search functionality
app.get('/api/terms', async (req, res) => {
  const { search } = req.query;
  const conditions = search ? [ilike(terms.name, `%${search}%`)] : [];
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  // ... rest of implementation
});
```

## 🎯 High-Impact Investigation Areas

### Priority 1: Admin Features
- Newsletter management sorting/filtering
- Content management search
- User management pagination
- Revenue analytics and filtering
- Support ticket prioritization

### Priority 2: User Experience
- Search functionality
- Filtering and sorting
- Real-time analytics
- Progress tracking
- Status management

### Priority 3: Business Logic
- Metrics calculation
- Quality scoring
- Category management
- Workflow automation
- Reporting features

## 🚀 Implementation Workflow

### 1. Before Making Changes
```bash
# Get baseline error count
npx tsc --build --force 2>&1 | grep -c "error TS"

# Identify TS6133 errors
npx tsc --build --force 2>&1 | grep "TS6133" | head -10
```

### 2. For Each Unused Variable
```bash
# Search for frontend usage
grep -r "variableName" apps/web/src/ apps/*/src/

# Check API documentation or tests
grep -r "variableName" tests/ docs/ *.md
```

### 3. Implementation Steps
1. **Analyze the context** - What should this variable do?
2. **Check interfaces** - What does the frontend expect?
3. **Implement the feature** - Complete the missing functionality
4. **Test the implementation** - Verify it works as expected
5. **Document the enhancement** - Update relevant docs

### 4. Validation
```bash
# Verify error reduction
npx tsc --build --force 2>&1 | grep -c "error TS"

# Test new functionality (example)
curl "http://localhost:3000/api/admin/newsletter?sort=email&order=desc"
```

## 📊 Success Metrics

### Expected Results per Session:
- **20-40% TypeScript error reduction**
- **3-6 new features implemented**
- **Improved admin/user experience**
- **Better code maintainability**

### Quality Indicators:
- Frontend-backend parameter alignment
- Complete query functionality (search, sort, filter, paginate)
- Real analytics instead of mock data
- Comprehensive admin tools

## 🚨 Red Flags to Investigate

### High Priority
- `sort`, `filter`, `search`, `page` parameters unused in API routes
- Date calculations (`lastWeek`, `lastMonth`) not used for analytics
- Database query functions (`and`, `ilike`, `or`) imported but unused
- Status/priority fields extracted but ignored

### Medium Priority
- Configuration objects partially implemented
- Validation schemas with unused fields
- Constants imported but not referenced
- Helper functions defined but not called

## 💡 Key Success Principles

1. **Think like a user** - What would make their experience better?
2. **Complete the circle** - If frontend sends it, backend should use it
3. **Real data over mocks** - Calculate actual metrics, don't fake them
4. **Progressive enhancement** - Each fix should add value
5. **Document discoveries** - Track what features were completed

## 🎯 Agent Behavior Guidelines

### DO:
- ✅ Search codebase before marking anything as unused
- ✅ Consider user experience impact of implementing features
- ✅ Look for patterns of incomplete implementations
- ✅ Test new functionality after implementation
- ✅ Document completed features

### DON'T:
- ❌ Immediately suppress errors without investigation
- ❌ Remove code without understanding its purpose
- ❌ Ignore frontend expectations
- ❌ Miss opportunities to enhance user experience
- ❌ Leave features half-implemented

## 🔄 Iterative Process

```
1. Identify unused variables
2. Investigate context and purpose
3. Implement missing functionality
4. Test and validate
5. Measure error reduction
6. Document completed features
7. Repeat with remaining errors
```

## 📈 Expected Outcomes

By following this approach:
- **Technical**: Significant TypeScript error reduction with improved code quality
- **Business**: Enhanced admin tools and user experience features
- **Development**: Better understanding of system architecture and user needs

---

**Remember**: Every unused variable is a potential feature enhancement. Investigate, implement, and improve rather than suppress and ignore.