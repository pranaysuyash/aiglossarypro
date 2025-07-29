# Content Seeding Scripts

This directory contains the comprehensive content population system for the AI/ML Glossary. These scripts leverage the existing AI services to generate high-quality, production-ready content.

## 🚀 Quick Start

```bash
# Run the interactive demo
npm run content:demo

# Generate sample import files
npm run import:bulk:samples

# Start with basic content seeding
npm run seed:terms:dry-run

# Generate comprehensive 42-section content
npm run generate:sections:dry-run

# Validate content quality
npm run validate:content
```

## 📁 File Structure

```
scripts/content-seeding/
├── README.md                    # This file
├── demo.ts                     # Interactive system demo
├── seedTerms.ts               # Main content seeding script
├── generate42Sections.ts      # 42-section content generator  
├── validateContent.ts         # Quality validation system
├── bulkImport.ts             # Bulk import from external sources
├── data/
│   └── essentialTerms.ts     # 280+ curated AI/ML terms
└── samples/                  # Auto-generated sample files
    ├── sample_terms.csv     # CSV import example
    └── sample_terms.json    # JSON import example
```

## 🎯 Core Features

### 1. **Content Seeding** (`seedTerms.ts`)
- Generates AI/ML terms using existing AI service
- Uses curated essential terms database (280+ terms)
- Supports category-specific generation
- Includes quality assessment and validation

### 2. **42-Section Generation** (`generate42Sections.ts`) 
- Creates comprehensive content following complete 42-section structure
- Priority-based section generation (high/medium/low)
- Batch processing capabilities
- Content quality scoring

### 3. **Content Validation** (`validateContent.ts`)
- Quality validation (0-100 scoring)
- Completeness assessment  
- Consistency verification
- Auto-fix capabilities with detailed reporting

### 4. **Bulk Import** (`bulkImport.ts`)
- Multiple format support (CSV, JSON, Essential Terms)
- AI-powered content enhancement
- Automatic category creation
- Error handling and recovery

### 5. **Essential Terms Database** (`data/essentialTerms.ts`)
- 280+ curated essential AI/ML terms
- 10 major categories (ML, DL, NLP, CV, etc.)
- Priority and complexity levels
- Aliases and related terms

## 🎮 Available Commands

### Content Seeding
```bash
npm run seed:terms                    # Generate essential terms
npm run seed:terms:dry-run           # Test without saving
npm run seed:terms:category "ML"     # Category-specific generation
```

### 42-Section Generation
```bash
npm run generate:sections                      # Generate comprehensive content
npm run generate:sections:dry-run             # Test without saving  
npm run generate:sections:priority high       # High-priority sections only
```

### Content Validation
```bash
npm run validate:content                # Validate all content
npm run validate:content:fix           # Auto-fix issues
npm run validate:content:report        # Generate detailed report
```

### Bulk Import
```bash
npm run import:bulk                     # Import essential terms
npm run import:bulk:enhance            # Import with AI enhancement
npm run import:bulk:csv path/file.csv  # Import from CSV
npm run import:bulk:json path/file.json # Import from JSON  
npm run import:bulk:samples            # Create sample files
```

### Demo
```bash
npm run content:demo                   # Run interactive demo
```

## 📊 Content Statistics

### Essential Terms Database
- **Total Terms**: 280+
- **Categories**: 10 major areas
- **High Priority**: 120+ terms
- **Coverage**: Core AI/ML concepts

### Generated Content Volume
- **Basic Term**: ~500-1,000 characters
- **Enhanced Term**: ~2,000-5,000 characters  
- **42-Section Term**: ~50,000-200,000 characters
- **Complete Database**: 10-50 million characters

## 🔧 Configuration Options

### seedTerms.ts Options
```bash
--count <number>        # Number of terms to generate (default: 10)
--category <name>       # Target specific category
--dry-run              # Preview without saving
--validate-only        # Validate existing terms only
```

### generate42Sections.ts Options  
```bash
--term <name>          # Generate for specific term
--batch <count>        # Process multiple terms (default: 5)
--sections <list>      # Comma-separated section list
--priority <level>     # high/medium/low priority sections
--dry-run             # Preview without saving
--validate            # Validate existing sections
```

### validateContent.ts Options
```bash
--type <validation>    # quality/completeness/consistency/all
--term <name>         # Validate specific term
--fix                 # Auto-fix issues where possible  
--report              # Generate detailed report
--threshold <score>   # Quality threshold (0-100, default: 70)
```

### bulkImport.ts Options
```bash
--source <path>        # Path to source file
--type <format>        # csv/json/essential
--enhance             # Use AI to enhance content
--validate            # Validate after import
--batch-size <number> # Import batch size (default: 10)
--dry-run            # Preview without saving
--category <name>     # Import specific category only
```

## 📈 Quality Metrics

The system evaluates content on three dimensions:

### 1. Quality Score (0-100)
- Text clarity and depth
- Technical accuracy  
- Grammar and spelling
- Structural completeness

### 2. Completeness Score (0-100)
- Required field coverage
- Section completeness
- Metadata richness
- Reference quality

### 3. Consistency Score (0-100)
- Definition alignment
- Category appropriateness
- Terminology standardization
- Cross-reference accuracy

## 🛠️ Integration Points

### AI Service Integration
The scripts leverage your existing AI service (`/server/aiService.ts`):
- `generateTermSuggestions()` - Term discovery
- `generateDefinition()` - Comprehensive definitions
- `generateSectionContent()` - 42-section content
- `improveDefinition()` - Quality enhancement

### Database Integration
Direct integration with existing schema:
- `terms` table - Core term data
- `categories` table - Category management
- `termSubcategories` table - Subcategory relationships

### Caching & Performance
- Leverages existing AI service caching
- Respects rate limits and cost optimization
- Supports batch processing for efficiency

## 📋 Example Workflows

### 1. Initial Database Population
```bash
# Preview essential terms
npm run seed:terms:dry-run --count 20

# Generate core terms  
npm run seed:terms --count 50

# Add comprehensive content
npm run generate:sections:priority high --batch 20

# Validate and fix issues
npm run validate:content:fix --threshold 70
```

### 2. Category Enhancement
```bash
# Focus on specific category
npm run seed:terms:category "Deep Learning" --count 15

# Generate detailed sections
npm run generate:sections --priority high --batch 15

# Validate category content
npm run validate:content --category "Deep Learning" --fix
```

### 3. Bulk Content Import
```bash
# Create sample files for reference
npm run import:bulk:samples

# Import with AI enhancement
npm run import:bulk:csv data/terms.csv --enhance --validate

# Validate imported content
npm run validate:content:report
```

## 🚨 Error Handling

### Common Issues
1. **Rate Limit Exceeded** - Automatic retry with backoff
2. **Poor Content Quality** - Auto-fix with `--fix` flag  
3. **Import Errors** - Detailed error logging and recovery
4. **Database Conflicts** - Automatic deduplication

### Recovery Commands
```bash
# Check system status
npm run validate:content --type all

# Fix common issues  
npm run validate:content:fix

# Re-generate failed content
npm run seed:terms --validate-only
```

## 📖 Documentation

- **Complete Guide**: `/docs/CONTENT_POPULATION_SYSTEM.md`
- **42-Section Structure**: `/docs/COMPLETE_42_SECTION_STRUCTURE.md`
- **Essential Terms**: `/scripts/content-seeding/data/essentialTerms.ts`

## 🎯 Next Steps

1. **Run Demo**: `npm run content:demo`
2. **Create Samples**: `npm run import:bulk:samples`  
3. **Start Seeding**: `npm run seed:terms:dry-run`
4. **Generate Content**: `npm run generate:sections:dry-run`
5. **Validate Quality**: `npm run validate:content`

## 🤝 Contributing

When adding new essential terms:
1. Update `/data/essentialTerms.ts`
2. Follow existing structure and categorization
3. Include priority, complexity, and related terms
4. Test with validation system

## 📞 Support

For issues or questions:
1. Check error logs for specific issues
2. Run validation to identify problems
3. Use dry-run mode to test changes
4. Review documentation for detailed guidance

---

**Ready to populate your glossary with high-quality AI/ML content? Start with the demo!**

```bash
npm run content:demo
```