# Visual Testing Guide for AI Glossary Pro

This guide covers the comprehensive visual testing setup for the AI Glossary Pro application, including multiple testing frameworks and approaches.

## 🎯 **Overview**

Our comprehensive visual testing strategy includes:
1. **Playwright** - End-to-end visual testing with screenshot comparisons
2. **Vitest** - Component-level testing with snapshots
3. **Storybook** - Component development and visual testing (Added June 22, 2025)
4. **Cross-browser Testing** - Chrome, Firefox, Safari, Mobile devices
5. **Responsive Testing** - Desktop, tablet, and mobile viewports

## 🚀 **Getting Started**

### Prerequisites
```bash
# Install dependencies (already done)
npm install --save-dev @playwright/test vitest @vitest/ui @testing-library/react @testing-library/jest-dom

# Install Playwright browsers (already done)
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Visual tests (Playwright)
npm run test:visual                 # Run visual tests headless
npm run test:visual:headed          # Run with browser UI
npm run test:visual:ui              # Run with Playwright UI

# Component tests (Vitest)
npm run test:component              # Component snapshot tests
npm run test:unit                   # Unit tests

# Interactive testing
npm run test:ui                     # Vitest UI
npm run test:coverage               # Coverage report

# Storybook (Component Development & Visual Testing)
npm run storybook                   # Start Storybook development server
npm run build-storybook             # Build static Storybook
```

## 📸 **Visual Testing with Playwright**

### Test Structure
```
tests/visual/
├── homepage.spec.ts        # Homepage visual tests
├── term-detail.spec.ts     # Term detail page tests
└── search.spec.ts          # Search functionality tests
```

### Key Features
- **Screenshot Comparisons**: Automatically compares current screenshots with baselines
- **Cross-browser Testing**: Tests across Chrome, Firefox, Safari
- **Mobile Testing**: iPhone and Android device testing
- **Responsive Testing**: Multiple viewport sizes

### Example Test
```typescript
test('Homepage displays correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="featured-terms"]');
  await expect(page).toHaveScreenshot('homepage-full.png');
});
```

## 🎨 **Component Development with Storybook**

### Overview
Storybook provides an isolated environment for developing and testing React components with visual feedback.

### Features
- **Component Isolation**: Develop components without full application context
- **Interactive Props**: Real-time prop manipulation with controls
- **Theme Testing**: Switch between light/dark themes
- **Responsive Testing**: Test different viewport sizes
- **Accessibility Testing**: Automated a11y checks with violations reporting
- **Auto Documentation**: Generated docs from component props and stories

### Available Stories
```
client/src/components/
├── ui/
│   ├── button.stories.tsx      # Button component variants
│   └── card.stories.tsx        # Card component layouts
└── TermCard.stories.tsx        # Custom TermCard component
```

### Storybook URL
- **Development**: `http://localhost:6006` or `http://localhost:6007`
- **Features**: Interactive controls, theme switching, responsive testing

### Creating New Stories
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from './YourComponent';

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { prop1: 'value1' },
};
```

### Best Practices
1. **Mock Data**: Use realistic mock data for complex components
2. **Multiple Variants**: Show different states and configurations
3. **Edge Cases**: Include loading states, errors, empty states
4. **Accessibility**: Test with a11y addon for compliance
5. **Documentation**: Use JSDoc comments for auto-generated docs

## 🧩 **Component Testing with Vitest**

### Test Structure
```
tests/component/
├── TermCard.test.tsx       # TermCard component tests
├── SearchBar.test.tsx      # SearchBar component tests
└── CategoryCard.test.tsx   # CategoryCard component tests
```

### Features
- **Snapshot Testing**: Captures component HTML structure
- **Props Testing**: Tests different component states
- **Interaction Testing**: User interaction simulation

### Example Component Test
```typescript
it('matches visual snapshot', () => {
  const { container } = render(<TermCard term={mockTerm} />);
  expect(container.firstChild).toMatchSnapshot();
});
```

## 🎨 **What Gets Tested**

### Homepage Tests
- ✅ Full page layout
- ✅ Header component
- ✅ Featured terms section
- ✅ Search bar
- ✅ Navigation menu
- ✅ Footer

### Term Detail Tests
- ✅ Term card display
- ✅ Definition section
- ✅ Related terms
- ✅ Mobile responsive views
- ✅ Tablet responsive views

### Search Tests
- ✅ Search results page
- ✅ Empty search state
- ✅ Search suggestions
- ✅ No results state
- ✅ Search with filters

### Component Tests
- ✅ TermCard variations
- ✅ Different component states
- ✅ Props validation
- ✅ Visual snapshots

## 🔧 **Configuration Files**

### Playwright Config (`playwright.config.ts`)
```typescript
export default defineConfig({
  testDir: './tests/visual',
  use: {
    baseURL: 'http://localhost:3001',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### Vitest Config (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

## 📊 **Test Results & Reports**

### Playwright Reports
- **HTML Report**: `playwright-report/index.html`
- **Screenshots**: `test-results/` directory
- **Traces**: Available for failed tests

### Vitest Reports
- **Coverage**: `coverage/` directory
- **UI**: Interactive test runner at `http://localhost:51204`

## 🛠 **Best Practices**

### Writing Visual Tests
1. **Wait for Content**: Always wait for dynamic content to load
2. **Stable Selectors**: Use `data-testid` attributes for reliable selectors
3. **Responsive Testing**: Test multiple viewport sizes
4. **Cross-browser**: Ensure compatibility across browsers

### Managing Screenshots
1. **Baseline Generation**: First run generates baseline screenshots
2. **Updates**: Use `--update-snapshots` to update baselines
3. **Review Changes**: Always review screenshot diffs before accepting
4. **Git**: Commit baseline screenshots to version control

### Component Testing
1. **Mock Data**: Use consistent mock data for snapshots
2. **State Testing**: Test different component states
3. **Props Validation**: Test various prop combinations
4. **Accessibility**: Include accessibility testing

## 🚨 **Troubleshooting**

### Common Issues

#### Screenshots Don't Match
```bash
# Update baseline screenshots
npx playwright test --update-snapshots

# Run specific test
npx playwright test homepage.spec.ts --update-snapshots
```

#### Component Tests Failing
```bash
# Update component snapshots
npm run test:component -- --update-snapshots

# Run specific component test
npm run test:component -- TermCard.test.tsx
```

#### Server Not Starting
```bash
# Ensure development server is running
npm run dev

# Check if port 3001 is available
lsof -ti:3001
```

## 📈 **CI/CD Integration**

### GitHub Actions Example
```yaml
- name: Run Visual Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:visual
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: playwright-results
    path: test-results/
```

## 🎯 **Next Steps**

1. **Add More Tests**: Expand coverage to all components
2. **Performance Testing**: Add performance visual tests
3. **Accessibility Testing**: Include a11y visual tests
4. **Animation Testing**: Test animated components
5. **Dark Mode**: Add dark theme visual tests

## 📚 **Resources**

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Visual Testing Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated**: December 2024 