# Visual Audit Setup and Usage

## Overview

The visual audit system provides automated UI/UX testing and analysis using Playwright for screenshot capture and Claude for intelligent analysis. This document explains how to set up and use the visual audit tools.

## Scripts Available

### 1. `visual-audit-simple.ts` - Basic Screenshot Capture
- Takes screenshots of key pages in different viewports
- Generates analysis prompt for Claude
- Creates report template
- **Command**: `npm run audit:visual`

### 2. `visual-audit-fixed.ts` - Debug Version  
- Enhanced error handling and debugging
- Runs in headed mode by default (for troubleshooting)
- More detailed logging during capture
- **Command**: `npm run audit:visual:debug`

### 3. `visual-audit.ts` - Full Analysis (Future)
- Complete end-to-end analysis pipeline
- **Command**: `npm run audit:visual:full`

## Setup Requirements

### Prerequisites
```bash
# Install dependencies (if not already done)
npm install

# Ensure Playwright browsers are installed
npx playwright install
```

### Environment Configuration

#### Option 1: Automatic Vite Detection (Recommended)
```bash
# Start the development server first
npm run dev

# Wait for "Vite dev server ready" message
# The script will auto-detect the Vite URL (usually http://localhost:5173)

# In a new terminal, run the audit
npm run audit:visual
```

#### Option 2: Manual URL Override
```bash
# Check what port Vite is running on
npm run dev
# Look for: "Local: http://localhost:5173/" (port may vary)

# Set BASE_URL environment variable
BASE_URL=http://localhost:5173 npm run audit:visual
```

#### Option 3: Headless Debug Mode
```bash
# For CI/CD or when headed mode fails
HEADLESS=1 BASE_URL=http://localhost:5173 npm run audit:visual:debug
```

## Common Issues and Solutions

### Issue: `net::ERR_CONNECTION_RESET`
**Cause**: Script trying to connect before Vite proxy is ready
**Solution**: 
1. Start `npm run dev` first and wait for "ready" message
2. Use the auto-detected Vite URL, or set `BASE_URL` manually

### Issue: Playwright headed mode permission denied (macOS)
**Cause**: Accessibility permissions required for headed browser
**Solution**: Use `HEADLESS=1` environment variable

### Issue: Blank screenshots
**Cause**: Pages not fully loaded before screenshot
**Solution**: Scripts now use `domcontentloaded` + body selector wait

## Output Structure

After running a visual audit, you'll find:

```
visual-audits/YYYY-MM-DD/           # (or visual-audits-fixed/ for debug)
├── 01-homepage-desktop.png
├── 02-terms-desktop.png  
├── 03-categories-desktop.png
├── 04-dashboard-desktop.png
├── 05-homepage-mobile.png
├── 06-terms-mobile.png
├── 07-homepage-tablet.png
├── 08-search-active.png
├── 09-mobile-menu-open.png
├── claude-analysis-prompt.md       # Ready-to-use prompt for Claude
└── visual-audit-report.md          # Template for findings
```

## Using the Results

### Automated Analysis with Claude CLI
```bash
# Navigate to the results directory
cd visual-audits/2024-12-29

# Use Claude CLI for automated analysis
claude -p "@./ Analyze these UI screenshots following the guidelines in claude-analysis-prompt.md"
```

### Manual Analysis
1. Open the screenshot directory
2. Review each screenshot for issues
3. Fill out the `visual-audit-report.md` template
4. Commit the completed report to `docs/`

## Screenshots Captured

| Screenshot | Description | Viewport |
|------------|-------------|----------|
| `01-homepage-desktop.png` | Homepage on desktop | 1920x1080 |
| `02-terms-desktop.png` | Terms listing page | 1920x1080 |
| `03-categories-desktop.png` | Categories page | 1920x1080 |
| `04-dashboard-desktop.png` | User dashboard | 1920x1080 |
| `05-homepage-mobile.png` | Homepage on mobile | 375x812 |
| `06-terms-mobile.png` | Terms on mobile | 375x812 |
| `07-homepage-tablet.png` | Homepage on tablet | 768x1024 |
| `08-search-active.png` | Search with results | 1920x1080 |
| `09-mobile-menu-open.png` | Mobile navigation | 375x812 |

## Development Workflow

### Regular Audits
```bash
# 1. Run audit after major UI changes
npm run dev  # Start server
npm run audit:visual  # Capture screenshots

# 2. Analyze results
claude -p "@./visual-audits/[date]/ Analyze these screenshots"

# 3. Create action items and commit report
```

### CI/CD Integration (Future)
```bash
# For automated pipeline integration
HEADLESS=1 BASE_URL=http://localhost:3001 npm run audit:visual
```

## Configuration

### Modifying Screenshot Configs
Edit the `configs` array in the respective script to:
- Add new pages/routes
- Change viewport sizes  
- Add interactive states
- Modify wait conditions

### Custom Analysis Prompts
The `claude-analysis-prompt.md` file can be customized to focus on:
- Specific design system compliance
- Accessibility requirements
- Brand guidelines
- Performance considerations

## Troubleshooting

### Debug Steps
1. **Check server**: `curl http://localhost:5173/` should return HTML
2. **Check ports**: Verify Vite port with `npm run dev` output
3. **Test browser**: Try `npx playwright open http://localhost:5173`
4. **Check permissions**: Use `HEADLESS=1` if headed mode fails

### Common Environment Variables
```bash
BASE_URL=http://localhost:5173    # Override default URL
HEADLESS=1                        # Force headless mode
DEBUG=1                           # Enable debug logging (fixed script)
```

## Best Practices

1. **Consistent Environment**: Always run from clean `npm run dev` state
2. **Regular Audits**: Run after major UI changes or weekly
3. **Document Findings**: Always fill out the report template
4. **Track Progress**: Commit audit reports to track improvements over time
5. **Action Items**: Create GitHub issues for high-priority findings

This visual audit system provides a reliable, repeatable process for maintaining UI/UX quality and can be integrated into your development workflow.