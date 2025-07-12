# Test Coverage Guide

## Overview

This project uses Vitest for comprehensive test coverage analysis with specific thresholds for different types of modules based on their criticality.

## Coverage Thresholds

### Critical Modules (90% coverage required)
- **Authentication**: `server/auth/**`
- **Payment Processing**: `server/routes/gumroad.ts`
- **Purchase Verification**: `client/src/components/PurchaseVerification.tsx`
- **Test Purchase**: `client/src/components/TestPurchaseButton.tsx`

### High Priority (80% coverage required)
- **Services**: `server/services/**`, `client/src/services/**`
- **Utilities**: `server/utils/**`, `client/src/utils/**`
- **Hooks**: `client/src/hooks/**`
- **Middleware**: `server/middleware/**`
- **AI Components**: `client/src/components/AI*.tsx`
- **Core Services**: `server/aiService.ts`, `server/db.ts`, `server/storage.ts`

### Medium Priority (75% coverage required)
- **Routes**: `server/routes/**`
- **Components**: `client/src/components/**` (excluding UI components)
- **Pages**: `client/src/pages/**`

### Global Minimum (70% coverage required)
- All other modules

## Running Coverage Tests

### Basic Coverage
```bash
npm run test:coverage
```

### Coverage with Detailed Report
```bash
npm run test:coverage:report
```

### Coverage in Watch Mode
```bash
npm run test:coverage:watch
```

### Coverage with Threshold Checking
```bash
npm run test:coverage:threshold
```

### Generate Coverage Report Script
```bash
./scripts/generate-coverage-report.sh
```

## Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML**: `coverage/index.html` - Interactive web interface
- **JSON**: `coverage/coverage-summary.json` - Machine-readable summary
- **LCOV**: `coverage/lcov.info` - For CI/CD integration
- **Text**: Terminal output during test runs
- **Clover**: `coverage/clover.xml` - XML format

## Current Coverage Status

### Coverage Analysis Summary
- **Total Client Files**: 195 TypeScript/React files
- **Total Server Files**: 145 TypeScript/Node.js files  
- **Total Test Files**: 9 existing test files
- **Coverage Gap**: Significant gaps in critical modules

### Critical Gaps Identified

#### 🚨 CRITICAL (Requires immediate attention - 90% coverage needed)
- `server/auth/simpleAuth.ts` - Authentication logic
- `server/routes/gumroad.ts` - Payment processing
- `client/src/components/PurchaseVerification.tsx` - Purchase verification
- `client/src/components/TestPurchaseButton.tsx` - Test purchase flow

#### ⚠️ HIGH PRIORITY (80% coverage needed)
- `server/services/userService.ts` - User management
- `server/services/analyticsService.ts` - Analytics tracking
- `server/middleware/security.ts` - Security middleware
- `server/aiService.ts` - AI service logic
- `client/src/components/AI*.tsx` - AI components (7 files)
- `client/src/hooks/useAuth.ts` - Authentication hooks
- `client/src/services/abTestingService.ts` - A/B testing
- `server/utils/**` - 12 utility modules
- `client/src/hooks/**` - 8 hook modules

#### 📊 MEDIUM PRIORITY (75% coverage needed)
- `server/routes/**` - Route handlers
- `client/src/components/**` - React components
- `client/src/pages/**` - Page components

## Test Organization

```
tests/
├── unit/                 # Unit tests
│   ├── auth.test.ts
│   ├── api.test.ts
│   └── storage.test.ts
├── component/            # Component tests
│   └── TermCard.test.tsx
├── integration/          # Integration tests
│   └── app.test.ts
├── e2e/                  # End-to-end tests
│   └── *.spec.ts
└── visual/               # Visual regression tests
    └── *.spec.ts
```

## Adding New Tests

### 1. Unit Tests
Create tests in `tests/unit/` for:
- Pure functions
- Service methods  
- Utility functions
- API endpoints

### 2. Component Tests
Create tests in `tests/component/` for:
- React components
- User interactions
- Component state management
- Props validation

### 3. Integration Tests
Create tests in `tests/integration/` for:
- Feature workflows
- API integration
- Database operations
- External service integration

## Coverage Configuration

The coverage configuration is defined in `vitest.coverage.config.ts` with:

- **Provider**: V8 (Node.js native coverage)
- **Reporters**: Text, HTML, JSON, LCOV, Clover
- **Thresholds**: Module-specific coverage requirements
- **Exclusions**: Generated files, config files, UI components

## CI/CD Integration

### GitHub Actions
- Automated coverage reports on PR
- Coverage artifacts uploaded
- Threshold validation
- Integration with Codecov/Coveralls

### Local Development
- Coverage reports generated automatically
- Browser opens with HTML report
- Badge generation for README

## Best Practices

### 1. Write Testable Code
- Use dependency injection
- Avoid complex constructors
- Separate business logic from UI
- Use pure functions where possible

### 2. Test Coverage Goals
- Focus on business logic first
- Test error conditions
- Test edge cases
- Avoid testing implementation details

### 3. Mocking Strategy
- Mock external dependencies
- Mock database calls
- Mock API responses
- Use factories for test data

### 4. Performance Considerations
- Run tests in parallel
- Use test.concurrent for independent tests
- Mock expensive operations
- Use test.skip for slow tests during development

## Troubleshooting

### Common Issues

1. **Tests failing due to missing mocks**
   - Check if external dependencies are properly mocked
   - Verify API endpoints are mocked in test environment

2. **Coverage not updating**
   - Clear coverage cache: `rm -rf coverage/`
   - Restart test runner
   - Check file inclusion/exclusion patterns

3. **Threshold failures**
   - Review coverage report to identify uncovered lines
   - Add tests for missing coverage
   - Consider adjusting thresholds if appropriate

### Debug Coverage Issues

```bash
# Run coverage with verbose output
npm run test:coverage:report

# Run specific test file with coverage
npx vitest run tests/unit/auth.test.ts --coverage

# Generate coverage for specific files
npx vitest run --coverage.include="server/auth/**"
```

## Continuous Improvement

### Monthly Coverage Review
1. Review coverage trends
2. Identify persistent gaps
3. Update thresholds if needed
4. Add tests for new features
5. Refactor low-coverage areas

### Coverage Metrics to Track
- Line coverage trends
- Branch coverage improvement
- Function coverage completeness
- Test execution time
- Coverage per module type

## Tools and Resources

- **Vitest**: Test runner and coverage provider
- **V8**: Native Node.js coverage engine
- **Istanbul**: Coverage reporting
- **Codecov**: Coverage tracking service
- **GitHub Actions**: CI/CD pipeline

---

For questions or issues with coverage setup, please check the troubleshooting section or create an issue in the repository.