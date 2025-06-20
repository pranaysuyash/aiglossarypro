# Project Organization Plan

## Current State Analysis

The AIMLGlossary project currently has organic growth with files scattered at the root level. While `aimlv2.py` and `aiml.xlsx` must remain at root during active processing, we can organize the rest of the project for better maintainability.

## Proposed Directory Structure

```
AIMLGlossary/
├── README.md                    # Project overview and quick start
├── 
├── # ACTIVE PROCESSING (DO NOT MOVE)
├── aimlv2.py                    # 🔥 Main content generator
├── aiml.xlsx                    # 🔥 Primary data file
├── checkpoint.json              # Progress tracking
├── ai_content_generator.log     # Runtime logs
├── issues.log                   # Known issues tracking
├── 
├── # DOCUMENTATION
├── docs/
│   ├── AIMLV2_DOCUMENTATION.md  # Detailed script documentation
│   ├── WEBSITE_ARCHITECTURE.md  # Website design and architecture
│   ├── PROJECT_ORGANIZATION.md  # This file
│   ├── EXCEL_STRUCTURE.md       # Data schema documentation
│   ├── OUTPUT_PROCESSING.md     # Post-processing plans
│   └── API_DOCUMENTATION.md     # Future API specifications
├── 
├── # DATA MANAGEMENT
├── data/
│   ├── current/
│   │   └── aiml.xlsx -> ../../aiml.xlsx  # Symlink to active file
│   ├── backups/
│   │   ├── aiml_till1145am13jun.xlsx
│   │   ├── aiml_till_330pm4jun2025.xlsx
│   │   ├── aiml_till1145pm15may2025.xlsx
│   │   ├── aiml_till5pm13may2025.xlsx
│   │   └── aiml_till1033pm23may.xlsx
│   ├── exports/
│   │   ├── json/              # Generated JSON files for website
│   │   ├── csv/               # CSV exports
│   │   └── api/               # API-ready data formats
│   └── temp/
│       ├── aiml.xlsx.tmp      # Temporary processing files
│       └── aiml2.xlsx         # Working copies
├── 
├── # TOOLS AND SCRIPTS
├── scripts/
│   ├── legacy/
│   │   ├── aiml.py            # Previous version
│   │   └── ebook.py           # PDF generator
│   ├── converters/
│   │   ├── excel_to_json.py   # Excel to JSON converter
│   │   ├── json_to_api.py     # API data preparation
│   │   └── data_validator.py  # Data quality checks
│   ├── maintenance/
│   │   ├── backup_manager.py   # Automated backups
│   │   ├── cleanup.py         # File cleanup utilities
│   │   └── health_check.py    # System health monitoring
│   └── deployment/
│       ├── build_website.py   # Website build script
│       ├── deploy_replit.py   # Replit deployment
│       └── update_pipeline.py # Automated update pipeline
├── 
├── # OUTPUT FORMATS
├── outputs/
│   ├── pdfs/
│   │   ├── current/
│   │   │   └── AI_ML_Glossary_Ebook.pdf
│   │   └── archive/
│   │       ├── AI_ML_Glossary_Ebook_1.pdf
│   │       ├── AI_ML_Glossary_Ebook_2.pdf
│   │       ├── AI_ML_Glossary_Ebook_3.pdf
│   │       ├── AI_ML_Glossary_Ebook_4.pdf
│   │       └── AI_ML_Glossary_Ebook_5.pdf
│   ├── html/
│   │   ├── ebookv1.html
│   │   ├── ebookv1.pdf
│   │   └── ebookv2.pdf
│   └── website/
│       └── build/             # Generated website files
├── 
├── # WEB DEVELOPMENT
├── website/
│   ├── README.md              # Website-specific documentation
│   ├── package.json           # Dependencies and scripts
│   ├── src/
│   │   ├── components/
│   │   │   ├── TermCard.js    # Individual term display
│   │   │   ├── SearchBar.js   # Search functionality
│   │   │   ├── Navigation.js  # Section navigation
│   │   │   └── ContentTree.js # Hierarchical content display
│   │   ├── pages/
│   │   │   ├── index.js       # Homepage
│   │   │   ├── term/          # Dynamic term pages
│   │   │   ├── browse/        # Category browsing
│   │   │   └── search/        # Search results
│   │   ├── utils/
│   │   │   ├── dataLoader.js  # Data loading utilities
│   │   │   ├── searchEngine.js # Search implementation
│   │   │   └── urlUtils.js    # URL management
│   │   ├── styles/
│   │   │   ├── globals.css    # Global styles
│   │   │   ├── components.css # Component styles
│   │   │   └── theme.css      # Theme variables
│   │   └── data/
│   │       ├── terms.json     # Generated from Excel
│   │       ├── structure.json # Section hierarchy
│   │       └── search-index.json # Search index
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── assets/
│   │       ├── images/
│   │       └── icons/
│   ├── docs/
│   │   ├── progress.md
│   │   ├── todo.md
│   │   ├── queries.md
│   │   └── issues.md
│   └── legacy/
│       ├── index.html         # Original static version
│       ├── term.html
│       ├── about.html
│       ├── 404.html
│       ├── css/style.css
│       └── js/
│           ├── app.js
│           ├── data-loader.js
│           └── search.js
├── 
├── # EXTERNAL INTEGRATIONS
├── integrations/
│   ├── googleaistudio/
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── replit/
│   │   ├── config/
│   │   ├── deployment/
│   │   └── sync/
│   └── api/
│       ├── openai/            # OpenAI integration
│       ├── webhooks/          # External webhooks
│       └── third-party/       # Other integrations
├── 
├── # CONFIGURATION
├── config/
│   ├── environment/
│   │   ├── development.json
│   │   ├── staging.json
│   │   └── production.json
│   ├── api/
│   │   ├── openai.json
│   │   └── rate-limits.json
│   └── deployment/
│       ├── replit.json
│       ├── github-pages.json
│       └── docker.json
├── 
├── # TESTING
├── tests/
│   ├── unit/
│   │   ├── test_data_processing.py
│   │   ├── test_excel_converter.py
│   │   └── test_api_calls.py
│   ├── integration/
│   │   ├── test_pipeline.py
│   │   └── test_website_build.py
│   ├── fixtures/
│   │   ├── sample_data.xlsx
│   │   └── test_terms.json
│   └── performance/
│       ├── load_tests.py
│       └── benchmark.py
├── 
├── # PYTHON ENVIRONMENT
├── venv/                      # Virtual environment (exists)
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
└── 
└── # LOGS AND TEMPORARY FILES (gitignored)
    ├── logs/
    │   ├── processing.log
    │   ├── errors.log
    │   └── performance.log
    └── tmp/
        ├── processing/
        └── uploads/
```

## Migration Strategy

### Phase 1: Safe Reorganization (Immediate)
1. **Create new directory structure** (without moving active files)
2. **Move legacy files** to appropriate locations
3. **Create symlinks** for data file references
4. **Update documentation** with new structure

### Phase 2: Active File Integration (After Processing Complete)
1. **Move aimlv2.py** to `scripts/` directory
2. **Move aiml.xlsx** to `data/current/`
3. **Update all references** and configuration
4. **Test complete pipeline** with new structure

### Phase 3: Enhanced Organization (Future)
1. **Implement automated scripts** for file management
2. **Add CI/CD pipeline** for deployments
3. **Create monitoring** and health checks
4. **Establish backup automation**

## File Movement Plan

### Immediate Moves (Safe)
```bash
# Create directory structure
mkdir -p data/{current,backups,exports/{json,csv,api},temp}
mkdir -p scripts/{legacy,converters,maintenance,deployment}
mkdir -p outputs/{pdfs/{current,archive},html,website/build}
mkdir -p integrations/{replit,api/{openai,webhooks,third-party}}
mkdir -p config/{environment,api,deployment}
mkdir -p tests/{unit,integration,fixtures,performance}
mkdir -p logs tmp

# Move backup files
mv aiml_till*.xlsx data/backups/
mv aiml2.xlsx data/temp/

# Move legacy scripts
mv ebook.py scripts/legacy/
mv aiml.py scripts/legacy/

# Move PDF outputs
mv AI_ML_Glossary_Ebook*.pdf outputs/pdfs/archive/
mv AI_ML_Glossary_Ebook.pdf outputs/pdfs/current/

# Move HTML outputs
mv ebookv*.html outputs/html/
mv ebookv*.pdf outputs/html/

# Move integrations
mv googleaistudio/ integrations/

# Create symlinks for active files
ln -s ../../aiml.xlsx data/current/aiml.xlsx
```

### Future Moves (After Processing Complete)
```bash
# Move active processing files
mv aimlv2.py scripts/processing/
mv checkpoint.json data/current/
mv ai_content_generator.log logs/
mv issues.log logs/

# Update references in moved scripts
# Test and validate all functionality
```

## Benefits of New Structure

### 1. **Clarity and Navigation**
- **Logical grouping** of related files
- **Clear separation** of concerns
- **Easy location** of specific functionality

### 2. **Development Workflow**
- **Isolated testing** environment
- **Organized scripts** for different purposes
- **Clear deployment** pipeline

### 3. **Data Management**
- **Centralized data** location
- **Organized backups** with timestamps
- **Multiple export** formats in dedicated locations

### 4. **Maintenance**
- **Easy cleanup** of temporary files
- **Centralized logging** for debugging
- **Organized configuration** management

### 5. **Scalability**
- **Room for growth** in each category
- **Plugin architecture** for integrations
- **Modular approach** to functionality

## Configuration Updates Required

### 1. Update Python Scripts
```python
# Old
EXCEL_FILE = "aiml.xlsx"

# New (after migration)
EXCEL_FILE = "data/current/aiml.xlsx"
```

### 2. Update Website References
```javascript
// Old
const dataPath = "./data/terms.json"

// New
const dataPath = "./src/data/terms.json"
```

### 3. Update Documentation
- **Path references** in all markdown files
- **Installation instructions** with new structure
- **Development setup** guides

## Maintenance Automation

### 1. Backup Management
```python
# scripts/maintenance/backup_manager.py
# Automated timestamped backups
# Cleanup old backups
# Verify backup integrity
```

### 2. Health Monitoring
```python
# scripts/maintenance/health_check.py
# Monitor processing status
# Check file integrity
# Validate data completeness
```

### 3. Deployment Pipeline
```python
# scripts/deployment/update_pipeline.py
# Excel to JSON conversion
# Website build and deployment
# Cache invalidation
```

## Security Considerations

### 1. **API Key Management**
- **Environment variables** instead of hardcoded keys
- **Separate configurations** for different environments
- **Key rotation** procedures

### 2. **Data Protection**
- **Backup encryption** for sensitive data
- **Access control** for configuration files
- **Audit logging** for data modifications

### 3. **Deployment Security**
- **Secure deployment** keys
- **HTTPS enforcement** for all endpoints
- **Input validation** for all user inputs

## Next Steps

1. **Review current implementation** in Replit project
2. **Create directory structure** following this plan
3. **Move non-active files** to new locations
4. **Update documentation** with new paths
5. **Test functionality** with new structure
6. **Plan final migration** of active files after processing completes

This organization plan provides a solid foundation for the project's growth while maintaining the active processing workflow and enabling smooth transition to a more structured development environment.