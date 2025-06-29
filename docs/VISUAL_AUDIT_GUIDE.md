# Visual Audit Guide

## Overview

The Visual Audit tool automatically captures screenshots of your application and provides a framework for identifying UI/UX issues using AI analysis. This helps maintain visual consistency and catch accessibility issues across different viewports.

## Features

- 🖼️ Automated screenshot capture across multiple viewports
- 📱 Desktop, tablet, and mobile testing
- 🎯 Interactive state testing (search, menus, etc.)
- 🤖 AI-powered visual analysis with Claude
- 📊 Structured issue reporting with severity levels
- 📋 Actionable recommendations

## Usage

### Simple Visual Audit (Recommended)

Run the simple version that captures screenshots and generates analysis prompts:

```bash
npm run audit:visual
```

This will:
1. Start your development server
2. Capture screenshots of key pages and states
3. Save them to `visual-audits/[date]/`
4. Generate a Claude analysis prompt
5. Create a report template

### Full Automated Audit (Requires Claude CLI)

If you have the Claude CLI installed:

```bash
npm run audit:visual:full
```

This version automatically analyzes screenshots and generates a complete report.

## Screenshot Configurations

The tool captures these views by default:

### Desktop (1920x1080)
- Homepage
- Terms listing
- Categories
- Dashboard

### Mobile (375x812)
- Homepage
- Terms listing
- Mobile menu open

### Tablet (768x1024)
- Homepage

### Interactive States
- Search with active results
- Mobile navigation menu
- Dark mode toggle

## Analysis Process

### Step 1: Run the Audit

```bash
npm run audit:visual
```

### Step 2: Review Screenshots

Navigate to the output directory:
```bash
cd visual-audits/[date]/
open .  # Opens in Finder on macOS
```

### Step 3: Analyze with Claude

Option A - Use Claude CLI:
```bash
claude -p "@visual-audits/[date]/ Analyze these UI screenshots following the guidelines in claude-analysis-prompt.md"
```

Option B - Manual Analysis:
1. Open each screenshot
2. Use the generated `visual-audit-report.md` template
3. Document issues following the severity guidelines

### Step 4: Create Action Items

Based on the analysis, create tasks for:
- Critical issues (blocking user actions)
- High priority (major UX problems)
- Medium priority (polish items)
- Low priority (nice-to-have improvements)

## Issue Severity Guidelines

### Critical
- Broken layouts
- Unreadable text
- Inaccessible interactive elements
- Complete feature failures

### High
- Poor color contrast
- Overlapping elements
- Missing responsive behavior
- Confusing navigation

### Medium
- Inconsistent spacing
- Minor alignment issues
- Style inconsistencies
- Suboptimal mobile layouts

### Low
- Minor visual polish
- Animation improvements
- Micro-interactions
- Brand consistency tweaks

## Customizing Screenshots

Edit `scripts/visual-audit-simple.ts` to add more pages or states:

```typescript
const configs: ScreenshotConfig[] = [
  // Add your custom configuration
  {
    name: 'custom-page',
    url: '/your-page',
    viewport: { width: 1920, height: 1080 },
    actions: [
      { type: 'click', selector: '.your-button' },
      { type: 'wait', value: 1000 }
    ]
  }
];
```

## Best Practices

### Regular Audits
- Run weekly during active development
- Before major releases
- After significant UI changes

### Team Review
- Share screenshots with designers
- Discuss findings in team meetings
- Prioritize fixes based on user impact

### Documentation
- Keep audit reports in version control
- Track improvements over time
- Reference in pull requests

## Troubleshooting

### Server doesn't start
- Ensure no other process is using port 3001
- Check `npm run dev` works independently

### Screenshots are blank
- Increase wait times in configurations
- Check for JavaScript errors in console

### Claude analysis fails
- Ensure Claude CLI is installed: `npm install -g @anthropic-ai/claude-cli`
- Check screenshot file sizes aren't too large

## Example Report

After analysis, your report should include:

```markdown
### Homepage Desktop

**Issues:**
1. **[HIGH]** - Hero text has poor contrast ratio (3.2:1)
   - Impact: Users with vision impairments can't read the main message
   - Fix: Increase text color to #333 or darken background

2. **[MEDIUM]** - CTA button is too small on mobile (38x38px)
   - Impact: Hard to tap on mobile devices
   - Fix: Increase to minimum 44x44px

**Working Well:**
- Clear visual hierarchy
- Consistent branding
- Fast load time
```

## Integration with CI/CD

You can integrate visual audits into your CI pipeline:

```yaml
# .github/workflows/visual-audit.yml
name: Visual Audit
on:
  pull_request:
  schedule:
    - cron: '0 9 * * 1' # Weekly on Monday

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run audit:visual
      - uses: actions/upload-artifact@v3
        with:
          name: visual-audit-results
          path: visual-audits/
```

## Next Steps

1. Run your first audit: `npm run audit:visual`
2. Review the generated screenshots
3. Use Claude or manual analysis to identify issues
4. Create GitHub issues for findings
5. Track improvements over time

---

*Visual quality is a key part of user experience. Regular audits help maintain high standards.*