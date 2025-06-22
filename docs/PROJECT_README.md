# AI/ML Glossary Project

A comprehensive AI/ML knowledge base and glossary generator that creates structured educational content for artificial intelligence and machine learning terms.

## 🚀 Currently Active

**⚠️ Active Processing**: `aimlv2.py` is currently running and processing `aiml.xlsx`. These files remain at the root level to maintain the active workflow.

## 📋 Project Overview

This project generates comprehensive AI/ML educational content including:
- **10,372+ AI/ML terms** with detailed explanations
- **295 content dimensions** per term (definitions, implementations, examples, etc.)
- **Multiple output formats**: Excel, PDF, HTML, website
- **Automated content generation** using OpenAI API

## 🏗️ Current Structure

```
AIMLGlossary/
├── aimlv2.py                    # 🔥 ACTIVE: Main content generator
├── aiml.xlsx                    # 🔥 ACTIVE: Primary data file (10,372 terms × 295 columns)
├── checkpoint.json              # Progress tracking for aimlv2.py
├── ai_content_generator.log     # Runtime logs
├── 
├── /old generations/            # Historical PDF versions
├── /website/                    # Web interface implementation
├── /googleaistudio/            # Google AI Studio integration
├── 
├── ebook.py                     # PDF generator (legacy)
├── aiml.py                      # Previous version generator
└── [multiple xlsx backups]     # Timestamped data backups
```

## 🔧 Core Components

### aimlv2.py - Main Content Generator
- **Purpose**: Fills empty cells in aiml.xlsx using OpenAI API
- **Features**: 
  - Parallel processing (25 workers)
  - Checkpoint system for resume capability
  - Atomic file operations for data safety
  - Comprehensive error handling and logging
- **Status**: Currently processing ~3,982 remaining terms (38.4% remaining)

### aiml.xlsx - Master Data File
- **Size**: 10,372 rows × 295 columns (3M+ data points)
- **Completion**: 61.6% filled (6,390 terms complete)
- **Structure**: 
  - Core content (236 columns): Definitions, implementations, examples
  - Metadata (47 columns): Classifications, validation, context
  - Extended content (12 columns): Best practices, security, optimization

## 📊 Data Organization

### Content Categories (295 columns total)
1. **Introduction & Basics** (17 columns)
2. **Technical Implementation** (18 columns) 
3. **Applications & Use Cases** (12 columns)
4. **Evaluation & Metrics** (13 columns)
5. **Advanced Concepts** (24 columns)
6. **Interactive Elements** (18 columns)
7. **Metadata & Classification** (47 columns)
8. **Extended Documentation** (12 columns)

### Term Coverage
- **A-Z Distribution**: 1,302 terms starting with 'A', 854 with 'C', 726 with 'M'
- **Scope**: From "3D Convolution" to "Zephyr 7B"
- **Difficulty Levels**: Beginner to Advanced research topics

## 🎯 Output Formats

### Generated Outputs
- **aiml.xlsx**: Master structured data
- **AI_ML_Glossary_Ebook.pdf**: Formatted educational ebook
- **Website**: Interactive web interface with search
- **JSON exports**: For programmatic access

### Quality Metrics
- **Introduction**: Avg 451 chars (173-954 range)
- **Applications**: Avg 641 chars (212-1,357 range)
- **Code Examples**: Avg 796 chars (40-3,075 range)
- **Evaluation**: Avg 649 chars (184-1,436 range)

## ⚙️ Running the System

### Prerequisites
```bash
pip install openai openpyxl tqdm
```

### Usage
```bash
# Continue processing (default)
python aimlv2.py

# Process from bottom-up
python aimlv2.py --mode bottomup

# Reset and start over
python aimlv2.py --reset-checkpoint

# Custom configuration
python aimlv2.py --workers 10 --batch-size 30
```

### Monitoring Progress
- Check `ai_content_generator.log` for real-time status
- `checkpoint.json` tracks completed cells
- Progress bar shows current batch status

## 🔄 Data Safety Features

- **Atomic writes**: Temporary files prevent corruption
- **Checkpoint system**: Resume from interruptions
- **Backup validation**: ZIP integrity checks
- **Timestamped backups**: Historical versions preserved

## 🎨 Web Interface & Development Tools

### Main Application
Located in `/client/` and `/server/`:
- Modern React frontend with TypeScript
- Express.js backend with database integration
- Interactive term browser and search
- User authentication and favorites
- Responsive design with Tailwind CSS

### Visual Component Development
**Storybook Integration** (Added June 22, 2025):
- Component isolation and testing
- Interactive props exploration
- Responsive viewport testing
- Light/dark theme switching
- Accessibility testing with a11y addon
- Auto-generated component documentation

**Available Commands:**
```bash
npm run storybook        # Start Storybook on port 6006/6007
npm run build-storybook  # Build static Storybook
```

**Features:**
- Visual regression testing capabilities
- Component development in isolation
- Real-time prop manipulation
- Theme and responsive testing
- Accessibility compliance checking

## 📈 Future Enhancements

See individual component documentation for specific improvement plans:
- Advanced search capabilities
- Real-time collaboration features
- Multi-language support
- API endpoints for external integration

## 📝 Documentation

- `docs/AIMLV2_DOCUMENTATION.md` - Detailed script documentation
- `docs/EXCEL_STRUCTURE.md` - Data schema and organization
- `docs/PROJECT_ORGANIZATION.md` - Proposed file structure improvements
- `docs/OUTPUT_PROCESSING.md` - Post-processing and improvement plans
- `docs/STORYBOOK_GUIDE.md` - Visual testing and component development guide
- `docs/VISUAL_TESTING_GUIDE.md` - Playwright visual testing documentation

## 🚨 Important Notes

1. **Do not move** `aimlv2.py` or `aiml.xlsx` while processing is active
2. **OpenAI API key** is embedded in script (consider environment variables for production)
3. **Large file sizes** - Excel file is ~50MB+ with full content
4. **Processing time** - Complete generation takes 6-12 hours depending on API limits

## 📞 Support

For issues or questions:
- Check `issues.log` for known problems
- Review `ai_content_generator.log` for runtime issues
- Ensure stable internet connection for API calls
- Monitor OpenAI API usage and limits