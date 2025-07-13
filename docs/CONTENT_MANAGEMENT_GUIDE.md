# Content Management System - Production Guide

## Overview

The AIGlossaryPro Content Management System (CMS) is a comprehensive solution for managing, generating, and optimizing AI/ML glossary content. This guide provides everything you need to populate and maintain content at scale.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Content Import](#content-import)
3. [Content Generation](#content-generation)
4. [Content Templates](#content-templates)
5. [Quality Management](#quality-management)
6. [Performance Optimization](#performance-optimization)
7. [Analytics & Monitoring](#analytics--monitoring)
8. [Troubleshooting](#troubleshooting)

## System Architecture

### Core Components

1. **Enhanced Terms System**
   - Primary content storage in `enhanced_terms` table
   - 42-section architecture for comprehensive content
   - Support for 10,000+ terms with optimized queries

2. **Content Generation Service**
   - AI-powered content generation using OpenAI
   - Multi-model support (GPT-4, GPT-4-mini, etc.)
   - Cost optimization with intelligent caching

3. **Admin Dashboards**
   - Content Management Dashboard
   - Content Import Dashboard
   - AI Content Monitor
   - Quality Evaluation Dashboard

### Database Schema

```sql
-- Core content tables
enhanced_terms (id, name, definition, short_definition, ...)
sections (id, term_id, name, display_order, is_completed)
section_items (id, section_id, label, content, content_type, ...)
ai_content_verification (id, term_id, verification_status, ...)
content_quality_scores (id, term_id, section_name, score, ...)
```

## Content Import

### Bulk Import via UI

1. Navigate to Admin Dashboard → Content Import
2. Supported formats: Excel (.xlsx, .xls), CSV
3. Required columns:
   - `name` (required): Term name
   - `definition` (optional): Full definition
   - `short_definition` (optional): Brief definition
   - `category` (optional): Category name

### Bulk Import via API

```bash
# Upload Excel/CSV file
curl -X POST https://aiglossarypro.com/api/admin/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@terms.xlsx" \
  -F "aiOptions={\"enableAI\":true,\"mode\":\"selective\"}"
```

### Command-Line Import

```bash
# Run bulk import script
npm run import:terms -- --file data/terms.xlsx --ai-generate --batch-size 100

# Import from JSON
npm run import:json -- --file data/terms.json --validate
```

### Import Best Practices

1. **Batch Processing**: Process in batches of 100-500 terms
2. **Validation**: Always validate data before import
3. **Duplicate Handling**: System automatically detects and handles duplicates
4. **Progress Monitoring**: Use job tracking for large imports

## Content Generation

### AI-Powered Generation

The system uses OpenAI's models to generate high-quality content:

1. **Single Term Generation**
   ```typescript
   // Via Admin UI
   // 1. Select term in Content Management Dashboard
   // 2. Choose section to generate
   // 3. Click "Generate Content"
   
   // Via API
   POST /api/admin/enhanced-content-generation/generate
   {
     "termId": "term-123",
     "sectionName": "definition_overview",
     "model": "gpt-4o-mini",
     "regenerate": true
   }
   ```

2. **Bulk Generation**
   ```typescript
   POST /api/admin/enhanced-content-generation/bulk
   {
     "termId": "term-123",
     "sectionNames": ["definition_overview", "key_characteristics", "applications"],
     "model": "gpt-4o-mini"
   }
   ```

3. **Multi-Model Comparison**
   ```typescript
   POST /api/admin/enhanced-content-generation/multi-model
   {
     "termId": "term-123",
     "sectionName": "definition_overview",
     "models": ["gpt-4o-mini", "gpt-4.1-mini", "o1-mini"]
   }
   ```

### Generation Cost Optimization

- **Caching**: Existing content is cached and reused
- **Model Selection**: Use `gpt-4o-mini` for cost-effective generation
- **Batch Processing**: Generate multiple sections in one request
- **Smart Regeneration**: Only regenerate when content quality is below threshold

### Content Sections (42-Section Architecture)

Priority 1 (Essential):
- `definition_overview`
- `key_characteristics`
- `real_world_applications`

Priority 2 (Important):
- `related_concepts`
- `tools_technologies`
- `implementation_details`

Priority 3 (Enhanced):
- `advantages_benefits`
- `challenges_limitations`
- `best_practices`

Priority 4 (Advanced):
- `future_directions`
- `research_papers`
- `code_examples`

## Content Templates

### Using Templates

1. **List Available Templates**
   ```bash
   GET /api/admin/ai-generation/templates
   ```

2. **Create Custom Template**
   ```typescript
   POST /api/admin/template-management/templates
   {
     "name": "technical_implementation",
     "category": "technical",
     "template": "## Technical Implementation\n\n{content}",
     "variables": ["requirements", "steps", "code_example"]
   }
   ```

### Template Categories

- **Core**: Definition, overview, characteristics
- **Practical**: Applications, use cases, examples
- **Technical**: Implementation, code, architecture
- **Academic**: Theory, research, mathematics

## Quality Management

### Content Validation

1. **Automatic Validation**
   - Minimum length requirements
   - No placeholder text (TODO, TBD)
   - Proper markdown structure
   - Technical accuracy checks

2. **Manual Review Process**
   ```bash
   # Run validation script
   npm run validate:content -- --type all --threshold 70 --fix
   ```

3. **Quality Scoring**
   - Definition quality (0-100)
   - Completeness score
   - Consistency score
   - Technical accuracy

### Content Verification Workflow

1. **Unverified** → AI-generated content pending review
2. **Under Review** → Being reviewed by admin/expert
3. **Verified** → Reviewed and approved
4. **Expert Reviewed** → Validated by domain expert
5. **Flagged** → Requires immediate attention

### Quality Improvement

```bash
# Improve low-quality content
npm run improve:content -- --min-score 60 --regenerate

# Check content health
npm run health:content -- --report
```

## Performance Optimization

### Database Optimization

1. **Indexes Created**
   - `idx_enhanced_terms_name_lower` - Fast term lookup
   - `idx_sections_term_id_name` - Section queries
   - `idx_section_items_section_id_label` - Content retrieval

2. **Query Optimization**
   - Batch queries limited to 100-500 records
   - Pagination for large result sets
   - Caching for frequently accessed content

### Import Performance

1. **Async Processing**
   - Large imports processed in background
   - Real-time progress tracking
   - Automatic retry on failures

2. **Batch Configuration**
   ```javascript
   const BATCH_CONFIG = {
     size: 100,
     parallel: 5,
     retryAttempts: 3,
     retryDelay: 1000
   };
   ```

### Generation Performance

- **Parallel Processing**: Generate up to 5 sections simultaneously
- **Rate Limiting**: Respect API limits (3500 RPM for GPT-4)
- **Caching**: Cache generated content for 24 hours

## Analytics & Monitoring

### Content Metrics Dashboard

Access via: `/admin/content-metrics`

Key Metrics:
- Total terms with content
- Section completion rate
- Average quality score
- Generation costs
- Content engagement

### Real-time Monitoring

1. **Generation Analytics**
   ```sql
   SELECT 
     COUNT(*) as total_generations,
     AVG(cost) as avg_cost,
     SUM(total_tokens) as total_tokens
   FROM ai_usage_analytics
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Content Health**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE quality_score >= 70) as high_quality,
     COUNT(*) FILTER (WHERE quality_score < 70) as needs_improvement,
     AVG(quality_score) as avg_quality
   FROM content_quality_metrics;
   ```

### Cost Tracking

Monitor AI generation costs:
- Real-time cost tracking per generation
- Daily/monthly cost reports
- Cost per term/section breakdown
- Model comparison costs

## Troubleshooting

### Common Issues

1. **Import Failures**
   - Check file format and encoding (UTF-8)
   - Verify required columns exist
   - Check for special characters in term names

2. **Generation Errors**
   - Verify OpenAI API key is valid
   - Check rate limits
   - Ensure sufficient API credits

3. **Performance Issues**
   - Run database vacuum: `VACUUM ANALYZE;`
   - Check index usage
   - Monitor query performance

### Debug Commands

```bash
# Test content management system
npm run test:content-management

# Check system health
npm run health:check

# View recent errors
npm run logs:errors -- --tail 100
```

### Support Resources

- Technical Documentation: `/docs`
- API Reference: `/api/docs`
- Admin Guide: `/admin/help`
- Support Email: support@aiglossarypro.com

## Production Checklist

Before content population:

- [ ] Run optimization script: `npm run optimize:content-management`
- [ ] Verify all indexes are created
- [ ] Test import with sample data
- [ ] Configure AI generation settings
- [ ] Set up monitoring alerts
- [ ] Review quality thresholds
- [ ] Test export/backup systems
- [ ] Verify admin permissions

## Quick Start Commands

```bash
# 1. Optimize system for production
npm run optimize:content-management

# 2. Test content management functionality
npm run test:content-management

# 3. Import initial content
npm run import:terms -- --file data/essential-terms.xlsx --ai-generate

# 4. Validate imported content
npm run validate:content -- --type all --fix

# 5. Monitor import progress
npm run monitor:imports -- --watch
```

---

Last Updated: January 2025
Version: 1.0.0