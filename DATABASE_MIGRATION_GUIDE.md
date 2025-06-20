# Database Migration Guide

## Overview
This guide documents the enhanced database schema migration for the AI Glossary Pro application. The migration adds sophisticated data structures to support enhanced term management with 42-section content organization, interactive elements, and advanced user personalization.

## Migration Summary

### What Was Changed
1. **Updated Schema Configuration**: Modified `drizzle.config.ts` and `server/db.ts` to use `enhancedSchema.ts`
2. **Enhanced Database Structure**: Added 7 new tables for complex term management
3. **Preserved Existing Data**: All existing tables and data remain intact
4. **Updated Imports**: All server files now import from `@shared/enhancedSchema`

### New Tables Added

#### 1. `enhanced_terms`
**Purpose**: Advanced term storage with rich categorization and metadata
**Key Features**:
- Complex categorization (main categories, subcategories, application domains)
- Search optimization (search text, keywords)
- Interactive features flags
- Analytics tracking (view count, last viewed)
- Parse metadata for version control

#### 2. `term_sections`
**Purpose**: Stores structured content from the 42-section framework
**Key Features**:
- Section-based content organization
- Flexible display types (card, sidebar, main, modal, metadata)
- Priority-based ordering
- Interactive section support

#### 3. `interactive_elements`
**Purpose**: Manages interactive content components
**Key Features**:
- Multiple element types (mermaid, quiz, demo, code)
- Flexible element data storage via JSONB
- Display ordering and activation controls

#### 4. `term_relationships`
**Purpose**: Defines connections between terms
**Key Features**:
- Multiple relationship types (prerequisite, related, extends, alternative)
- Relationship strength scoring (1-10)
- Bidirectional relationship support

#### 5. `display_configs`
**Purpose**: Customizable layouts per term
**Key Features**:
- Multiple configuration types (card, detail, mobile)
- Flexible layout definitions via JSONB
- Default configuration support

#### 6. `enhanced_user_settings`
**Purpose**: Advanced user personalization
**Key Features**:
- Experience level adaptation
- Section visibility preferences
- Content type preferences (math, code, interactive)
- UI customization (compact mode, dark mode)

#### 7. `content_analytics`
**Purpose**: Content performance tracking
**Key Features**:
- Engagement metrics (views, time spent, interactions)
- Quality metrics (ratings, helpfulness votes)
- Section-level analytics

## Migration Process

### Files Modified
- `/drizzle.config.ts` - Updated schema path
- `/server/db.ts` - Updated import path
- `/server/storage.ts` - Updated import path
- `/server/importCleanData.ts` - Updated import path
- `/server/pythonProcessor.ts` - Updated import path
- `/server/quickSeed.ts` - Updated import path
- `/server/manualImport.ts` - Updated import path
- `/server/excelStreamer.ts` - Updated import path
- `/server/excelParser.ts` - Updated import path
- `/server/seed.ts` - Updated import path

### Migration Files Created
- `/migrations/0000_exotic_nick_fury.sql` - Full schema generation (reference only)
- `/migrations/0001_add_enhanced_tables.sql` - Safe incremental migration

## Running the Migration

### Step 1: Apply the Migration
```bash
# Run the custom migration (safer approach)
psql $DATABASE_URL -f migrations/0001_add_enhanced_tables.sql

# OR use Drizzle Kit (only if starting fresh)
npx drizzle-kit push:pg
```

### Step 2: Verify Migration
```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'enhanced_terms', 'term_sections', 'interactive_elements', 
  'term_relationships', 'display_configs', 'enhanced_user_settings', 
  'content_analytics'
);

-- Verify indexes were created
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'enhanced_terms', 'term_sections', 'interactive_elements', 
  'term_relationships', 'display_configs', 'content_analytics'
);
```

## Performance Optimizations

### Indexes Added
- **enhanced_terms**: name, slug, difficulty_level, main_categories, search_text
- **term_sections**: (term_id, section_name), display_type
- **interactive_elements**: term_id, element_type
- **term_relationships**: from_term_id, to_term_id, relationship_type
- **display_configs**: (term_id, config_type)
- **content_analytics**: term_id, section_name

### Query Optimization Features
- Full-text search support via `search_text` column
- Array-based categorization for efficient filtering
- JSONB storage for flexible content structure
- Foreign key constraints for data integrity

## Data Migration Strategy

### Existing Data Preservation
- All original tables remain unchanged
- No data loss or modification
- Backward compatibility maintained

### Future Data Population
The enhanced tables will be populated through:
1. **AI-powered content parsing** - Extract structured data from existing terms
2. **User interaction tracking** - Populate analytics tables
3. **Administrative configuration** - Set up display configs and relationships

## Schema Compatibility

### Original Schema Support
The enhanced schema maintains full compatibility with the original schema by:
- Re-exporting all original tables
- Preserving original table structures
- Maintaining existing relationships

### Type Safety
All TypeScript types are maintained and enhanced:
- Original types remain available
- New enhanced types added
- Validation schemas provided via Zod

## Rollback Plan

If rollback is needed:
1. **Revert configuration files**:
   ```bash
   # Revert drizzle.config.ts
   git checkout HEAD~1 -- drizzle.config.ts
   
   # Revert db.ts and other imports
   git checkout HEAD~1 -- server/db.ts
   # ... repeat for other files
   ```

2. **Drop enhanced tables** (if necessary):
   ```sql
   DROP TABLE IF EXISTS content_analytics CASCADE;
   DROP TABLE IF EXISTS enhanced_user_settings CASCADE;
   DROP TABLE IF EXISTS display_configs CASCADE;
   DROP TABLE IF EXISTS term_relationships CASCADE;
   DROP TABLE IF EXISTS interactive_elements CASCADE;
   DROP TABLE IF EXISTS term_sections CASCADE;
   DROP TABLE IF EXISTS enhanced_terms CASCADE;
   ```

## Next Steps

### Data Population
1. Implement enhanced term parser to populate `enhanced_terms`
2. Extract section data to populate `term_sections`
3. Configure basic relationships in `term_relationships`

### Feature Development
1. Update frontend to utilize enhanced schema
2. Implement analytics tracking
3. Build personalization features
4. Create admin interface for content management

### Monitoring
1. Monitor query performance with new indexes
2. Track database size growth
3. Optimize queries based on usage patterns

## Support

For issues with this migration:
1. Check the migration logs
2. Verify all foreign key constraints
3. Ensure all indexes were created successfully
4. Contact the development team if data inconsistencies occur