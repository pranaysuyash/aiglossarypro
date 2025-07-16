import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error', // Upgraded from warn to error
      '@typescript-eslint/explicit-function-return-type': 'off', // Allow type inference
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // React rules
      'react/prop-types': 'off', // We use TypeScript for prop validation
      'react/react-in-jsx-scope': 'off', // React 17+ doesn't require React in scope
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error', // Upgraded from warn to error
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-boolean-value': 'error',

      // General JavaScript rules
      'no-console': 'error', // Upgraded from warn to error for production code
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-unreachable': 'error',
      'no-useless-escape': 'error',
      eqeqeq: 'error',
      curly: 'error',

      // Code quality rules
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', 100],
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1, 2] }],
      'prefer-template': 'error',
      'no-nested-ternary': 'warn',
      'no-else-return': 'error',

      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Accessibility rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        // Additional test globals
        vi: 'readonly',
        fetch: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        PerformanceObserver: 'readonly',
        browser: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off', // Tests often use globals
    },
  },
  {
    files: ['**/*.cjs', 'scripts/**/*.js', 'server/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in scripts
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      'storybook-static/**',
      'playwright-report/**',
      'test-results/**',
      'reports/**',
      // Ignore debug and test files that are not critical
      'debug-*.js',
      'test-*.js',
      'test-*.cjs',
      '**/storage.ts', // This file has many stub functions
      '**/streamingImporter.ts', // Legacy file with many console statements
      'server/simpleTermsMigration.ts', // Migration script
      '**/*.stories.tsx', // Storybook files
      '**/*.d.ts', // Type definition files
    ],
  },
];
