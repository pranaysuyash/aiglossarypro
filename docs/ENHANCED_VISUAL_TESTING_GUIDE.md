# Enhanced Visual Testing Guide

## Overview

The Enhanced Visual Testing System provides comprehensive UI/UX testing capabilities including:
- Interactive testing (clicks, hovers, form fills)
- Component-level analysis
- Accessibility testing with WCAG compliance
- Performance monitoring
- AI-powered screenshot analysis
- Visual regression testing
- Comprehensive reporting

## Quick Start

### Basic Usage

```bash
# Run full visual audit
npm run audit:visual:enhanced

# Run specific test types
npm run visual-test -- --type=accessibility
npm run visual-test -- --type=performance
npm run visual-test -- --type=interaction

# Test specific pages
npm run visual-test -- --page=/login
npm run visual-test -- --pages=all

# Test specific components
npm run visual-test component Button --interactions
npm run visual-test component TermCard --states=hover,selected

# Test user flows
npm run visual-test flow search-and-find
npm run visual-test flow user-authentication
```

### CLI Commands

```bash
# Show help
./scripts/visual-audit-cli.ts --help

# List available tests
./scripts/visual-audit-cli.ts list components
./scripts/visual-audit-cli.ts list flows
./scripts/visual-audit-cli.ts list breakpoints

# Analyze screenshots with AI
./scripts/visual-audit-cli.ts analyze screenshot.png

# Compare screenshots for regression
./scripts/visual-audit-cli.ts compare baseline.png current.png --threshold=2

# Generate reports
./scripts/visual-audit-cli.ts report --format=html
```

## Configuration

### Environment Variables

Configure visual testing in your main `.env` file by adding or updating these variables:

```bash
# Base URL for testing
BASE_URL=http://localhost:3001

# Claude API key for AI analysis
CLAUDE_API_KEY=your-api-key

# Run tests in headed mode
HEADLESS=false

# Update visual regression baselines
UPDATE_BASELINE=true

# Email report after completion
EMAIL_REPORT=true

# Slack webhook for notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

All visual audit configuration is now integrated into the main `.env` file - no separate environment file needed.

### Test Configuration

Edit `scripts/visual-audit-config.ts` to customize:

```typescript
// Add custom breakpoints
export const BREAKPOINTS = [
  { name: 'custom-tablet', width: 834, height: 1112 },
  // ...
];

// Add new user flows
export const CRITICAL_USER_FLOWS = [
  {
    name: 'checkout-process',
    steps: [
      { action: 'navigate', url: '/cart' },
      { action: 'click', selector: '[data-testid="checkout-btn"]' },
      // ...
    ]
  }
];

// Configure performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  fcp: 1500, // Target 1.5s First Contentful Paint
  lcp: 2000, // Target 2s Largest Contentful Paint
  // ...
};
```

## Test Types

### 1. Interactive Testing

Tests user interactions and dynamic behavior:

```typescript
{
  name: 'form-interaction',
  actions: [
    { type: 'focus', selector: 'input[name="email"]' },
    { type: 'type', selector: 'input[name="email"]', value: 'test@example.com' },
    { type: 'click', selector: 'button[type="submit"]' },
    { type: 'wait', value: 2000, screenshot: true }
  ]
}
```

**Features:**
- Click, hover, type, scroll, keyboard navigation
- Form filling and submission
- Dynamic content interaction
- State change verification

### 2. Component Testing

Tests individual components across all states:

```typescript
{
  name: 'Button',
  selector: 'button, .btn',
  states: ['default', 'hover', 'focus', 'active', 'disabled'],
  interactions: ['click', 'hover', 'focus']
}
```

**Features:**
- State variations (hover, focus, active, disabled)
- Responsive behavior
- Dark/light mode compatibility
- Animation performance

### 3. Accessibility Testing

Comprehensive WCAG compliance testing:

```typescript
{
  accessibility: {
    wcagLevel: 'AA',
    rules: ['color-contrast', 'focus-visible', 'keyboard-access'],
    focusTest: true,
    keyboardNavigation: true,
    contrastCheck: true
  }
}
```

**Features:**
- WCAG 2.1 Level A, AA, AAA compliance
- Color contrast analysis
- Keyboard navigation testing
- Screen reader compatibility
- Focus state verification
- ARIA attribute validation

### 4. Performance Testing

Monitors loading and runtime performance:

```typescript
{
  performance: true,
  metrics: ['fcp', 'lcp', 'tti', 'cls', 'fid']
}
```

**Features:**
- Core Web Vitals monitoring
- Lighthouse integration
- Animation performance
- Network request analysis
- Bundle size tracking

### 5. Visual Regression Testing

Detects unintended visual changes:

```bash
# Update baselines
UPDATE_BASELINE=true npm run audit:visual:enhanced

# Run regression tests
npm run visual-test compare
```

**Features:**
- Pixel-by-pixel comparison
- Configurable difference threshold
- Visual diff generation
- Baseline management

## Advanced Features

### AI-Powered Analysis

The system integrates with Claude API for intelligent analysis:

```typescript
// Automatic issue detection
- Visual hierarchy problems
- Color contrast issues
- Layout inconsistencies
- UX best practice violations

// Smart recommendations
- Specific fix suggestions
- Priority ordering
- Effort estimation
```

### Custom Test Scenarios

Create complex test scenarios:

```typescript
export const CUSTOM_SCENARIOS = [
  {
    name: 'responsive-layout-shift',
    description: 'Test for layout shifts during responsive transitions',
    breakpoints: ['mobile', 'tablet', 'desktop'],
    actions: [
      { type: 'scroll', value: 500 },
      { type: 'wait', value: 1000 },
      { type: 'resize', width: 768, height: 1024 }
    ]
  }
];
```

### Performance Monitoring

Track detailed performance metrics:

```typescript
// Animation performance
{
  fps: 58.2,
  jank: 3.2%, // Percentage of janky frames
  longTasks: 2
}

// Loading performance
{
  fcp: 1823ms,
  lcp: 2341ms,
  tti: 3012ms,
  cls: 0.08
}
```

## Reporting

### HTML Report

Interactive HTML report with:
- Issue categorization and severity
- Screenshot gallery
- Performance charts
- Accessibility compliance summary
- Task prioritization

### Markdown Report

Developer-friendly markdown with:
- Executive summary
- Detailed issue descriptions
- Action items
- Code snippets

### JSON Report

Machine-readable format for:
- CI/CD integration
- Custom analysis
- Trend tracking
- Automated ticket creation

## Best Practices

### 1. Test Organization

```
visual-audits/
├── 2024-01-15-10-30-45/
│   ├── screenshots/
│   │   ├── components/
│   │   ├── interactions/
│   │   └── accessibility/
│   ├── videos/
│   ├── index.html
│   ├── report.md
│   └── report.json
```

### 2. Continuous Integration

```yaml
# .github/workflows/visual-tests.yml
name: Visual Tests
on: [push, pull_request]

jobs:
  visual-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run audit:visual:enhanced
      - uses: actions/upload-artifact@v2
        with:
          name: visual-audit-report
          path: visual-audits/latest/
```

### 3. Performance Optimization

- Run tests in parallel when possible
- Use headless mode in CI
- Cache browser installations
- Optimize screenshot sizes
- Use selective test runs for PRs

### 4. Issue Tracking

```typescript
// Automatically create tickets
const createTicket = async (issue: VisualIssue) => {
  if (issue.severity === 'critical') {
    await createGitHubIssue({
      title: issue.description,
      body: issue.recommendation,
      labels: ['visual-bug', issue.category]
    });
  }
};
```

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**
   ```bash
   # Install browser dependencies
   npx playwright install-deps
   ```

2. **Port Already in Use**
   ```bash
   # Kill existing process
   lsof -ti:3001 | xargs kill -9
   ```

3. **Memory Issues**
   ```bash
   # Increase Node memory limit
   NODE_OPTIONS='--max-old-space-size=8192' npm run audit:visual:enhanced
   ```

4. **Timeout Errors**
   - Increase timeout values in config
   - Check network connectivity
   - Verify server is running

### Debug Mode

```bash
# Enable debug logging
DEBUG=visual-audit:* npm run audit:visual:enhanced

# Run with visible browser
HEADLESS=false npm run audit:visual:enhanced

# Slow down animations
SLOW_MO=1000 npm run audit:visual:enhanced
```

## API Reference

### EnhancedVisualAuditor

```typescript
class EnhancedVisualAuditor {
  constructor(options?: AuditorOptions);
  
  // Main methods
  run(): Promise<void>;
  runTests(): Promise<void>;
  generateReport(): Promise<void>;
  
  // Test methods
  runTestConfig(config: TestConfig): Promise<void>;
  testComponent(page: Page, component: ComponentTest): Promise<void>;
  runAccessibilityTests(page: Page, config: TestConfig): Promise<void>;
  runPerformanceAnalysis(page: Page, config: TestConfig): Promise<void>;
  
  // Analysis methods
  analyzeScreenshot(path: string, name: string): Promise<void>;
  analyzeWithClaude(screenshot: string): Promise<VisualIssue[]>;
}
```

### Utility Functions

```typescript
// Color contrast calculation
calculateContrast(color1: ColorInfo, color2: ColorInfo): ContrastResult;

// Screenshot comparison
compareScreenshots(baseline: string, current: string): Promise<DiffResult>;

// Performance measurement
checkAnimationPerformance(page: Page): Promise<PerformanceMetrics>;

// Element timing
measureElementTiming(page: Page, selector: string): Promise<TimingResult>;
```

## Integration Examples

### React Component Testing

```typescript
// Test React component states
const testReactComponent = async (page: Page) => {
  // Test loading state
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('set-loading', { detail: true }));
  });
  await page.screenshot({ path: 'loading-state.png' });
  
  // Test error state
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('set-error', { detail: 'Network error' }));
  });
  await page.screenshot({ path: 'error-state.png' });
};
```

### API Integration

```typescript
// Test with different API responses
const testWithMockData = async (page: Page) => {
  await page.route('**/api/terms', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ terms: mockTerms })
    });
  });
  
  await page.reload();
  await page.waitForSelector('[data-testid="term-card"]');
};
```

## Contributing

To add new test capabilities:

1. Add test configuration in `visual-audit-config.ts`
2. Implement test logic in `visual-audit-enhanced.ts`
3. Add CLI command in `visual-audit-cli.ts`
4. Update documentation
5. Add example usage

## Future Enhancements

- [ ] Real user monitoring integration
- [ ] A/B test visual comparison
- [ ] Cross-browser testing expansion
- [ ] Mobile app testing support
- [ ] PDF report generation
- [ ] Slack/Teams notifications
- [ ] Historical trend analysis
- [ ] Custom assertion framework