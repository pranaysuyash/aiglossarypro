# Visual Testing Workflows

This document outlines the complete visual testing infrastructure and workflows for the AIMLGlossary application.

## Overview

Our visual testing strategy consists of multiple layers:

1. **Enhanced Visual Audit** - Comprehensive UI/UX analysis with AI assistance
2. **Playwright Visual Tests** - Automated cross-browser visual regression testing  
3. **Storybook + Chromatic** - Component-level visual testing and CI/CD integration
4. **Million.js Performance Monitoring** - Visual performance optimization tracking

## Quick Start

### Development Workflow

```bash
# 1. Run quick visual audit
npm run audit:visual

# 2. Run visual tests for current changes
npm run test:visual:chromium

# 3. Update visual baselines (when intentional changes made)
npm run test:visual:update
```

### Before Deployment

```bash
# 1. Run comprehensive visual audit
npm run audit:visual:enhanced

# 2. Run cross-browser visual tests
npm run test:visual:cross-browser

# 3. Build and test Storybook
npm run build-storybook
npm run chromatic:ci
```

## Testing Infrastructure

### 1. Enhanced Visual Audit

**Purpose:** Comprehensive UI/UX analysis with human-readable reports  
**Frequency:** On-demand, before major releases  
**Location:** `scripts/visual-audit-enhanced.ts`

**Commands:**
```bash
# Quick audit (9 screenshots)
npm run audit:visual

# Full audit with AI analysis, accessibility, and performance
npm run audit:visual:enhanced

# Debug mode with detailed logging
npm run audit:visual:debug
```

**Outputs:**
- Screenshots: `visual-audits/{timestamp}/screenshots/`
- HTML Report: `visual-audits/{timestamp}/index.html`
- Analysis Prompt: `visual-audits/{timestamp}/claude-analysis-prompt.md`

**Features:**
- Multi-device testing (Desktop, Mobile, Tablet)
- Interactive element testing
- Accessibility compliance checking
- Performance metrics with Lighthouse
- AI-powered visual analysis (with Claude API)

### 2. Playwright Visual Tests

**Purpose:** Automated visual regression testing  
**Frequency:** Every PR, continuous integration  
**Location:** `tests/visual/`

**Commands:**
```bash
# Run all visual tests
npm run test:visual

# Run with UI for debugging
npm run test:visual:ui

# Run cross-browser tests
npm run test:visual:cross-browser

# Run mobile-specific tests
npm run test:visual:mobile

# Update baselines (after intentional changes)
npm run test:visual:update
```

**Configuration:** `playwright.visual.config.ts`

**Browser Coverage:**
- Chromium Desktop (1920x1080)
- Firefox Desktop (1920x1080)
- WebKit Desktop (1920x1080)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)
- Tablet Chrome (768x1024)

**Test Files:**
- `homepage.spec.ts` - Homepage layout and components
- `search.spec.ts` - Search functionality and results
- `term-detail.spec.ts` - Term detail pages
- `ai-features.spec.ts` - AI-powered features
- `error-states.spec.ts` - Error handling and states
- `settings-page.spec.ts` - User settings and preferences

### 3. Storybook + Chromatic

**Purpose:** Component-level visual testing and design system validation  
**Frequency:** Every commit to main branch  
**Location:** `stories/`

**Commands:**
```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook

# Run Chromatic visual testing
npm run chromatic

# Run Chromatic in CI mode
npm run chromatic:ci
```

**Components Covered:**
- UI Components (Button, Card, Input, etc.)
- Layout Components (Header, Footer, Navigation)
- Interactive Components (Search, Filters, Modals)
- AI Components (Term suggestions, Content feedback)
- Page Components (Homepage, Dashboard, etc.)

### 4. Million.js Performance Monitoring

**Purpose:** Track visual performance optimizations  
**Frequency:** Every build  
**Location:** `million.config.js`

**Monitoring:**
- Component render performance improvements
- Bundle size optimizations
- Runtime performance metrics
- Visual performance regression detection

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/visual-testing.yml`

**Triggers:**
- Push to main/develop branches
- Pull requests to main

**Jobs:**

1. **visual-tests**
   - Runs Playwright visual tests
   - Uploads test results as artifacts
   - Runs Chromatic on push events

2. **storybook-visual-tests**
   - Builds Storybook
   - Runs Chromatic component testing
   - Updates visual baselines

3. **enhanced-visual-audit**
   - Runs comprehensive visual audit on PRs
   - Uploads audit reports as artifacts

### Environment Variables

Required secrets in GitHub repository:

```bash
CHROMATIC_PROJECT_TOKEN=chpt_xxxxxxxxxxxxx
CLAUDE_API_KEY=sk-xxxxxxxxxxxxx (optional, for AI analysis)
```

## Visual Testing Best Practices

### 1. Screenshot Guidelines

**Naming Convention:**
- `component-name-state.png` (e.g., `homepage-desktop.png`)
- `feature-device-state.png` (e.g., `search-mobile-active.png`)

**Consistency Tips:**
- Disable animations in tests
- Wait for fonts to load
- Use fixed viewport sizes
- Hide dynamic content (timestamps, user-specific data)

### 2. Baseline Management

**When to Update Baselines:**
- ✅ Intentional design changes
- ✅ New features that affect layout
- ✅ Responsive design improvements
- ❌ Accidental visual changes
- ❌ Text content updates only

**Update Process:**
1. Review proposed changes carefully
2. Run `npm run test:visual:update`
3. Commit updated snapshots
4. Document changes in PR description

### 3. Test Maintenance

**Regular Tasks:**
- Review failed visual tests weekly
- Update outdated test selectors
- Add tests for new components
- Clean up unused snapshots

**Component Coverage Checklist:**
- [ ] Default state
- [ ] Hover/focus states
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Mobile responsiveness

## Troubleshooting

### Common Issues

**1. Visual Test Failures**
```bash
# View differences in UI
npm run test:visual:ui

# Check specific project
npm run test:visual:chromium

# Update if changes are intentional
npm run test:visual:update
```

**2. Chromatic Issues**
```bash
# Check project token
echo $CHROMATIC_PROJECT_TOKEN

# Run with verbose logging
npx chromatic --debug

# Skip CI checks for testing
npx chromatic --skip=ci
```

**3. Performance Issues**
```bash
# Check Million.js optimizations
npm run build | grep Million

# Analyze bundle size
npm run build:analyze

# Profile visual performance
npm run dev:perf
```

### Debug Commands

```bash
# Visual audit with debug logging
DEBUG=visual-audit npm run audit:visual:enhanced

# Playwright debug mode
npm run test:visual:headed

# Storybook development mode
npm run storybook
```

## Integration with Development Workflow

### Pre-commit Hooks

Add to `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run visual tests for components
npm run test:visual:chromium --passWithNoTests
```

### VS Code Extensions

Recommended extensions for visual testing:

- Playwright Test for VS Code
- Storybook for VS Code
- Visual Studio IntelliCode

### Code Review Checklist

**Visual Changes Review:**
- [ ] Screenshots provided for UI changes
- [ ] Visual tests updated appropriately
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Accessibility compliance maintained
- [ ] Performance impact assessed

## Metrics and Reporting

### Key Performance Indicators

**Visual Quality:**
- Visual test pass rate: >95%
- Cross-browser consistency: >98%
- Accessibility compliance: 100%

**Performance:**
- Component optimization rate: >30%
- Bundle size impact: <5% increase
- Visual regression detection: <24 hours

**Developer Experience:**
- Test execution time: <5 minutes
- Baseline update frequency: <weekly
- False positive rate: <2%

### Monitoring Dashboards

**GitHub Actions:**
- Visual test status
- Chromatic build status
- Performance metrics

**Chromatic Dashboard:**
- Component change tracking
- Visual regression history
- Team collaboration features

---

## Next Steps

1. **Set up Chromatic project token** for full CI/CD integration
2. **Run initial visual test baseline** update
3. **Configure team notifications** for visual changes
4. **Add visual testing to code review** process
5. **Monitor performance impact** of visual optimizations

For questions or issues, refer to:
- [Playwright Documentation](https://playwright.dev/docs/test-snapshots)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Documentation](https://storybook.js.org/docs/)
- [Million.js Documentation](https://million.dev/docs/)