/**
 * Visual Audit Configuration
 *
 * Centralized configuration for visual testing including:
 * - Test scenarios
 * - Component definitions
 * - Breakpoints
 * - Accessibility rules
 * - Performance thresholds
 */

export interface BreakpointConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

export interface ComponentConfig {
  name: string;
  selector: string;
  states: string[];
  interactions: string[];
  criticalPaths?: string[];
}

export interface AccessibilityConfig {
  wcagLevel: 'A' | 'AA' | 'AAA';
  rules: string[];
  skipRules?: string[];
  customRules?: any[];
}

export interface PerformanceThresholds {
  fcp: number; // First Contentful Paint (ms)
  lcp: number; // Largest Contentful Paint (ms)
  tti: number; // Time to Interactive (ms)
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay (ms)
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

export const BREAKPOINTS: BreakpointConfig[] = [
  { name: 'mobile-small', width: 320, height: 568 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'mobile-large', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'desktop-large', width: 2560, height: 1440 },
];

export const CRITICAL_USER_FLOWS = [
  {
    name: 'search-and-find',
    steps: [
      { action: 'navigate', url: '/' },
      { action: 'click', selector: '[data-testid="search-button"]' },
      { action: 'type', selector: 'input[type="search"]', value: 'neural network' },
      { action: 'keyboard', key: 'Enter' },
      { action: 'wait', value: 2000 },
      { action: 'click', selector: '[data-testid="term-card"]:first-child' },
      { action: 'wait', value: 1000 },
    ],
  },
  {
    name: 'browse-categories',
    steps: [
      { action: 'navigate', url: '/' },
      { action: 'click', selector: '[href="/categories"]' },
      { action: 'wait', value: 2000 },
      { action: 'click', selector: '[data-category="machine-learning"]' },
      { action: 'wait', value: 1000 },
    ],
  },
  {
    name: 'user-authentication',
    steps: [
      { action: 'navigate', url: '/login' },
      { action: 'type', selector: 'input[name="email"]', value: 'test@example.com' },
      { action: 'type', selector: 'input[name="password"]', value: 'password123' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'wait', value: 2000 },
    ],
  },
];

export const COMPONENTS: ComponentConfig[] = [
  {
    name: 'Button',
    selector: 'button, .btn',
    states: ['default', 'hover', 'focus', 'active', 'disabled'],
    interactions: ['click', 'hover', 'focus'],
    criticalPaths: ['CTA buttons', 'Submit buttons'],
  },
  {
    name: 'TermCard',
    selector: '[data-testid="term-card"]',
    states: ['default', 'hover', 'selected', 'loading'],
    interactions: ['click', 'hover'],
    criticalPaths: ['Term selection', 'Term preview'],
  },
  {
    name: 'Navigation',
    selector: 'nav, [role="navigation"]',
    states: ['default', 'mobile', 'scrolled'],
    interactions: ['click', 'hover', 'scroll'],
    criticalPaths: ['Main navigation', 'Mobile menu'],
  },
  {
    name: 'SearchBar',
    selector: '[data-testid="search-bar"], input[type="search"]',
    states: ['default', 'focused', 'filled', 'searching', 'results'],
    interactions: ['click', 'type', 'clear'],
    criticalPaths: ['Global search', 'Term search'],
  },
  {
    name: 'Modal',
    selector: '[role="dialog"], .modal',
    states: ['closed', 'opening', 'open', 'closing'],
    interactions: ['open', 'close', 'escape'],
    criticalPaths: ['Login modal', 'Term details modal'],
  },
  {
    name: 'Form',
    selector: 'form',
    states: ['empty', 'partial', 'filled', 'invalid', 'submitting', 'success', 'error'],
    interactions: ['fill', 'submit', 'reset'],
    criticalPaths: ['Login form', 'Signup form', 'Contact form'],
  },
];

export const ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  wcagLevel: 'AA',
  rules: [
    'aria-allowed-attr',
    'aria-required-attr',
    'aria-valid-attr',
    'aria-valid-attr-value',
    'button-name',
    'color-contrast',
    'document-title',
    'duplicate-id',
    'empty-heading',
    'focus-order-semantics',
    'form-field-multiple-labels',
    'frame-title',
    'heading-order',
    'html-has-lang',
    'html-lang-valid',
    'image-alt',
    'input-image-alt',
    'label',
    'link-name',
    'list',
    'listitem',
    'meta-viewport',
    'object-alt',
    'region',
    'role-img-alt',
    'scrollable-region-focusable',
    'valid-lang',
  ],
  skipRules: [
    'color-contrast', // Sometimes needs manual review
  ],
};

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  fcp: 1800, // 1.8 seconds
  lcp: 2500, // 2.5 seconds
  tti: 3800, // 3.8 seconds
  cls: 0.1, // Cumulative Layout Shift
  fid: 100, // 100ms
  lighthouse: {
    performance: 0.9, // 90%
    accessibility: 0.95, // 95%
    bestPractices: 0.9, // 90%
    seo: 0.9, // 90%
  },
};

export const INTERACTION_PATTERNS = {
  hover: {
    duration: 500,
    screenshot: true,
  },
  click: {
    delay: 100,
    screenshot: true,
  },
  type: {
    delay: 50, // Delay between keystrokes
    screenshot: true,
  },
  scroll: {
    smooth: true,
    duration: 300,
    screenshot: false,
  },
  drag: {
    duration: 500,
    screenshot: true,
  },
};

export const VISUAL_REGRESSION_CONFIG = {
  threshold: 0.01, // 1% difference threshold
  diffPath: 'visual-diffs',
  baselinePath: 'visual-baseline',
  updateBaseline: process.env.UPDATE_BASELINE === 'true',
};

export const AI_ANALYSIS_CONFIG = {
  model: 'claude-3-opus-20240229',
  maxTokens: 2000,
  temperature: 0.3,
  systemPrompt: `You are a visual design and UX expert analyzing web application screenshots. 
  Focus on identifying issues related to:
  1. Visual hierarchy and layout
  2. Color and contrast
  3. Typography and readability
  4. Consistency and design patterns
  5. Responsive design
  6. Accessibility
  7. User experience and usability
  
  Provide actionable recommendations for each issue found.`,
};

export const REPORT_CONFIG = {
  formats: ['html', 'markdown', 'json'],
  includeScreenshots: true,
  includeVideos: true,
  generateTaskList: true,
  emailReport: process.env.EMAIL_REPORT === 'true',
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
};

// Test data for forms and interactions
export const TEST_DATA = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
  },
  invalidUser: {
    email: 'invalid-email',
    password: '123', // Too short
    name: '',
  },
  searchQueries: [
    'machine learning',
    'neural network',
    'deep learning',
    'artificial intelligence',
    'natural language processing',
  ],
  categories: [
    'machine-learning',
    'deep-learning',
    'computer-vision',
    'nlp',
    'reinforcement-learning',
  ],
};

// Custom test scenarios
export const CUSTOM_SCENARIOS = [
  {
    name: 'responsive-layout-shift',
    description: 'Test for layout shifts during responsive transitions',
    breakpoints: ['mobile', 'tablet', 'desktop'],
    actions: [
      { type: 'scroll', value: 500 },
      { type: 'wait', value: 1000 },
      { type: 'scroll', value: -500 },
    ],
  },
  {
    name: 'dark-mode-consistency',
    description: 'Verify all components work correctly in dark mode',
    setup: [{ type: 'click', selector: '[data-testid="theme-toggle"]' }],
    pages: ['/', '/terms', '/categories', '/about'],
  },
  {
    name: 'form-validation-states',
    description: 'Test all form validation states and error messages',
    forms: ['login', 'signup', 'contact'],
    states: ['empty-submit', 'invalid-data', 'valid-data', 'network-error'],
  },
];

export default {
  BREAKPOINTS,
  CRITICAL_USER_FLOWS,
  COMPONENTS,
  ACCESSIBILITY_CONFIG,
  PERFORMANCE_THRESHOLDS,
  INTERACTION_PATTERNS,
  VISUAL_REGRESSION_CONFIG,
  AI_ANALYSIS_CONFIG,
  REPORT_CONFIG,
  TEST_DATA,
  CUSTOM_SCENARIOS,
};
